# 10 — 5단계 종합 보고서 + 마무리

`design/CLAUDE.md`·`design/PLAN.md`·WORKLOG를 읽어라.

1. report-courses — selector JSON 열기(상단 바 파일 열기·드래그앤드롭 공용, store.openFile이 스키마 자동 판별). summary.groupBreakdown으로 **수강 이력카드 자동 생성**: 교과군×학점 매트릭스, required-credits.json 대비 필수이수 충족/부족 배지, 국수영 81 초과 경고, 192학점 진행 게이지. (선택·단독 커밋) selector exportToJSON 말미 localStorage 복사 3줄 훅 → "최근 실습 결과 불러오기" 배너.
2. report-check — checklist.json 4영역 O/X/보류. 학점 항목은 courses 데이터로 자동 제안값(사용자 확정 필요) + 친구 조언 주고받기 기록 + 수정·보완 메모.
3. report-print — 전체 조립: 표지(이름·학교 선택 입력, 인쇄 직전에만) → 종합점검표 → 관심 학과 기록 → 과목 설계·이력카드 → 만다라트 → 체크리스트 → 로드맵. print.css로 A4 1~3장, [PDF로 저장(인쇄)] [설계서 파일 저장] 버튼. 화면에서는 섹션 미리보기, 인쇄 시 전체.
4. 마무리: 루트 CLAUDE.md 레지스트리에 journey 등록, README의 prompts 표에 06~10 추가, WORKLOG 총정리.

## 최종 점검 (보고에 포함)
selector 실파일 import→이력카드 합계가 selector 화면과 일치 / 파일 왕복 무손실 / node --test 통과 유지 / A4 인쇄 무결 / 375px 전 라우트 / 네트워크 전송 0건 / "기록 지우고 종료" 완전 삭제. 커밋 전 멈추고 점검 결과와 함께 보고.
