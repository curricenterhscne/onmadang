# WORKLOG.md — 온마당 작업 이력

> 다른 컴퓨터에서 이어 작업할 때 참고용. Claude Code 세션 간 맥락 유지를 위해 기록.

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
