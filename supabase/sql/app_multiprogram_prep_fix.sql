-- ============================================================
-- app_multiprogram_prep.sql 실행 중 에러 수정
-- ============================================================
-- settings.id의 시퀀스가 기존 최대값보다 뒤처져 있어 새 행 삽입 시
-- id=1(기존 dream_up 행)과 충돌했다. 시퀀스를 현재 최대 id로 맞춘 뒤
-- 나머지(지역연계 신청기간 + 데모 강좌 2건)를 다시 실행한다.
-- (courses 테이블 공개읽기 RLS는 앞서 이미 성공적으로 적용됐다 —
--  이 파일에서는 다시 건드리지 않는다.)
-- ============================================================

-- 진짜 원인: settings는 원래 "행이 항상 1개(id=1)만 존재"하도록 만들어진
-- 싱글톤 테이블이었다 — id 기본값이 상수 1이고, CHECK(id=1)로 그 외 값을 막는다.
-- 멀티프로그램에서는 프로그램마다 한 행씩 필요하므로 이 제약을 없앤다.
-- (program 컬럼의 UNIQUE 제약이 "프로그램당 한 행"을 대신 보장한다.)
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_id_check;
ALTER TABLE settings ALTER COLUMN id DROP DEFAULT;
CREATE SEQUENCE IF NOT EXISTS settings_id_seq OWNED BY settings.id;
SELECT setval('settings_id_seq', COALESCE((SELECT MAX(id) FROM settings), 0) + 1, false);
ALTER TABLE settings ALTER COLUMN id SET DEFAULT nextval('settings_id_seq');

INSERT INTO settings (program, open_at, close1_at, open2_at, close2_at)
VALUES ('joint_regional', now(), now() + interval '90 days', NULL, NULL)
ON CONFLICT (program) DO UPDATE
  SET open_at = EXCLUDED.open_at, close1_at = EXCLUDED.close1_at,
      open2_at = EXCLUDED.open2_at, close2_at = EXCLUDED.close2_at;

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

-- 확인
-- SELECT code, name, program, capacity FROM courses WHERE program = 'joint_regional';
-- SELECT * FROM settings WHERE program = 'joint_regional';
