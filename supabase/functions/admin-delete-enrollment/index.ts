import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== Deno.env.get("ADMIN_PASSWORD")) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) {
    return Response.json(
      { error: "id required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sbHeaders = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  };

  // 1. 삭제 전에 enrollment 조회하여 course_code 확인
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/enrollments?id=eq.${encodeURIComponent(id)}&select=course_code,status`,
    { headers: sbHeaders }
  );
  if (!getRes.ok) {
    return Response.json({ error: await getRes.text() }, { status: 502, headers: CORS_HEADERS });
  }
  const rows = await getRes.json();
  if (!rows.length) {
    return Response.json({ error: "enrollment not found" }, { status: 404, headers: CORS_HEADERS });
  }
  const { course_code, status } = rows[0];

  // 2. enrollment 삭제
  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/enrollments?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
    }
  );
  if (!delRes.ok) {
    return Response.json({ error: await delRes.text() }, { status: 502, headers: CORS_HEADERS });
  }

  // 3. active/pending 상태였으면 courses.enrolled_count 차감
  if (status === "active" || status === "pending") {
    // 현재 enrolled_count 조회
    const courseRes = await fetch(
      `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(course_code)}&select=enrolled_count`,
      { headers: sbHeaders }
    );
    if (courseRes.ok) {
      const courses = await courseRes.json();
      if (courses.length) {
        const newCount = Math.max(0, (courses[0].enrolled_count || 0) - 1);
        await fetch(
          `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(course_code)}`,
          {
            method: "PATCH",
            headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ enrolled_count: newCount }),
          }
        );
      }
    }
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
