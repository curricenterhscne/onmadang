# CLAUDE.md — 수강신청 앱 (apply/)

> 폴더 안에 **성격이 다른 두 페이지**가 있다. 헤더 규칙이 서로 다르니 아래 표를 먼저 볼 것.
> 최종 검증 2026-08-13 (실측)

## 개요

**수강신청 웹앱.** 선착순 좌석 예약 → 3분 타이머 → 정보 입력 → 확정 흐름.

**현재 운영 대상 (2026-09-03 전환)** — 2026학년도 2학기 **꿈키움 학교 밖 교육 창의적체험활동(진로활동)**.
원천 데이터는 `dream_up/index.html`의 `DATA`(66강좌)이며, 이전의 고교-대학 연계 14강좌는 대체되었다.

- 66강좌 · 15개 기관 · 7개 지역 · 14개 계열 · 강좌당 16차시 · **정원 일괄 15명**
- 운영 2026-10-17 ~ 11-29 · 대상 **고등학교 1~3학년** (학년 제한 강좌 없음)
- ⚠️ **학점이 아니라 창의적체험활동 시수 인정이다.** `creditRecognition` 필드는 쓰지 않는다 (아래 참조)

## ★ index.html ≠ 앱 (2026-07-31 이후)

수강신청이 마감되면서 **앱을 `app.html`로 옮기고, `index.html`은 마감 안내 페이지로 교체**했다.
"apply 앱을 고쳐 달라"는 요청을 받으면 **`app.html`을 열 것.** `index.html`이 아니다.

| 파일 | 성격 | 공통 헤더 | 비고 |
|---|---|---|---|
| `app.html` | 수강신청 앱 본체 (약 1,576줄) | ❌ 미사용 — 자체 헤더 인라인 | 독립 앱 |
| `index.html` | 기간 외 안내 (약 60줄) | ✅ **사용** (`common.css` + `common.js`, `data-active="safety"`) | 정적 페이지. **사이트 내 링크 없음** — 직접 URL 접근용 |

- 다음 신청 기간이 열리면 `index.html`을 `app.html` 내용으로 되돌리거나 리다이렉트를 건다. 이때 **어느 쪽이 앱인지 이 표를 먼저 갱신할 것.**

### ⚠️ 2026-08-20 변경 — 신청 링크는 `dual_credit/enroll.js`가 제어한다

`dual_credit/`에 흩어져 있던 "수강 신청하기" 링크 4곳(`../apply/index.html` 하드코딩)을 **전부 걷어냈다.**
지금은 `dual_credit/enroll.js`의 `OM_ENROLL.periods`가 현재 시각으로 상태를 판정해,

- 신청 기간 안 → 버튼이 **`../apply/app.html`**로 연결
- 기간 밖 → 버튼이 눌리지 않고 「지금은 수강 신청 기간이 아닙니다」로 바뀜

**신청 기간을 열 때 할 일은 `enroll.js`에 기간 한 줄을 추가하는 것뿐이다.** `apply/` 쪽 파일을 옮기거나 이름을 바꿀 필요가 없다.
`apply/index.html`은 이제 사이트 내에서 링크되지 않는 **직접 URL 접근용 안내 페이지**다 (과거에 배포된 URL 보호용). 문구도 특정 학기에 매이지 않게 일반화했다.

## 폴더 구조

