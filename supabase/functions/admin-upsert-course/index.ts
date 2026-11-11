import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, isWithinScope, CORS_HEADERS } from "../_shared/authz.ts";

// 강좌 등록·수정. apply/_embed_data.js + gen_embed.py 재생성 워크플로를 대체한다 —
// 비개발자인 지역청/기관 담당자가 이 함수를 통해 강좌 상세 정보를 직접 입력한다.
//
// 입력 바디: { code?, term?, program, name, org, region, capacity, min_open,
//              field, target, intro, method, place, supply, activity_area,
//              recommended_for, instructor_bio, start_date, end_date, session_count,
//              instructors, sessions, schedule_by_day, learning_goals, grade_restricted }
// code가 있으면 그 강좌를 수정(없는 코드면 그 코드로 신규 등록), code를 비우면
// 아래 규칙으로 코드를 자동 부여해 신규 등록한다.
//
// 자동 코드 규칙: {프로그램 2자}{학년도 2자}{운영 기간 1자}{지원청 2자}{순번 2자}
//   운영 기간: 1 = 1학기, S = 여름방학, 2 = 2학기, W = 겨울방학
//   예) 지역연계 · 2027학년도 여름방학 · 천안 · 첫 강좌 → JR27SCA01
//   운영 기간은 바디의 term(위 4개 문자 중 하나)을 우선하고, 없으면 start_date의 월로 정한다
//   (3~6월 1, 7~8월 S, 9~12월 2, 1~2월 W). start_date도 없으면 등록 시점 날짜로 판단한다.
//   학년도는 3월에 바뀐다 — 1·2월은 전년도(2028-01 겨울방학 → 27W). 단 1·2월에 시작하는
//   1학기 강좌로 명시하면 그해 학년도로 본다.
//   term은 코드를 만드는 데만 쓰고 DB에 저장하지 않는다.
//   순번은 같은 접두어 안에서 기존 최대값 + 1.

const EDITABLE_FIELDS = [
  "name", "org", "region", "capacity", "min_open",
  "field", "target", "intro", "method", "place", "supply",
  "activity_area", "recommended_for", "instructor_bio",
  "start_date", "end_date", "session_count",
  "instructors", "sessions", "schedule_by_day", "learning_goals",
  "grade_restricted", "is_registerable",
];

// 지역청 담당자(role=region)가 다룰 수 있는 프로그램
const REGION_PROGRAMS = ["joint_regional"];

const PROGRAM_PREFIX: Record<string, string> = {
  joint_regional: "JR",
  dual_credit: "DC",
  dream_up: "DU",
};

const REGION_CODE: Record<string, string> = {
  "천안": "CA", "공주": "GJ", "보령": "BR", "아산": "AS", "서산": "SS",
  "논산계룡": "NG", "당진": "DJ", "금산": "GS", "부여": "BY", "서천": "SC",
  "청양": "CY", "홍성": "HS", "예산": "YS", "태안": "TA",
};

function regionCode(region: string | null | undefined): string {
  const r = String(region || "").replace(/\s/g, "").replace(/교육지원청$/, "");
  return REGION_CODE[r] || "ZZ";
}

const TERM_CODES = ["1", "S", "2", "W"];

function termOf(startDate: string | null | undefined, explicit?: string | null): { yy: string; term: string } {
  // KST 기준 오늘 날짜(YYYY-MM-DD)
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const d = /^\d{4}-\d{2}-\d{2}/.test(String(startDate || "")) ? String(startDate) : today;
  let year = parseInt(d.slice(0, 4), 10);
  const month = parseInt(d.slice(5, 7), 10);
  const term = explicit && TERM_CODES.includes(explicit) ? explicit
    : month <= 2 ? "W" : month <= 6 ? "1" : month <= 8 ? "S" : "2";
  if (month <= 2 && term !== "1") year -= 1;
  return { yy: String(year).slice(-2), term };
}

