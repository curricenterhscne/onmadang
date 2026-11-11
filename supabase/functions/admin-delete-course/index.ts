import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, isWithinScope, CORS_HEADERS } from "../_shared/authz.ts";

// 강좌 삭제. 확정 신청이나 진행 중인 좌석 예약이 있는 강좌는 지우지 않고 막는다.
// 취소·만료된 신청 기록만 남아 있으면 그 기록을 먼저 지우고 강좌를 지운다(외래키 enrollments_course_code_fkey).
// 모집을 멈추려면 강제마감(admin-toggle-close)을 쓰도록 안내한다.

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

  // 살아 있는 신청(확정 active, 아직 만료되지 않은 좌석 예약 pending)이 있으면 막는다.
  // enrolled_count만 보면 안 된다 — 취소·만료된 신청 기록은 count에 안 잡히지만
  // enrollments.course_code 외래키로 강좌를 참조해 DELETE가 23503으로 실패한다(2026-11-11 지역청 보고).
  const encCode = encodeURIComponent(code);
  const liveRes = await fetch(
    `${SUPABASE_URL}/rest/v1/enrollments?course_code=eq.${encCode}` +
      `&or=${encodeURIComponent(`(status.eq.active,and(status.eq.pending,expires_at.gt."${new Date().toISOString()}"))`)}&select=status`,
    { headers: sbHeaders },
  );
  if (!liveRes.ok) {
    return Response.json({ error: await liveRes.text() }, { status: 502, headers: CORS_HEADERS });
  }
  const live = await liveRes.json();
  if (live.length > 0 || (course.enrolled_count || 0) > 0) {
    const n = live.filter((r: { status: string }) => r.status === "active").length;
    return Response.json(
      { error: `신청자가 있는 강좌는 삭제할 수 없습니다(확정 ${n}건${live.length > n ? `, 신청 진행 중 ${live.length - n}건` : ""}). 모집을 멈추려면 강제마감을 쓰십시오.` },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  // 남은 기록(취소·만료·시간이 지난 예약)은 강좌와 함께 지운다
  const oldRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?course_code=eq.${encCode}`, {
    method: "DELETE",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
  });
  if (!oldRes.ok) {
    return Response.json({ error: await oldRes.text() }, { status: 502, headers: CORS_HEADERS });
  }

  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?code=eq.${encCode}`, {
    method: "DELETE",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
  });
  if (!delRes.ok) {
    return Response.json({ error: await delRes.text() }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
