# CLAUDE.md — 알림·소통 마당 (board/)

> 온마당 공통 헤더/푸터 사용. **GitHub Issues를 CMS로** 쓴다.
> 최종 검증 2026-07-24 (실측)

## 구조

```
board/
├─ index.html          공지사항 목록
├─ notice.html         공지 상세
├─ resources.html      자료실 목록
└─ resource-view.html  자료 상세
```

> 루트 `CLAUDE.md` 레지스트리에 `index.html`·`resources.html`만 적혀 있었다. **상세 페이지 2개가 빠져 있었다.**

## 데이터 소스 — GitHub Issues API

- 대상 레포 상수: `const REPO = 'curricenterhscne/onmadang'` (4개 파일에 각각 선언)
- 엔드포인트: `https://api.github.com/repos/${REPO}/issues`
- **라벨로 게시판을 구분한다**

| 게시판 | 라벨 | 비고 |
|---|---|---|
| 공지사항 | `공지` | 카테고리 라벨을 추가로 붙여 필터 (`labels=공지,${label}`) |
| 자료실 | `자료` | |

- 인증 없이 호출한다 → **비인증 rate limit(시간당 60회)** 을 공유한다. 이것이 캐시를 쓰는 이유다.

## 캐시 — `cachedFetch`

`assets/js/common.js:203`에 전역으로 정의된 공유 유틸이다. board 전용이 아니다.

```js
window.cachedFetch = function (url, ttlMs) { … }   // 기본 TTL 60000ms (1분)
```

- sessionStorage에 저장. 탭을 닫으면 사라진다
- 게시글을 올린 뒤 바로 반영되지 않으면 TTL을 기다리거나 탭을 새로 연다
- TTL을 늘리면 rate limit에 여유가 생기지만 반영이 느려진다 (5분 → 1분으로 단축한 이력 있음)

## 주요 함수 (실측)

`fetchIssues` `fetchTotal` `fetchAdjacentIssues` `loadPage` `renderList` `renderNotice` `renderResource` `renderPagination` `setFilter` `extractAttachments` `countAttachments` `hasAttachment` `stripAttachmentLinks` `fileIcon` `getBadges` `getCatBadge` `getIssueId` `fmtDate` `fmtDateFull` `escHtml` `escUrl` `showError` `load`

- 첨부파일은 이슈 본문의 링크를 파싱해 추출한다 (`extractAttachments`) → 본문에서 링크를 지우고(`stripAttachmentLinks`) 별도 영역에 표시
- `escHtml` / `escUrl`로 이스케이프한다. **이슈 본문은 신뢰할 수 없는 입력으로 취급할 것**

## 운영

게시글 등록 = **GitHub Issue 작성 + 라벨 부여**. 중등교육팀이 직접 등록한다.
첨부파일은 Issue 본문에 드래그해 업로드하면 GitHub이 URL을 만들어 준다.

## 하지 말 것

- `REPO` 상수를 한 파일만 고치기 ❌ (4개 파일에 각각 있다)
- 인증 토큰을 프론트엔드에 넣기 ❌ (공개 레포이므로 불필요하고 위험)
- `cachedFetch`를 우회해 직접 `fetch` ❌ (rate limit 소진)
- 이슈 본문을 이스케이프 없이 innerHTML에 삽입 ❌
