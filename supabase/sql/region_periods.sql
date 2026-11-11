-- ============================================================
-- 지역청별 수강신청 기간 (2026-11-11)
-- ============================================================
-- 지금까지 settings는 "프로그램당 1행"이라 지역연계 공동교육과정도
-- 14개 지원청이 한 기간을 같이 썼다. 지원청마다 기간이 달라졌으므로
-- settings에 region 칸을 더하고, 다음 규칙으로 기간을 고른다.
--
--   1) 그 프로그램 + 그 지역(region) 행이 있으면 그 기간
--   2) 없으면 그 프로그램의 기본 행(region IS NULL)
--   3) 둘 다 없으면 not_configured (신청 불가)
--
-- 좌석 예약·취소는 학생이 보낸 값이 아니라 "강좌의 지역"(courses.region)으로
-- 기간을 찾는다. 그래서 다른 지역 화면에서 신청해도 그 강좌 지역의 기간이 적용된다.
--
-- ⚠️ 기존 함수(get_open_status, reserve_course, cancel_enrollment)의 시그니처는
--    바꾸지 않는다(같은 인자로 CREATE OR REPLACE = 교체). 지역 기간 조회는
--    새 함수 get_open_status_region(p_program, p_region)으로 추가한다.
--    (인자가 바뀌면 오버로드가 추가돼 모호성 오류가 난 전례: rpc_multiprogram_fix_overload.sql)
--
-- 실행: Supabase 대시보드 > SQL Editor에서 이 파일 전체를 한 번에 실행.
-- 실행 전 [0단계]로 현재 settings 행을 확인해 둘 것.
-- ============================================================

-- [0단계] 실행 전 확인 (결과를 기록해 둔다)
-- SELECT id, program, open_at, close1_at, open2_at, close2_at FROM settings ORDER BY id;
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.settings'::regclass;

BEGIN;

-- ── 1. region 칸 + 고유 제약 교체 ─────────────────────────────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS region text;
COMMENT ON COLUMN settings.region IS '지역청별 신청 기간. NULL = 프로그램 기본 기간. 값은 courses.region과 같은 전체 이름(예: 천안교육지원청)';

