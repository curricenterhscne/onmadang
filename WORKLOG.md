# WORKLOG.md — 온마당 작업 이력

> 다른 컴퓨터에서 이어 작업할 때 참고용. Claude Code 세션 간 맥락 유지를 위해 기록.

---

## 2026-07-18: 사전 조사 — selector JSON I/O + common.js 헤더 방식 (prompts/06 착수)

### selector exportToJSON / importFromJSON 요약 (design/selector/index.html:1774~1835)

- **payload 구조** (`schema: 'cne_course_selector/v1'`)
  - `exportedAt`: KST ISO(+09:00), `year`, `schoolCode`, `schoolName`, `department|null`
  - `selections`: `Set<'g{groupIdx}-s{subjectIdx}-sem{0..5}'>` → `[...state.userSelections]` 배열로 직렬화
  - `preset`: 활성 학과 프리셋(있으면), `null`
  - `summary`: `_buildSummary()` — `{ totalCredits, changcheCredits, groupBreakdown }` (교과군별 학점 집계, 소수 첫째 자리)
- **파일명**: `과목선택_{학교명}[_{학과}]_{YYYY-MM-DDTHHmm}.json` (특수문자 `_` 치환)
- **import 흐름**
  1. `schema` 검증(`cne_course_selector/v1` 이외 거부) → `schoolCode` 유효성 → 학교 매칭
  2. `state.year` 갱신 후 `onSchoolChange(schoolCode, department, selections)`로 복원
  3. `preset` 있으면 버튼 활성화
- **드래그앤드롭**: `document`에 `.json` 파일 드롭 시 import (드롭 존 UI 없음, 문서 전체가 존)

### journey store가 참고해야 할 지점

- **schema 필드명**은 selector 컨벤션 준수 → 설계서 파일도 `schema`, `exportedAt`(KST) 사용 (`onmadang_jinro/v1`)
- selector payload의 `summary.groupBreakdown`을 그대로 5단계 이력카드 1차 데이터원으로 사용 (design/CLAUDE.md 명시)
- `openFile()`은 두 스키마(`onmadang_jinro/v1`, `cne_course_selector/v1`)를 파일 내용으로 자동 판별해야 함 — selector 파일 드롭 시 `step4.coursePlan`에 들어감

### 공통 헤더/푸터 방식 (assets/js/common.js)

- 사용법: 페이지에 `<div id="om-header" data-active="design"></div>`와 `<div id="om-footer"></div>` 두고 `<script src="../assets/js/common.js"></script>`
- IIFE로 감싼 non-module 스크립트. 실행 시:
  1. `<script src>`에서 base 경로 자동 계산(GitHub Pages 프로젝트 하위 대응)
  2. 클로버 SVG defs를 헤더 앞에 삽입 → 리뉴얼 배너 + `<header>`(GNB 4개, 헤드툴 3개, 햄버거) + 모바일 메뉴로 `outerHTML` 치환
  3. `<div id="om-footer">`도 `<footer>`로 치환
  4. 햄버거 열기/닫기, ESC 닫기, 모바일 아코디언 바인딩
- `data-active` 값: `about|design|safety|board` (없으면 그냥 비활성)
- window에 `cachedFetch` 노출 (sessionStorage, 5분 TTL) — journey `data()` 헬퍼와는 별개(우리는 파일 fetch용 자체 캐시 사용)
- **journey는 셸 1개**이므로 index.html에서 위 방식을 그대로 사용하면 GNB `design` 활성 + 상대경로 링크 자동 계산.

### 이번 단계에서 손대지 않는 것

- selector/majors의 핵심 로직 (`onSchoolChange`, 학과 브리지 파라미터, 학점 집계 등). 06 단계는 journey 셸/store/대시보드/랜딩 링크만.

---

## 2026-07-07: 외부 자산 ①② 통합 (커밋 cd56a0d)

### 작업 내용

외부 별도 레포로 운영되던 두 자산을 `design/` 하위 폴더로 통합하고, 전 페이지 GNB를 활성화했다.

### 변경 파일 구조

