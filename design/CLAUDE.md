# CLAUDE.md — 진로·학업 설계 (design/)

> 온마당 공통 헤더/푸터 사용. 단 `majors/`·`selector/`는 예외(각 폴더 문서 참조).
> 최종 갱신 2026-07-24

## 개요

GNB 2번 「진로·학업 설계」. **학생이 자신의 진로·학업 설계를 실제로 해내도록 돕는 것**이 목표다.
자료집 디지털화가 목표가 아니다.

## ★ 구조 — 질문 3관문 (2026-07 재편)

이전 5단계 선형 구조(자기이해 → 교육과정이해 → 진로설계활동 → 과목선택실습 → 종합보고서)는 **폐기**했다.

### 왜 폐기했나 — 반복하면 안 되는 실패

수업용 활동 자료집(교사 진행·차시 단위·빈칸 채우기·모둠활동)을 그대로 선형 워크북 웹앱으로 옮겼다가 접었다.

| | 종이 워크북 | 웹 도구 |
|---|---|---|
| 목적 | 수업 시간을 구조화 | 혼자 있는 학생이 결정을 내리게 함 |
| 진행 | 1→N 선형, 앞이 막히면 뒤가 막힘 | 아무 때나 던져도 답을 줌 |
| 질문 | "너를 서술하라" | "무엇을 고를 수 있고, 되는가?" |

**매체가 바뀌면 목적이 달라진다.** 종이를 그대로 옮기면 웹에 필요 없는 것(빈칸·모둠활동·순서 강제)이 대부분이 된다.

### 현재 구조

허브(`design/index.html`)는 **위계 없는 카드 3장**이다.

> ① 뭘 골라야 할지 모르겠어요 · ② 우리 학교에 뭐가 있는지 모르겠어요 · ③ 내가 고른 게 맞는지 모르겠어요

```
design/
├─ index.html          허브 (3관문)                      ⚠️ 아직 구 5단계 카드 — 개편 예정
├─ compass/            ① 진로 나침반 — 검사 결과 → 계열 후보   ⏳ 미구현
├─ majors/             ① 학과·과목 탐색 (자산, 수정 금지)      ✅
├─ selector/           ② 과목 선택 실습 (자산, 수정 금지)      ✅
├─ check/              ③ 내 선택 점검 — 판정 7종 + A4 점검표   ✅ 구현·검증 완료
├─ outside/            학교에 없는 과목 듣는 법 (GNB 미노출)    ⏳ 미구현
├─ js/                 jinro-plan.js · jinro-verify.js      ✅
├─ css/                jinro.css (공용 + A4 인쇄)           ✅
├─ data/               콘텐츠 JSON 17종                     ✅
└─ _dev/               테스트. 배포 산출물 아님               ✅
```

> ⏳ 표시는 **아직 폴더가 없다.** 이 문서가 먼저 들어와 있는 것이므로, 없다고 해서 잘못된 상태가 아니다.
> `design/index.html`도 아직 구 5단계 카드 구조이며 개편 대기 중이다.

### 진행 순서 (2026-07)

1. `check/` A4 인쇄 실물 확인 → 넘치면 조정
2. `outside/` 신규 (짧음)
3. `compass/` + `data/compass-mapping.json` — **매핑은 자의적으로 만들지 말 것.** 근거를 주석으로 남기고 승인받는다
4. `index.html` 허브 3관문 개편
5. `assets/js/common.js`의 `subMenus.design` 교체 (데스크톱+모바일 양쪽)

## 설계 원칙 (반드시 지킬 것)

1. **완주를 전제하지 않는다.** 어느 카드로 들어와도 그 화면 하나로 값을 준다. "1단계부터 하세요" 류 문구 금지. 번호는 순서가 아니라 이름표다.
2. **검사를 만들지 않는다.** 흥미·적성·가치관 검사는 커리어넷·고용24로 보낸다. 우리 몫은 **결과를 계열·학과·과목으로 번역하는 다리**다.
3. **산출물은 설계서가 아니라 판정 결과지다.** 다 안 채워도 유효해야 한다.
4. **판정에 점수·등급을 부여하지 않는다.** "무엇이 몇 학점 모자란지 + 어떻게 하면 되는지"로 쓴다.
5. **학생 정보를 저장하지 않는다.** 회원가입 없음, 서버 전송 없음, localStorage에도 넣지 않는다. 파일은 기기에서만 연다.
6. **수강신청은 학교별 오프라인**이다. 종착점은 **인쇄(A4 1장) + 이미지/텍스트 공유**다.
7. 색만으로 상태를 구분하지 않는다. 배지 텍스트를 항상 병기한다.