```
apply/
├─ index.html       ← 마감 안내 페이지 (약 60줄, 공통 헤더 사용)
├─ app.html         ← 수강신청 앱 전체 (약 1,576줄, 스타일·로직 인라인, 독립 헤더)
├─ _embed_data.js   ← 정적 데이터 (SCHOOLS 122개, COURSE_DETAILS 66개)
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
| `code` | string | 강좌 코드 (PK), e.g. `"DC26C001"` |
| `field` | string | 계열 (필터용), e.g. `"생명·자연과학"` |
| `target` | string | 수강 대상 |
| `period` | string | 기간·시간 요약 텍스트 |
| `place` | string | 수업 장소 |
| `intro` | string | 한줄 소개 |
| `method` | string | 수업 방식 |
| `supply` | string | 준비물 |
| `university` | string | 대학명 |
| `gradeRestricted` | boolean | 학년 제한 여부. **현재 66강좌 전부 `false`** |
| ~~`creditRecognition`~~ | — | **2026-09-03부터 쓰지 않는다.** 창의적체험활동은 학점이 아니라 시수 인정이고 원천 데이터에 해당 값이 없다. 지어내지 말 것 |
| `activityArea` | string | 창의적체험활동 영역, 현재 전부 `"진로활동"` |
| `region` | string | 지역 (7종) |
| `sessionCount` | number | 총 차시 수 (현재 전부 16) |
| `recommendedFor` | string | 추천 대상 |
| `learningGoals` | array\<string\> | 학습 목표 |
| `instructorBio` | string | 강사 약력 |
| `instructors` | array | `[{name, affiliation, major}]` |
| `startDate` | string | 시작일 (YYYY-MM-DD) |
| `endDate` | string | 종료일 (YYYY-MM-DD) |
| `scheduleByDay` | array | `[{date, weekday, start, end, sessionCount}]` |
| `sessions` | array | `[{no, date, time, content, instructor}]` |

## 원천 데이터: `dream_up/index.html`

`COURSE_DETAILS`는 손으로 쓰지 않는다. **`dream_up/index.html`의 `DATA`(66강좌)에서 생성한다.**
필드명이 한글이라 아래처럼 매핑된다.

| dream_up `DATA` | `COURSE_DETAILS` | 비고 |
|---|---|---|
| `강좌코드` | `code` | 동일 값 |
| `분야` (배열) | `field` | **`' · '`로 join.** 앱이 `d.field.split(' · ')`로 되쪼갠다. 분야값 자체의 `·`는 공백이 없어 충돌하지 않는다 |
| `학습목표1`·`학습목표2` | `learningGoals` (배열) | 빈 값은 제외 |
| `강사` `[{성명,소속,전공}]` | `instructors` `[{name,affiliation,major}]` | |
| `차시` `[{차시,일자,시작시간,내용,담당강사}]` | `sessions` `[{no,date,time,content,instructor}]` | |
| (파생) | `scheduleByDay` | 원천에 없다 — 아래 참조 |

### ⚠️ `scheduleByDay`의 종료시각은 파생값이다

원천 `차시`에는 **시작시간만 있고 종료시간이 없다.** 그래서 `end = 마지막 차시 시작 + 50분`으로 계산한다.

근거(실측): 차시 간격은 60분이 대부분(737건)이라 **수업 50분 + 휴식 10분** 구조다. DC26C001은 `16:30 + 50 = 17:20`으로 원천 `수업요일시간` 선언값과 정확히 일치하고, DC26C004는 50분 간격으로 붙어 있다.

> **`수업요일시간`을 시간 범위 근거로 쓰지 말 것.** 66개 중 시:분~시:분 범위를 담은 것은 **2개뿐**이고, 표기가 26가지로 제각각이다(`매주 토 / 4시간`, `토,일,토/6,5,5`, `매주 토 ~일/ 4시간`). `period` 필드에 원문 그대로 담아 두되 계산에는 쓰지 않는다.

**원천 데이터 자체의 불일치 2건** (고칠 때 원천을 먼저 확인할 것):
- `DC26C005` — 선언 `14:00~16:50`인데 실제 차시는 `14:00·15:00·16:00·17:00`(4차시). 차시 쪽이 맞다고 보고 계산했다
- `DC26C001` — 11/14 차시 시작이 `13:30`인데 선언은 `14:30`

점심시간이 있는 강좌(`DC26C055`·`DC26C056`, 차시 간격 120분)는 `scheduleByDay`가 하루 1행이라 `09:00~15:50`처럼 점심을 포함한 전체 구간으로 보인다. 정확한 시각은 모달의 차시별 표에서 확인된다.

### 재생성 방법

수정은 **`dream_up/index.html`의 `DATA`를 고친 뒤 재생성**한다. `_embed_data.js`를 직접 편집하지 말 것 (파일 전체가 3줄이라 수동 편집이 위험하다).

생성 스크립트는 `dream_up`의 `DATA`를 괄호 균형으로 파싱해 `SCHOOLS`는 그대로 두고 `COURSE_DETAILS`만 교체하며, `json.dumps`로 직렬화해 제어문자 혼입을 막는다. 생성 후 **제어문자 0건·3줄 구조**를 반드시 확인한다.

## Supabase courses 테이블 교체

**강좌 목록·정원·잔여석은 `_embed_data.js`가 아니라 `get_course_status()` RPC가 공급한다.**
`_embed_data.js`는 코드(`code`)로 매칭되는 설명文만 덧붙인다. 따라서 **강좌를 바꾸려면 DB를 반드시 함께 바꿔야 한다.**
코드가 어긋나면 카드가 제목만 남고 내용이 빈 채로 렌더링된다.

- 교체 SQL: **`supabase/sql/courses_2026_2_creative.sql`** (66행 INSERT, 정원 15, 트랜잭션). `gen_embed.py`가 생성하므로 직접 편집하지 말 것
- 실행은 Supabase 대시보드 SQL Editor에서 한다 (레포에 마이그레이션 체계가 없다)

### `courses` 테이블 컬럼 (2026-09-03 `information_schema` 실측)

| 컬럼 | 타입 | NULL | 기본값 |
|---|---|---|---|
| `code` `name` `org` `region` | text | NO | — |
| `capacity` | integer | NO | 15 |
| `enrolled_count` | integer | NO | 0 |
| `min_open` | integer | NO | 5 |
| `is_registerable` | boolean | NO | true |
| `is_closed_manual` | boolean | NO | false |

- `min_open`은 **폐강 기준 인원**이다. 관리자 대시보드의 「폐강 위험」이 이 값을 쓴다. **테이블 기본값은 5지만 2026-2학기는 8로 상향**되어 INSERT에 명시했다. 바뀌면 `gen_embed.py`의 `MIN_OPEN`을 고쳐 재생성할 것
- ⚠️ **RLS가 스키마 노출을 막아 anon 키로는 이 표를 다시 확인할 수 없다.** `get_course_status()` RPC 반환값은 여기에 계산 필드(`remaining`·`is_full`)가 더 붙은 것이며 테이블 컬럼과 같지 않다
- SQL은 `reservations` 테이블이 있을 때만 지우도록 `DO $$` 블록으로 방어해 두었다

## 신청 기간 (2026-2학기)

| 구분 | 일시 (KST) |
|---|---|
| 1차 신청 | 2026. 9. 10.(목) 18:00 ~ 9. 13.(일) 15:00 |
| 2차 신청 | 2026. 9. 15.(화) 18:00 ~ 22:00 |
| 개설강좌 확정 안내 | 2026. 9. 17.(목) |

**개폐 판정은 `get_open_status()` RPC가 한다.** 반환 필드는 `phase` `is_open` `open_at` `open2_at` `close1_at` `close2_at` `server_now`이며 **시각은 UTC**다 (`09:00Z` = `18:00 KST`).

- 저장 위치: **`public.settings`** 테이블의 `open_at` `close1_at` `open2_at` `close2_at` (2026-09-03 확인)
- 설정 SQL: **`supabase/sql/open_schedule_2026_2.sql`**
- 컬럼이 `timestamptz`라 **KST 시각에 `+09`를 붙여 그대로 넣으면 된다** (`'2026-09-10 18:00:00+09'`)
- ⚠️ `settings`가 2행 이상이면 `UPDATE`에 `WHERE`를 붙일 것. SQL [1단계]에서 행 수를 먼저 확인한다
- `phase` 값: `before_open` → `open1` → `between` → `open2` → `closed`. `between`은 1차 마감~2차 오픈 대기 구간이며 앱이 2차 시작 카운트다운을 띄운다
- **화면 문구는 `app.html` 안내 박스에 하드코딩되어 있다.** 일정이 바뀌면 **DB와 `app.html`을 함께** 고쳐야 한다 (히어로 태그 + 안내 ⑤ 일정, 총 2곳)

> `dual_credit/enroll.js`의 `periods`는 **고교-대학 연계**용이며 이 앱과 무관하다. 창의적체험활동 진입점은 `dream_up/index.html`의 「수강신청 바로가기」 버튼(`goSignup()` → `../apply/app.html`)이다.

## 핵심 주의사항

1. **_embed_data.js에 제어문자 금지** — `creditRecognition` 등 멀티라인 필드에 실제 줄바꿈(U+000A)이 들어가면 JS 파싱 실패 → 사이트 먹통. 반드시 JSON `\n` 이스케이프 사용. Python `json.dumps()`로 재직렬화하면 자동 처리됨.
2. **Supabase 접속 정보** — `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 **`app.html`**에 하드코딩됨 (anon key이므로 RLS로 보호).
3. **serverTimeDiff** — 클라이언트-서버 시간차 보정. 모든 카운트다운은 `Date.now() + serverTimeDiff` 사용.
4. **z-index 계층** (실측) — `.onmadang-header` 9000 · backdrop 9100 · 학교 자동완성 9200 · 토스트 9300 · `.om-mobile-menu` 9500.
   새 오버레이는 이 사이 값을 쓰고 목록을 갱신할 것.
