# CLAUDE.md — 수강신청 앱 (apply/)

> 폴더 안에 **성격이 다른 두 페이지**가 있다. 헤더 규칙이 서로 다르니 아래 표를 먼저 볼 것.
> 최종 검증 2026-08-13 (실측)

## 개요

고교-대학 연계 학점 인정 **수강신청 웹앱**.
선착순 좌석 예약 → 3분 타이머 → 정보 입력 → 확정 흐름.

## ★ index.html ≠ 앱 (2026-07-31 이후)

수강신청이 마감되면서 **앱을 `app.html`로 옮기고, `index.html`은 마감 안내 페이지로 교체**했다.
"apply 앱을 고쳐 달라"는 요청을 받으면 **`app.html`을 열 것.** `index.html`이 아니다.

| 파일 | 성격 | 공통 헤더 | 비고 |
|---|---|---|---|
| `app.html` | 수강신청 앱 본체 (약 1,576줄) | ❌ 미사용 — 자체 헤더 인라인 | 독립 앱 |
| `index.html` | 마감 안내 (약 60줄) | ✅ **사용** (`common.css` + `common.js`, `data-active="safety"`) | 정적 페이지 |

- 다음 신청 기간이 열리면 `index.html`을 `app.html` 내용으로 되돌리거나 리다이렉트를 건다. 이때 **어느 쪽이 앱인지 이 표를 먼저 갱신할 것.**
- `dual_credit/`의 "수강 신청하기" 버튼 4곳은 모두 `../apply/index.html`을 가리킨다. 마감 기간에는 안내 페이지로 가는 것이 **의도된 동작**이다. 신청 기간을 다시 열 때 이 링크들의 목적지를 함께 점검한다.

## 폴더 구조

```
apply/
├─ index.html       ← 마감 안내 페이지 (약 60줄, 공통 헤더 사용)
├─ app.html         ← 수강신청 앱 전체 (약 1,576줄, 스타일·로직 인라인, 독립 헤더)
├─ _embed_data.js   ← 정적 데이터 (SCHOOLS 122개, COURSE_DETAILS 14개)
│                     ⚠️ 파일 전체가 3줄. 한 줄에 거대 배열이 들어 있어 수동 편집 위험
└─ admin/
   └─ index.html    ← 관리자 대시보드 (약 600줄)
                       ※ admin/ 전용 CLAUDE.md는 두지 않는다 — 이 문서 하단에 통합
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
2. **Supabase 접속 정보** — `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 **`app.html`**에 하드코딩됨 (anon key이므로 RLS로 보호).
3. **serverTimeDiff** — 클라이언트-서버 시간차 보정. 모든 카운트다운은 `Date.now() + serverTimeDiff` 사용.
4. **z-index 계층** (실측) — `.onmadang-header` 9000 · backdrop 9100 · 학교 자동완성 9200 · 토스트 9300 · `.om-mobile-menu` 9500.
   새 오버레이는 이 사이 값을 쓰고 목록을 갱신할 것.
5. **학번 형식** — `학년-반(2자리)-번호(2자리)`, e.g. `"2-01-15"`.
6. **학년 제한** — 전체 강좌가 1~2학년 대상이므로 3학년 옵션 제거됨. `gradeRestricted` 강좌는 확정 시 학년 검증하여 차단.
7. **강좌 안내 링크** — `../dual_credit/`로 연결 (off-campus_courses 아님).
8. **`app.html`의 GNB는 손으로 관리한다** — `common.js`를 안 쓰므로 GNB가 자동 동기화되지 않는다. 온마당 메뉴가 바뀌면 `app.html`의 데스크톱 nav(`.onmadang-links`)와 모바일 nav(`.om-mobile-nav`) **양쪽을 직접 고쳐야 한다.** (2026-08-13에 `알림·소통 마당`이 홈으로 가던 오류와 `고교학점제` 메뉴 누락을 이 방식으로 정정했다.)
9. **리디자인 배너 문구는 3곳에 중복** — `assets/js/common.js`, **`apply/app.html`**, `design/selector/guide.html`. 수정 시 3곳 동시 변경. (`apply/index.html`은 `common.js`가 주입하므로 별도 수정 불필요.)
10. **GoatCounter 미적용** — `index.html`(마감 안내)에는 있으나 `app.html`·`admin/`에는 없다. 루트 `CLAUDE.md`의 접속 통계 절 참조.

## 관리자 페이지 (admin/)

`apply/admin/index.html` — 수강신청 현황 모니터링 및 관리 대시보드.

### 기능
- 비밀번호 로그인 (sessionStorage 저장, 자동 로그인)
- 대시보드 요약 카드 (전체 신청자, 마감 강좌, 폐강 위험)
- 강좌 테이블 (코드, 강좌명, 기관, 지역, 신청/정원, 잔여, 강제마감 토글, 정원수정)
- 신청자 명단 모달 + 개별 삭제
- 강좌별/전체 엑셀 다운로드 (클라이언트 SheetJS)

### API (Supabase Edge Functions)

| 함수 | 메서드 | 역할 |
|------|--------|------|
| `admin-courses` | GET | courses 테이블 전체 조회 |
| `admin-enrollments` | GET | enrollments 조회 (code 필터, includeSchool 옵션) |
| `admin-set-capacity` | POST | courses.capacity 업데이트 |
| `admin-toggle-close` | POST | courses.is_closed_manual 토글 |
| `admin-delete-enrollment` | POST | enrollment 삭제 + enrolled_count 차감 |

Edge Functions 소스: `supabase/functions/admin-*/index.ts`
인증: `Authorization: Bearer {ADMIN_PASSWORD}` (환경변수)

### 배포
- Edge Functions: `npx supabase functions deploy {함수명} --no-verify-jwt` (5개 각각)
- **`--no-verify-jwt` 필수** — 없으면 Supabase가 Authorization 헤더를 JWT로 검증하여 401 발생
- 프론트엔드: git push → GitHub Pages 자동 배포

### enrolled_count 보정
신청 삭제 등으로 `courses.enrolled_count`가 실제와 불일치할 경우 SQL로 보정:
```sql
UPDATE courses SET enrolled_count = (
  SELECT COUNT(*) FROM enrollments
  WHERE enrollments.course_code = courses.code
    AND enrollments.status IN ('active', 'pending')
);
```

## 하지 말 것

- **`app.html`에** 온마당 공통 헤더/푸터(`common.js`) 적용 ❌ — 독립 앱이다
  (반대로 `index.html`은 공통 헤더를 **쓴다.** 여기서 걷어내지 말 것)
- 앱을 고치라는 요청에 `index.html`을 열기 ❌ — 앱은 `app.html`이다
- Supabase RPC 함수 시그니처 변경 ❌ — DB 함수와 일치해야 함
- _embed_data.js를 수동 편집할 때 제어문자 삽입 ❌