```
design/
├── index.html              ← [신규] 진로·학업 설계 랜딩 (5단계 플로우 + 도구 카드 2장)
├── majors/                 ← [신규] ① 대학 학과·권장 과목 (2022-curriculum-majors 복사본)
│   ├── index.html          (헤더/푸터 온마당 공통으로 교체, breadcrumb 추가)
│   ├── app.js              (브리지 URL: ../selector/ 상대경로로 변경)
│   ├── manifest.json
│   ├── 01~10-*.json        (10개 계열 데이터)
│   └── *.pdf
└── selector/               ← [신규] ② 과목 선택 실습 (course_selector_cne 복사본)
    ├── index.html          (헤더/푸터 온마당 공통으로 교체, breadcrumb 추가)
    ├── guide.html          (헤더/푸터 교체)
    └── data/               (~191개 JSON: schools, courseDB, curriculum_2025/2026)
```

### 주요 변경 사항

1. **GNB "진로·학업 설계" 활성화** — 전체 10개 기존 페이지에서 `nav-disabled` → `<a>` 링크 전환
2. **외부 URL → 내부 상대경로** — `curricenterhscne.github.io/2022-curriculum-majors/` 및 `course_selector_cne/` 를 모두 `design/majors/`, `design/selector/`로 전환. `target="_blank"` 제거.
3. **①↔② 브리지** — `app.js`의 `buildSelectorUrl()` 내 URL만 `../selector/`로 변경. 파라미터 로직(`?want=&core=&majorId=`)은 미수정.
4. **온마당 헤더/푸터 통합** — majors, selector, guide 3개 HTML에 리뉴얼 배너 + GNB + 햄버거 메뉴 + breadcrumb + 푸터 추가
5. **캐릭터 SVG** — CDN 참조 유지 (paenkkumi/tokkumi/kkumi, 권리 확보 완료)
6. **제외 파일** — admin.html, mockup_*.html, Python 스크립트, bat, cne-design-system 폴더, docs/

### 수정된 기존 파일 (12개)

- `index.html`, `pilot001.html` — GNB + 외부 링크 전환
- `board/index.html`, `board/notice.html` — GNB + 외부 링크 전환
- `safety/*.html` (6개) — GNB + 외부 링크 전환
- `CLAUDE.md` — 자산 테이블 업데이트 (내부 경로 반영)
- `ASSETS.md` — 연동 방식 "폴더 통합"으로 업데이트

### 알아둘 것

- `design/majors/index.html`과 `design/selector/index.html`은 각각 **자체 CSS 체계**(cne-design-system CDN + 브리지 변수)를 유지. 온마당 헤더/푸터 CSS는 각 파일 내 `<style>` 블록 하단에 별도 추가됨.
- selector의 toolbar(학교 검색, 연도 선택 등)는 원본 그대로 유지. `<header class="kk-header">` → `<header class="onmadang-header">` + `<div class="kk-header-toolbar">` 구조로 분리.
- `design/selector/data/` 에 ~191개 JSON (학교별 편성표). 용량 크지만 정적 파일.

---

## 이전 작업 (참고)

| 커밋 | 내용 |
|---|---|
| cb4c5fd | 기획 md 커밋 + 공동교육과정 수강신청 URL 폐쇄 반영 |
| e7251f4 | 공동교육과정 수강신청 링크를 기간 외 안내 페이지로 교체 |
| 147575b | 4대 안전망 서브페이지 5개 생성 + GNB 활성화 + 모바일 햄버거 메뉴 추가 |
| 5c30b01 | Create index.html |

---

## 다음 할 일 (미완성 메뉴)

- [ ] **고교학점제 안내** (`about/`) — 아직 `nav-disabled` 상태. 콘텐츠 확보 후 페이지 생성 필요.
- [ ] **진로·학업 설계 1~3, 5단계** — design/index.html에 카드만 있고 실제 하위 페이지(자기 이해, 교육과정 이해, 진로설계 활동, 종합 보고서) 미생성.
- [ ] **알림·소통 마당 > 자료실** — 아직 미구현 (공지사항만 운영 중).
- [ ] **공동교육과정 수강신청** (③) — 신규 시스템 개발 중, 완성 시 `safety/enrollment-closed.html` 교체.
