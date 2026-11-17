# CLAUDE.md — 수강신청 (apply/)

> 최종 검증 2026-11-17 (코드 실측). 날짜별 경위는 루트 `WORKLOG.md`.
> 줄 수·개수는 바뀌므로 "약"으로 적는다. 함수명·필드명은 코드를 열어 대조한 뒤 고칠 것.

## 개요

**선착순 수강신청 앱 하나(`app.html`)가 여러 프로그램을 함께 받는다.** 좌석 예약 → 3분 타이머 → 정보 입력·개인정보 동의 → 확정.
프로그램은 주소의 `?program=`으로 고른다(생략하면 `dream_up`).

| 코드 (`programs.code`) | 이름 | 범위 (`scope_type`) | 지금 상태 (2026-11-17) |
|---|---|---|---|
| `joint_regional` | 지역연계 공동교육과정 | `region` — 지원청 선택 관문이 먼저 뜬다 | **2026-11-21(토) 09:00 신청 시작.** 지원청마다 기간이 다르다. 1인 1강좌 |
| `dream_up` | 꿈키움 창의적체험활동 | `province` | 2026-2학기 운영 종료. DB 강좌·신청 자료는 2026-10-21에 백업 후 삭제 |
| `dual_credit` | 고교-대학 연계 학점 인정 | `org` | 다음 회차 대기. 강좌 0건 |

- **온라인 공동교육과정은 이 앱이 아니다.** 선착순이 아닌 별도 사이트(형제 레포 `enrollment_cne`, Supabase 프로젝트도 다르다)이며, 온마당은 입구 칸만 연결한다(`assets/js/enroll-status.js`의 `ON_*`).
- 이 앱의 Supabase 프로젝트는 `yhrgvnttjlitukrxdfdo`다. anon 키는 `app.html`·`enroll-status.js`에 공개되어 있고 RLS로 보호한다.

## 진입 경로

모든 수강신청은 **입구 `enroll/`**에서 시작한다(2026-11-11~). 다른 페이지의 「신청」 단추도 입구로 보낸다(`dual_credit/enroll.js`, `dream_up/index.html`의 `goSignup()`).

| 입구 칸 | 연결 |
|---|---|
| 지역연계 | 기간과 관계없이 늘 `../apply/app.html?program=joint_regional` (`data-always-app`). 지원청별 기간은 앱이 처리한다 |
| 고교-대학 연계 · 꿈키움 | `OM_ENROLL_STATUS.get(code)`가 기본 기간을 읽어, 신청 중이거나 강좌 공개 중이면 앱으로, 아니면 `enroll/closed.html?p=…` |
| 온라인 | 형제 레포 사이트의 `get_enroll_status()`를 읽는다 |

- 지역청은 `app.html?program=joint_regional&region=천안`처럼 자기 지역 주소를 직접 배포할 수 있다(관리자 매뉴얼에 안내).
- **`assets/js/enroll-status.js`가 `get_open_status(p_program)`의 반환 모양에 기대고 있다.** RPC 반환값을 바꾸면 이 파일도 함께 고친다.

## 파일

| 파일 | 성격 | 공통 헤더 | 비고 |
|---|---|---|---|
| **`app.html`** | 학생 신청 앱 (약 1,930줄, 스타일·로직 인라인) | ❌ `common.js` 미사용. `common.css`는 연결, 헤더·푸터 마크업을 직접 둔다 | **"수강신청 앱을 고쳐 달라" = 이 파일** |
| `index.html` | 고교-대학 연계 신청 기간 외 안내 (약 40줄) | ✅ `common.js` 사용 (`data-active="safety"`) | 사이트 안에서 링크되지 않는다. 예전에 배포된 주소 보호용. GoatCounter 있음 |
| `admin/index.html` | 관리 화면 (약 1,730줄) | ❌ 독립 | Edge Functions 호출. noindex |
| `admin/guide/` | 관리자 웹 매뉴얼 — `region.html`(지역청) · `province.html`(도교육청) · `guide.css` · `index.html`(region으로 이동) | ❌ | 관리 화면 기능이 바뀌면 **두 매뉴얼을 함께** 고친다 |
| `admin/course_template.xlsx` | 강좌 엑셀 양식 정적 사본 | — | 관리 화면 `buildTemplateWorkbook()`과 내용을 맞춘다. 양식을 바꾸면 다시 만든다 |
| `admin-test/index.html` · `app-test.html` | 시범 운영 때 배포한 주소 → 정식 주소로 이동 (각 약 15줄) | — | 지우지 말 것(배포된 주소). 쿼리·해시를 그대로 넘긴다 |
| `_embed_data.js` | `SCHOOLS`(학교 자동완성) + 꿈키움 `COURSE_DETAILS`(66강좌) | — | **2줄짜리 파일.** 손으로 고치지 말 것. 아래 「꿈키움 정적 데이터」 |
| `_tools/gen_embed.py` | `dream_up/index.html`의 `DATA` → `_embed_data.js`·강좌 SQL 생성 | — | 꿈키움 전용 |

