# WORKLOG.md — 온마당 작업 이력

> 다른 컴퓨터에서 이어 작업할 때 참고용. Claude Code 세션 간 맥락 유지를 위해 기록.

---

## 2026-08-13: 폴더 실측 ↔ CLAUDE.md 대조 및 문서 정합화

07-24 이후 코드가 크게 움직였는데 문서가 따라가지 못해, 전 폴더를 실측해 대조하고 어긋난 곳을 맞췄다.

### 발견한 불일치 (문서 → 실제)

| 문서 | 실제 |
|---|---|
| `apply/CLAUDE.md`: `index.html` = 앱 본체, "`common.js` 미사용" | 앱은 **`app.html`**. `index.html`은 마감 안내이고 **`common.js`를 쓴다** |
| `dual_credit/CLAUDE.md`: "수강신청은 `apply/index.html`에서 처리" | 위와 동일 사유로 틀림. `support/` 폴더도 문서에 없었음 |
| `design/CLAUDE.md`: `compass/`·`outside/` ⏳ 미구현, 허브 "구 5단계 카드" | 셋 다 완료. 진행 순서 1~5 전 항목 완료 |
| 루트: `about/` ❌ 미구축 (P0) | 구축 완료 (3개 페이지) |
| 루트: `off-campus_courses/` "학교 밖 교육 강좌 / 공통 헤더 ✅" | **심의 자료**이고 공통 헤더 **미사용**. 학생 동선의 「학교 밖 교육」은 `safety/off-campus_courses.html` |
| 루트: `data-active` 값 4개 | `about` 포함 5개 |
| 루트: `safety/` "5개 HTML" | 6개 |

### 코드 수정

1. **`apply/app.html` GNB 정정** — `common.js`를 안 쓰는 독립 앱이라 GNB가 수동 관리인데, 본체 개편이 반영되지 않아 낡아 있었다.
   - `알림·소통 마당` → `../index.html`(홈)로 가던 것을 `../board/`로
   - `고교학점제` 메뉴 누락 → 첫 번째로 추가 (GNB 순서 규칙)
   - `수강신청` 자기 링크 `./` → `./app.html` (앱 안에서 누르면 마감 안내로 나가던 문제)
   - 데스크톱 `.onmadang-links` · 모바일 `.om-mobile-nav` **양쪽** 수정
2. **테스트 덤프가 레포 루트로 새던 것 차단** — `design/_dev/test-page.js`가 `sample-export.json`을 **레포 루트**에 쓰고 있었다. GitHub Pages는 레포 전체를 배포하므로 테스트 산출물이 그대로 공개된다.
   - 출력 경로를 `_dev/` 안으로 변경, `.gitignore`에 추가(루트 경로도 재발 방지용으로 함께 등록), 추적 중이던 `_dev/sample-export.json`은 `git rm --cached`

### 문서 수정

- `apply/CLAUDE.md` — `app.html` / `index.html` 역할 구분 표 신설, 헤더 규칙을 파일별로 분리, 배너·Supabase 키·GoatCounter 위치 정정
- `dual_credit/CLAUDE.md` — apply 경로 정정, `support/` 추가, 수강신청 링크 4곳 목록화
- `design/CLAUDE.md` — 완료 상태 반영, `compass/` 매핑 근거는 미검토로 남김
- 루트 `CLAUDE.md` — 레지스트리를 「본체」/「링크되지 않는 부속 페이지」로 분리, **GoatCounter 절 신설**, 마감 안내 페이지 2종 구분 명시

### 알아둘 것

