/* ============================================================
   고교-대학 연계 학점 인정 — 수강 신청 개폐 제어
   dual_credit/index.html · dual_credit/courses.html 공용

   ▣ 학기가 바뀌면 아래 OM_ENROLL.periods 배열만 고치면 된다.
     - 신청 기간을 열 때  : periods에 한 줄 추가
     - 신청 기간이 끝나면 : 그대로 두면 자동으로 닫힌 상태가 된다 (지우지 말 것)
     - 14개 과목 자체는 계속 유지되며 매년 1·2학기에 개설될 수 있다.
   ============================================================ */

window.OM_ENROLL = {

  /* 신청 기간에 여는 앱 (apply/app.html이 수강신청 앱 본체) */
  appUrl: '../apply/app.html',

  /* 신청 기간이 아닐 때 안내를 볼 곳 */
  noticeUrl: '../board/notice.html',

  /* ── 수강 신청 기간 목록 (KST 기준, 과거 기간도 기록으로 남겨 둘 것) ──
     open  : 신청 시작 일시
     close : 신청 마감 일시 (이 시각이 지나면 자동으로 닫힌다)
     term  : 화면에 표시할 학기 이름                              */
  periods: [
    { term: '2026학년도 2학기',
      open:  '2026-07-16T18:00:00+09:00',
      close: '2026-07-31T18:00:00+09:00' }

    /* 예시 — 다음 학기를 열 때 아래 형식으로 추가
    ,{ term: '2027학년도 1학기',
       open:  '2027-02-19T18:00:00+09:00',
       close: '2027-03-05T18:00:00+09:00' }
    */
  ]
};

(function () {
  'use strict';

  var CFG = window.OM_ENROLL;
  var WD  = ['일', '월', '화', '수', '목', '금', '토'];

  function fmt(d) {
    return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() +
           '.(' + WD[d.getDay()] + ') ' +
           ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* ── 현재 상태 판정 ── */
  var now = Date.now();
  var list = [];
  (CFG.periods || []).forEach(function (p) {
    var o = Date.parse(p.open), c = Date.parse(p.close);
    if (!isNaN(o) && !isNaN(c)) list.push({ term: p.term, o: o, c: c });
  });
  list.sort(function (a, b) { return a.o - b.o; });

  var cur = null, next = null;
  list.forEach(function (p) {
    if (now >= p.o && now < p.c) { if (!cur) cur = p; }
    else if (now < p.o) { if (!next) next = p; }
  });

  var state;
  if (cur) {
    state = {
      status: 'open',
      term:   cur.term,
      url:    CFG.appUrl,
      label:  '수강 신청 →',
      notice: cur.term + ' 수강 신청을 접수하고 있습니다. 마감 ' + fmt(new Date(cur.c)) + '.'
    };
  } else if (next) {
    state = {
      status: 'upcoming',
      term:   next.term,
      url:    null,
      label:  '신청 기간 전',
      notice: next.term + ' 수강 신청은 ' + fmt(new Date(next.o)) + '에 시작합니다.'
    };
  } else {
    state = {
      status: 'closed',
      term:   list.length ? list[list.length - 1].term : '',
      url:    null,
      label:  '신청 기간 아님',
      notice: '현재 접수 중인 수강 신청이 없습니다. 다음 신청 일정은 공지사항으로 안내합니다.'
    };
  }
  window.OM_ENROLL_STATE = state;

  /* ── 화면 반영 ──
     data-enroll="cta"    : 신청 버튼 (href·문구가 상태에 따라 바뀜)
     data-enroll="notice" : 상태 안내 문구
     data-enroll="term"   : 학기 이름
     data-enroll="open-only"   : 신청 기간에만 보임
     data-enroll="closed-only" : 신청 기간이 아닐 때만 보임                */
  function apply() {
    var isOpen = state.status === 'open';

    document.querySelectorAll('[data-enroll="cta"]').forEach(function (el) {
      el.textContent = state.label;
      el.classList.toggle('enroll-open', isOpen);
      el.classList.toggle('enroll-shut', !isOpen);
      if (isOpen) {
        el.setAttribute('href', state.url);
        el.removeAttribute('aria-disabled');
      } else {
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('title', state.notice);
      }
    });

    document.querySelectorAll('[data-enroll="notice"]').forEach(function (el) {
      el.textContent = state.notice;
      el.classList.toggle('enroll-open', isOpen);
      el.classList.toggle('enroll-shut', !isOpen);
    });

    document.querySelectorAll('[data-enroll="term"]').forEach(function (el) {
      if (state.term) el.textContent = state.term;
    });

    document.querySelectorAll('[data-enroll="open-only"]').forEach(function (el) {
      el.hidden = !isOpen;
    });
    document.querySelectorAll('[data-enroll="closed-only"]').forEach(function (el) {
      el.hidden = isOpen;
    });
  }

  /* 동적으로 그려지는 영역(courses.html 모달 등)에서 다시 호출할 수 있게 노출 */
  window.OM_ENROLL_APPLY = apply;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
