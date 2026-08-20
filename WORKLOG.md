# WORKLOG.md — 온마당 작업 이력

> 다른 컴퓨터에서 이어 작업할 때 참고용. Claude Code 세션 간 맥락 유지를 위해 기록.

---

## 2026-08-20 (4): `dual_credit/inform/` 문서 등록

세션 밖(GitHub 웹)에서 `dual_credit/inform/`이 추가되어(`bb0fc17` `876fe02` `01c4ef4`) 문서에 등록했다.

- `dual_credit_2026_2_start.html` (약 698줄) — **수강 확정 학생용 2026-2학기 수업 시작 안내**
- 공통 헤더·GoatCounter 미적용, 자체 스타일(Noto Serif KR + Pretendard)
- GNB·본문 어디서도 링크되지 않는다 → 루트 `CLAUDE.md`의 「링크되지 않는 부속 페이지」 표에 추가
- 학기마다 새 파일이 늘 수 있다 (`dual_credit_{연도}_{학기}_start.html` 형태)

> `support/`(협의회 참석자용)와 `inform/`(학생용)은 **대상이 다르다.** 섞지 말 것.

---

## 2026-08-20 (3): 상단 「리디자인 작업 중」 배너 제거

GNB 위에 떠 있던 안내 배너를 **3곳에서 모두** 걷어냈다.

| 파일 | 처리 |
|---|---|
| `assets/js/common.js` | `var banner`를 **빈 문자열로**. 렌더링 코드(`banner + header + mobileMenu`)는 그대로 두어, 문구만 채우면 다시 뜬다 |
| `apply/app.html` | 인라인 `<div class="renewal-banner">` 삭제 (`common.js` 미사용 앱) |
| `design/selector/guide.html` | 인라인 `<div class="renewal-banner">` 삭제 (`common.js` 미사용) |

- `.renewal-banner` 스타일은 `common.css`에 **남겨 두었다.** 다시 쓸 때 CSS를 새로 짜지 않아도 된다.
- `common.js`에 재사용 절차를 주석으로 남겼다.
- ⚠️ 브라우저가 `common.js`를 캐시하고 있으면 배너가 남아 보인다. 배포 후 확인 시 강력 새로고침할 것.

---

## 2026-08-20 (2): 사이트 전체 문체 정리 — 홍보 톤 제거

앞선 작업에서 `dual_credit/`·`safety/off-campus_courses.html`에만 적용했던 문체 원칙을
**전 페이지로 확대**했다. 기준은 루트 `CLAUDE.md` 기술 원칙 **5-1**.

> 건조하고 정중하게 사실만. 느낌표·구호·감탄 표현을 쓰지 않고, 혜택을 단정하는 대신 조건을 함께 적는다.

### 고친 것

| 파일 | 전 → 후 |
|---|---|
| `index.html` | h1 「내가 선택하는 나만의 교육과정, 온마당이 함께 설계합니다」 → 「충남 고교학점제 종합지원 포털」 + 리드문 「학생이 선택하는 교육과정, 설계와 점검을 지원합니다」 (`.hero-lead` 신설) · 「…한 곳에서 만나보세요」 → 「…안내를 제공합니다」 · 「고교학점제, 제대로 알아봐요」 → 「고교학점제 안내」 · 「진로·학업 설계, 어디서든 시작하세요」 → 「진로·학업 설계」 · 안전망 카드 1·4번 설명에서 "꼼꼼하게!" "교실을 넘어 지역사회로!" "나의 꿈에 날개를 답니다" 제거 |
| `about/index.html` | "…시스템.고교학점제를 알려드립니다"(마침표 뒤 띄어쓰기 누락 오타 포함) 수정 · "단순한 제도 변화가 아니라" 수사 제거 · "차근차근 살펴보세요" → "확인할 수 있습니다" · "한눈에 정리했습니다" → "정의와 등장 배경, 추진 경과를 정리했습니다" |
| `safety/index.html` | "원하는 과목이 학교에 없어도 괜찮습니다" → "학교에 개설되지 않은 과목도 이수할 수 있도록…" · "학교의 배움 차림표를 선택하세요" 삭제 |
| `safety/schoolcurriculum.html` | h2 「배움의 기본은 학교에 있습니다」 → 「학교 교육과정이란」 · "선생님들께서 많은 고민 속에서 …배움 차림표" → "소속 학교가 학생의 진로와 적성을 고려하여 편성한 과목 목록" |
| `safety/onlineschool.html` | "…첫 번째 목표랍니다" 구어체 → 평서문 · "영상으로 확인해 보세요" → "영상으로 안내합니다" |
| `safety/jointcurricula.html` | "…으로 다양해요" → "…세 가지입니다" · 유형 비교표의 **구어체 1행 삭제**("마당을 깔고", "충남의 모든 선생님이 나의 선생님", "뵙고 배워요") — 아래 2행에 정식 정의가 이미 있었다 |
| `design/outside/index.html` | "괜찮습니다." 삭제 · "교수님께 직접 배웁니다" → 조건을 명시한 평서문 |
| `design/compass/index.html` | "먼저 나를 알아보세요… 찾아드립니다" → "커리어넷 검사 결과의 흥미유형으로 관련 계열과 학과를 안내합니다" |
| `design/selector/index.html` | "🎉 졸업 학점 달성!" → "졸업 이수 학점(192학점)을 충족했습니다" |

