/* ============================================================
   수강신청 상태 공용 — 모든 수강신청 진입점이 쓴다 (2026-11-11)
   enroll/index.html(입구) · enroll/closed.html · dual_credit/enroll.js

   신청 기간은 Supabase settings 표(관리 화면 「신청 기간」에서 입력)가 정한다.
   이 파일은 get_open_status(p_program) RPC로 프로그램별 상태를 읽어
   「신청 중이면 신청 화면, 아니면 안내 페이지」를 고를 수 있게 해 준다.
   anon 키는 공개용(RLS로 보호) — apply/app.html과 같은 값.

   OM_ENROLL_STATUS.get('joint_regional') → Promise<{
     program, isOpen, phase, openAt, closeAt, label, appUrl }>
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
        var s = { program: program, isOpen: false, phase: 'unknown', openAt: null, closeAt: null,
                  appUrl: base + 'apply/app.html?program=' + encodeURIComponent(program) };
        if (!d) { s.label = '신청 상태를 확인하지 못했습니다'; return s; }
        s.isOpen = !!d.is_open; s.phase = d.phase;
        if (d.phase === 'open1') { s.closeAt = d.close1_at; }
        if (d.phase === 'open2') { s.closeAt = d.close2_at; }
        if (d.phase === 'before_open') { s.openAt = d.open_at; }
        if (d.phase === 'between') { s.openAt = d.open2_at; }
        s.label = s.isOpen ? ('신청 중 · ' + fmt(s.closeAt) + ' 마감')
          : (s.openAt ? (fmt(s.openAt) + ' 신청 시작') : '수강신청 기간이 아닙니다');
        return s;
      });
    return cache[program];
  }

  window.OM_ENROLL_STATUS = { get: get, fmt: fmt };
})();
