-- ============================================================
-- Phase B3 준비 — app.html 멀티프로그램 대응에 필요한 DB 변경
-- ============================================================
-- 이 파일은 두 부분으로 구성된다. 둘 다 안전하게 되돌릴 수 있다.
--
-- 1) courses 테이블 공개 읽기 허용
--    현재 app.html은 강좌 상세(소개·일정·강사진 등)를 _embed_data.js라는
--    정적 파일에서만 읽는다. 새 프로그램(지역연계 등)은 이 파일이 없고,
--    대신 admin-upsert-course로 DB courses 컬럼에 직접 저장된다.
--    학생 화면이 이 상세 정보를 직접 읽을 수 있도록 courses 테이블에
--    "누구나 읽기 가능" RLS 정책을 추가한다. enrolled_count/capacity는
--    이미 get_course_status() RPC로 공개되어 있으므로 노출 범위가 넓어지는
--    건 아니다 — 지금까지 RPC로만 열려 있던 강좌 "상세" 컬럼이 추가로
--    공개 읽기 대상이 될 뿐이다(개인정보 아님, 강좌 소개 텍스트).
--
-- 2) 지역연계 데모 데이터 시딩
--    프로그램 전체 초기화 기능으로 언제든 지울 수 있다(admin 페이지
--    "지역연계 공동교육과정" 탭 → 위험 구역 → 이 프로그램 전체 초기화).
-- ============================================================

BEGIN;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS courses_public_read ON courses;
CREATE POLICY courses_public_read ON courses FOR SELECT USING (true);

COMMIT;

-- ────────────────────────────────────────────────────────────
-- 지역연계 신청 기간 설정 (지금부터 90일간 열어둠 — 데모용)
-- ────────────────────────────────────────────────────────────
INSERT INTO settings (program, open_at, close1_at, open2_at, close2_at)
VALUES ('joint_regional', now(), now() + interval '90 days', NULL, NULL)
ON CONFLICT (program) DO UPDATE
  SET open_at = EXCLUDED.open_at, close1_at = EXCLUDED.close1_at,
      open2_at = EXCLUDED.open2_at, close2_at = EXCLUDED.close2_at;

-- ────────────────────────────────────────────────────────────
-- 지역연계 데모 강좌 2건
-- ────────────────────────────────────────────────────────────
INSERT INTO courses (
  code, program, name, org, region, capacity, min_open, is_registerable, is_closed_manual,
  field, target, intro, method, place, supply,
  recommended_for, instructor_bio, start_date, end_date, session_count,
  instructors, sessions, learning_goals, grade_restricted
) VALUES
(
  'JR26DEMO1', 'joint_regional', '[데모] 인공지능과 데이터 활용', '논산계룡교육지원청', '논산계룡교육지원청',
  20, 8, true, false,
  '공학·IT', '1~2학년', '데이터로 세상을 이해하고 인공지능의 기본 원리를 체험합니다.', '대면 실습',
  '논산계룡교육지원청 공동실습실', '필기구, 개인 노트북(선택)',
  '공학 계열에 관심 있는 학생', '지역 대학 컴퓨터공학과 교수진',
  (current_date + 14), (current_date + 70), 8,
  '[{"name":"홍길동","affiliation":"OO대학교","major":"컴퓨터공학과"}]'::jsonb,
  '[{"no":"1","date":"","time":"","content":"인공지능이란 무엇인가","instructor":"홍길동"}]'::jsonb,
  '["인공지능의 기본 개념을 설명할 수 있다.","데이터 분석 도구를 활용할 수 있다."]'::jsonb,
  false
),
(
  'JR26DEMO2', 'joint_regional', '[데모] 지역 문화유산 탐구', '논산계룡교육지원청', '논산계룡교육지원청',
  18, 8, true, false,
  '인문·어문', '1~2학년', '논산·계룡 지역의 문화유산을 답사하고 기록합니다.', '현장 답사 + 대면',
  '논산계룡교육지원청 일원', '필기구, 편한 복장',
  '지역사·인문학에 관심 있는 학생', '지역 문화해설사',
  (current_date + 14), (current_date + 70), 6,
  '[{"name":"김문화","affiliation":"논산문화원","major":"향토사"}]'::jsonb,
  '[]'::jsonb,
  '["지역 문화유산의 가치를 설명할 수 있다."]'::jsonb,
  false
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 확인
-- ============================================================
-- SELECT code, name, program, capacity FROM courses WHERE program = 'joint_regional';
-- SELECT * FROM settings WHERE program = 'joint_regional';

-- ============================================================
-- 데모 끝난 뒤 지우는 법
-- ============================================================
-- admin 페이지 → "지역연계 공동교육과정" 탭 → 위험 구역 →
-- "이 프로그램 전체 초기화" (실제 지역청 강좌를 등록하기 전에 비워두는 걸 권장)
