-- ============================================================
-- Phase B1 수정 — 구 시그니처 함수 제거 (오버로드 충돌 해결)
-- ============================================================
-- rpc_multiprogram.sql의 CREATE OR REPLACE는 인자 개수가 다르면
-- "교체"가 아니라 "오버로드 추가"로 처리된다. 그 결과 아래 6개 함수가
-- 전부 구 시그니처(p_program 없음)와 신 시그니처(p_program 있음)로
-- 동시에 존재하게 되어 호출이 모호해졌다(42725 에러).
--
-- 이 파일은 구 시그니처만 정확히 지정해서 삭제한다.
-- 신 시그니처(rpc_multiprogram.sql에서 만든 것)는 그대로 남는다.
-- release_reservation은 손댄 적이 없으므로 여기 없음.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_open_status();
DROP FUNCTION IF EXISTS public.get_course_status();
DROP FUNCTION IF EXISTS public.reserve_course(text);
DROP FUNCTION IF EXISTS public.confirm_enrollment(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_my_enrollment(text, text, text);
DROP FUNCTION IF EXISTS public.cancel_enrollment(text, text, text, text);

COMMIT;

-- ============================================================
-- 확인 (그대로 실행)
-- ============================================================
-- 아래는 함수당 정확히 1행씩만 나와야 한다(전부 p_program 포함 시그니처).
SELECT proname, pg_get_function_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('get_open_status','get_course_status','reserve_course',
                  'confirm_enrollment','get_my_enrollment','cancel_enrollment')
ORDER BY proname;

-- 회귀 테스트 — 이제 모호함 없이 실행되어야 한다
SELECT get_open_status();
SELECT * FROM get_course_status() LIMIT 5;