-- program 하나에만 걸린 UNIQUE 제약(이름이 환경마다 다를 수 있어 찾아서 지운다)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
      FROM pg_constraint c
     WHERE c.conrelid = 'public.settings'::regclass
       AND c.contype = 'u'
       AND (SELECT array_agg(a.attname ORDER BY a.attname)
              FROM unnest(c.conkey) k
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k) = ARRAY['program']::name[]
  LOOP
    EXECUTE format('ALTER TABLE settings DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
-- 같은 성격의 고유 인덱스가 따로 있으면 그것도 지운다
DROP INDEX IF EXISTS settings_program_key;
DROP INDEX IF EXISTS settings_program_idx;

-- 프로그램 + 지역(기본은 NULL)마다 한 행
CREATE UNIQUE INDEX IF NOT EXISTS settings_program_region_uniq
  ON settings (program, coalesce(region, ''));

-- ── 2. 기간 행 고르기 (내부용) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public._period_for(p_program text, p_region text)
 RETURNS settings
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
AS $function$
  SELECT s.*
    FROM settings s
   WHERE s.program = p_program
     AND (s.region IS NULL OR (p_region IS NOT NULL AND s.region = p_region))
   ORDER BY (s.region IS NULL)   -- 지역 행 먼저, 없으면 기본 행
   LIMIT 1
$function$;
REVOKE ALL ON FUNCTION public._period_for(text, text) FROM PUBLIC, anon, authenticated;

-- ── 3. 학생 화면용: 지역 기간 상태 (신규) ────────────────────────
CREATE OR REPLACE FUNCTION public.get_open_status_region(p_program text DEFAULT 'dream_up', p_region text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
AS $function$
DECLARE
  v_s     settings;
  v_open  bool := false;
  v_phase text := 'closed';
BEGIN
  v_s := public._period_for(p_program, p_region);

  IF v_s.id IS NULL THEN
    RETURN jsonb_build_object('server_now', now(), 'is_open', false,
      'phase', 'not_configured', 'program', p_program, 'region', p_region);
  END IF;

  IF now() < v_s.open_at THEN
    v_phase := 'before_open';
  ELSIF v_s.close1_at IS NULL OR now() <= v_s.close1_at THEN
    v_phase := 'open1'; v_open := true;
  ELSIF v_s.open2_at IS NOT NULL AND now() < v_s.open2_at THEN
    v_phase := 'between';
  ELSIF v_s.open2_at IS NOT NULL AND now() >= v_s.open2_at
    AND (v_s.close2_at IS NULL OR now() <= v_s.close2_at) THEN
    v_phase := 'open2'; v_open := true;
  ELSE
    v_phase := 'closed';
  END IF;

  RETURN jsonb_build_object(
    'server_now', now(), 'is_open', v_open, 'phase', v_phase,
    'open_at', v_s.open_at, 'close1_at', v_s.close1_at,
    'open2_at', v_s.open2_at, 'close2_at', v_s.close2_at,
    'program', p_program,
    'region', p_region,
    'period_region', v_s.region      -- NULL이면 기본 기간을 쓴 것
  );
END $function$;
GRANT EXECUTE ON FUNCTION public.get_open_status_region(text, text) TO anon, authenticated;

-- 기존 get_open_status(p_program)도 같은 판정을 쓰게 맞춘다(시그니처 그대로 = 교체)
CREATE OR REPLACE FUNCTION public.get_open_status(p_program text DEFAULT 'dream_up')
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
AS $function$
  SELECT public.get_open_status_region(p_program, NULL)
$function$;

-- ── 4. 좌석 예약: 강좌의 지역 기간으로 판정 (시그니처 그대로) ──────
CREATE OR REPLACE FUNCTION public.reserve_course(p_code text, p_program text DEFAULT 'dream_up')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  DECLARE
    v_rid    uuid        := gen_random_uuid();
    v_exp    timestamptz := now() + interval '3 minutes';
    v_upd    int;
    v_region text;
    v_s      settings;
  BEGIN
    SELECT region INTO v_region FROM courses WHERE code = p_code AND program = p_program;
    v_s := public._period_for(p_program, v_region);

    IF v_s.id IS NULL THEN
      RETURN jsonb_build_object('ok',false,'error','not_configured');
    END IF;

    IF now() < v_s.open_at THEN
      RETURN jsonb_build_object('ok',false,'error','not_open');
    END IF;
    IF v_s.close1_at IS NOT NULL AND v_s.open2_at IS NOT NULL
       AND now() > v_s.close1_at AND now() < v_s.open2_at THEN
      RETURN jsonb_build_object('ok',false,'error','between_periods');
    END IF;
    -- 2차가 없는 기간(1차만)도 마감 뒤에는 막는다
    IF (v_s.close2_at IS NOT NULL AND now() > v_s.close2_at)
       OR (v_s.open2_at IS NULL AND v_s.close1_at IS NOT NULL AND now() > v_s.close1_at) THEN
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

    RETURN jsonb_build_object('ok', true, 'reservation_id', v_rid, 'expires_at', v_exp);
  END $function$;

-- ── 5. 신청 취소: 취소할 신청의 강좌 지역 기간으로 판정 (시그니처 그대로) ──
CREATE OR REPLACE FUNCTION public.cancel_enrollment(p_school text, p_stno text, p_phone text, p_pin text, p_program text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_phone  text := regexp_replace(p_phone, '[^0-9]', '', 'g');
  v_pin    text := encode(digest(p_pin, 'sha256'), 'hex');
  v_code   text;
  v_prog   text;
  v_region text;
  v_s      settings;
BEGIN
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

  -- 기간 확인은 찾아낸 신청의 강좌 지역 기준 (예전과 같이 최종 마감 뒤에만 막는다)
  SELECT region INTO v_region FROM courses WHERE code = v_code;
  v_s := public._period_for(coalesce(v_prog, p_program, 'dream_up'), v_region);
  IF v_s.id IS NOT NULL AND (
       (v_s.close2_at IS NOT NULL AND now() > v_s.close2_at)
    OR (v_s.open2_at IS NULL AND v_s.close1_at IS NOT NULL AND now() > v_s.close1_at)) THEN
    RETURN jsonb_build_object('ok',false,'error','period_closed');
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
-- 실행 후 확인
-- ============================================================
-- 1) 함수가 하나씩만 있는지 (오버로드 없음)
-- SELECT proname, pg_get_function_arguments(oid) FROM pg_proc
--  WHERE proname IN ('get_open_status','get_open_status_region','reserve_course','cancel_enrollment','_period_for')
--  ORDER BY proname;
-- 2) 꿈키움 회귀: 예전과 같은 결과
-- SELECT get_open_status();
-- 3) 지역 행이 없을 때는 기본 기간
-- SELECT get_open_status_region('joint_regional', '천안교육지원청');   -- period_region: null
-- 4) 지역 행을 넣으면 그 기간 (관리 화면 「신청 기간」에서 넣는 것과 같다)
-- INSERT INTO settings (program, region, open_at, close1_at)
--   VALUES ('joint_regional','천안교육지원청','2026-11-20 09:00+09','2026-11-27 18:00+09');
-- SELECT get_open_status_region('joint_regional', '천안교육지원청');   -- period_region: 천안교육지원청
