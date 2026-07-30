# HANDOFF — 클로드 코드 인계 (진로·학업 설계 안 B)

> 작성 2026-07-24 · 대상 레포 `curricenterhscne/onmadang`
> 이 문서를 먼저 읽고, 상세 설계는 `TASK_진로학업설계_안B.md`를 참조한다.

---

## 0. 한 줄 요약

「진로·학업 설계」를 **질문 3관문(안 B)** 구조로 재편한다.
**판정 엔진과 `check/` 화면은 구현·검증이 끝났다.** 남은 것은 `outside/`, `compass/`, 허브 개편, GNB 교체다.

---

## 1. 파일 배치

받은 `design/` 폴더를 레포의 `design/`에 그대로 덮어쓴다. 기존 `majors/`·`selector/`는 **건드리지 않는다.**

```
design/
  check/index.html          [신규] 내 선택 점검 화면
  css/jinro.css             [신규] 공용 스타일 + A4 인쇄
  js/jinro-plan.js          [신규] selector 파일 → 편성표 복원
  js/jinro-verify.js        [신규] 판정 엔진 7종
  data/                     [신규] 콘텐츠 JSON 17종
    group-alias.json          교과군 매핑 (필수)
    required-credits.json     ★ 수정본
    grading.json              ★ 수정본
    curriculum.json / subject-hierarchy.json / recommended-subjects.json
    suneung.json / checklist.json / external-sites.json
    holland-interest-types.json / aptitude-types.json / work-values.json
    strengths.json / mandarat.json / roadmap.json
    activities.json           (폐기 대상 — 콘텐츠 목차로만 참고)
    plan-schema.json          (폐기 대상 — 구 워크북 스키마)
  _dev/                     [개발용] 배포 제외 · .gitignore 권장
    test-verify.js  test-page.js  sample-export.json

  index.html                [기존 — 7/29에 허브로 개편]
  majors/                   [기존 — 수정 금지]
  selector/                 [기존 — 수정 금지]
```

### ★ 수정된 JSON 2종 — 반드시 이 버전을 쓸 것

| 파일 | 수정 내용 |
|---|---|
| `grading.json` | `achievement5`를 **1학년 공통과목**(E 40~60 / **I** 40 미만)과 **선택과목**(E 60 미만, I 없음)으로 분리. 2026.1. 개정 반영. 3단계 성취도 기준율(`achievement3`) 추가 |
| `required-credits.json` | `koreanMathEnglishCap`을 **동적 상한**으로 교체 → `상한 = 81 + max(0, 교과이수학점 − 174) × 0.5`. `jointCurriculumLimit`(공동교육과정 학기 2과목) 추가 |

> ⚠️ 81 상한과 "초과분 50%"는 **별개 규칙이 아니다.** 워크북 원문(p.16·p.31·p.40) 한 문장이며 하나의 동적 상한이다. 두 판정으로 쪼개면 틀린다.

---

## 2. 로컬 확인 방법

### ⚠️ `file://`로 열면 동작하지 않는다

`check/`는 `fetch()`로 JSON을 읽는다. 반드시 HTTP로 띄운다.

```bash
cd <repo>
python3 -m http.server 8080
# → http://localhost:8080/design/check/
```

### 확인 순서

1. `design/_dev/sample-export.json`을 드롭존에 끌어다 놓는다
2. 판정 7종이 렌더되는지 본다
3. 「희망 계열·분야」에서 `의학(의예)` 선택 → 권장과목 판정이 `확인 불가` → `확인 필요`로 바뀌는지 본다
4. **「점검표 인쇄」 → 미리보기가 A4 1장에 들어가는지 확인** ← 유일한 미검증 항목
5. 375px 폭에서 교과군 표가 깨지지 않는지 본다

### 자동 테스트

```bash
cd design/_dev
npm install jsdom          # test-page.js 에만 필요
node test-verify.js        # 판정 엔진 — 전 편성표 187건 회귀
node test-page.js          # 화면 — jsdom 통합 테스트
```

기대값: `실행 성공 187건 / 실패 0건`, `판정 항목 수: 7`, `h1 개수: 1`, `드롭존 중첩 인터랙티브: 없음`

---

## 3. 완료된 것 (재작업 불필요)

### Phase 0 실측 — 추정하지 말고 이 값을 쓸 것

- 편성표 경로: `design/selector/data/curriculum_{year}/{code}.json` (2025: 93개 / 2026: 94개)
- `selections` 키 `g{gi}-s{si}-sem{0~5}` → **`groups[gi].subjects[si]` 그대로 복원 가능**
- 과목 객체가 `name` `group` `type` `area` `basic` `range` `semCredits[6]` `achievement` `rank`를 전부 보유
- **`rank` 필드에 석차등급 산출 여부가 있다** (`5등급` / `-`). 규칙 추론보다 이 값이 정확하다
- 학점 집계는 selector `_buildSummary()`(index.html:1731~1771) 재현 — 지정군은 selections 무관 전량, 선택군은 `subj.opCredit || group.groupCredit`, `isSoonjeung` 그룹 제외
- `summary.groupBreakdown`은 **그대로 쓰면 안 된다.** 편성표에 `한국사` 교과군이 없고 `사회`에 섞여 있어 사회·한국사 판정이 동시에 틀린다 → `selections` + 편성표로 직접 재집계 (`group-alias.json`)

### 판정 7종

`total-192` · `group-required` · `kme-cap` · `hierarchy` · `rank-exempt` · `major-fit` · `offer-gap`

열화 4단계 모두 동작 확인: `full` → `summary`(편성표 미로딩) → 정보 없음 → 스키마 오류.
**데이터 없음을 "미달"로 표시하지 않는다.** `unknown` 배지 + "선생님과 확인" 안내로 처리한다.

