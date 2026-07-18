# 09 — 3단계 진로설계 활동 + majors 담기 훅

`design/CLAUDE.md`·`design/PLAN.md`·WORKLOG를 읽어라. majors 데이터 로드·브리지 로직 수정 금지.

1. (단독 커밋) `design/majors/app.js` 학과 상세 모달에 "내 기록에 담기" 버튼 → localStorage `onmadang.jinro.v1`의 step3에 {majorId, 학과명, 계열, 핵심·권장과목} 추가 + 토스트. journey store.js를 import하지 말고 동일 키에 안전 병합하는 최소 코드로(try/catch, 스키마 필드만).
2. career-majors — 담은 학과 목록(삭제 가능) + 관심 계열/학과 이유·역량(학업/진로/공동체) 기록 + 같은 이름 다른 학과 비교(2개 나란히) + recommended-subjects.json에서 계열 매칭되는 2028 권장과목 참고 카드(매칭 실패 시 조용히 생략) + "학과 더 탐색 → ../majors/".
3. career-mandarat — mandarat.json: 8항목 만다라트, 학년 3장 탭. 모바일=셀 탭→바텀시트 편집, 데스크톱=그리드 직접 입력. "지리교사 예시" 읽기 전용 오버레이. 평가요소(학업/진로/공동체역량) 안내 박스.
4. career-roadmap — roadmap.json phases 타임라인 편집(N년후 연차 입력 가능) + 활동 후 느낌.

완료 기준: majors 회귀 없음(검색·모달·selector 브리지 확인 결과 보고 포함), 만다라트 375px 편집 가능. 커밋 전 멈추고 보고.
