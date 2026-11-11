import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, CORS_HEADERS } from "../_shared/authz.ts";

// 프로그램 단위 전체 초기화 — 그 프로그램의 강좌·신청자를 전부 지운다.
// 신청 기간이 끝나고 대상자 선정·명단 다운로드가 끝난 뒤, 다음 회차를 준비하려고
// DB의 개인정보를 지우는 용도(온마당은 개인정보를 상시 보관하지 않는다는 원칙).
// 되돌릴 수 없으므로 province만 호출 가능하다. programs/settings 행 자체는 남긴다
// (다음 회차에도 같은 프로그램 메타·기간설정을 재사용할 수 있게).
//
// 입력: { program, confirm: "<program display_name 그대로>" }
// confirm이 실제 programs.display_name과 정확히 일치해야만 실행된다(오클릭 방지).

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
  if (!staff || staff.role !== "province") {
    return Response.json({ error: "Forbidden — 도교육청 담당자만 초기화할 수 있습니다" }, { status: 403, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const { program, confirm } = body;
  if (!program) {
    return Response.json({ error: "program required" }, { status: 400, headers: CORS_HEADERS });
  }

  const progRes = await fetch(
    `${SUPABASE_URL}/rest/v1/programs?code=eq.${encodeURIComponent(program)}&select=code,display_name`,
    { headers: sbHeaders },
  );
  const progRows = progRes.ok ? await progRes.json() : [];
  const progRow = progRows[0];
  if (!progRow) {
    return Response.json({ error: "program not found" }, { status: 404, headers: CORS_HEADERS });
  }
  if (confirm !== progRow.display_name) {
    return Response.json(
      { error: `확인 문구가 일치하지 않습니다. "${progRow.display_name}"을(를) 정확히 입력하세요.` },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const coursesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?program=eq.${encodeURIComponent(program)}&select=code`,
    { headers: sbHeaders },
  );
  if (!coursesRes.ok) {
    return Response.json({ error: await coursesRes.text() }, { status: 502, headers: CORS_HEADERS });
  }
  const courses = await coursesRes.json();
  const codes: string[] = courses.map((c: { code: string }) => c.code);

  let deletedEnrollments = 0;
  if (codes.length) {
    const codeList = codes.map(encodeURIComponent).join(",");
    const delEnrollRes = await fetch(
      `${SUPABASE_URL}/rest/v1/enrollments?course_code=in.(${codeList})`,
      { method: "DELETE", headers: { ...sbHeaders, Prefer: "return=representation" } },
    );
    if (!delEnrollRes.ok) {
      return Response.json({ error: await delEnrollRes.text() }, { status: 502, headers: CORS_HEADERS });
    }
    const deletedRows = await delEnrollRes.json();
    deletedEnrollments = Array.isArray(deletedRows) ? deletedRows.length : 0;
  }

  const delCoursesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?program=eq.${encodeURIComponent(program)}`,
    { method: "DELETE", headers: { ...sbHeaders, Prefer: "return=representation" } },
  );
  if (!delCoursesRes.ok) {
    return Response.json({ error: await delCoursesRes.text() }, { status: 502, headers: CORS_HEADERS });
  }
  const deletedCourseRows = await delCoursesRes.json();
  const deletedCourses = Array.isArray(deletedCourseRows) ? deletedCourseRows.length : 0;

  return Response.json(
    { ok: true, program, deletedCourses, deletedEnrollments },
    { headers: CORS_HEADERS },
  );
});
