# CLAUDE.md — 고교-대학 연계 학점 인정 강좌 (dual_credit/)

> 온마당 공통 헤더/푸터 사용. 강좌 데이터는 HTML 내 인라인.
> 최종 검증 2026-08-13 (실측) — apply 경로 정정 · `support/` 추가

## 개요

고교-대학 연계 학점 인정 프로그램 **안내 + 강좌 카탈로그**.
수강신청 앱 본체는 **`apply/app.html`**이다 (`apply/index.html`이 아니다 — 자세한 내용은 `apply/CLAUDE.md`).

## 폴더 구조

```
dual_credit/
├─ index.html     ← 프로그램 안내 랜딩 (정적, FAQ 아코디언)
├─ courses.html   ← 강좌 카탈로그 (DATA 배열 인라인, 필터·검색·상세 모달)
└─ support/
   ├─ index.html  ← 수업 운영 안내 협의회 안내 (약 401줄, 공통 헤더 미사용)
   └─ 2026_2학기_수업운영안내협의회_운영계획.pdf
```

> `support/`는 **GNB·본문 어디에서도 링크되지 않는다.** 협의회 참석자에게 URL을 직접 배포하는 페이지다.
> 지운다고 사이트에 죽은 링크가 생기지는 않지만, 외부에 뿌려진 URL이 깨진다.

## 수강신청 링크 (⚠️ 마감 상태 확인 필요)

"수강 신청하기" 버튼이 **4곳**에 있고 전부 `../apply/index.html`을 가리킨다.

| 위치 | 형태 |
|---|---|
| `courses.html:231` | 상단 CTA |
| `courses.html:278` | `goSignup()` — `window.location.href` |
| `index.html:199` · `:359` · `:508` | 본문 CTA 3곳 |

현재 `apply/index.html`은 **마감 안내 페이지**이므로 마감 기간에는 이것이 의도된 동작이다.
**신청 기간을 다시 열 때 4곳의 목적지를 `app.html`로 바꿀지 함께 결정할 것.** 한 곳만 고치면 안 된다.

## courses.html DATA 배열 구조

`const DATA = [...]` 로 14개 강좌가 인라인 정의됨.

### 강좌 객체 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `연번` | int | 1~14 |
| `강좌코드` | string | e.g. `"GD26C014"` |
| `지역` | string | "천안", "대전" 등 |
| `기관명` | string | 대학명 |
| `강좌명` | string | 강좌 제목 |
| `분야` | array\<string\> | 계열 배열 |
| `활동영역` | string | "진로활동" 등 |
| `운영대상` | string | "고등학교 1,2학년" 등 |
| `학년제한` | boolean | 학년 제한 여부 |
| `운영시작일` | string | YYYY-MM-DD |
| `운영종료일` | string | YYYY-MM-DD |
| `수업요일시간` | string | 요약 텍스트 |
| `수업방식` | string | "강의형", "혼합형" 등 |
| `수업장소` | string | 장소 |
| `준비물등` | string | 준비물 |
| `한줄소개` | string | 소개 |
| `추천대상` | string | 추천 대상 |
| `학습목표1`, `학습목표2` | string | 학습 목표 |
| `강사소개` | string | 강사 약력 |
| `학점인정사항` | string | 학점 인정 정책 |
| `비고` | string | 비고 (비어있으면 해당 섹션 미표시) |

### 서브 배열: 강사

```json
[{"성명": "김이영", "소속": "국립공주대학교", "전공": "교육심리상담"}]
```

### 서브 배열: 일정 (수업 일정 테이블용)

```json
[{"date": "2026-09-05", "요일": "토", "시작": "13:00", "종료": "16:50", "차시수": 4}]
```
- `buildScheduleHTML()`이 이 배열로 수업 일정 테이블 렌더링
- `시작`/`종료`가 비면 "수업 시간" 열이 공란으로 표시됨

### 서브 배열: 차시 (차시별 수업 계획 테이블용)

```json
[{"차시": 1, "일자": "2026-09-05", "시작시간": "13:00", "내용": "과목 목표...", "담당강사": "김이영"}]
```

## apply/_embed_data.js와의 관계

**동일한 14개 강좌**가 두 파일에 각각 존재한다 (필드명이 다름).
강좌 데이터 수정 시 **반드시 양쪽 동시 수정** 필요.

| 이 파일 (courses.html) | apply/_embed_data.js | 비고 |
|---|---|---|
| `DATA[].강좌코드` | `COURSE_DETAILS[].code` | 동일 값 |
| `DATA[].일정` | `COURSE_DETAILS[].scheduleByDay` | 필드명 다름 |
| `DATA[].차시` | `COURSE_DETAILS[].sessions` | 필드명 다름 |
| `DATA[].강사` | `COURSE_DETAILS[].instructors` | 필드명 다름 |
| `DATA[].수업요일시간` | `COURSE_DETAILS[].period` | 필드명 다름 |
| `DATA[].비고` | (없음) | courses.html 전용 |

## 주요 함수 (courses.html — 실측 8개)

| 함수 | 역할 |
|---|---|
| `render()` | 필터(대학·계열·수업방식·검색어) 적용 후 카드 그리드 렌더링 |
| **`openModal(idx)`** | `DATA[idx]`로 상세 모달 렌더링. 카드의 `onclick`에서 호출 |
| `closeModal(e)` | 오버레이 클릭 / ESC로 모달 닫기 |
| `buildScheduleHTML(schedule)` | `일정` 배열 → 수업 일정 테이블 HTML |
| `toggleField()` / `setInst()` / `clearFields()` | 필터 UI 조작 |
| `goSignup()` | `../apply/index.html`로 이동 (현재 마감 안내) |

> ⚠️ 이전 문서에 `openDetail(idx)`로 적혀 있었으나 **그런 함수는 존재하지 않는다.** 실제 이름은 `openModal(idx)`이다.

## 색상 맵

```javascript
CARD_COLORS = {
  "국립공주대학교": "#0b5345", "단국대학교": "#8a1c1c",
  "백석대학교": "#145a32", "순천향대학교": "#6b2737", "충남대학교": "#7d6608"
};
```

## 하지 말 것

- DATA 배열만 수정하고 apply/_embed_data.js를 빠뜨리기 ❌
- `일정`의 `시작`/`종료` 없이 `차시`의 `시작시간`만 채우기 ❌ (둘 다 채워야 함)
- index.html의 통계 수치(대학 수, 강좌 수 등)를 DATA와 불일치시키기 ❌
- 수강신청 링크 4곳 중 일부만 고치기 ❌
- 이 문서의 함수명·필드명을 확인 없이 신뢰하기 ❌ → 코드를 열어 대조할 것
