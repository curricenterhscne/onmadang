-- ============================================================
-- Phase B1 — RPC 7개 재정의 (멀티프로그램 지원)
-- ============================================================
-- ⚠️ 실행 전 필수 확인
--   1. rpc_backup_query.sql 결과가 이 레포에 저장되어 있는지 (있음 — 2026-10-21)
--   2. program_column_migration.sql을 먼저 실행했는지
--      (courses.program, enrollments.program, settings.program, programs 테이블이 있어야 함)
--
-- 모든 함수는 CREATE OR REPLACE이며, 함수명·파라미터 순서·RETURNS 타입은
-- 그대로 유지한다(기존 app.html이 p_program 없이 호출해도 그대로 동작).
-- 새 파라미터는 전부 DEFAULT 'dream_up' 또는 DEFAULT NULL이라 하위호환이다.
--
-- 바뀌는 동작 요약
--   - get_open_status / reserve_course: settings 조회를 program으로 필터.
--     해당 program 행이 없으면 "닫힘(not_configured)"으로 안전하게 처리
--     (예전처럼 행이 없으면 "항상 열림"으로 오동작하던 잠재 버그를 함께 막는다).
--   - get_course_status: 목록을 program으로 필터.
--   - reserve_course: 좌석 선점 시 해당 코드가 실제로 그 program 소속인지 확인.
--   - confirm_enrollment: 중복 체크를 "전체 테이블"이 아니라 "같은 program 안"으로 스코프.
--     programs.term_subject_limit이 있는 프로그램(지역연계=2)은 "같은 과목 재신청만 차단 +
--     개수 상한 체크"로, 없는 프로그램(꿈키움/고교대학연계)은 기존과 동일하게
--     "이 프로그램 안에서 활성 신청 1건만" 유지.
--   - get_my_enrollment / cancel_enrollment: p_program DEFAULT NULL — 생략하면 기존과
--     완전히 동일(프로그램 구분 없이 조회/취소), 넘기면 그 프로그램으로 좁혀서 조회/취소.
--   - cancel_enrollment: 취소 UPDATE를 "식별자 일치하는 모든 활성 신청"이 아니라
--     "찾아낸 그 신청 1건(course_code 일치)"만으로 좁힘 — 한 학생이 여러 건 활성 신청을
--     가질 수 있게 되면서 생기는 "하나만 취소하려다 전부 취소" 버그를 예방하는 수정.
--   - release_reservation: 변경 없음(재정의하지 않음).
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- get_open_status
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_open_status(p_program text DEFAULT 'dream_up')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_s     settings%ROWTYPE;
  v_open  bool := false;
  v_phase text := 'closed';
BEGIN
  SELECT * INTO v_s FROM settings WHERE program = p_program LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'server_now', now(),
      'is_open',    false,
      'phase',      'not_configured',
      'program',    p_program
    );
  END IF;

  IF now() < v_s.open_at THEN
    v_phase := 'before_open';
  ELSIF v_s.close1_at IS NULL OR now() <= v_s.close1_at THEN
    v_phase := 'open1';
    v_open  := true;
  ELSIF v_s.open2_at IS NOT NULL AND now() < v_s.open2_at THEN
    v_phase := 'between';
  ELSIF v_s.open2_at IS NOT NULL AND now() >= v_s.open2_at
    AND (v_s.close2_at IS NULL OR now() <= v_s.close2_at) THEN
    v_phase := 'open2';
    v_open  := true;
  ELSE
    v_phase := 'closed';
  END IF;

  RETURN jsonb_build_object(
    'server_now', now(),
    'is_open',    v_open,
    'phase',      v_phase,
    'open_at',    v_s.open_at,
    'close1_at',  v_s.close1_at,
    'open2_at',   v_s.open2_at,
    'close2_at',  v_s.close2_at,
    'program',    p_program
  );
END $function$;

