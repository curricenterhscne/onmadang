-- ============================================================
-- 2026학년도 2학기 꿈키움 창의적체험활동 — 수강신청 기간 설정
-- 대상 테이블: public.settings   (2026-09-03 확인)
-- 생성일: 2026-09-03
--
-- 확정 일정 (KST)
--   1차 : 2026. 9. 10.(목) 18:00 ~ 9. 13.(일) 15:00
--   2차 : 2026. 9. 15.(화) 18:00 ~ 22:00
--   개설강좌 확정 안내 : 2026. 9. 17.(목)
--
-- 컬럼이 timestamptz이므로 KST 시각에 +09 를 붙여 그대로 넣는다.
-- (기존 값도 09:00Z = 18:00 KST 로 같은 규칙이었다)
-- ============================================================

-- ── [1단계] 현재 값과 행 수 확인 ──
--   settings가 여러 행이면 아래 UPDATE에 WHERE 를 반드시 붙일 것.
--   1행이면 그대로 실행하면 된다.
SELECT * FROM settings;


-- ── [2단계] 기간 설정 ──
BEGIN;

UPDATE settings SET
  open_at   = '2026-09-10 18:00:00+09',   -- 1차 시작
  close1_at = '2026-09-13 15:00:00+09',   -- 1차 마감
  open2_at  = '2026-09-15 18:00:00+09',   -- 2차 시작
  close2_at = '2026-09-15 22:00:00+09';   -- 2차 마감
-- ⚠️ settings가 2행 이상이면 위 문장 끝에 WHERE 절을 추가할 것 (예: WHERE id = 1)

-- 확인 ① 저장된 값 (UTC로 표시된다: 09:00Z = 18:00 KST)
SELECT open_at, close1_at, open2_at, close2_at FROM settings;

-- 확인 ② KST로 보기 — 위 일정과 글자 그대로 일치해야 한다
SELECT open_at   AT TIME ZONE 'Asia/Seoul' AS "1차 시작",
       close1_at AT TIME ZONE 'Asia/Seoul' AS "1차 마감",
       open2_at  AT TIME ZONE 'Asia/Seoul' AS "2차 시작",
       close2_at AT TIME ZONE 'Asia/Seoul' AS "2차 마감"
  FROM settings;

-- 확인 ③ 앱이 실제로 읽는 값. 9/10 이전이면 phase='before_open' 이어야 한다.
SELECT * FROM get_open_status();

COMMIT;
-- 값이 틀리면 COMMIT 대신:  ROLLBACK;


-- ============================================================
-- 앱 동작 참고 (apply/app.html renderStatusBar)
--   before_open → "신청 시작까지 ⏳ …" 카운트다운
--   open1       → 신청 가능 · close1_at 까지 마감 카운트다운
--   between     → "2차 신청 시작까지 ⏳ …" (open2_at 사용)
--   open2       → 신청 가능 · close2_at 까지 마감 카운트다운
--   closed      → "신청이 마감되었습니다."
--
-- 화면 문구는 app.html에 하드코딩되어 있다 (히어로 태그 + 안내 ⑤ 일정, 2곳).
-- 일정이 바뀌면 DB와 app.html을 함께 고칠 것.
-- ============================================================
