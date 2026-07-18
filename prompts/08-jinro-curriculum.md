# 08 — 2단계 교육과정 이해 (학습+퀴즈 뷰 3종)

`design/CLAUDE.md`·`design/PLAN.md`·WORKLOG를 읽어라.

1. curr-structure — curriculum.json: 2022 편제 인터랙티브(교과군 아코디언, 일반/진로/융합선택 3분류 탭·색 구분) + fillQuizAnswers 빈칸 퀴즈(채점·해설·재도전, 완료 시 step2.quiz.structure).
2. curr-grading — grading.json: 성취도 A~E + 석차 5등급 병기 체계, 예외(융합선택 9과목 '·', 체육·예술 3단계, 교양 P), 이수기준(출석 2/3·성취율 40%) 학습 → matchQuiz 6문항(과목 유형 매칭, why 해설 표시).
3. curr-hierarchy — subject-hierarchy.json: 수학·과학 이수경로 다이어그램(인라인 SVG, 토큰 색) + pathQuizAnswers 퀴즈. suneung.json으로 "2028 통합수능과의 관계" 안내 박스. 말미에 "우리 학교 편제표로 실습 → ../selector/" 카드(step2.mySchool 방문 체크).

퀴즈 공통: 점수 저장·재도전 허용, 정답 하드코딩 금지(전부 JSON에서). 커밋 전 멈추고 보고.