## 데이터 흐름 (`app.html`)

```
programs 표 (anon 직접 조회)  → applyProgramBranding(): 이름·scope_type(지역 관문 여부)
courses 표  (anon 직접 조회)  → fetchDbCourseDetails(): 강좌 상세. DB 값이 _embed_data.js보다 우선
_embed_data.js                → SCHOOL_MAP(학교 검색), DETAIL_MAP(꿈키움 상세 보충)

RPC (모두 p_program 포함, release_reservation 제외)
  get_open_status_region(p_program, p_region) ← 지역 관문 프로그램
  get_open_status(p_program)                  ← 그 밖의 프로그램
  get_course_status(p_program)    좌석 현황 (폴링)
  reserve_course(p_code, p_program)  3분 좌석 확보
  release_reservation(p_rid)
  confirm_enrollment(…)           확정
  get_my_enrollment(…) / cancel_enrollment(…)  내 신청 조회·취소(취소비번)
```

- 강좌 목록·정원·잔여석은 `get_course_status()`가 준다. 상세 설명은 코드(`code`)로 붙인다.
- 중복 신청 검사는 **프로그램 단위**다. `programs.term_subject_limit`이 있으면 개수 상한, NULL이면 1건(지역연계는 2026-11-11부터 NULL = 1인 1강좌, `joint_regional_limit_1.sql`).
- 지역 관문: 14개 지원청(`REGIONS` 상수) 중 하나를 고르면 `courses.region`이 같은 강좌만 보인다. 선택은 `?region=`에 남고 `normalizeRegion()`이 약칭·전체 이름을 받는다. **신청 자체를 지역으로 제한하지는 않는다.**

## 신청 기간

저장 위치는 `public.settings` 표다. 열은 `program`, `region`, `open_at`, `close1_at`, `open2_at`, `close2_at`, `preview_at`이고 시각은 `timestamptz`다. 입력은 **관리 화면 「신청 기간」**에서 한다. SQL로 직접 넣지 않는다.

- **기간 고르기** (`_period_for(program, region)`):
  1. 그 프로그램 + 그 지역 행이 있으면 그 기간을 쓴다.
  2. 없으면 프로그램 기본 행(`region IS NULL`)을 쓴다.
  3. 둘 다 없으면 `not_configured`(신청 불가)다.
- 고유 인덱스는 `(program, coalesce(region,''))`다. 그래서 PostgREST `on_conflict`를 못 쓰고, `admin-periods`가 찾아서 PATCH, 없으면 POST한다.
- 예약·취소는 학생이 보낸 값이 아니라 **강좌의 `courses.region`**으로 기간을 찾는다.
- `phase`: `before_open` → `open1` → `between`(1차 마감~2차 시작, 카운트다운) → `open2` → `closed`, 그리고 `not_configured`. 2차를 비우면 1차만 운영한다.
- **강좌 공개(미리 보기)**: `preview_at`(비우면 `open_at` 7일 전). 공개 전에는 목록 대신 공개 시각을 안내하고, 공개 뒤에는 목록·상세는 보이고 신청 단추만 막힌다.
- 화면 문구는 DB 값으로 그린다(「○○ 신청 기간 11. 21.(토) 09:00 ~ …」). 예전처럼 `app.html`에 일정을 하드코딩하지 않는다.

## 관리 화면 (`admin/`)