## 공용 모듈

| 파일 | 역할 |
|---|---|
| `js/jinro-plan.js` | selector 내보내기 파일 → 편성표로 과목 복원. **DOM 비의존** |
| `js/jinro-verify.js` | 판정 엔진 7종. **DOM 비의존**, 콘솔 단독 테스트 가능 |
| `css/jinro.css` | 공용 스타일 + `@media print` A4 |
| `data/group-alias.json` | 편성표 교과군 → 필수이수 교과군 매핑 |

두 JS는 UMD 형태라 브라우저·Node 양쪽에서 로드된다. **DOM을 참조하는 코드를 넣지 말 것** — 테스트가 깨진다.

### 판정 7종 (`jinro-verify.js`)

| id | 내용 | 근거 |
|---|---|---|
| `total-192` | 3년 누적 192학점 | `required-credits.graduation.total` |
| `group-required` | 교과(군)별 필수이수 9개 | `required-credits` + `group-alias.json` |
| `kme-cap` | 국·수·영 **동적 상한** | `상한 = 81 + max(0, 교과이수학점 − 174) × 0.5` |
| `hierarchy` | 위계 역행·선수 미이수 | `subject-hierarchy.*.paths.edges` |
| `rank-exempt` | 석차 산출/미산출 분류 | **편성표 `subject.rank`**(1순위) |
| `major-fit` | 희망 학과 핵심/권장과목 | `recommended-subjects.fields[]` |
| `offer-gap` | 권장과목 중 우리 학교 미개설 | 편성표 ∩ `recommended-subjects` |

> ⚠️ **81 상한과 "초과분 50%"는 별개 규칙이 아니다.** 한 문장이며 하나의 동적 상한이다. 두 판정으로 쪼개면 틀린다.

### 열화(degradation) 설계

편성표 로딩 실패 시에도 죽지 않는다. **데이터 없음을 "미달"로 표시하지 않는다.**

| 수준 | 가능한 판정 |
|---|---|
| `full` (편성표 있음) | 7종 전부 |
| `summary` (편성표 없음, groupBreakdown 있음) | 총학점·국수영·일부 교과군 (사회·한국사는 `unknown`) |
| 정보 없음 | 전부 `unknown` + "선생님과 확인" 안내 |

## 데이터 (`design/data/`)

| 파일 | 내용 |
|---|---|
| `curriculum.json` | 2022 보통교과 편제 |
| `grading.json` | 성취도·석차, **1학년 공통과목 I(미이수) 구분** |
| `required-credits.json` | 192 구조, 교과군 필수이수, **국수영 동적 상한**, 공동교육과정 학기 2과목 |
| `subject-hierarchy.json` | 수학·과학 위계 |
| `recommended-subjects.json` | 2028 자연계열 20개 분야 핵심/권장과목 |
| `suneung.json` `checklist.json` `external-sites.json` | 수능·점검·외부 링크 |
| `holland-…` `aptitude-…` `work-values` `strengths` `mandarat` `roadmap` | 진로 탐색 콘텐츠 |
| `group-alias.json` | 교과군 매핑 |
| `activities.json` `plan-schema.json` | **폐기 대상** — 구 워크북 구조. 콘텐츠 목차로만 참고 |

⚠️ `verify` 필드가 있는 파일(`curriculum` `subject-hierarchy` `recommended-subjects`)은 배포 전 NCIC·교육부 고시·대교협 확정본과 대조.

## 로컬 확인

`fetch`를 쓰므로 **`file://`에서 동작하지 않는다.**

```bash
python3 -m http.server 8080     # 레포 루트에서
# → http://localhost:8080/design/check/
cd design/_dev && npm install jsdom && node test-verify.js && node test-page.js
```

기대값: `실행 성공 187건 / 실패 0건`, `판정 항목 수: 7`, `h1 개수: 1`

## 하지 말 것

- `majors/`·`selector/`의 핵심 로직 수정 ❌ (데이터 파일 읽기는 허용)
- 완주를 전제하는 선형 구조 재도입 ❌
- 자체 심리검사 구현 ❌
- 학생 정보 저장 ❌
- `summary.groupBreakdown`을 그대로 사용 ❌
- `jinro-*.js`에 DOM 참조 추가 ❌
- 본체 페이지에 `var(--color-*)` 사용 ❌ (존재하지 않는 토큰)
