# CLAUDE.md — 수강신청 앱 (apply/)

> **독립 앱**. 온마당 공통 헤더/푸터 미사용. Supabase 백엔드 연동.

## 개요

고교-대학 연계 학점 인정 **수강신청 웹앱**.
선착순 좌석 예약 → 3분 타이머 → 정보 입력 → 확정 흐름.

## 폴더 구조

```
apply/
├─ index.html       ← 앱 전체 (1563줄, 스타일·로직 인라인)
└─ _embed_data.js   ← 정적 데이터 (SCHOOLS 122개, COURSE_DETAILS 14개)
```

## 데이터 흐름

```
_embed_data.js (정적)          Supabase RPC (실시간)
  ├─ SCHOOLS → SCHOOL_MAP       ├─ get_open_status()   → 신청 기간 상태
  └─ COURSE_DETAILS → DETAIL_MAP├─ get_course_status()  → 좌석 현황 (12~18초 폴링)
                                 ├─ reserve_course()     → 좌석 임시 확보 (3분)
                                 ├─ confirm_enrollment() → 신청 확정
                                 ├─ release_reservation()→ 예약 해제
                                 ├─ get_my_enrollment()  → 내 신청 조회
                                 └─ cancel_enrollment()  → 신청 취소 (PIN 검증)
```

## COURSE_DETAILS 필드 명세

| 필드 | 타입 | 설명 |
|------|------|------|
| `code` | string | 강좌 코드 (PK), e.g. `"GD26C014"` |
| `field` | string | 계열 (필터용), e.g. `"생명·자연과학"` |
| `target` | string | 수강 대상 |
| `period` | string | 기간·시간 요약 텍스트 |
| `place` | string | 수업 장소 |
| `intro` | string | 한줄 소개 |
| `method` | string | 수업 방식 |
| `supply` | string | 준비물 |
| `university` | string | 대학명 |
| `gradeRestricted` | boolean | 학년 제한 여부 |
| `creditRecognition` | string | 학점 인정 문구 (**줄바꿈 포함 가능**) |
| `recommendedFor` | string | 추천 대상 |
| `learningGoals` | array\<string\> | 학습 목표 |
| `instructorBio` | string | 강사 약력 |
| `instructors` | array | `[{name, affiliation, major}]` |
| `startDate` | string | 시작일 (YYYY-MM-DD) |
| `endDate` | string | 종료일 (YYYY-MM-DD) |
| `scheduleByDay` | array | `[{date, weekday, start, end, sessionCount}]` |
| `sessions` | array | `[{no, date, time, content, instructor}]` |

## dual_credit/courses.html과의 관계

**동일한 14개 강좌**가 두 파일에 각각 존재한다.
강좌 데이터(시간, 내용, 강사 등) 수정 시 **반드시 양쪽 동시 수정** 필요.

| 이 파일 (apply) | courses.html | 비고 |
|---|---|---|
| `COURSE_DETAILS[].sessions` | `DATA[].차시` | 필드명 다름 |
| `COURSE_DETAILS[].scheduleByDay` | `DATA[].일정` | 필드명 다름 |
| `COURSE_DETAILS[].instructors` | `DATA[].강사` | 필드명 다름 |
| `code` | `강좌코드` | 동일 값 |

## 핵심 주의사항

1. **_embed_data.js에 제어문자 금지** — `creditRecognition` 등 멀티라인 필드에 실제 줄바꿈(U+000A)이 들어가면 JS 파싱 실패 → 사이트 먹통. 반드시 JSON `\n` 이스케이프 사용. Python `json.dumps()`로 재직렬화하면 자동 처리됨.
2. **Supabase 접속 정보** — `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 index.html에 하드코딩됨 (anon key이므로 RLS로 보호).
3. **serverTimeDiff** — 클라이언트-서버 시간차 보정. 모든 카운트다운은 `Date.now() + serverTimeDiff` 사용.
4. **z-index 계층** — backdrop: 9100, 학교 자동완성: 9200, 토스트: 9300.
5. **학번 형식** — `학년-반(2자리)-번호(2자리)`, e.g. `"2-01-15"`.

## 하지 말 것

- 온마당 공통 헤더/푸터(`common.js`) 적용 ❌ — 독립 앱
- Supabase RPC 함수 시그니처 변경 ❌ — DB 함수와 일치해야 함
- _embed_data.js를 수동 편집할 때 제어문자 삽입 ❌
