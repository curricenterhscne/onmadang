# design/PLAN.md — 진로·학업 설계 구축 계획 v3 (아키텍처 개선판)

원천: 『진로설계를 위한 학생 활동 자료집』 활동 1~22 → 2022 개정 기준 재구성 (`design/data/` 16종)
랜딩 5단계 구조(자기 이해 → 교육과정 이해 → 진로설계 활동 → 과목 선택 실습 → 종합 보고서)와 GNB는 유지.

---

## 0. 기존 레포 방식에서 벗어나는 결정 3가지 (근거 포함)

### 결정 ① 페이지 15개 복붙 대신 — **journey 단일 앱 (SPA-lite)**

**문제**: 레포의 페이지-당-HTML 방식은 selector(2,005줄)·majors(1,266줄)처럼 파일마다 헤더/푸터/스타일이 복제된다. WORKLOG를 보면 GNB 하나 바꾸는 데 12개 파일을 수정했다. 여기에 신규 페이지 15개를 같은 방식으로 더하면 유지보수 비용이 선형으로 폭증하고, 무엇보다 이 기능은 **모든 화면이 하나의 상태(설계서)를 공유하는 워크북 앱**이라 페이지 전환마다 store 로드·진행률 재계산·풀 리로드가 반복된다.

**개선**: `design/journey/` 폴더 하나에 앱 셸 1개 + 해시 라우터(~50줄, 직접 작성) + 뷰 모듈(네이티브 ES module, 빌드 불필요):

```
design/journey/
├── index.html        앱 셸 단 1개 (공통 헤더/푸터 포함)
├── app.js            해시 라우터 + 뷰 로더 + 진행률 갱신
├── store.js          설계서 상태 (아래 결정 ②)
├── journey.css       + assets/css/print.css
└── views/            화면당 JS 모듈 1개 (render(el, store, data) 규약)
    ├── dashboard.js                        #/
    ├── self-prologue.js …  self-summary.js  #/self/*      (4)
    ├── curr-structure.js … curr-hierarchy.js #/curriculum/* (3)
    ├── career-majors.js …  career-roadmap.js #/career/*    (3)
    └── report-courses.js … report-print.js   #/report/*    (3)
```

- 딥링크(`journey/#/self/tests`)·뒤로가기 정상 동작, 화면 전환 즉시(모바일 수업 중 체감 큼)
- HTML 보일러플레이트 0회 복제 — 셸 수정 = 파일 1개
- `#/report/print`는 전 뷰의 데이터를 그 자리에서 조립 (페이지 간 상태 전달 문제 소멸)
- **빌드 도구는 여전히 없음** — 네이티브 ES module은 GitHub Pages에서 그대로 동작. 레포의 "빌드리스" 원칙은 유지하되 "파일당 HTML" 관행만 벗어난다
- `design/index.html` 랜딩은 GNB 구조상 유지, 5단계 카드가 journey 라우트로 링크

### 결정 ② localStorage 중심 대신 — **파일 우선(file-first) 저장 모델**

**문제**: 학생 현실은 학교 컴퓨터실 공용 PC ↔ 개인 폰 ↔ 집 PC를 오간다. localStorage는 기기 귀속이라 "지난 시간에 한 게 없어요"가 반드시 발생하고, 공용 PC에선 남의 기록을 보게 되는 역방향 문제도 있다. **selector가 localStorage를 아예 안 쓰고 파일 기반으로 설계된 이유가 바로 이것** — 신규 기능만 localStorage 중심이면 오히려 비일관적이다.

**개선**: "**내 설계서 파일**" 멘탈 모델. 상단 바에 항상:
`📄 내 설계서 · 마지막 파일 저장 n분 전 [파일로 저장] [파일 열기]`
- localStorage는 **자동 캐시**(이어하기 편의)로 격하 — 세션 중 자동 저장, 시작 시 "이어서 하기 / 파일 열기 / 새로 시작" 3택
- 변경 누적·이탈 시 파일 저장 넛지, 공용 PC용 "기록 지우고 종료" 원탭
- selector JSON(`cne_course_selector/v1`)과 설계서 JSON(`onmadang_jinro/v1`) 둘 다 드래그앤드롭으로 열림 — 파일 하나 들고 다니는 흐름이 4단계(selector)와 5단계(report)에서 동일해짐

### 결정 ③ 검증 불가한 코드 대신 — **store 로직 노드 단위 테스트**

