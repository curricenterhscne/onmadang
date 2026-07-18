# CLAUDE.md — 진로·학업 설계 (design/) 개발 컨텍스트

> 루트 `CLAUDE.md` 원칙을 상속하되, 신규 콘텐츠는 아래 아키텍처 결정을 따른다(근거: `design/PLAN.md` §0).
> 데이터: `design/data/` 16종 (2022 개정 단일 트랙).

## 무엇을 만드는가
자료집 활동 1~22를 5단계 여정으로 웹화한 **journey 단일 앱**. 최종 산출물 = 학생이 A4 인쇄(PDF)로 뽑는 진로학업설계서.

## 아키텍처 (기존 레포 관행과 다른 부분 — 의도된 결정)
1. **SPA-lite**: `design/journey/` 앱 셸 1개 + 해시 라우터(직접 작성, ~50줄) + 네이티브 ES module 뷰. 페이지당 HTML 생성 금지 — 헤더/푸터/배지는 셸에만 존재.
2. **파일 우선 저장**: "내 설계서 파일"(`onmadang_jinro/v1` JSON)이 주 저장소, localStorage(`onmadang.jinro.v1`)는 자동 캐시. 시작 화면 3택(이어하기/파일 열기/새로 시작), 상단 상시 바(마지막 파일 저장 시각 + 저장/열기), 이탈 시 저장 넛지, "기록 지우고 종료" 원탭. localStorage 실패(시크릿 모드)를 무시하고도 완주 가능해야 한다.
3. **store 테스트**: `store.js`는 DOM 무의존 순수 모듈 → `tests/store.test.js`를 `node --test`로 실행. 스키마 병합·완료 판정·학점 집계(84/81/192)·두 스키마 import 검증을 커버. 빌드 도구는 여전히 없음.

## 절대 규칙
- 학생 데이터 네트워크 전송 금지 (Supabase는 apply/ 전용 — 접근 금지), 회원/로그인 없음, URL에 개인정보 금지 (해시 라우트에 상태 싣지 않기)
- majors/selector 핵심 로직 수정 금지. 허용 훅 2개뿐: majors 모달 "내 기록에 담기" 버튼 / selector exportToJSON 말미 localStorage 복사 3줄 (각각 단독 커밋)
- 상대경로만(fetch 포함), 디자인 토큰만, 본체 캐릭터는 클로버 SVG placeholder만, 빌드 도구·프레임워크 금지, KWCAG 준수
- 데이터는 항상 `../data/*.json` fetch — 뷰에 하드코딩 금지. `verify` 필드가 있는 파일(curriculum, subject-hierarchy, recommended-subjects)은 배포 전 원자료 대조, 수정 시 `source`에 출처 기록

## 라우트 ↔ 뷰 ↔ 데이터

| 라우트 | 뷰 | 주 데이터 | store 경로 |
|---|---|---|---|
| #/ | dashboard | activities | progress() |
| #/self/prologue | self-prologue | strengths | step1.prologue |
| #/self/tests | self-tests | holland-interest-types, aptitude-types, work-values, external-sites | step1.interest/aptitude/values |
| #/self/jobs | self-jobs | external-sites | step1.jobs, jobFuture |
| #/self/summary | self-summary | (step1 취합) | step1.summary |
| #/curriculum/structure | curr-structure | curriculum | step2.quiz.structure |
| #/curriculum/grading | curr-grading | grading | step2.quiz.grading |
| #/curriculum/hierarchy | curr-hierarchy | subject-hierarchy, suneung | step2.quiz.hierarchy |
| #/career/majors | career-majors | recommended-subjects | step3.* |
| #/career/mandarat | career-mandarat | mandarat | step4.mandarat |
| #/career/roadmap | career-roadmap | roadmap | step4.roadmap |
| #/report/courses | report-courses | required-credits | step4.coursePlan |
| #/report/check | report-check | checklist | step4.checklist, peerReview, audit |
| #/report/print | report-print | (전체 조립) | — |

뷰 규약: `export function render(el, ctx)` — ctx = {store, data(캐시된 fetch 헬퍼), navigate}. 뷰는 자신의 store 경로만 쓰고, 저장은 store.save()로만.

## store.js API
`load() / save(patch) / get(path) / progress()` + 파일: `exportFile()`(파일명 `진로학업설계_YYYYMMDD.json`) / `openFile(file)`(onmadang_jinro/v1 · cne_course_selector/v1 자동 판별) / `wipe()`(이중 확인). 저장 시 `jinro:change` CustomEvent.
selector payload는 `step4.coursePlan`에 원본 보관, 집계는 `summary.groupBreakdown` 1차 사용.

## 이수 집계 규칙 (report)
192학점 = 교과 174(필수 84 + 자율 90) + 창체 18 / 교과(군)별 필수: 국8·수8·영8·사8·과10·한국사6·체10·예10·생활교양군16 / 국수영 합 81 초과 경고. 데이터: `required-credits.json`.

## 작업 관례
`prompts/06~10` 순서, 단계마다 한국어 커밋 + WORKLOG.md 기록. journey 완성 시 루트 CLAUDE.md 레지스트리에 등록(공통 헤더/푸터 ✅, 핵심 파일 index.html·app.js·store.js). 로컬 확인은 `python3 -m http.server`(ES module은 file:// 불가).

## 수용 기준 (전 단계 공통)
- [ ] `node --test` 전체 통과
- [ ] 파일 저장 → 새로 시작(wipe) → 파일 열기 왕복 무손실 / selector 실파일 import 시 학점 합계 일치
- [ ] 네트워크 탭에 입력 데이터 요청 0건
- [ ] 375px 전 화면 입력 가능, #/report/print A4 인쇄 가로 스크롤·잘림 없음
- [ ] 대시보드 진행률 = 실제 입력 상태, 딥링크·뒤로가기 정상
- [ ] majors/selector 기존 기능 회귀 없음