### 일부러 두기로 한 것

- **3관문 문구** — 「뭘 골라야 할지 모르겠어요」 등. 홍보가 아니라 `CLAUDE.md`에 못박힌 구조 명칭이자 진입점 안내다.
- **`about/student-agency.html`** — OECD 논의 해설문이라 수사가 기능한다.
- **`design/majors/`(자산①)의 꾸꾸클럽 톤** — 별도 디자인 시스템을 쓰는 외부 자산. 통일하려면 별도 판단 필요.
- **게시판 안내문** — "…확인하세요"는 기능 안내로 자연스럽다.
- **대학 제출 원문** — `dual_credit/courses.html`의 `한줄소개`·`추천대상`, `curriculum.html` 본문. 고치면 원자료와 어긋난다.
- **정책 브랜드명** — 「온배움」「참학력」「꿈키움」은 공식 명칭.

---

## 2026-08-20: 고교-대학 연계 — 과목 교육과정 게시 + 수강신청 기간 개폐 자동화

「학교 밖 교육」 아래를 **수강신청 중심에서 과목 안내 중심으로** 재편했다.
14개 과목은 계속 유지되고 매 학년도 1·2학기에 개설될 수 있으므로, 특정 학기 날짜에 매인 문구를 걷어냈다.

### 1. `dual_credit/curriculum.html` 신설 — 과목 교육과정 문서 (전자책 레이아웃)

충남교육청 발간 원본(`2026 고교-대학 연계 학점 인정 학교 밖 교육 과목 교육과정.html`, 14개 과목)을 이식했다.

- **레이아웃**: 왼쪽에 목차를 계속 띄우는 전자책 형태(`.ebook` 그리드 = sticky 사이드바 + 본문). 960px 이하에서는 목차가 위로 쌓인다.
- **스크롤스파이**: 현재 읽고 있는 과목을 목차에서 `aria-current`로 표시하고, 목차 스크롤도 따라간다.
- 원본 CSS를 **전부 `.doc-wrap` 아래로 스코프**. 원본의 `.wrap`이 공통 헤더의 `.wrap`과 충돌한다.
- ⚠️ **원본의 `<header class="c-head">`를 `<div>`로 교체.** `common.css`가 요소 선택자로 `header{position:sticky;top:0;z-index:100}`을 걸어 두어서, 그대로 두면 **과목 제목이 GNB 위에 고정되어 겹친다.** 실제로 이 증상이 나왔고 이렇게 고쳤다.
- 원본 표지는 제거하고 공통 `.page-hero`가 제목을 맡음. 목차 → `#course-1`~`#course-14` 앵커.
- 앵커 재정렬은 `load` 후 `scrollIntoView({behavior:'instant'})`. smooth는 로딩 중 끊긴다.
- 인쇄용 `@media print` 추가. GoatCounter 적용.
- 생성 스크립트: 세션 scratchpad의 `build_curriculum.py` (원본이 갱신되면 같은 규칙으로 다시 이식할 것).

