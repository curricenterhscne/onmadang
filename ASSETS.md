# ASSETS.md — 기존 자산 명세 및 연동 규칙

본체(`onmadang`)는 아래 자산을 관리한다. ①②는 `design/` 하위 폴더로 통합 완료, ③은 외부 서비스로 운영.

> 최종 갱신 2026-07-24 · 수치는 레포를 직접 열어 확인한 **실측값**이다.

---

## ⓪ 온마당 디자인 시스템 (DS)

- **레포**: `curricenterhscne/cne-design-system`
- **배포**: https://curricenterhscne.github.io/cne-design-system/
- **상태**: 자체 제작 **임시 v1.0**. 디자인 용역 결과물이 들어오면 **v2.0으로 토큰화**해 교체한다.
- **캐릭터**: 팬꾸미·토꾸미·꾸미. **저작재산권 확보 완료 — 사용 제한 해제(2026-07).**
  - 경로: `cne-design-system/assets/characters/*.svg`
  - 현재 `design/majors/`(토꾸미·꾸미)와 `design/selector/`(팬꾸미·토꾸미)에서 사용 중
  - 캐릭터가 어울리지 않는 자리(작은 아이콘, 판정 결과 등)에는 **인라인 클로버 SVG**를 계속 쓴다

### ⚠️ 토큰 체계가 두 개다

| 범위 | 토큰 | 정의 위치 |
|---|---|---|
| 본체 페이지 전부 | `--bg` `--brand` `--ink` `--line` `--soft` … | `assets/css/common.css` |
| `design/majors/` · `design/selector/` | `--color-*` + `.kk-*` 컴포넌트 | CDN DS |

- **`assets/css/tokens.css`는 존재하지 않는다.** 이전 문서 기술과 다르다. 본체 토큰은 `common.css`의 `:root`에 있다.
- 본체 페이지에서 `var(--color-*)`를 쓰면 아무것도 적용되지 않는다.

### ⚠️ CDN 핀 고정 미적용

`majors`·`selector`가 `cne-design-system@main`을 **6곳** 참조한다. 커밋 해시 `@b851419`로 고정하기로 결정했으나 아직 반영되지 않았다. (Pretendard는 `@v1.3.9`로 이미 고정됨)

---

## ① 대학 학과와 권장 과목 안내

- **원본 레포**: `curricenterhscne/2022-curriculum-majors`
- **통합 위치**: `design/majors/` (폴더 복사, 헤더/푸터 온마당 공통으로 교체)
- **상태**: DS v1.0 적용·서브헤더 네비 완료, 온마당 breadcrumb 통합
- **내용**: 2022 개정 교육과정 기반 **10계열 130개 학과** 탐색 (키워드/과목 역검색)

| 계열 | 학과 수 | | 계열 | 학과 수 |
|---|---|---|---|---|
| 인문학 | 11 | | 공학 | 26 |
| 사회 | 14 | | 농생명과학 | 12 |
| 경상 | 8 | | 예체능 | 5 |
| 사범 | 27 | | 융합미래분야 | 5 |
| 자연과학 | 9 | | 의료보건 | 13 |

> 이전 문서의 "170여 학과"는 실제와 다르다. 파일은 `01-humanities.json` ~ `10-medical.json`, 각 파일의 `departments[]`가 학과 배열이다.

- **학과 항목 필드**: `id` `name` `desc` `mainCourses` `basicCourses` `majorCourses` `similarDepts` `careers` `licenses` `subjects`
- **연동 위치**: `design/index.html`(허브), GNB 바로가기, `design/check/`(권장과목 대조)

## ② 과목 선택 실습 (Selector)

- **원본 레포**: `curricenterhscne/course_selector_cne`
- **통합 위치**: `design/selector/` (폴더 복사, 헤더/푸터 온마당 공통으로 교체)
- **상태**: DS 적용 + ① 브리지 연동 완료
- **내용**: 학교별 편성표 시뮬레이션. 학교 선택 시 want/core 과목 자동 선택 + 토스트

### 데이터 (실측)

```
design/selector/data/
  schools.json                  학교 목록 (학교코드·학교명·departments_{year})
  courseDB.json                 834과목 마스터 DB
  curriculum_2025_index.json    {학교코드: {updated, size}}
  curriculum_2026_index.json
  curriculum_2025/{code}.json   93개
  curriculum_2026/{code}.json   94개      ← 합계 187개
```

- 편성표 URL 규칙: `data/curriculum_${year}/${encodeURIComponent(code)}.json`
  학과가 있는 학교는 `schools.json`의 `departments_{year}[].code` 사용 (예: `N100002532(영어과)`)
- 과목 객체: `name` `group` `type`(공통/일반/진로/융합) `area` `basic` `range` `semCredits[6]` `achievement` `rank`
- **`rank` 필드에 석차등급 산출 여부가 들어 있다** (`5등급` / `-`)

