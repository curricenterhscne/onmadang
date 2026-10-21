import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, isWithinScope, CORS_HEADERS } from "../_shared/authz.ts";

// 강좌 등록·수정. apply/_embed_data.js + gen_embed.py 재생성 워크플로를 대체한다 —
// 비개발자인 지역청/기관 담당자가 이 함수를 통해 강좌 상세 정보를 직접 입력한다.
//
// 입력 바디: { code, program, name, org, region, capacity, min_open,
//              field, target, intro, method, place, supply, activity_area,
//              recommended_for, instructor_bio, start_date, end_date, session_count,
//              instructors, sessions, schedule_by_day, learning_goals, grade_restricted }
// code가 기존에 있으면 수정, 없으면 신규 등록(둘 다 이 함수 하나로 처리 — PostgREST upsert).

const EDITABLE_FIELDS = [
  "name", "org", "region", "capacity", "min_open",
  "field", "target", "intro", "method", "place", "supply",
  "activity_area", "recommended_for", "instructor_bio",
  "start_date", "end_date", "session_count",
  "instructors", "sessions", "schedule_by_day", "learning_goals",
  "grade_restricted", "is_registerable",
];

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
  const { code, program } = body;
  if (!code || !program) {
    return Response.json({ error: "code, program required" }, { status: 400, headers: CORS_HEADERS });
  }

  // region/org 관리자는 자기 scope 값과 일치하는 강좌만 등록/수정 가능 —
  // 요청 바디의 region/org가 자기 scope_value와 다르면 거부(다른 지역/기관 강좌를 몰래 못 만듦).
  if (staff.role !== "province") {
    const col = staff.role === "region" ? "region" : "org";
    if (!isWithinScope(staff, col, body[col])) {
      return Response.json(
        { error: `Forbidden — ${col}는 본인 소관(${staff.scope_value}) 값이어야 합니다` },
        { status: 403, headers: CORS_HEADERS },
      );
    }
  }

  const payload: Record<string, unknown> = { code, program };
  for (const f of EDITABLE_FIELDS) {
    if (body[f] !== undefined) payload[f] = body[f];
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      // code가 이미 있으면 갱신, 없으면 삽입. enrolled_count는 payload에 없으므로
      // merge-duplicates라도 기존 신청 인원수가 덮어써지지 않는다(해당 컬럼을 안 보내면
      // PostgREST upsert는 그 컬럼을 그대로 둔다).
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([payload]),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: 502, headers: CORS_HEADERS });
  }

  const data = await res.json();
  return Response.json({ ok: true, course: data[0] }, { headers: CORS_HEADERS });
});
