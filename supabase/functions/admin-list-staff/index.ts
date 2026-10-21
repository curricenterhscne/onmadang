import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, CORS_HEADERS } from "../_shared/authz.ts";

// 도교육청 담당자가 전체 직원 계정(가입 대기 포함)을 조회한다 — 승인 화면용.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const staff = await authenticateStaff(req, SUPABASE_URL, SERVICE_ROLE_KEY);
  if (!staff || staff.role !== "province") {
    return Response.json({ error: "Forbidden — 도교육청 담당자만 조회할 수 있습니다" }, { status: 403, headers: CORS_HEADERS });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/staff_profiles?select=*&order=created_at.desc`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    return Response.json({ error: await res.text() }, { status: 502, headers: CORS_HEADERS });
  }

  const data = await res.json();
  return Response.json(data, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
});