async function nextCode(
  SUPABASE_URL: string, SERVICE_ROLE_KEY: string, program: string,
  region: string, startDate: string | null | undefined, explicitTerm?: string | null,
): Promise<string> {
  const { yy, term } = termOf(startDate, explicitTerm);
  const prefix = `${PROGRAM_PREFIX[program] || "XX"}${yy}${term}${regionCode(region)}`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?code=like.${encodeURIComponent(prefix + "*")}&select=code`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const rows: { code: string }[] = res.ok ? await res.json() : [];
  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.code.slice(prefix.length), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(2, "0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const staff = await authenticateStaff(req, SUPABASE_URL, SERVICE_ROLE_KEY);
  if (!staff) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const { program } = body;
  if (!program) {
    return Response.json({ error: "program required" }, { status: 400, headers: CORS_HEADERS });
  }
  const term = body.term ? String(body.term).toUpperCase() : null;
  if (term && !TERM_CODES.includes(term)) {
    return Response.json({ error: "term은 1·S·2·W 중 하나여야 합니다" }, { status: 400, headers: CORS_HEADERS });
  }
  if (staff.role === "region" && !REGION_PROGRAMS.includes(program)) {
    return Response.json(
      { error: "Forbidden — 지역청 담당자는 지역연계 공동교육과정 강좌만 등록할 수 있습니다" },
      { status: 403, headers: CORS_HEADERS },
    );
  }

  // region/org 관리자는 자기 scope 값과 일치하는 강좌만 등록/수정 가능 —
  // 요청 바디의 region/org가 자기 scope_value와 다르면 거부(다른 지역/기관 강좌를 몰래 못 만듦).
  if (staff.role !== "province") {
    const col = staff.role === "region" ? "region" : "org";
    if (!isWithinScope(staff, col, body[col])) {
      return Response.json(
        { error: `Forbidden — ${col}는 본인 소관(${staff.scope_value}) 값이어야 합니다` },
        { status: 403, headers: CORS_HEADERS },
      );
    }
  }

  const authHeaders = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };

  // 코드를 지정한 수정 요청이면, 기존 강좌도 본인 소관인지 확인한다 —
  // 바디의 region만 보면 다른 지원청 강좌 코드를 넣어 덮어쓸 수 있기 때문.
  if (code && staff.role !== "province") {
    const exRes = await fetch(
      `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(code)}&select=region,org,program`,
      { headers: authHeaders },
    );
    const ex = exRes.ok ? (await exRes.json())[0] : null;
    if (ex) {
      const col = staff.role === "region" ? "region" : "org";
      if (!isWithinScope(staff, col, ex[col]) || ex.program !== program) {
        return Response.json(
          { error: `Forbidden — 강좌 ${code}는 본인 소관 강좌가 아닙니다` },
          { status: 403, headers: CORS_HEADERS },
        );
      }
    }
  }

  const fields: Record<string, unknown> = { program };
  for (const f of EDITABLE_FIELDS) {
    if (body[f] !== undefined) fields[f] = body[f];
  }

  // 자동 부여: 순번 충돌(동시 등록) 시 덮어쓰지 않도록 merge 없이 INSERT하고, 충돌하면 다시 계산한다.
  if (!code) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const newCode = await nextCode(SUPABASE_URL, SERVICE_ROLE_KEY, program, String(body.region || ""), body.start_date, term);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify([{ code: newCode, ...fields }]),
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json({ ok: true, course: data[0] }, { headers: CORS_HEADERS });
      }
      if (res.status !== 409) {
        return Response.json({ error: await res.text() }, { status: 502, headers: CORS_HEADERS });
      }
    }
    return Response.json({ error: "강좌 코드 자동 부여에 실패했습니다. 다시 시도해 주세요." }, { status: 409, headers: CORS_HEADERS });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      // code가 이미 있으면 갱신, 없으면 삽입. enrolled_count는 payload에 없으므로
      // merge-duplicates라도 기존 신청 인원수가 덮어써지지 않는다(해당 컬럼을 안 보내면
      // PostgREST upsert는 그 컬럼을 그대로 둔다).
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([{ code, ...fields }]),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: 502, headers: CORS_HEADERS });
  }

  const data = await res.json();
  return Response.json({ ok: true, course: data[0] }, { headers: CORS_HEADERS });
});
