# CLAUDE.md — 알림·소통 마당 (board/)

> 온마당 공통 헤더/푸터 사용. **2026-11-18부터 Supabase 게시판**이다(이전: GitHub Issues).
> 최종 검증 2026-11-18 (코드 실측)

## 구조

```
board/
├─ index.html          첫 화면 (공지사항·자료실 카드 2장, 시안 sub04_00)
├─ notices.html        공지 목록      ← 2026-11-18 이전에는 index.html이 공지 목록이었다
├─ notice.html         공지 상세 (?id=)
├─ resources.html      자료 목록
├─ resource-view.html  자료 상세 (?id=)
├─ admin/index.html    담당자 글쓰기 화면 (noindex, 공통 헤더 없음)
├─ css/board.css       공용 스타일 (목록·상세·첫 화면·배지·첨부)
└─ js/board.js         읽기·화면 모듈 window.OM_BOARD
```

- 목록·상세 HTML은 틀만 있다. `data-board-list="notice|resource"`, `data-board-view="…"` 요소를 `board.js`가 채운다(`mountList` · `mountView`).
- 홈(`index.html`) 알림·소통 마당의 최근 공지 5건도 `OM_BOARD.latest('notice', 5)`를 쓴다.
- 상세 페이지는 `marked@12.0.2` + `dompurify 3.1.6`을 먼저 불러온다. **본문은 신뢰하지 않는 입력이다.** `renderMarkdown()`이 정화하므로 우회하지 말 것.

## 데이터 — Supabase (`yhrgvnttjlitukrxdfdo`, 수강신청과 같은 프로젝트)

| 표 | 내용 | 접근 |
|---|---|---|
| `board_posts` | id, board(`notice`/`resource`), title, body(마크다운), category, is_important, attachments(jsonb), author, created_at, updated_at, deleted_at | 읽기: 누구나(RLS가 `deleted_at`이 있는 글을 숨긴다). 쓰기: 정책 없음 |
| `board_settings` | `editor_password` = `salt$sha256` | 막힘 |
| `board_log` | 로그인·쓰기 기록(ip, role, ok, action, post_id, author) | 막힘 |
| 버킷 `board-files` | 첨부 파일. 공개 읽기, 파일당 50MB | 올리기는 서명 주소로만 |

- SQL: `supabase/sql/board.sql`(표·RLS·버킷), `supabase/sql/board_import_github.sql`(옛 GitHub 이슈 11건, 번호 유지).
- **attachments 원소**: 올린 파일 `{name, path, size}` 또는 외부 링크 `{name, url}`. 파일 주소는 `OM_BOARD.fileUrl()`이 `…/object/public/board-files/{path}?download={name}`로 만든다(원래 이름으로 내려받기).
- 분류: `board.js`의 `BOARDS`와 Edge Function의 `CATEGORIES`가 **같아야 한다.** 공지는 분류 없음 + 「중요」 고정, 자료는 서식·매뉴얼·연수자료·홍보자료.

## 쓰기 — Edge Function `board-admin`

- `supabase/functions/board-admin/index.ts`. 모든 요청은 `POST { action, password, … }`.
- 배포: `npx supabase functions deploy board-admin --no-verify-jwt --project-ref yhrgvnttjlitukrxdfdo`
- **권한은 암호 두 개다.**
  - 마스터: 비밀값 `BOARD_MASTER_PASSWORD`(대시보드 Edge Functions → Secrets). 저장소·대화에 적지 않는다.
  - 담당자 공용 암호: 마스터가 관리 화면 「마스터 관리」에서 정한다. 마스터는 지운 글 되살리기와 기록 보기도 한다.
- 같은 IP에서 15분 안에 10번 틀리면 15분 동안 막는다(`board_log` 기준).
- 지우기는 `deleted_at`만 채운다(첨부 파일은 남긴다). 고치기는 작성자(author)를 바꾸지 않고, 고친 사람은 `board_log.author`에만 남긴다.
- 업로드: `upload_url`이 `YYYYMM/uuid.확장자` 경로의 서명 주소를 주고, 브라우저가 그 주소로 PUT 한다. 확장자 허용 목록은 함수의 `EXT`와 `board.sql`의 MIME 목록이다.

## 운영

- 담당자는 `board/admin/`에서 공용 암호로 로그인해 글을 쓴다. 사용 안내가 화면 안에 있다.
- 로그인 암호는 그 탭의 sessionStorage에만 둔다(탭을 닫으면 사라짐). 작성자 이름은 그 컴퓨터의 localStorage에 기억한다.
- 학생 개인정보가 든 파일을 올리지 않는다(읽기 제한 없음). 교사 전용 자료는 다른 사이트로 공유한다.

## 하지 말 것

- 본문을 `renderMarkdown()` 없이 innerHTML에 넣기 ❌
- `board_posts`에 쓰기 RLS 정책 추가 ❌ → 쓰기는 `board-admin`만
- 분류를 `board.js`·함수 중 한 곳만 고치기 ❌
- 공지 목록 주소를 `board/index.html`로 되돌리기 ❌ → 첫 화면이다. 목록은 `notices.html`
- 마스터·담당자 암호를 코드·문서·대화에 적기 ❌
