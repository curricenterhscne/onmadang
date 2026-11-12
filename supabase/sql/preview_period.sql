-- ============================================================
-- 강좌 미리 보기(공개) 시각 (2026-11-12)
-- ============================================================
-- 신청 시작 전에 학생이 강좌 목록을 먼저 볼 수 있게 한다.
--
--   preview_at  — 강좌 공개 시각. NULL이면 신청 시작(open_at) 7일 전.
--   공개 시각 ~ 신청 시작 전에는 강좌 목록을 볼 수 있고 신청 단추만 막힌다.
--   공개 시각 전에는 학생 화면이 목록 대신 「강좌 공개 예정」 안내를 띄운다.
--
-- get_open_status_region / get_open_status는 시그니처를 그대로 두고 교체한다
-- (반환 JSON에 preview_at · preview_set · is_preview를 더할 뿐).
-- 화면 쪽은 preview_at이 없는 응답도 open_at - 7일로 계산하므로
-- 이 SQL을 실행하기 전에도 「1주일 전 공개」로 동작한다.
--
-- 실행: Supabase 대시보드 > SQL Editor에서 이 파일 전체를 한 번에 실행.
-- 선행: region_periods.sql (settings.region, _period_for)
-- ============================================================

BEGIN;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS preview_at timestamptz;
COMMENT ON COLUMN settings.preview_at IS '강좌 공개(미리 보기) 시각. NULL = 신청 시작 7일 전';

CREATE OR REPLACE FUNCTION public.get_open_status_region(p_program text DEFAULT 'dream_up', p_region text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
AS $function$
DECLARE
  v_s       settings;
  v_open    bool := false;
  v_phase   text := 'closed';
  v_preview timestamptz;
BEGIN
  v_s := public._period_for(p_program, p_region);

  IF v_s.id IS NULL THEN
    RETURN jsonb_build_object('server_now', now(), 'is_open', false,
      'phase', 'not_configured', 'program', p_program, 'region', p_region);
  END IF;

  v_preview := coalesce(v_s.preview_at, v_s.open_at - interval '7 days');

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
    'preview_at', v_preview,
    'preview_set', v_s.preview_at IS NOT NULL,          -- false면 기본값(7일 전)
    'is_preview', v_phase = 'before_open' AND now() >= v_preview,
    'program', p_program,
    'region', p_region,
    'period_region', v_s.region
  );
END $function$;
GRANT EXECUTE ON FUNCTION public.get_open_status_region(text, text) TO anon, authenticated;

COMMIT;

-- [확인]
-- SELECT get_open_status('joint_regional');
--   → preview_at이 open_at 7일 전(또는 입력값), is_preview가 공개 기간이면 true
