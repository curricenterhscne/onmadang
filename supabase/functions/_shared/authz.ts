// ============================================================
// 분산 관리자 인증·권한 공용 헬퍼
// admin-* Edge Function 전체가 공유한다.
// ============================================================
// 기존 방식(ADMIN_PASSWORD 공유 비밀번호 1개)을 Supabase Auth 개인 계정 +
// staff_profiles(role: province|region|org) 조회로 교체한다.
//
// province — 전체 조회/관리 가능 (기존 ADMIN_PASSWORD와 동급)
// region   — courses.region = scope_value 인 강좌/신청자만
// org      — courses.org = scope_value 인 강좌/신청자만

export interface StaffProfile {
  id: string;
  name: string | null;
  role: "province" | "region" | "org";
  scope_value: string | null;
  status: string;
}

/**
 * 과도기 호환: 기존 ADMIN_PASSWORD 공유 비밀번호도 당분간 계속 인정한다
 * (지금 운영 중인 관리자가 Supabase Auth 계정으로 전환하기 전까지 접근이 끊기지 않게).
 * 이 비밀번호로 들어오면 province 권한과 동급으로 취급한다.
 * ⚠️ 전원이 개인 계정으로 전환하면 이 경로는 제거할 것(ASSETS.md/apply/CLAUDE.md에 기록).
 */
function legacyPasswordProfile(req: Request): StaffProfile | null {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== Deno.env.get("ADMIN_PASSWORD")) return null;
  return { id: "legacy-password", name: "(공유 비밀번호)", role: "province", scope_value: null, status: "approved" };
}

/**
 * 요청의 Authorization: Bearer <JWT 또는 기존 공유 비밀번호>를 검증하고,
 * 승인된(staff_profiles.status='approved') 직원 프로필을 반환한다.
 * 인증 실패·미승인이면 null.
 */
export async function authenticateStaff(
  req: Request,
  SUPABASE_URL: string,
  SERVICE_ROLE_KEY: string,
): Promise<StaffProfile | null> {
  // 0) 과도기: 기존 공유 비밀번호 먼저 확인
  const legacy = legacyPasswordProfile(req);
  if (legacy) return legacy;

  const auth = req.headers.get("authorization") || "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return null;

  // 1) JWT로 사용자 식별 (Supabase Auth API)
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  if (!user?.id) return null;

  // 2) staff_profiles 조회 (service role로 — RLS 우회해 본인 외 레코드도 조회 가능해야
  //    province 관리자의 승인 작업 등에 쓸 수 있다. 여기선 본인 레코드만 가져온다.)
  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/staff_profiles?id=eq.${user.id}&select=*`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!profRes.ok) return null;
  const rows = await profRes.json();
  const profile: StaffProfile | undefined = rows[0];
  if (!profile || profile.status !== "approved") return null;
  return profile;
}

/**
 * staff_profile의 role/scope_value를 PostgREST 쿼리스트링 조각(선두에 &)으로 변환한다.
 * province는 빈 문자열(= 필터 없음, 전체 조회).
 * scope_value가 비어 있는데 region/org 역할이면 안전하게 "아무것도 안 걸리는" 조건을 반환한다
 * (설정 누락으로 전체 데이터가 새어나가는 사고를 막기 위함).
 */
export function scopeFilterParam(profile: StaffProfile, column: "region" | "org" = "region"): string {
  if (profile.role === "province") return "";
  if (!profile.scope_value) return `&${column}=eq.__none__`; // 매칭 불가능한 값 — fail closed
  return `&${column}=eq.${encodeURIComponent(profile.scope_value)}`;
}

/** region/org 관리자가 자기 scope 밖의 값을 쓰려는 쓰기 요청을 막는다. */
export function isWithinScope(
  profile: StaffProfile,
  targetColumn: "region" | "org",
  targetValue: string | null | undefined,
): boolean {
  if (profile.role === "province") return true;
  const col = profile.role === "region" ? "region" : "org";
  if (col !== targetColumn) return false;
  return !!profile.scope_value && profile.scope_value === targetValue;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
