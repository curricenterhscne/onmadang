import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CORS_HEADERS } from "../_shared/authz.ts";

// 지역청/기관 담당자 가입 신청. 계정은 즉시 만들어지지만 로그인해도
// staff_profiles.status='pending'이라 승인 전까지는 admin-* 함수가 전부 401을 돌려준다.
// province(도교육청) 담당자가 admin-approve-staff로 승인해야 실제로 쓸 수 있다.
//
// 입력: { email, password, name, role: 'region'|'org', scope_value }
// province 계정은 이 경로로 셀프 가입을 받지 않는다(보안) — 필요하면 Supabase 대시보드에서
// 직접 만들고 staff_profiles에 role='province' 행을 수동으로 넣는다.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sbHeaders = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  const body = await req.json().catch(() => ({}));
  const { email, password, name, role, scope_value } = body;

  if (!email || !password || !role || !scope_value) {
    return Response.json(
      { error: "email, password, role, scope_value 필요" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (role !== "region" && role !== "org") {
    return Response.json(
      { error: "셀프 가입은 role='region' 또는 'org'만 가능합니다" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "비밀번호는 8자 이상" }, { status: 400, headers: CORS_HEADERS });
  }

  // 1) Supabase Auth 사용자 생성 (관리자 API, 이메일 인증 생략)
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    return Response.json({ error: `계정 생성 실패: ${text}` }, { status: 502, headers: CORS_HEADERS });
  }
  const user = await createRes.json();

  // 2) staff_profiles에 pending 상태로 등록
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/staff_profiles`, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "return=representation" },
    body: JSON.stringify([{ id: user.id, name: name ?? null, role, scope_value, status: "pending" }]),
  });
  if (!profileRes.ok) {
    const text = await profileRes.text();
    return Response.json({ error: `프로필 등록 실패: ${text}` }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json(
    { ok: true, message: "가입 신청이 접수됐습니다. 도교육청 담당자 승인 후 로그인할 수 있습니다." },
    { headers: CORS_HEADERS },
  );
});
