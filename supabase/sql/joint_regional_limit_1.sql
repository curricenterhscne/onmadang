-- ============================================================
-- 지역연계 공동교육과정 신청 상한: 1인 1강좌 (2026-11-11 담당자 결정)
-- ============================================================
-- programs.term_subject_limit가 2였다(1인 2강좌).
-- NULL로 두면 confirm_enrollment가 꿈키움·고교-대학 연계와 같은 「1건만」 검사를 쓴다
-- (이미 활성 신청이 있으면 'duplicate' — 학생 화면 문구도 그대로 맞는다).
-- 실행: Supabase 대시보드 > SQL Editor

UPDATE programs SET term_subject_limit = NULL WHERE code = 'joint_regional';

-- 확인: joint_regional의 term_subject_limit이 null
-- SELECT code, term_subject_limit FROM programs ORDER BY code;

-- 참고: 이미 2건을 확정한 학생이 있는지 (있으면 담당자가 정리)
-- SELECT school, student_no, count(*) FROM enrollments
--  WHERE program = 'joint_regional' AND status = 'active'
--  GROUP BY school, student_no HAVING count(*) > 1;