### `check/` 화면

파일 투입 → 판정 → 인쇄·복사·초기화. 접근성 처리 완료(색+텍스트 배지, 포커스 이동, `role="alert"`, `th scope`).

---

## 4. 완료된 추가 작업 (2026-07-30)

### selector·majors 공통 GNB 적용 ✅

- `design/selector/index.html`, `design/majors/index.html`의 인라인 헤더/푸터/모바일메뉴를 `common.js`가 제공하는 최신 GNB로 교체
- `common.css` + `common.js` 적용, CDN DS와 병용
- selector 앱 도구(guide, save, load, share) → `.h-toolbar` 내 `.app-tools`로 이동, 오른쪽 정렬
- 학교 미선택 빈 상태를 화면 가운데 배치 (`grid-column: 1 / -1`)
- 선택 셀 hover 시 배경 사라지는 버그 수정

### 배너 문구 갱신 ✅

- "리디자인 작업 중 (2026. 7. 31. ~ 8. 31.)" — `common.js`, `apply/index.html`, `guide.html` 3곳 변경

---

## 5. 남은 작업

| 순서 | 작업 | 참조 |
|---|---|---|
| 1 | **A4 인쇄 실물 확인** — 넘치면 교과군 표 2단 또는 석차 목록 요약 | TASK §5 |
| 2 | `design/outside/index.html` — 없는 과목 듣는 법 (짧음) | TASK §7 |
| 3 | `design/compass/` + `data/compass-mapping.json` — **매핑은 자의적으로 만들지 말 것**, 근거를 주석으로 남기고 승인받는다 | TASK §6 ⏸3 |
| 4 | `design/index.html` 허브 3관문 개편 | TASK §3 |
| 5 | `assets/js/common.js` `subMenus.design` 교체 (데스크톱+모바일 양쪽) | TASK §8 |
| 6 | 배포 사이트에서 selector/majors GNB 동작 최종 확인 | — |

### GNB 교체 내용

```js
design: [
  { label: '진로 나침반',    href: L.design + 'compass/'  },
  { label: '학과·과목 탐색', href: L.majors               },
  { label: '과목 선택 실습', href: L.selector             },
  { label: '내 선택 점검',   href: L.design + 'check/'    }
]
```
현재는 `#step-1`~`#step-5` 앵커 5개다. `outside/`는 GNB에 넣지 않는다.

---

## 5. ⚠️ 레포에서 발견한 문제 — 별도 판단 필요

### ① 캐릭터 사용 — 저작재산권 확보 완료

꾸꾸클럽 캐릭터(팬꾸미·토꾸미·꾸미)의 저작재산권이 확보되어 사용 제한이 해제되었다.
`majors`·`selector`에서 CDN 참조 중인 캐릭터 SVG는 그대로 유지해도 무방하다.

### ② 디자인 토큰이 이원화되어 있고 `CLAUDE.md`가 실제와 다르다

| 범위 | 토큰 | 출처 |
|---|---|---|
| 본체 페이지 (`design/index.html`, `safety/`, `board/` …) | `--bg` `--brand` `--ink` `--line` `--soft` … | `assets/css/common.css` |
| `majors/` · `selector/` | `--color-*` + `.kk-*` | CDN `cne-design-system` |

`CLAUDE.md`는 `--color-*`만 기술하고 있으나, **본체 페이지에는 그런 토큰이 정의되어 있지 않다.** 그대로 따르면 스타일이 통째로 먹지 않는다.
→ 신규 `check/`·`css/jinro.css`는 **`common.css` 계열(`--brand` 등)** 을 쓴다. 이게 맞다. `--color-*`로 "고치지" 말 것.
→ `CLAUDE.md`의 토큰 절 수정 권장.

### ③ CDN이 `@main`으로 고정되어 있지 않다

`majors`·`selector`에서 `cne-design-system@main`을 6곳 참조한다. 마스터플랜에서 `@b851419` 핀 고정을 결정했으나 미적용이다. (7/30 polish 항목)

### ④ 기타

- `about/` 폴더 없음 (기지 — P0)
- 루트 `2015/`, `resources/` 폴더 용도 미확인 → 링크 검증 대상

---

## 6. 절대 지킬 것

1. `design/majors/`·`design/selector/`의 **핵심 로직 수정 금지.** 데이터 파일을 읽는 것은 허용.
2. 회원가입·서버 저장 **0**. localStorage에도 학생 정보를 넣지 않는다. 파일은 기기에서만 연다.
3. 빌드 도구 없는 순수 정적. 내부 링크·fetch 전부 **상대경로**.
4. 2022 개정 단일 기준. 2015 개정 데이터·분기를 만들지 않는다.
5. **완주를 전제하지 않는다.** "1단계부터 하세요" 류 문구 금지. 번호는 순서가 아니라 이름표다.
6. 판정 문구에 점수·등급을 부여하지 않는다. "무엇이 몇 학점 모자란지 + 어떻게 하면 되는지"로 쓴다.
7. 색만으로 판정을 구분하지 않는다. 배지 텍스트를 항상 병기한다.
8. 커밋·푸시는 **승인 후에만.** 작업 기록은 `WORKLOG.md`에 남긴다.

---

## 7. 파급효과 — 개발 외 처리 사항

`디자인_의뢰서_및_납품사양서.md` §6.1 아이콘 세트에 「자기이해·교육과정이해·진로설계활동·과목선택실습·나의설계서」 **5종**이 들어 있다. 안 B에서는 「진로 나침반·학과과목탐색·과목선택실습·내선택점검」 **4종**으로 바뀐다. 업체 발송 전이면 수정, 발송 후면 정정 통지.
`온마당_구축_마스터플랜.md` §1 사이트맵, `CLAUDE.md` 메뉴 구조 절도 같은 대상이다.