### 내보내기 스키마 — 외부에서 읽을 때

```json
{ "schema":"cne_course_selector/v1", "exportedAt":"…+09:00",
  "year":"2026", "schoolCode":"…", "schoolName":"…", "department":null,
  "selections":["g0-s0-sem0", …], "preset":null,
  "summary":{ "totalCredits":…, "changcheCredits":…, "groupBreakdown":{…} } }
```

- `selections` 키 `g{gi}-s{si}-sem{0~5}` → `groups[gi].subjects[si]`로 **완전 복원 가능**
- **localStorage 미사용.** 메모리 상태 + 파일 내보내기/가져오기
- ⚠️ `summary.groupBreakdown`을 그대로 쓰면 안 된다 → `design/data/group-alias.json` 참조

### ①↔② 브리지 흐름 (상대경로)

```
[① 학과 모달 — design/majors/]
   "이 학과 권장 과목으로 과목 선택 실습" 버튼
        │  ?want=<과목들>&core=<과목들>&majorId=<학과ID>
        ▼
[② Selector — design/selector/] 학교 선택 시 해당 과목 자동 선택 + 토스트
```

브리지 로직은 ①②가 이미 보유(`majors/app.js:446 buildSelectorUrl()`). **재구현 금지.**

## ③ 참학력 공동교육과정 수강신청

- **레포/호스팅**: 별도 (Vercel)
- **배포**: ~~https://gongdong-enrollment.vercel.app/~~ (폐쇄됨, 신규 개발 중)
- **연동 위치**: `safety/jointcurricula.html`
- **현재 처리**: 수강신청 링크 → `safety/enrollment-closed.html`(기간 외 안내). 신규 시스템 완성 후 URL 교체
- 참고: 공동교육과정은 **한 학기 2과목 제한**, 한 번 이수한 과목 재수강 불가

## ④ 진로·학업 설계 공용 모듈 (신규, 본체 내부)

`design/` 하위에서 여러 화면이 공유하는 자체 자산.

| 파일 | 역할 |
|---|---|
| `design/js/jinro-plan.js` | selector 내보내기 → 편성표로 과목 복원. DOM 비의존 |
| `design/js/jinro-verify.js` | 판정 엔진 7종. DOM 비의존, 콘솔 단독 테스트 가능 |
| `design/css/jinro.css` | 공용 스타일 + A4 인쇄 |
| `design/data/*.json` | 2022 개정 콘텐츠 자산 17종 |
| `design/_dev/` | 개발용 테스트. **배포 제외** |

### `design/data/` 콘텐츠 자산

| 파일 | 내용 |
|---|---|
| `curriculum.json` | 2022 보통교과 편제 (공통 학기분권, 일반/진로/융합) |
| `grading.json` | 성취도·석차 5등급, 예외 규칙, **1학년 공통과목 I(미이수) 구분** |
| `required-credits.json` | 192학점 구조, 교과군별 필수이수, **국수영 동적 상한** |
| `subject-hierarchy.json` | 수학·과학 위계·이수경로 |
| `recommended-subjects.json` | 2028 자연계열 20개 분야 핵심/권장과목 |
| `suneung.json` | 2028 통합형 수능 출제과목 |
| `group-alias.json` | 편성표 교과군 → 필수이수 교과군 매핑 (한국사 분리) |
| `checklist.json` `external-sites.json` | 점검 항목·외부 링크 |
| `holland-…` `aptitude-…` `work-values` `strengths` `mandarat` `roadmap` | 진로 탐색 콘텐츠 |
| `activities.json` `plan-schema.json` | **폐기 대상** — 구 워크북 구조. 콘텐츠 목차로만 참고 |

⚠️ `verify` 필드가 있는 파일(`curriculum` `subject-hierarchy` `recommended-subjects`)은 배포 전 NCIC·교육부 고시·대교협 확정본과 대조할 것.

---

## 연동 시 공통 규칙

1. ①② 자산은 `design/` 하위 폴더에 통합. 내부 링크는 **상대경로**.
2. ⓪③ 등 외부 자산 링크는 **풀 URL** + `target="_blank" rel="noopener"`.
3. 본체 내부 페이지 이동은 **상대경로**.
4. 자산이 다운되어도 본체가 멀쩡하도록, 본체 콘텐츠와 자산을 분리.
5. **①②의 핵심 로직은 수정하지 않는다.** 데이터 파일을 읽는 것은 허용.

## 주소 체계

- 본체: **`onmadang.or.kr`** (CNAME 설정 완료) · 개발 미러 `curricenterhscne.github.io/onmadang/`
- ①② 자산: 본체 내 `design/majors/`, `design/selector/` (통합 완료)
- ③ 자산: 별도 서비스 (신규 개발 중)

정식 오픈 단계의 서버·SSL 전환은 **인프라 용역**과 별도 검토.
