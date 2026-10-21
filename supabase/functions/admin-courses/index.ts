import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, scopeFilterParam, CORS_HEADERS } from "../_shared/authz.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth check — 개인 계정(JWT) 또는 과도기 공유 비밀번호
  const staff = await authenticateStaff(req, SUPABASE_URL, SERVICE_ROLE_KEY);
  if (!staff) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  // program 쿼리파라미터(선택) + 역할별 scope 필터(region→region 컬럼, org→org 컬럼)
  const reqUrl = new URL(req.url);
  const programParam = reqUrl.searchParams.get("program");
  const scopeColumn = staff.role === "org" ? "org" : "region";
  const scopeQS = scopeFilterParam(staff, scopeColumn);
  const programQS = programParam ? `&program=eq.${encodeURIComponent(programParam)}` : "";

  const url = `${SUPABASE_URL}/rest/v1/courses?select=*&order=code${scopeQS}${programQS}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: 502, headers: CORS_HEADERS });
  }

  const data = await res.json();
  return Response.json(data, {
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
  });
});
