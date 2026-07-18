# 06 — journey 앱 기반 (셸·라우터·store·파일 우선 저장)

`design/CLAUDE.md`와 `design/PLAN.md`(특히 §0 아키텍처 결정 3가지)를 먼저 읽어라.

## 사전 조사
`design/selector/index.html`의 exportToJSON/importFromJSON과 `assets/js/common.js` 헤더 방식을 파악해 WORKLOG.md에 요약. selector/majors는 이번 단계에서 수정하지 않는다.

## 구현
1. `design/journey/index.html` — 앱 셸 1개: 공통 헤더/푸터(온마당 GNB, breadcrumb) + 상단 "내 설계서" 바(마지막 파일 저장 시각, [파일로 저장][파일 열기], 드래그앤드롭 존) + `<main id="view">` + `<script type="module" src="./app.js">`.
2. `design/journey/store.js` — DOM 무의존 순수 ES module. design/CLAUDE.md의 API. localStorage 실패는 조용히 무시(파일 저장만으로 완주 가능).
3. `tests/store.test.js` — node --test. 커버: 기본값 생성, save 병합, get 경로, progress 판정, exportFile 직렬화↔openFile 역직렬화 왕복, cne_course_selector/v1 판별·summary 집계, 잘못된 파일 거부.
4. `design/journey/app.js` — 해시 라우터(뷰 lazy import, 404→#/), 라우트 변경 시 진행률 갱신, `data()` fetch 캐시 헬퍼(상대경로 `../data/`).
5. `views/dashboard.js` — 시작 3택(이어하기: 캐시 있을 때만 / 파일 열기 / 새로 시작) + 5단계 카드 진행률 + 미완료 활동 바로가기. 4단계 카드는 `../selector/` 링크.
6. `assets/css/print.css`(A4 골격) + `design/journey/journey.css`(토큰만 사용).
7. `design/index.html` 랜딩: 1·2·3·5단계 카드를 journey 라우트로 링크(예: `./journey/#/self/prologue`), "준비 중" 배지 제거.

## 완료 기준
node --test 전체 통과. 브라우저: 파일 저장→새로 시작→파일 열기 왕복 무손실, 딥링크·뒤로가기 정상, 네트워크 전송 0건. 커밋 전 멈추고 변경 요약과 테스트 출력 보고. 커밋 후 WORKLOG 기록.
