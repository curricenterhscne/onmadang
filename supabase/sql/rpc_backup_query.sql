-- ============================================================
-- RPC 함수 7개 정의 백업 — 실행 전 필수 (Phase B0)
-- ============================================================
-- 이 쿼리는 테이블을 전혀 바꾸지 않는 순수 조회(SELECT)다. 운영에 영향 없음.
--
-- 사용법:
--   1. Supabase 대시보드 > SQL Editor에서 이 쿼리를 실행한다.
--   2. 결과(각 행의 정의 전문)를 복사해서 이 파일 하단의
--      "-- ===== 백업 결과 (여기에 붙여넣기) =====" 아래에 그대로 붙여넣는다.
--   3. 붙여넣은 채로 커밋한다. 이게 이후 모든 RPC 교체 작업의 롤백 기준점이 된다.
--
-- ⚠️ RPC 함수 7개(get_open_status·get_course_status·reserve_course·
--    release_reservation·confirm_enrollment·get_my_enrollment·cancel_enrollment)의
--    실제 정의는 이 레포 어디에도 없다 — Supabase 클라우드 DB에만 존재한다.
--    손대기 전에 반드시 이 백업부터 뜬다.

SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_open_status',
    'get_course_status',
    'reserve_course',
    'release_reservation',
    'confirm_enrollment',
    'get_my_enrollment',
    'cancel_enrollment'
  )
ORDER BY p.proname;

-- ============================================================
-- 참고: settings 테이블 행 수도 같이 확인해 둘 것
-- (2행 이상이면 이후 모든 UPDATE/ALTER 작업에서 WHERE 누락 위험이 커진다)
-- ============================================================
-- SELECT count(*) FROM settings;

-- ===== 백업 결과 (여기에 붙여넣기) =====
--
-- (아직 비어 있음 — Supabase 대시보드에서 위 쿼리를 실행한 뒤 결과를 붙여넣어 주세요)
