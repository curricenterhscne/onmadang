// ============================================================
// board-admin — 알림·소통 마당 글쓰기 (2026-11-18)
// ============================================================
// 모든 요청: POST { action, password, ... }
//   login                                  → { role }
//   create   { post }                      → { id }
//   update   { id, post, editor }          → { ok }   (작성자 author는 바꾸지 않는다. 고친 사람 editor는 기록에만)
//   delete   { id }                        → { ok }   (deleted_at 표시, 화면에서 숨김. 마스터가 복구 가능)
//   upload_url { name, size }              → { path, signedUrl }  (브라우저가 signedUrl로 PUT)
//   마스터 전용:
//   list_deleted                           → { rows }
//   restore  { id }                        → { ok }
//   set_editor_password { new_password }   → { ok }
//   log                                    → { rows }  (최근 200건)
//
// 권한
//   master — 비밀값 BOARD_MASTER_PASSWORD (대시보드 Edge Functions > Secrets)
//   editor — 담당자 공용 암호. board_settings('editor_password')에 salt$sha256 로 둔다.
//            마스터가 관리 화면에서 바꾼다. 아직 정하지 않았으면 editor 로그인은 없다.
//   같은 IP에서 15분 안에 10번 틀리면 15분 동안 막는다.
//
// post 필드: board(notice|resource) title body category is_important attachments author
// 배포: npx supabase functions deploy board-admin --no-verify-jwt --project-ref yhrgvnttjlitukrxdfdo
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MASTER = Deno.env.get("BOARD_MASTER_PASSWORD") ?? "";
const BUCKET = "board-files";
const MAX_FILE = 50 * 1024 * 1024;
const FAIL_LIMIT = 10;
const FAIL_WINDOW_MIN = 15;

// board/js/board.js의 BOARDS와 같아야 한다
const CATEGORIES: Record<string, string[]> = {
  notice: [],
  resource: ["서식", "매뉴얼", "연수자료", "홍보자료"],
};
const EXT = ["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip",
  "png", "jpg", "jpeg", "gif", "webp", "txt", "csv", "mp4"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}
class Bad extends Error { constructor(msg: string, public status = 400) { super(msg); } }

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await r.text();
  if (!r.ok) throw new Bad(`DB 오류 (${r.status}) ${text.slice(0, 200)}`, 500);
  return text ? JSON.parse(text) : null;
}

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