### 로그인과 권한
- 기본은 **Supabase Auth 개인 계정**(이메일+비밀번호)이다. 역할은 `staff_profiles.role`이다.
  - `province`(도교육청): 모든 권한을 가진다.
  - `region`(지역청): 자기 지원청만 다룬다. **지역연계만 다룬다**(`REGION_PROGRAMS = ['joint_regional']`, 관리 화면·`admin-periods`·`admin-upsert-course` 세 곳에 같은 값).
  - `org`(기관): 자기 기관만 다룬다.
- 「공유 비밀번호로 로그인」은 과도기 호환용이다(`ADMIN_PASSWORD` 환경변수, `_shared/authz.ts`의 `legacyPasswordProfile()` → province와 같은 권한).
- JWT가 만료되면 `authFetch()`가 `refresh_token`으로 한 번 다시 시도한다.
- 지역청 담당자는 가입 신청(`register-staff`) → 도교육청 승인(`admin-approve-staff`) 순서로 계정을 받는다.

### Edge Functions (`supabase/functions/`, 13개 + `_shared/authz.ts`)

| 함수 | 역할 |
|---|---|
| `admin-whoami` | 로그인 계정의 이름·역할·소관 |
| `admin-courses` | 강좌 조회 (`?program=`, 소관 필터) |
| `admin-upsert-course` | 강좌 등록·수정. `code`를 비우면 자동 부여 |
| `admin-delete-course` | 강좌 삭제 (신청자가 있으면 409) |
| `admin-set-capacity` · `admin-toggle-close` | 정원 수정 · 수동 마감 |
| `admin-enrollments` · `admin-delete-enrollment` | 신청 명단 · 신청 1건 삭제(`enrolled_count` 차감) |
| `admin-periods` | 신청 기간 조회(GET `?program=`)·저장(POST)·지역 행 삭제(`action:"delete"`). `preview_at < open_at` 검사 |
| `admin-reset-program` | 프로그램의 강좌·신청 전체 삭제 (province 전용, `display_name`을 그대로 입력해야 실행) |
| `register-staff` · `admin-list-staff` · `admin-approve-staff` | 담당자 가입 신청 · 목록 · 승인 |

- 수정·삭제 요청은 바디 값만이 아니라 **기존 강좌의 `region`/`org`/`program`**으로 소관을 확인한다.
- 배포: `npx supabase functions deploy <함수명> --no-verify-jwt --project-ref yhrgvnttjlitukrxdfdo`
  - `--no-verify-jwt`는 꼭 붙인다. 함수가 `authz.ts`로 직접 검사한다. 이 플래그가 없으면 공유 비밀번호 요청이 게이트웨이에서 401이 된다.
  - 로그인은 `npx supabase login`(대시보드 Account > Access Tokens)으로 한다.
- 프론트엔드는 `main`에 푸시하면 GitHub Pages가 배포한다.

### 강좌 등록
- 화면에서 한 건씩 등록하거나, **엑셀 일괄 등록**을 쓴다.
  - 엑셀 양식은 시트 4개다(`강좌목록`·`강사진`·`차시계획`·`작성안내`).
  - 강사진·차시 행은 강좌목록의 「번호」로 강좌에 묶는다.
  - `parseBulkWorkbook()`이 검증한 뒤 행마다 `admin-upsert-course`를 부른다.
  - 차시의 날짜·시간으로 `schedule_by_day`를 계산한다(`deriveSchedule()`, 끝 시각 = 마지막 시작 + 50분).
  - 날짜 칸은 엑셀 일련번호라 `XLSX.SSF.parse_date_code`로 푼다.
  - 「코드」에 기존 코드를 적으면 수정이다. 그 번호의 강사진·차시 행이 없으면 기존 값을 건드리지 않는다.
- **강좌 코드 자동 부여**: `{프로그램 2자}{학년도 2자}{운영 기간 1자}{지원청 2자}{순번 2자}` (예: `JR27SCA01`).
  - 운영 기간은 `1`·`S`·`2`·`W`다(`TERM_CODES`).
  - 바디의 `term`을 먼저 쓰고, 없으면 `start_date`의 월로 정한다. 학년도는 3월에 바뀐다.
  - 접두어 표 `PROGRAM_PREFIX`·`REGION_CODE`는 함수 안에 있다.
  - 순번이 충돌하면 409를 받고 다시 계산한다. 코드 칸에 직접 입력하는 것은 도교육청 계정만 할 수 있다.
