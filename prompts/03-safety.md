# 03 · 4대 안전망 + 자산 ③ 연동

ASSETS.md의 ③ 규칙을 따르세요.

## safety/index.html (개요)
- 4단계 안전망: 학교 교육과정 → 충남온라인학교 → 공동교육과정 → 학교 밖 교육
- "원하는 과목이 학교에 없어도 단계별 안전망이 보장한다"는 메시지.
- 각 카드 → 해당 상세 페이지로 연결. 메인의 4대 안전망 카드 디자인과 톤 일치.

## safety/coop.html (공동교육과정) — 핵심
- 참학력 수강신청 연결: ~~https://gongdong-enrollment.vercel.app/~~ (폐쇄됨, 신규 개발 중)
  - 현재 `safety/enrollment-closed.html`(기간 외 안내 페이지)로 연결
- 신청 절차 / 일정 / 문의 안내 섹션(텍스트 플레이스홀더)

## safety/online.html (충남온라인학교)
- 온라인 공동교육과정 강좌 안내
- 배지·강조색은 온라인(스카이, --color-online) 사용

## safety/school.html, outschool.html
- 안내 콘텐츠 골격(플레이스홀더)

## 주의
- ③는 Vercel 별도 운영 → 링크만, 임베드 시 폴백
- 완료 후 커밋
