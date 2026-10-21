import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, isWithinScope, CORS_HEADERS } from "../_shared/authz.ts";

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
  const { code, value } = body;
  if (!code || typeof value !== "boolean") {
    return Response.json(
      { error: "code and value (boolean) required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (staff.role !== "province") {
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(code)}&select=region,org`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    );
    const rows = checkRes.ok ? await checkRes.json() : [];
    const course = rows[0];
    const col = staff.role === "region" ? "region" : "org";
    if (!course || !isWithinScope(staff, col, course[col])) {
      return Response.json({ error: "Forbidden — 소관 강좌가 아닙니다" }, { status: 403, headers: CORS_HEADERS });
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/courses?code=eq.${encodeURIComponent(code)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_closed_manual: value }),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