- 학년 제한은 `target`의 학년(「3학년」「2~3학년」「2·3학년」)을 **운영 학년도 기준**으로 읽는다. 다음 학년도 강좌라면 `gradeRule()`이 학년차만큼 빼서 현재 학년으로 환산한다. 검사는 학생 화면에서만 한다(RPC에는 학년 검사가 없다).

### enrolled_count 보정
```sql
UPDATE courses SET enrolled_count = (
  SELECT COUNT(*) FROM enrollments
  WHERE enrollments.course_code = courses.code
    AND enrollments.status IN ('active', 'pending')
);
```
프로그램이 여럿이므로 필요하면 `WHERE courses.program = '…'`를 붙인다.

## DB 변경 (`supabase/sql/`)

**레포에 마이그레이션 체계가 없다. 담당자가 대시보드 SQL Editor에서 직접 실행한다.**

| 파일 | 내용 |
|---|---|
| `rpc_backup_query.sql` | 멀티프로그램 전 RPC 7개 원래 정의 백업 |
| `program_column_migration.sql` | `programs` 표, `courses`/`enrollments`/`settings`의 `program` 칸, `staff_profiles` 표 |
| `rpc_multiprogram.sql` · `rpc_multiprogram_fix_overload.sql` | RPC 6개에 `p_program` 추가 · 구 시그니처 DROP |
| `app_multiprogram_prep.sql` · `…_fix.sql` | `settings` 싱글톤 제약 제거, 데모 시딩 |
| `region_periods.sql` | 지역별 기간(`settings.region`, `_period_for`, `get_open_status_region`) |
| `preview_period.sql` | `settings.preview_at` |
| `joint_regional_limit_1.sql` | 지역연계 1인 1강좌 |
| `courses_2026_2_creative.sql` · `open_schedule_2026_2.sql` | 2026-2학기 꿈키움 강좌·기간 (지난 회차 기록) |

**함정 두 가지 — 다시 밟지 말 것**
1. **`CREATE OR REPLACE FUNCTION`으로 인자 개수를 바꾸면 교체가 아니라 오버로드가 추가된다.** 그러면 `… is not unique` 오류가 난다. 시그니처를 바꿀 때는 옛 함수를 먼저 `DROP`한다. 바꿀 필요가 없으면 시그니처를 그대로 두고 본문만 교체한다.
2. **원래 싱글톤이던 표에 프로그램 구분을 더할 때는 PK·CHECK 제약까지 확인한다.** `settings`에 `CHECK(id=1)`이 숨어 있어 두 번째 프로그램 행을 넣지 못했던 전례가 있다.

## 개인정보

- 신청 폼에는 개인정보 수집·이용 안내와 필수 동의 체크가 있다(2026-11-16). 체크하지 않으면 `submitConfirm()`이 막고, 폼을 열 때마다 `resetEnrollForm()`이 체크를 푼다.
  **문구는 `policy/privacy.html`과 같게 유지한다.** 수집 항목이 바뀌면 두 곳을 함께 고친다.
- `docs/privacy/register.json`의 수강신청 항목은 이번 기간이 `2026-11-21 ~ 11-30`이다. **기간이 끝나면 신청 자료를 지우거나 상태를 바꾸지 않으면 주간 검사가 실패한다.** 신청 기간을 새로 열 때 `end`를 적는다.

## `app.html` 주의사항

1. **헤더·모바일 메뉴·푸터는 손으로 관리한다.** 마크업은 `common.js` 출력을 옮겨 둔 것이다. 온마당 메뉴가 바뀌면 다음 세 곳을 직접 고친다.
   - 데스크톱 nav(`.nav-links`)
   - 모바일 nav(`.mobile-menu-nav`)
   - 푸터 사이트맵(`.ft-sitemap`)
