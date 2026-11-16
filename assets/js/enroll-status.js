/* ============================================================
   수강신청 상태 공용 — 모든 수강신청 진입점이 쓴다 (2026-11-11)
   enroll/index.html(입구) · enroll/closed.html · dual_credit/enroll.js

   신청 기간은 Supabase settings 표(관리 화면 「신청 기간」에서 입력)가 정한다.
   이 파일은 get_open_status(p_program) RPC로 프로그램별 상태를 읽어
   「신청 중이면 신청 화면, 아니면 안내 페이지」를 고를 수 있게 해 준다.
   anon 키는 공개용(RLS로 보호) — apply/app.html과 같은 값.

   OM_ENROLL_STATUS.get('joint_regional') → Promise<{
     program, isOpen, isPreview, phase, previewAt, openAt, closeAt, label, appUrl }>
   isPreview — 강좌 공개(미리 보기) 기간: 신청 시작 전이지만 신청 화면에서 강좌를 볼 수 있다.
   공개 시각은 관리 화면 「강좌 공개」 값, 비어 있으면 신청 시작 7일 전(preview_period.sql).
   ============================================================ */
(function () {
  'use strict';
  var URL = 'https://yhrgvnttjlitukrxdfdo.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlocmd2bnR0amxpdHVrcnhkZmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDYzNDAsImV4cCI6MjA5Nzc4MjM0MH0.FKtEr-59H1hl1Aucb-x1MFQkAC--ylV0BEX5gg1lpg8';
  var WD = ['일', '월', '화', '수', '목', '금', '토'];

  // 입구 기준 상대 경로가 아니라 이 스크립트 위치 기준으로 앱 주소를 만든다
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/assets\/js\/enroll-status\.js.*$/, '') : '../';

  function fmt(iso) {
    if (!iso) return '';
    var d = new Date(iso); // 브라우저 시간대 = 한국 사용자 기준
    return (d.getMonth() + 1) + '. ' + d.getDate() + '.(' + WD[d.getDay()] + ') ' +
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  var cache = {};
  function get(program) {
    if (cache[program]) return cache[program];
    cache[program] = fetch(URL + '/rest/v1/rpc/get_open_status', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_program: program })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var s = { program: program, isOpen: false, isPreview: false, phase: 'unknown', previewAt: null, openAt: null, closeAt: null,
                  appUrl: base + 'apply/app.html?program=' + encodeURIComponent(program) };
        if (!d) { s.label = '신청 상태를 확인하지 못했습니다'; return s; }
        s.isOpen = !!d.is_open; s.phase = d.phase;
        if (d.phase === 'open1') { s.closeAt = d.close1_at; }
        if (d.phase === 'open2') { s.closeAt = d.close2_at; }
        if (d.phase === 'before_open') {
          s.openAt = d.open_at;
          // preview_at이 없는 응답(preview_period.sql 실행 전)은 7일 전으로 계산한다
          s.previewAt = d.preview_at || (d.open_at ? new Date(new Date(d.open_at).getTime() - 7 * 864e5).toISOString() : null);
          var now = d.server_now ? new Date(d.server_now).getTime() : Date.now();
          s.isPreview = !!s.previewAt && now >= new Date(s.previewAt).getTime();
        }
        if (d.phase === 'between') { s.openAt = d.open2_at; }
        s.label = s.isOpen ? ('신청 중 · ' + fmt(s.closeAt) + ' 마감')
          : s.isPreview ? ('강좌 미리 보기 · ' + fmt(s.openAt) + ' 신청 시작')
          : (s.openAt ? (fmt(s.openAt) + ' 신청 시작') : '수강신청 기간이 아닙니다');
        return s;
      });
    return cache[program];
  }

  /* ── 온라인 공동교육과정 (2026-11-16) ──────────────────────────
     선착순이 아닌 별도 신청 사이트(enrollment-cne.vercel.app, 다른 Supabase 프로젝트)다.
     그 사이트 관리 화면 「신청 기간」의 현재 회차를 get_enroll_status()로 읽어 같은 모양으로 돌려준다.
     phase: idle(강좌 공개 전) · before(강좌 공개) · open(신청 중) · closed(마감), 회차가 없으면 null.
     재신청 회차가 신청 중이면 재신청 화면으로 연결한다. anon 키는 공개용(RLS로 보호). */
  var ON_URL = 'https://jrndddwypckotcpipsjc.supabase.co';
  var ON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybmRkZHd5cGNrb3RjcGlwc2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDc4MDAsImV4cCI6MjA5NjA4MzgwMH0.J8kNkkSbOgQRBYl6Byk9AAI_4--R6R-SFT9LkAEiTb0';
  var ON_APP = 'https://enrollment-cne.vercel.app/';

  function getOnline() {
    if (cache.online) return cache.online;
    cache.online = fetch(ON_URL + '/rest/v1/rpc/get_enroll_status', {
      method: 'POST',
      headers: { apikey: ON_KEY, Authorization: 'Bearer ' + ON_KEY, 'Content-Type': 'application/json' },
      body: '{}'
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var s = { program: 'online', isOpen: false, isPreview: false, phase: 'unknown', previewAt: null, openAt: null, closeAt: null, appUrl: ON_APP };
        if (!d) { s.label = '신청 상태를 확인하지 못했습니다'; return s; }
        var m = d.main, re = d.reapply;
        if (m && m.phase === 'open') {
          s.isOpen = true; s.phase = 'open'; s.closeAt = m.ends_at;
          s.label = '신청 중 · ' + fmt(m.ends_at) + ' 마감';
        } else if (re && re.phase === 'open') {
          s.isOpen = true; s.phase = 'reapply'; s.closeAt = re.ends_at; s.appUrl = ON_APP + 'reapply';
          s.label = '재신청 중 · ' + fmt(re.ends_at) + ' 마감';
        } else if (m && m.phase === 'before') {
          s.isPreview = true; s.phase = 'before'; s.openAt = m.starts_at; s.previewAt = m.preview_at;
          s.label = '강좌 미리 보기 · ' + fmt(m.starts_at) + ' 신청 시작';
        } else {
          // 강좌 공개 전(idle)·마감(closed)·회차 없음 — 입구에서는 「기간 아님」
          s.phase = m ? m.phase : 'none';
          if (m && m.phase === 'idle') { s.openAt = m.starts_at; s.previewAt = m.preview_at; }
          s.label = '수강신청 기간이 아닙니다';
        }
        return s;
      });
    return cache.online;
  }

  window.OM_ENROLL_STATUS = {
    get: function (program) { return program === 'online' ? getOnline() : get(program); },
    fmt: fmt
  };
})();