async function recentFails(ip: string) {
  const since = new Date(Date.now() - FAIL_WINDOW_MIN * 60000).toISOString();
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/board_log?select=id&ip=eq.${encodeURIComponent(ip)}&ok=is.false&at=gte.${encodeURIComponent(since)}&limit=1`,
    { headers: { ...H, Prefer: "count=exact" } },
  );
  const cr = r.headers.get("content-range") || "*/0";
  return parseInt(cr.split("/")[1] || "0", 10) || 0;
}

async function log(entry: Record<string, unknown>) {
  try { await rest("board_log", { method: "POST", body: JSON.stringify(entry) }); } catch (_) { /* 기록 실패는 무시 */ }
}

async function roleFor(pw: string): Promise<"master" | "editor" | null> {
  if (!pw) return null;
  if (MASTER && safeEq(pw, MASTER)) return "master";
  const rows = await rest("board_settings?select=value&key=eq.editor_password");
  const stored: string | undefined = rows?.[0]?.value;
  if (!stored || !stored.includes("$")) return null;
  const [salt, hash] = stored.split("$");
  return safeEq(await sha256(salt + pw), hash) ? "editor" : null;
}

function str(v: unknown, max: number, field: string, required = false): string | null {
  if (v == null || v === "") { if (required) throw new Bad(`${field}을(를) 입력하십시오.`); return null; }
  if (typeof v !== "string") throw new Bad(`${field} 형식이 올바르지 않습니다.`);
  const s = v.trim();
  if (required && !s) throw new Bad(`${field}을(를) 입력하십시오.`);
  if (s.length > max) throw new Bad(`${field}은(는) ${max}자 이하로 입력하십시오.`);
  return s || null;
}

function cleanAttachments(v: unknown) {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > 20) throw new Bad("첨부는 20개까지 넣을 수 있습니다.");
  return v.map((a: any) => {
    const name = str(a?.name, 200, "첨부 이름", true)!;
    // 그림 첨부: alt(그림 설명)·w·h(올릴 때 잰 크기, 본문에서 자리 잡기용)·pos(본문 위/아래) — 모두 선택
    const extra: Record<string, unknown> = {};
    const alt = str(a?.alt, 200, "그림 설명");
    if (alt) extra.alt = alt;
    const w = Number(a?.w), h = Number(a?.h);
    if (Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && w <= 20000 && h <= 20000) { extra.w = w; extra.h = h; }
    if (a?.pos === "top" || a?.pos === "bottom") extra.pos = a.pos; // 본문 위·아래 (없으면 화면에서 위)
    if (a?.path) {
      if (typeof a.path !== "string" || !/^\d{6}\/[0-9a-f-]{36}\.[a-z0-9]{1,5}$/.test(a.path)) throw new Bad("첨부 파일 경로가 올바르지 않습니다.");
      const size = Number(a.size) || 0;
      return { name, path: a.path, size, ...extra };
    }
    let url: URL;
    try { url = new URL(String(a?.url || "")); } catch { throw new Bad(`링크 주소가 올바르지 않습니다: ${name}`); }
    if (url.protocol !== "https:") throw new Bad("링크는 https:// 로 시작해야 합니다.");
    return { name, url: url.href, ...extra };
  });
}

function cleanPost(p: any, isCreate: boolean) {
  if (!p || typeof p !== "object") throw new Bad("글 내용이 없습니다.");
  const out: Record<string, unknown> = {};
  if (isCreate || p.board !== undefined) {
    if (!(p.board in CATEGORIES)) throw new Bad("게시판을 고르십시오.");
    out.board = p.board;
  }
  if (isCreate || p.title !== undefined) out.title = str(p.title, 200, "제목", true);
  if (isCreate || p.body !== undefined) out.body = str(p.body, 50000, "본문") ?? "";
  if (isCreate || p.category !== undefined) {
    const c = str(p.category, 30, "분류");
    const board = (out.board as string) || p.board;
    if (c && board && !CATEGORIES[board]?.includes(c)) throw new Bad("분류가 올바르지 않습니다.");
    out.category = c;
  }
  if (isCreate || p.is_important !== undefined) out.is_important = !!p.is_important;
  if (isCreate || p.attachments !== undefined) out.attachments = cleanAttachments(p.attachments);
  if (isCreate || p.author !== undefined) out.author = str(p.author, 40, "작성 담당자", true);
  return out;
}

function postId(v: unknown) {
  const id = Number(v);
  if (!Number.isInteger(id) || id < 1) throw new Bad("글 번호가 올바르지 않습니다.");
  return id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST만 받습니다." }, 405);

  const ip = clientIp(req);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }
  const action = String(body?.action || "");

  try {
    if ((await recentFails(ip)) >= FAIL_LIMIT) {
      return json({ error: `암호를 여러 번 틀려 ${FAIL_WINDOW_MIN}분 동안 막혔습니다. 잠시 뒤 다시 시도하십시오.` }, 429);
    }
    const role = await roleFor(String(body?.password || ""));
    if (!role) {
      await log({ ip, role: null, ok: false, action });
      return json({ error: "암호가 맞지 않습니다." }, 401);
    }
    const masterOnly = () => { if (role !== "master") throw new Bad("마스터 계정만 할 수 있습니다.", 403); };

    switch (action) {
      case "login": {
        await log({ ip, role, ok: true, action });
        const hasEditor = role === "master"
          ? !!(await rest("board_settings?select=key&key=eq.editor_password"))?.length : undefined;
        return json({ role, editorPasswordSet: hasEditor });
      }

      case "create": {
        const post = cleanPost(body.post, true);
        const rows = await rest("board_posts", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(post) });
        const id = rows?.[0]?.id;
        await log({ ip, role, ok: true, action, post_id: id, author: post.author });
        return json({ id });
      }

      case "update": {
        const id = postId(body.id);
        const post = cleanPost(body.post, false);
        delete post.author; delete post.board; // 작성자·게시판은 고치지 않는다
        if (post.category !== undefined && post.board === undefined) {
          const cur = await rest(`board_posts?select=board&id=eq.${id}`);
          const b = cur?.[0]?.board;
          if (post.category && b && !CATEGORIES[b].includes(post.category as string)) throw new Bad("분류가 올바르지 않습니다.");
        }
        post.updated_at = new Date().toISOString();
        const rows = await rest(`board_posts?id=eq.${id}&deleted_at=is.null`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(post) });
        if (!rows?.length) throw new Bad("글을 찾을 수 없습니다.", 404);
        await log({ ip, role, ok: true, action, post_id: id, author: str(body.editor, 40, "고친 사람") });
        return json({ ok: true });
      }

      case "delete": {
        const id = postId(body.id);
        const rows = await rest(`board_posts?id=eq.${id}&deleted_at=is.null`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
        if (!rows?.length) throw new Bad("글을 찾을 수 없습니다.", 404);
        await log({ ip, role, ok: true, action, post_id: id });
        return json({ ok: true });
      }

      case "upload_url": {
        const name = str(body.name, 200, "파일 이름", true)!;
        const ext = (name.split(".").pop() || "").toLowerCase();
        if (!EXT.includes(ext)) throw new Bad(`올릴 수 없는 파일 형식입니다(.${ext}). 가능한 형식: ${EXT.join(", ")}`);
        const size = Number(body.size) || 0;
        if (size > MAX_FILE) throw new Bad("파일은 50MB 이하만 올릴 수 있습니다. 더 큰 파일은 구글 드라이브 링크로 첨부하십시오.");
        const now = new Date(Date.now() + 9 * 3600000);
        const path = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`, { method: "POST", headers: H, body: "{}" });
        const t = await r.json().catch(() => ({}));
        if (!r.ok || !t.url) throw new Bad(`업로드 주소를 만들지 못했습니다 (${r.status}).`, 500);
        return json({ path, signedUrl: `${SUPABASE_URL}/storage/v1${t.url}` });
      }

      case "list_deleted": {
        masterOnly();
        const rows = await rest("board_posts?select=id,board,title,author,deleted_at&deleted_at=not.is.null&order=deleted_at.desc&limit=100");
        return json({ rows });
      }

      case "restore": {
        masterOnly();
        const id = postId(body.id);
        await rest(`board_posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ deleted_at: null }) });
        await log({ ip, role, ok: true, action, post_id: id });
        return json({ ok: true });
      }

      case "set_editor_password": {
        masterOnly();
        const pw = String(body.new_password || "");
        if (pw.length < 8) throw new Bad("담당자 암호는 8자 이상으로 정하십시오.");
        if (MASTER && safeEq(pw, MASTER)) throw new Bad("마스터 암호와 다른 암호로 정하십시오.");
        const salt = crypto.randomUUID().replace(/-/g, "");
        const value = `${salt}$${await sha256(salt + pw)}`;
        await rest("board_settings?on_conflict=key", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ key: "editor_password", value, updated_at: new Date().toISOString() }),
        });
        await log({ ip, role, ok: true, action });
        return json({ ok: true });
      }

      case "log": {
        masterOnly();
        const rows = await rest("board_log?select=at,ip,role,ok,action,post_id,author&order=at.desc&limit=200");
        return json({ rows });
      }

      default:
        throw new Bad("알 수 없는 요청입니다.");
    }
  } catch (e) {
    const status = e instanceof Bad ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : String(e) }, status);
  }
});