5. **학번 형식** — `학년-반(2자리)-번호(2자리)`, e.g. `"2-01-15"`.
6. **학년 제한** — 현재 66강좌 전부 **1~3학년** 대상이라 학년 선택에 **3학년이 있다**(`app.html`의 `my-grade`·`r-grade` 두 곳). `gradeRestricted` 로직은 남아 있으나 현재 해당 강좌가 없다. 학년 제한 강좌가 생기면 `gradeRestricted:true` + `target`에 「N학년」 표기를 넣으면 확정 시 자동 차단된다.
7. **강좌 안내 링크** — `../dual_credit/`로 연결 (off-campus_courses 아님).
8. **`app.html`의 GNB는 손으로 관리한다** — `common.js`를 안 쓰므로 GNB가 자동 동기화되지 않는다. 온마당 메뉴가 바뀌면 `app.html`의 데스크톱 nav(`.onmadang-links`)와 모바일 nav(`.om-mobile-nav`) **양쪽을 직접 고쳐야 한다.** (2026-08-13에 `알림·소통 마당`이 홈으로 가던 오류와 `고교학점제` 메뉴 누락을 이 방식으로 정정했다.)
9. **상단 안내 배너는 2026-08-20에 제거됨** — 「리디자인 작업 중」 문구를 3곳(`assets/js/common.js`, **`apply/app.html`**, `design/selector/guide.html`)에서 모두 지웠다. 다시 띄울 때도 **3곳 동시 작업**이다: `common.js`는 `var banner`에 HTML을 채우고, `app.html`·`guide.html`은 `common.js`를 안 쓰므로 `<div class="renewal-banner" role="note">`를 인라인으로 직접 넣는다. (`apply/index.html`은 `common.js`가 주입하므로 별도 수정 불필요.)
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