2. **상단 안내 배너**를 다시 띄울 때는 `common.js`의 `var banner`와 `app.html`의 인라인 `<div class="renewal-banner" role="note">`, 두 곳을 함께 고친다.
3. **디자인(DS v2.0, 2026-11-13)**:
   - `<html data-section="enroll">`을 직접 둔다. 없으면 파란 단색 머리 영역이 된다.
   - 머리 영역은 `.page-hero.is-light`다.
   - 본문 래퍼는 `.app-main`이다(`common.css`의 `.wrap`과 겹치지 않게).
   - 앱 `:root`에는 DS에 없는 상태색만 둔다(`--ok`·`--warn`·`--danger`·`--info-bg` 등). `--mint`는 `common.css`의 옅은 바탕색이다(예전 초록이 아니다).
   - JS가 쓰는 클래스(`.hero h1`·`.hero-stat .val`·`.hero-open-tag`·`.hero-links`·`.hero-crumb`)를 지우지 말 것.
4. **z-index 계층**: 공통 헤더 100 · GNB 드롭다운 110 · 모바일 메뉴 200 · backdrop 9100 · 학교 자동완성 9200 · 토스트 9300.
5. **검색창 자동 채움 방지**:
   - 강좌 검색창은 따로 `<form role="search">`에 두고 `id="course-search"`·`name="course_keyword"`와 비밀번호 관리자 무시 속성을 붙였다.
   - 취소비번 칸은 `autocomplete="one-time-code"`다.
   - 새 입력 칸을 더할 때 이 묶음을 깨지 말 것. 크롬이 관리 화면 아이디를 검색창에 채워 강좌가 모두 걸러진 전례가 있다.
6. `serverTimeDiff`로 서버 시각을 보정한다. 카운트다운은 모두 `Date.now() + serverTimeDiff`를 쓴다.
7. 학번 형식은 `학년-반(2자리)-번호(2자리)`(예: `2-01-15`)다.
8. 문체는 루트 규칙 5-2를 따른다(「~하십시오」, 2026-11-16 적용). 입력 칸 placeholder는 예외다.
9. GoatCounter는 `app.html`·`admin/`에 넣지 않는다.

## 꿈키움 정적 데이터 (`_embed_data.js`, 지난 회차)

꿈키움 강좌 상세는 `dream_up/index.html`의 `DATA`(66강좌)에서 `_tools/gen_embed.py`로 만든다. **`_embed_data.js`를 직접 고치지 말 것.** 파일이 2줄이라 손으로 고치면 깨지기 쉽고, 문자열에 실제 줄바꿈이 들어가면 JS 파싱이 실패해 앱 전체가 멈춘다(`json.dumps`로 직렬화한다).

- 매핑: `강좌코드`→`code`, `분야`(배열)→`field`(`' · '`로 join), `학습목표1·2`→`learningGoals`, `강사`→`instructors`, `차시`→`sessions`.
- `scheduleByDay`는 원천에 없는 파생값이다. 끝 시각 = 마지막 차시 시작 + 50분(수업 50분 + 휴식 10분). 원천의 `수업요일시간`은 표기가 제각각이라 계산에 쓰지 않는다.
- 창의적체험활동은 학점이 아니라 시수 인정이다. `creditRecognition` 필드를 지어 넣지 말 것.
- 새 프로그램은 `_embed_data.js` 없이 관리 화면에서 넣은 DB 값만으로 상세가 보인다.

## 하지 말 것

- 앱을 고치라는 요청에 `index.html`을 열기 ❌ → 앱은 `app.html`이다
- `app.html`에 `common.js` 적용 ❌ → 독립 앱이다(`common.css` 연결은 한다). 반대로 `index.html`의 공통 헤더는 걷어내지 말 것
- `admin-test/`·`app-test.html` 삭제 ❌ → 배포된 주소가 깨진다
- RPC 시그니처를 바꾸면서 옛 함수를 남겨 두기 ❌ (오버로드 함정)
- `get_open_status` 반환 모양을 `enroll-status.js` 확인 없이 바꾸기 ❌
- `REGION_PROGRAMS`를 한 곳만 고치기 ❌ → 세 곳이 같아야 한다
- `_embed_data.js` 손 편집 ❌
- 신청 자료·계정·비밀번호를 저장소나 매뉴얼에 적기 ❌ → 공개 저장소다