-- ────────────────────────────────────────────────────────────
-- get_course_status
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_course_status(p_program text DEFAULT 'dream_up')
 RETURNS TABLE(code text, name text, org text, region text, capacity integer, enrolled_count integer, remaining integer, is_full boolean, is_registerable boolean, is_closed_manual boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    WITH exp AS (
      UPDATE enrollments SET status = 'expired'
      WHERE status = 'pending' AND expires_at < now()
      RETURNING course_code
    )
    UPDATE courses c
       SET enrolled_count = GREATEST(
             c.enrolled_count
             - (SELECT count(*) FROM exp WHERE exp.course_code = c.code),
             0)
     WHERE c.code IN (SELECT DISTINCT course_code FROM exp);

    RETURN QUERY
    SELECT
      c.code, c.name, c.org, c.region,
      c.capacity, c.enrolled_count,
      GREATEST(c.capacity - c.enrolled_count, 0),
      (c.enrolled_count >= c.capacity OR c.is_closed_manual),
      c.is_registerable,
      c.is_closed_manual
    FROM courses c
    WHERE c.program = p_program
    ORDER BY c.code;
  END $function$;

-- ────────────────────────────────────────────────────────────
-- reserve_course
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reserve_course(p_code text, p_program text DEFAULT 'dream_up')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  DECLARE
    v_rid uuid        := gen_random_uuid();
    v_exp timestamptz := now() + interval '3 minutes';
    v_upd int;
    v_s   settings%ROWTYPE;
  BEGIN
    SELECT * INTO v_s FROM settings WHERE program = p_program LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok',false,'error','not_configured');
    END IF;

    IF now() < v_s.open_at THEN
      RETURN jsonb_build_object('ok',false,'error','not_open');
    END IF;
    IF v_s.close1_at IS NOT NULL AND v_s.open2_at IS NOT NULL
       AND now() > v_s.close1_at AND now() < v_s.open2_at THEN
      RETURN jsonb_build_object('ok',false,'error','between_periods');
    END IF;
    IF v_s.close2_at IS NOT NULL AND now() > v_s.close2_at THEN
      RETURN jsonb_build_object('ok',false,'error','period_closed');
    END IF;

    WITH exp AS (
      UPDATE enrollments SET status = 'expired'
      WHERE course_code = p_code AND status = 'pending' AND expires_at < now()
      RETURNING 1
    )
    UPDATE courses
       SET enrolled_count = GREATEST(enrolled_count - (SELECT count(*) FROM exp), 0)
     WHERE code = p_code;

    IF NOT EXISTS (
      SELECT 1 FROM courses WHERE code = p_code AND program = p_program AND is_registerable
    ) THEN
      RETURN jsonb_build_object('ok',false,'error','not_registerable');
    END IF;

    UPDATE courses
       SET enrolled_count = enrolled_count + 1
     WHERE code = p_code
       AND program          = p_program
       AND is_registerable  = true
       AND is_closed_manual = false
       AND enrolled_count   < capacity
    RETURNING 1 INTO v_upd;

    IF v_upd IS NULL THEN
      RETURN jsonb_build_object('ok',false,'error','full');
    END IF;

    INSERT INTO enrollments(course_code, status, reservation_id, expires_at, program)
    VALUES (p_code, 'pending', v_rid, v_exp, p_program);

    RETURN jsonb_build_object(
      'ok',             true,
      'reservation_id', v_rid,
      'expires_at',     v_exp
    );
  END $function$;

-- ────────────────────────────────────────────────────────────
-- confirm_enrollment
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_enrollment(p_rid uuid, p_school text, p_stno text, p_name text, p_phone text, p_pin text, p_program text DEFAULT 'dream_up')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_phone text := regexp_replace(p_phone, '[^0-9]', '', 'g');
  v_pin   text := encode(digest(p_pin, 'sha256'), 'hex');
  v_row   enrollments%ROWTYPE;
  v_limit int;
  v_count int;
BEGIN
  SELECT * INTO v_row
  FROM enrollments
  WHERE reservation_id = p_rid AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'error','reservation_notfound');
  END IF;

  IF now() > v_row.expires_at THEN
    UPDATE enrollments SET status = 'expired'   WHERE id = v_row.id;
    UPDATE courses SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE code = v_row.course_code;
    RETURN jsonb_build_object('ok',false,'error','reservation_expired');
  END IF;

  -- 같은 강좌 중복 신청은 상한 유무와 무관하게 항상 차단
  IF EXISTS (
    SELECT 1 FROM enrollments
    WHERE status = 'active' AND id <> v_row.id AND program = p_program
      AND course_code = v_row.course_code
      AND ((school = p_school AND student_no = p_stno) OR phone = v_phone)
  ) THEN
    UPDATE enrollments SET status = 'expired'   WHERE id = v_row.id;
    UPDATE courses SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE code = v_row.course_code;
    RETURN jsonb_build_object('ok',false,'error','duplicate');
  END IF;

  SELECT term_subject_limit INTO v_limit FROM programs WHERE code = p_program;

  IF v_limit IS NOT NULL THEN
    -- 개수 상한이 있는 프로그램(예: 지역연계=2) — 이 프로그램 안에서 활성 신청 개수만 체크
    SELECT count(*) INTO v_count FROM enrollments
    WHERE status = 'active' AND program = p_program
      AND ((school = p_school AND student_no = p_stno) OR phone = v_phone);

    IF v_count >= v_limit THEN
      UPDATE enrollments SET status = 'expired'   WHERE id = v_row.id;
      UPDATE courses SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE code = v_row.course_code;
      RETURN jsonb_build_object('ok',false,'error','term_limit_exceeded');
    END IF;
  ELSE
    -- 상한 없는 프로그램(꿈키움/고교대학연계) — 기존과 동일: 이 프로그램 안에서 활성 신청 1건만
    IF EXISTS (
      SELECT 1 FROM enrollments
      WHERE status = 'active' AND id <> v_row.id AND program = p_program
        AND ((school = p_school AND student_no = p_stno) OR phone = v_phone)
    ) THEN
      UPDATE enrollments SET status = 'expired'   WHERE id = v_row.id;
      UPDATE courses SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE code = v_row.course_code;
      RETURN jsonb_build_object('ok',false,'error','duplicate');
    END IF;
  END IF;

  BEGIN
    UPDATE enrollments
       SET status      = 'active',
           school      = p_school,
           student_no  = p_stno,
           name        = p_name,
           phone       = v_phone,
           cancel_pin  = v_pin,
           expires_at  = NULL
     WHERE id = v_row.id;
  EXCEPTION WHEN unique_violation THEN
    UPDATE enrollments SET status = 'expired'   WHERE id = v_row.id;
    UPDATE courses SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE code = v_row.course_code;
    RETURN jsonb_build_object('ok',false,'error','duplicate');
  END;

  RETURN jsonb_build_object('ok', true);
