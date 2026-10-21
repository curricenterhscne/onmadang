import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, CORS_HEADERS } from "../_shared/authz.ts";

function sbHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

async function fetchAllRows(baseUrl: string, key: string) {
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let offset = 0;

  while (true) {
    const res = await fetch(baseUrl, {
      headers: {
        ...sbHeaders(key),
        "Range-Unit": "items",
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        Prefer: "count=exact",
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allRows.push(...data);

    const contentRange = res.headers.get("Content-Range");
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match && allRows.length >= parseInt(match[1])) break;
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allRows;
}

async function fetchSchoolMap(supabaseUrl: string, key: string) {
  const url = `${supabaseUrl}/rest/v1/schools?select=neis_code,name&limit=2000`;
  const res = await fetch(url, { headers: sbHeaders(key) });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const s of data) map[s.neis_code] = s.name;
  return map;
}

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
  if (!staff) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const programParam = url.searchParams.get("program");
  const includeSchool = url.searchParams.get("includeSchool");

  // JSON with optional school name map
  // region/org 관리자는 courses와 inner join해서 그 소속 강좌의 신청자만 보게 한다
  // (enrollments 자체엔 region/org가 없어서, 연결된 courses 쪽 컬럼으로 필터링)
  let queryUrl = `${SUPABASE_URL}/rest/v1/enrollments?select=*,courses!inner(name,region,org,program)&status=in.(active,pending)&order=student_no`;
  if (code) queryUrl += `&course_code=eq.${encodeURIComponent(code)}`;
  if (programParam) queryUrl += `&courses.program=eq.${encodeURIComponent(programParam)}`;
  if (staff.role === "region" && staff.scope_value) {
    queryUrl += `&courses.region=eq.${encodeURIComponent(staff.scope_value)}`;
  } else if (staff.role === "org" && staff.scope_value) {
    queryUrl += `&courses.org=eq.${encodeURIComponent(staff.scope_value)}`;
  } else if (staff.role === "region" || staff.role === "org") {
    queryUrl += `&courses.region=eq.__none__`; // scope_value 누락 시 fail closed
  }

  try {
    const rows = await fetchAllRows(queryUrl, SERVICE_ROLE_KEY);
    let schoolMap: Record<string, string> = {};
    if (includeSchool === "true") {
      schoolMap = await fetchSchoolMap(SUPABASE_URL, SERVICE_ROLE_KEY);
    }

    const result = rows.map((r: any) => ({
      ...r,
      school_name: schoolMap[r.school] || undefined,
    }));

    return Response.json(result, {
      headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502, headers: CORS_HEADERS });
  }
});