- **링크되지 않는 부속 페이지가 7종 있다** (`off-campus_courses/` 3종, `dual_credit/support/`, `resources/teacher/online_class/`, `2015/`, `pilot001.html`). 담당자가 URL을 직접 배포하는 문서형 페이지라 사이트를 훑어서는 안 나온다. "죽은 링크 0" 점검 시 누락 주의.
- **GoatCounter가 페이지마다 인라인**이라 `common.js`가 주입하지 않는다. 새 페이지는 직접 넣어야 하고, 현재 앱 계열(`app.html`, `check/`, `majors/`, `selector/`, `courses.html`)은 빠져 있다.
- DS CDN `@main` 핀 고정은 **여전히 미적용** (10곳). 07-24 문서의 지적이 그대로 유효하다.

---

## 2026-07-15 ~ 08-06: 수강신청 운영 및 본체 완성 (요약)

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 07-15 | `383c2e3`~`95daae1` | 수강신청 관리자 대시보드 구현, 신청 삭제 + `enrolled_count` 차감, 3학년 옵션 제거, 강좌 안내 링크를 `dual_credit`으로 |
| 07-22 | `931c017` `da893e4` | `off-campus_courses/dream_up26-1/` 업로드 (꿈키움 이수 결과 확인) |
| 07-24 | `4e06387` | GitHub API 캐시 TTL 5분 → 1분 |
| 07-30 | `248bcae` | **진로·학업 설계 3관문 재편** — 허브 개편 + `compass/` + `outside/` + `subMenus.design` 교체 |
| 07-30 | `b4ccd61` | **`about/` 신규** (고교학점제란? / 학생 주도성) + GNB 전 메뉴 활성화 |
| 07-30 | `ecea72e` `3d49e31` | 정식 홈페이지 구축, head-tools 정리, 텍스트·레이아웃 조정 |
| 07-30 | `7c7f471` | selector·majors에 공통 GNB 적용, 배너 문구 갱신 |
| 08-03 | `aa67ff7` `67148b7` | 메인 공지사항 섹션 위치·배경 조정 |
| 08-03 | `63f08f6` | **수강신청 앱을 `app.html`로 이동**, `index.html`을 마감 안내로 교체 |
| 08-06 | `4bfe149` | `dual_credit/support/` 업로드 (수업 운영 안내 협의회) |

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

## 다음 할 일

> 2026-08-13 갱신. 아래 4개는 **완료**되어 목록에서 내렸다 — `about/`, 진로·학업 설계 하위 페이지(3관문으로 대체), 자료실, GNB 전 메뉴 활성화.

### 남은 것

- [ ] **DS CDN 핀 고정** — `@main` → 커밋 해시. `design/majors/index.html`, `design/selector/index.html`, `design/selector/guide.html` 총 10곳. 07-24부터 미처리.
- [ ] **`compass/` 매핑 근거 검토** — 화면은 동작하나 `design/data/compass-mapping.json`의 흥미유형 → 계열 연결 타당성은 미검증. **자의적으로 만들지 말 것**이라는 원칙에 따라 근거 확인 후 승인 필요.
- [ ] **GoatCounter 누락 페이지 보완 여부 결정** — `design/check/`, `design/majors/`, `design/selector/`, `dual_credit/courses.html`, `apply/app.html`. 앱 계열에도 통계를 붙일지 판단.
- [ ] **공동교육과정 수강신청** (③) — 신규 시스템 개발 중, 완성 시 `safety/enrollment-closed.html` 교체.
- [ ] **다음 수강신청 기간 개시 준비** — `apply/index.html`을 앱으로 되돌릴지 결정 + `dual_credit`의 "수강 신청하기" 링크 4곳 목적지 점검 (`apply/CLAUDE.md` 참조).
- [ ] **`verify` 필드 데이터 대조** — `design/data/`의 `curriculum` `subject-hierarchy` `recommended-subjects`를 NCIC·교육부 고시·대교협 확정본과 대조 (배포 전).

### 정리 판단 보류

- [ ] **`pilot001.html`** — 홈 구 시안. 현재 `index.html`이 정식 홈이므로 역할이 끝났으나, 외부에 URL이 돌았을 수 있어 임의 삭제하지 않았다. 담당자 확인 필요.