store(스키마 병합·완료 판정·학점 집계·import 검증)는 전 기능의 기반인데 브라우저 수동 확인만으로는 회귀를 못 잡는다. store.js를 순수 모듈로 작성하면 **빌드 없이 `node --test tests/store.test.js`로 검증** 가능. 학점 집계(필수이수 84·국수영 81·192 진행률)와 selector import 검증은 반드시 테스트로 고정한다. 레포 최초의 테스트지만 도구 추가가 0이므로 원칙 위반이 아니다.

### 따르기로 한 것 (바꾸지 않는 게 맞는 제약)
- 빌드리스·프레임워크 금지 (솔로 유지보수 + 외부 인프라 용역 + 베타 일정 — Vite 등은 프로젝트가 더 커질 때의 카드)
- 상대경로 강제, 디자인 토큰, 본체 캐릭터 클로버 placeholder, KWCAG
- **majors/selector 핵심 로직 불가침** — majors 모달 "내 기록에 담기" 버튼 1개, selector export 말미 localStorage 복사 3줄 훅(선택)만
- prompts/ 단계 진행 + WORKLOG 기록 + 폴더별 CLAUDE.md 레지스트리

---

## 1. 5단계 × 자료집 활동 매핑 (라우트 기준)

| 단계 | 라우트 | 자료집 활동 | 핵심 |
|---|---|---|---|
| 대시보드 | `#/` | — | 단계별 진행률, 이어하기/파일 열기/새로 시작 |
| 1 자기 이해 | `#/self/prologue·tests·jobs·summary` | P, 1~6 | 검사는 커리어넷 외부, 결과 기록 + 유형 카드, 종합점검표 자동 취합 |
| 2 교육과정 이해 | `#/curriculum/structure·grading·hierarchy` | 7~9 | 2022 편제·평가(성취도+5등급, 예외과목 매칭 퀴즈)·위계, 말미에 selector 연결 |
| 3 진로설계 활동 | `#/career/majors·mandarat·roadmap` | 11~16, 19, 22 | majors 담기 연동·학과 비교, 만다라트(학년 3장·예시 프리셋), 로드맵 |
| 4 과목 선택 실습 | `../selector/` (기존) | 10, 17 | JSON 내보내기가 5단계 입력 |
| 5 종합 보고서 | `#/report/courses·check·print` | 18, 20~21, 최종 | selector import→이력카드 자동, 체크리스트+조언, A4 조립 인쇄 |

## 2. 저장·연동 명세

- 설계서 파일 스키마 `onmadang_jinro/v1` (`data/plan-schema.json` 기반, `schema`·`exportedAt` 필드는 selector 컨벤션 준수)
- localStorage 캐시 키 `onmadang.jinro.v1` / selector 훅 키 `onmadang.jinro.selector`
- 이력카드 집계 1차 데이터원 = selector payload `summary.groupBreakdown` (인덱스 키 `g{}-s{}-sem{}`의 과목명 복원은 후속 개선으로 분리)
- 네트워크 전송 0건 원칙. Supabase는 apply/ 전용 — 접근 금지

## 3. 작업 단계 = prompts/06~10

| # | 범위 | 게이트 |
|---|---|---|
| 06 | journey 셸+라우터+store(+`tests/store.test.js`)+대시보드+파일 우선 UX+랜딩 링크 | `node --test` 전체 통과, 파일 저장→새로 시작→열기 왕복 무손실 |
| 07 | self 뷰 4종 + 종합점검표 취합 | Step1 기록·요약·진행률 일치 |
| 08 | curriculum 뷰 3종(퀴즈 채점·재도전) | 퀴즈 3종 동작, selector 연결 |
| 09 | career 뷰 3종 + majors 담기 버튼(단독 커밋) | majors 회귀 없음, 만다라트 모바일 편집 |
| 10 | report 뷰 3종 + selector 훅(선택·단독 커밋) + 레지스트리·WORKLOG 마무리 | selector 실파일 import 집계 일치, A4 인쇄 무결, 375px 전체 |

## 4. 리스크

- ES module은 `file://`로 안 열림 → 로컬 확인은 `python3 -m http.server` (README 기존 안내와 동일)
- 구형 인앱 브라우저 호환: ES module 미지원 시 안내 문구 + 자료집 PDF 폴백 링크
- 만다라트·이력카드 대형 표 → 모바일 셀 편집 시트, 전체 표는 인쇄 전용
- iOS 시크릿 모드 → 파일 우선 모델이 곧 대응책 (store는 캐시 실패를 무시하고 파일 저장으로 완주 가능해야 함)