### 2. `dual_credit/enroll.js` 신설 — 수강신청 개폐 일원화

이전에는 `../apply/index.html`이 **4곳에 하드코딩**되어 있어 기간이 바뀔 때마다 전부 찾아 고쳐야 했다. 전부 걷어냈다.

- `OM_ENROLL.periods` 배열 하나로 상태 판정 → `open` / `upcoming` / `closed`
- `data-enroll="cta|notice|term|open-only|closed-only"` 훅으로 화면 반영
- 기간 밖이면 버튼의 `href`를 제거해 눌리지 않게 하고 문구를 바꾼다 (**색이 아니라 문구로 구분** — KWCAG)
- 동적 DOM(`courses.html` 모달)은 `window.OM_ENROLL_APPLY()` 재호출로 갱신
- **다음 학기를 열 때 고칠 곳은 `enroll.js` 한 파일뿐이다.**

### 3. 기존 페이지 정리

| 파일 | 변경 |
|---|---|
| `dual_credit/index.html` | **전면 재작성.** 자체 navy/gold 팔레트와 Noto 서체를 걷어내고 `common.css` 토큰 + `.content-card` 구조로 통일. 날짜 박힌 타임라인 → 매 학기 공통 운영 절차 6단계. 과목 표의 과목명에 `curriculum.html#course-N` 링크. FAQ 아코디언 JS → `<details>` (JS 제거). 문의 절 추가 |
| `dual_credit/courses.html` | 신청 버튼을 `data-enroll="cta"`로. 상세 모달에 「과목 교육과정」 섹션 추가(`#course-${연번}`). 모달 안 신청 안내의 고정 날짜 제거. `goSignup()`을 상태 인식형으로. **단, 이 페이지로 가는 링크는 전부 제거했다(아래)** |
| `safety/off-campus_courses.html` | 「안내 및 수강 신청」 단일 버튼 → **과목 교육과정 / 제도 안내** 2카드. 유형 비교표를 구분·학점기록·운영시기 3행 표로 정리 |
| `apply/index.html` | "2026-2학기 마감" → 학기 비의존 안내로. `dual_credit`으로 되돌아가는 링크 2개. `<title>`도 갱신 |

### 4. 노출 정리 — 학생 동선은 「과목 교육과정」·「제도 안내」 둘뿐

`courses.html`(개설 강좌)로 가는 **내부 링크를 전부 제거**했다. 파일과 기능은 그대로이며 직접 URL로만 접근한다.
학기별 운영 일정·장소·강사·준비물은 **수강 신청 시 안내**하는 것을 전제로 문구를 고쳤다.

### 5. 문체 정리 — 홍보 톤 제거

전 페이지의 문구를 **건조하고 정중하게 사실만 전달하는 쪽**으로 바꿨다. 느낌표·구호·감탄 표현을 걷어냈다.
루트 `CLAUDE.md`의 기술 원칙에 **5-1 문체** 항목으로 남겨 두었다.

> ⚠️ `curriculum.html`의 과목 순서 = `courses.html`의 `DATA[].연번` = `apply/_embed_data.js` 순서. **셋이 같아야 과목 교육과정 링크가 맞는다.**

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
- [ ] **다음 수강신청 기간 개시** — `dual_credit/enroll.js`의 `periods`에 기간 한 줄 추가. **이것만 하면 된다** (08-20에 자동화). 지난 기간은 지우지 말 것.
- [ ] **`curriculum.html` 학기 갱신 절차 정하기** — 과목이 추가·교체되면 원본 문서를 다시 이식해야 한다. `.doc-wrap` 스코프 규칙과 `#course-N` 순서 일치(= `courses.html` `DATA[].연번`)를 지킬 것.
- [ ] **`verify` 필드 데이터 대조** — `design/data/`의 `curriculum` `subject-hierarchy` `recommended-subjects`를 NCIC·교육부 고시·대교협 확정본과 대조 (배포 전).

### 정리 판단 보류

- [ ] **`pilot001.html`** — 홈 구 시안. 현재 `index.html`이 정식 홈이므로 역할이 끝났으나, 외부에 URL이 돌았을 수 있어 임의 삭제하지 않았다. 담당자 확인 필요.
