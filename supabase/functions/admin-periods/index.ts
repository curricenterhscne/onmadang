// ============================================================
// admin-periods — 수강신청 기간 조회·저장 (지역청별 기간, 2026-11-11)
// ============================================================
// GET  ?program=joint_regional
//      → { rows: [{id, program, region, open_at, close1_at, open2_at, close2_at}] }
//        region이 null인 행이 프로그램 기본 기간이다.
// POST { program, region|null, preview_at?, open_at, close1_at?, open2_at?, close2_at? }  → 저장(없으면 추가)
//      preview_at(강좌 공개 시각)은 비우면 NULL = 신청 시작 7일 전(preview_period.sql, 2026-11-12)
// POST { action: "delete", program, region }                              → 지역 행 삭제(기본 기간으로 돌아감)
//
// 권한
//   province — 모든 프로그램, 기본 기간과 모든 지역
//   region   — REGION_PROGRAMS만, 자기 지역(scope_value) 행만. 기본 기간은 읽기만
//   org      — 불가
// 시각은 ISO 문자열(시간대 포함)로 받는다. 화면에서 KST(+09:00)를 붙여 보낸다.
// settings의 (program, region) 고유 인덱스는 식(coalesce) 인덱스라 PostgREST on_conflict를
// 쓸 수 없다 → 먼저 찾아서 PATCH, 없으면 INSERT.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateStaff, CORS_HEADERS, StaffProfile } from "../_shared/authz.ts";

// admin-upsert-course·관리 화면의 REGION_PROGRAMS와 같아야 한다
const REGION_PROGRAMS = ["joint_regional"];
const FIELDS = ["preview_at", "open_at", "close1_at", "open2_at", "close2_at"] as const;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function canRead(staff: StaffProfile, program: string) {
  if (staff.role === "province") return true;
  return staff.role === "region" && REGION_PROGRAMS.includes(program);
}

function canWrite(staff: StaffProfile, program: string, region: string | null) {
  if (staff.role === "province") return true;
  if (staff.role !== "region" || !REGION_PROGRAMS.includes(program)) return false;
  return !!region && !!staff.scope_value && region === staff.scope_value;
}

function toTime(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? NaN : t;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

  const staff = await authenticateStaff(req, SUPABASE_URL, KEY);
  if (!staff) return json({ error: "Unauthorized" }, 401);

  // ── 조회 ──
  if (req.method === "GET") {
    const program = new URL(req.url).searchParams.get("program") || "";
    if (!program) return json({ error: "program required" }, 400);
    if (!canRead(staff, program)) return json({ error: "Forbidden" }, 403);
    let q = `${SUPABASE_URL}/rest/v1/settings?program=eq.${encodeURIComponent(program)}` +
      `&select=id,program,region,preview_at,open_at,close1_at,open2_at,close2_at&order=region.nullsfirst`;
    // 지역청은 기본 기간 + 자기 지역 행만
    if (staff.role === "region") {
      const sv = encodeURIComponent(staff.scope_value || "__none__");
      q += `&or=(region.is.null,region.eq.${sv})`;
    }
    const r = await fetch(q, { headers: H });
    if (!r.ok) return json({ error: await r.text() }, 502);
    return json({ rows: await r.json(), role: staff.role, scope: staff.scope_value });
  }

  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const program = String(body.program || "");
  const region: string | null = body.region ? String(body.region) : null;
  if (!program) return json({ error: "program required" }, 400);
  if (!canWrite(staff, program, region)) {
    return json({ error: staff.role === "region" ? "자기 교육지원청의 기간만 바꿀 수 있습니다" : "Forbidden" }, 403);
  }

  const match = `program=eq.${encodeURIComponent(program)}&` +
    (region ? `region=eq.${encodeURIComponent(region)}` : "region=is.null");

  // ── 삭제(지역 행만) ──
  if (body.action === "delete") {
    if (!region) return json({ error: "기본 기간은 삭제할 수 없습니다" }, 400);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?${match}`, {
      method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
    });
    if (!r.ok) return json({ error: await r.text() }, 502);
    return json({ ok: true });
  }

  // ── 저장 ──
  const t = Object.fromEntries(FIELDS.map((f) => [f, toTime(body[f])])) as Record<typeof FIELDS[number], number | null>;
  if (FIELDS.some((f) => Number.isNaN(t[f]))) return json({ error: "날짜 형식이 올바르지 않습니다" }, 400);
  if (t.open_at === null) return json({ error: "신청 시작 일시는 꼭 넣어야 합니다" }, 400);
  if (t.close1_at === null) return json({ error: "신청 마감 일시는 꼭 넣어야 합니다" }, 400);
  if (t.close1_at <= t.open_at) return json({ error: "마감은 시작보다 뒤여야 합니다" }, 400);
  if (t.preview_at !== null && t.preview_at >= t.open_at) return json({ error: "강좌 공개는 신청 시작보다 앞이어야 합니다" }, 400);
  if ((t.open2_at === null) !== (t.close2_at === null)) return json({ error: "2차 신청은 시작과 마감을 함께 넣어야 합니다" }, 400);
  if (t.open2_at !== null && t.close2_at !== null) {
    if (t.open2_at <= t.close1_at) return json({ error: "2차 시작은 1차 마감보다 뒤여야 합니다" }, 400);
    if (t.close2_at <= t.open2_at) return json({ error: "2차 마감은 2차 시작보다 뒤여야 합니다" }, 400);
  }
  const row: Record<string, unknown> = { program, region };
  for (const f of FIELDS) row[f] = t[f] === null ? null : new Date(t[f]!).toISOString();

  const found = await fetch(`${SUPABASE_URL}/rest/v1/settings?${match}&select=id`, { headers: H });
  const rows = found.ok ? await found.json() : [];
  const r = rows.length
    ? await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.${rows[0].id}`, {
        method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(row),
      })
    : await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
        method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(row),
      });
  if (!r.ok) return json({ error: await r.text() }, 502);
  const saved = await r.json();
  return json({ ok: true, row: saved[0] });
});
