import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, isWithinScope, CORS_HEADERS } from "../_shared/authz.ts";

// 강좌 삭제. 신청자가 이미 있는 강좌는 지우지 않고 막는다(신청 데이터 고아 방지) —
// 마감하려면 is_registerable=false(admin-toggle-close류)를 쓰도록 안내한다.

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
  };

  const staff = await authenticateStaff(req, SUPABASE_URL, SERVICE_ROLE_KEY);
  if (!staff) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const { code } = body;
  if (!code) {
    return Response.json({ error: "code required" }, { status: 400, headers: CORS_HEADERS });
  }

  const courseRes = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(code)}&select=region,org,enrolled_count`,
    { headers: sbHeaders },
  );
  const rows = courseRes.ok ? await courseRes.json() : [];
  const course = rows[0];
  if (!course) {
    return Response.json({ error: "course not found" }, { status: 404, headers: CORS_HEADERS });
  }

  if (staff.role !== "province") {
    const col = staff.role === "region" ? "region" : "org";
    if (!isWithinScope(staff, col, course[col])) {
      return Response.json({ error: "Forbidden — 소관 강좌가 아닙니다" }, { status: 403, headers: CORS_HEADERS });
    }
  }

  if ((course.enrolled_count || 0) > 0) {
    return Response.json(
      { error: "신청자가 있는 강좌는 삭제할 수 없습니다. 모집 마감(강제마감) 기능을 쓰세요." },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
  });
  if (!delRes.ok) {
    return Response.json({ error: await delRes.text() }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
