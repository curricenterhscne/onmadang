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

  const url = `${SUPABASE_URL}/rest/v1/enrollments?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: 502, headers: CORS_HEADERS });
  }

  return Response.json({ ok: true }, { headers: CORS_HEADERS });
});