END $function$;

-- ────────────────────────────────────────────────────────────
-- get_my_enrollment — p_program DEFAULT NULL(생략 시 기존과 완전히 동일한 동작)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_enrollment(p_school text, p_student_no text, p_phone text, p_program text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_phone text := regexp_replace(p_phone, '[^0-9]', '', 'g');
  v_row   enrollments%ROWTYPE;
  v_cname text;
BEGIN
  SELECT e.* INTO v_row
  FROM enrollments e
  WHERE e.status      = 'active'
    AND e.school      = p_school
    AND e.student_no  = p_student_no
    AND e.phone       = v_phone
    AND (p_program IS NULL OR e.program = p_program)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'notfound');
  END IF;

  SELECT name INTO v_cname FROM courses WHERE code = v_row.course_code;

  RETURN jsonb_build_object(
    'ok',          true,
    'course_code', v_row.course_code,
    'course_name', v_cname,
    'status',      v_row.status,
    'created_at',  v_row.created_at
  );
END $function$;

-- ────────────────────────────────────────────────────────────
-- cancel_enrollment — p_program DEFAULT NULL(생략 시 기존과 완전히 동일한 동작)
--   + 취소 UPDATE를 course_code로 좁혀서(찾아낸 신청 건 1개만 취소) 다건-활성 신청
--   시나리오에서 "전부 취소되는" 기존 로직의 잠재 버그를 함께 막는다.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_enrollment(p_school text, p_stno text, p_phone text, p_pin text, p_program text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_phone text := regexp_replace(p_phone, '[^0-9]', '', 'g');
  v_pin   text := encode(digest(p_pin, 'sha256'), 'hex');
  v_code  text;
  v_prog  text;
  v_s     settings%ROWTYPE;
BEGIN
  SELECT * INTO v_s FROM settings WHERE program = coalesce(p_program, 'dream_up') LIMIT 1;
  IF FOUND AND v_s.close2_at IS NOT NULL AND now() > v_s.close2_at THEN
    RETURN jsonb_build_object('ok',false,'error','period_closed');
  END IF;

  SELECT course_code, program INTO v_code, v_prog
  FROM enrollments
  WHERE status     = 'active'
    AND school     = p_school
    AND student_no = p_stno
    AND phone      = v_phone
    AND cancel_pin = v_pin
    AND (p_program IS NULL OR program = p_program)
  FOR UPDATE;

  IF v_code IS NULL THEN
    RETURN jsonb_build_object('ok',false,'error','notfound_or_wrong_pin');
  END IF;

  UPDATE enrollments
     SET status = 'cancelled'
   WHERE status     = 'active'
     AND school     = p_school
     AND student_no = p_stno
     AND phone      = v_phone
     AND program    = v_prog
     AND course_code = v_code;

  UPDATE courses
     SET enrolled_count = GREATEST(enrolled_count - 1, 0)
   WHERE code = v_code;

  RETURN jsonb_build_object('ok', true);
END $function$;

COMMIT;

-- ============================================================
-- 실행 후 회귀 확인 (꿈키움, program 생략 호출이 예전과 동일해야 함)
-- ============================================================
-- SELECT get_open_status();              -- p_program 생략 → 'dream_up' 그대로
-- SELECT * FROM get_course_status();      -- 기존 꿈키움 66강좌만 나와야 함
-- SELECT get_my_enrollment('OO고등학교','1101','010-0000-0000');  -- program 생략 → 기존과 동일 조회
