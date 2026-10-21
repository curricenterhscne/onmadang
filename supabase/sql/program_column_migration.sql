-- ============================================================
-- Phase B0 — 멀티프로그램 확장을 위한 additive 스키마 변경
-- ============================================================
-- ⚠️ 실행 전: rpc_backup_query.sql을 먼저 실행해 RPC 7개 정의를 백업했는지 확인할 것.
--
-- 이 마이그레이션은 전부 ADD COLUMN / CREATE TABLE 뿐이다.
-- 기존 행은 DELETE·DROP 되지 않는다 — 운영 중인 꿈키움(2026-10-17~11-29) 데이터는
-- program 컬럼이 자동으로 'dream_up'으로 채워질 뿐, 그 외 동작은 전혀 바뀌지 않는다.
--
-- 실행 순서: Supabase 대시보드 > SQL Editor에서 이 파일 전체를 그대로 실행.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. courses — 프로그램 구분 + 상세 정보 컬럼 흡수
--    (apply/_embed_data.js의 COURSE_DETAILS 필드 명세를 컬럼으로 옮긴다.
--     지금 당장은 전부 NULL이어도 무방 — app.html은 당분간
--     "DB 컬럼이 채워져 있으면 그걸 쓰고, 없으면 _embed_data.js로 폴백"한다.)
-- ────────────────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program          text NOT NULL DEFAULT 'dream_up';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS field            text;        -- 계열
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target           text;        -- 수강 대상
ALTER TABLE courses ADD COLUMN IF NOT EXISTS intro            text;        -- 한줄 소개
ALTER TABLE courses ADD COLUMN IF NOT EXISTS method           text;        -- 수업 방식
ALTER TABLE courses ADD COLUMN IF NOT EXISTS place            text;        -- 수업 장소
ALTER TABLE courses ADD COLUMN IF NOT EXISTS supply           text;        -- 준비물
ALTER TABLE courses ADD COLUMN IF NOT EXISTS activity_area    text;        -- 창의적체험활동 영역
ALTER TABLE courses ADD COLUMN IF NOT EXISTS recommended_for  text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_bio   text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date       date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_date         date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS session_count    int;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructors      jsonb;       -- [{name,affiliation,major}]
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sessions         jsonb;       -- [{no,date,time,content,instructor}]
ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_by_day  jsonb;       -- [{date,weekday,start,end,sessionCount}]
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_goals   jsonb;       -- [string, ...]
ALTER TABLE courses ADD COLUMN IF NOT EXISTS grade_restricted boolean NOT NULL DEFAULT false;

-- ────────────────────────────────────────────────────────────
-- 2. enrollments — 프로그램 구분
-- ────────────────────────────────────────────────────────────
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS program text NOT NULL DEFAULT 'dream_up';

-- reservations는 존재할 때만 (기존 courses_2026_2_creative.sql의 방어 패턴 재사용)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reservations'
  ) THEN
    EXECUTE 'ALTER TABLE reservations ADD COLUMN IF NOT EXISTS program text NOT NULL DEFAULT ''dream_up''';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. programs — 프로그램 메타 (어느 프로그램을 누가 관리하는지)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  code                text PRIMARY KEY,
  display_name        text NOT NULL,
  scope_type          text NOT NULL CHECK (scope_type IN ('province','region','org')),
  term_subject_limit  int  NULL,          -- 한 학기 신청 가능 과목 수 상한. NULL = 무제한
  is_active           boolean NOT NULL DEFAULT true
);

INSERT INTO programs (code, display_name, scope_type, term_subject_limit, is_active)
VALUES
  ('dream_up',       '꿈키움 창의적체험활동',       'province', NULL, true),
  ('dual_credit',    '고교-대학 연계',             'org',      NULL, true),
  ('joint_regional', '지역연계 공동교육과정',       'region',   2,    true)
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 4. cycles — 신청 기간 (enroll.js의 하드코딩 periods 배열을 대체할 데이터)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cycles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program     text NOT NULL REFERENCES programs(code),
  term        text NOT NULL,
  open_at     timestamptz NOT NULL,
  close_at    timestamptz NOT NULL,
  notice_text text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cycles_program_idx ON cycles(program);

-- ────────────────────────────────────────────────────────────
-- 5. staff_profiles — 분산 관리자 (Supabase Auth 계정과 1:1)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  role        text NOT NULL CHECK (role IN ('province','region','org')),
  scope_value text,          -- role='region'→courses.region과 매칭되는 지역청명
                              -- role='org'→courses.org와 매칭되는 기관명
                              -- role='province'→NULL(전체)
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. RLS — programs/cycles는 공개 조회(학생이 신청기간을 봐야 함),
--    staff_profiles는 본인 행만 + service_role
-- ────────────────────────────────────────────────────────────
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS programs_public_read ON programs;
CREATE POLICY programs_public_read ON programs FOR SELECT USING (true);

ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cycles_public_read ON cycles;
CREATE POLICY cycles_public_read ON cycles FOR SELECT USING (true);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_profiles_own_read ON staff_profiles;
CREATE POLICY staff_profiles_own_read ON staff_profiles
  FOR SELECT USING (auth.uid() = id);
-- INSERT/UPDATE/DELETE는 anon/authenticated 둘 다 막아 둔다 — 전부 service_role(Edge Function) 경유만 허용.
-- (정책을 추가하지 않으면 RLS 활성화 테이블은 기본적으로 service_role 외엔 쓰기가 전부 막힌다.)

COMMIT;

-- ============================================================
-- 실행 후 확인 (읽기 전용 — 그대로 실행해서 결과를 확인할 것)
-- ============================================================
-- SELECT program, count(*) FROM courses GROUP BY program;
--   → 기존 66강좌가 전부 'dream_up'으로 나와야 정상
-- SELECT * FROM programs;
--   → dream_up / dual_credit / joint_regional 3행
-- SELECT column_name FROM information_schema.columns WHERE table_name='courses' ORDER BY ordinal_position;
--   → 새로 추가한 컬럼들이 보이는지 확인
