/* ============================================================
   고교-대학 연계 학점 인정 — 수강 신청 상태 표시
   dual_credit/index.html · dual_credit/courses.html 공용

   ▣ 2026-11-11부터 신청 기간은 이 파일이 아니라 DB가 정한다.
     관리 화면(apply/admin/) 「신청 기간」에서 「고교-대학 연계」 기본 기간을 넣으면
     이 파일이 assets/js/enroll-status.js로 그 상태를 읽어 화면에 반영한다.
     신청 단추는 모든 프로그램 공통 입구(enroll/)로 보낸다.
     (예전처럼 periods 배열을 고칠 필요가 없다.)

   화면 쪽 표시 규칙(data-enroll 속성)은 예전과 같다.
   ============================================================ */
(function () {
  'use strict';

  var ENROLL_URL = '../enroll/';

  /* 상태를 읽기 전 기본값 — 닫힌 상태로 그려 두고 읽은 뒤 바꾼다 */
  var state = {
    status: 'closed', term: '', url: null,
    label: '신청 기간 아님',
    notice: '수강 신청 일정을 확인하는 중입니다.'
  };
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
        el.removeAttribute('title');
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

  var CLOSED = '현재 접수 중인 수강 신청이 없습니다. 다음 신청 일정은 공지사항으로 안내합니다.';

  function load() {
    apply();
    if (!window.OM_ENROLL_STATUS) { state.notice = CLOSED; apply(); return; }
    window.OM_ENROLL_STATUS.get('dual_credit').then(function (s) {
      var fmt = window.OM_ENROLL_STATUS.fmt;
      if (s.isOpen) {
        state.status = 'open'; state.url = ENROLL_URL; state.label = '수강 신청 →';
        state.notice = '수강 신청을 접수하고 있습니다. 마감 ' + fmt(s.closeAt) + '.';
      } else if (s.openAt) {
        state.status = 'upcoming'; state.label = '신청 기간 전';
        state.notice = '수강 신청은 ' + fmt(s.openAt) + '에 시작합니다.';
      } else {
        state.status = 'closed'; state.label = '신청 기간 아님'; state.notice = CLOSED;
      }
      apply();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
