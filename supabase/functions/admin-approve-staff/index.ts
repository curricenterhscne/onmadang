import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, CORS_HEADERS } from "../_shared/authz.ts";

// 가입 신청(status='pending')을 도교육청(province) 담당자가 승인/거부한다.
// 입력: { staff_id, action: 'approve'|'reject' }

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
  if (!staff || staff.role !== "province") {
    return Response.json({ error: "Forbidden — 도교육청 담당자만 승인할 수 있습니다" }, { status: 403, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const { staff_id, action } = body;
  if (!staff_id || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "staff_id, action('approve'|'reject') 필요" }, { status: 400, headers: CORS_HEADERS });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/staff_profiles?id=eq.${encodeURIComponent(staff_id)}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
  });
  if (!res.ok) {
    return Response.json({ error: await res.text() }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
