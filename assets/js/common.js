/* ============================================================
   온마당 공통 헤더·푸터 렌더러 — common.js
   사용법: <div id="om-header" data-active="safety"></div>
          <div id="om-footer"></div>
          <script src="../assets/js/common.js"></script>
   ============================================================ */
(function () {
  'use strict';

  /* ── base path 자동 계산 ── */
  var scripts = document.querySelectorAll('script[src*="common.js"]');
  var src = scripts[scripts.length - 1].getAttribute('src');
  var base = src.replace('assets/js/common.js', '');

  /* ── 링크 맵 ── */
  var L = {
    home:     base + 'index.html',
    design:   base + 'design/',
    safety:   base + 'safety/',
    board:    base + 'board/',
    majors:   base + 'design/majors/',
    selector: base + 'design/selector/',
    apply:    base + 'apply/'
  };

  /* ── active 메뉴 ── */
  var headerEl = document.getElementById('om-header');
  if (!headerEl) return;
  var active = headerEl.getAttribute('data-active') || '';

  var CLV15 = '<svg class="clover" width="15" height="15"><use href="#clv"/></svg>';
  var CLV38 = '<svg class="clover" width="38" height="38"><use href="#clv"/></svg>';

  function cls(menu) { return menu === active ? ' class="active"' : ''; }

  /* ── 클로버 SVG 심볼 (defs) ── */
  var svgDefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<symbol id="clv" viewBox="0 0 100 100">'
    + '<circle cx="50" cy="32" r="17" fill="#7BCE7C"/>'
    + '<circle cx="32" cy="50" r="17" fill="#7BCE7C"/>'
    + '<circle cx="68" cy="50" r="17" fill="#7BCE7C"/>'
    + '<circle cx="50" cy="68" r="17" fill="#5fb260"/>'
    + '<circle cx="50" cy="50" r="8.5" fill="#4F6EBE"/>'
    + '<path d="M50 66 Q53 82 59 90" stroke="#5fb260" stroke-width="5" fill="none" stroke-linecap="round"/>'
    + '</symbol></defs></svg>';

  /* ── 리뉴얼 배너 ── */
  var banner = '<div class="renewal-banner" role="note">'
    + '\uFF1C충남 고교학점제 종합지원 포털 온마당\uFF1E 현재 리뉴얼 작업 중입니다.&ensp;(2026. 7. 1. ~ 7. 31.)'
    + '</div>';

  /* ── GNB 메뉴 항목 ── */
  function gnbItems(useClass) {
    var items = ''
      + '<span class="' + (useClass ? 'nav-' : '') + 'disabled" aria-disabled="true" title="준비 중">고교학점제 안내</span>'
      + '<a href="' + L.design + '"' + cls('design') + '>진로\u00B7학업 설계</a>'
      + '<a href="' + L.safety + '"' + cls('safety') + '>4대 안전망</a>'
      + '<a href="' + L.board  + '"' + cls('board')  + '>알림\u00B7소통 마당</a>';
    return items;
  }

  /* ── 헤더 HTML ── */
  var header = '<header>'
    + '<div class="nav">'
    + '<a href="' + L.home + '" class="brand">'
    +   CLV38
    +   '<span class="brand-txt"><b>온마당</b><span>충남 고교학점제 종합지원</span></span>'
    + '</a>'
    + '<nav class="nav-links" aria-label="주 메뉴">' + gnbItems(true) + '</nav>'
    + '<div class="head-tools">'
    +   '<a href="' + L.majors + '" class="head-link">' + CLV15 + '<span>대학 학과 안내</span></a>'
    +   '<a href="' + L.selector + '" class="head-link">' + CLV15 + '<span>과목 선택 실습</span></a>'
    +   '<a href="' + L.apply + '" class="head-cta">수강신청</a>'
    + '</div>'
    + '<button class="hamburger" aria-label="메뉴 열기">\u2630</button>'
    + '</div></header>';

  /* ── 모바일 메뉴 HTML ── */
  var mobileMenu = '<div class="mobile-menu" id="mobileMenu" aria-hidden="true">'
    + '<div class="mobile-menu-panel">'
    + '<button class="mobile-menu-close" aria-label="메뉴 닫기">\u2715</button>'
    + '<nav class="mobile-menu-nav" aria-label="모바일 메뉴">' + gnbItems(false) + '</nav>'
    + '<div class="mobile-menu-divider"></div>'
    + '<div class="mobile-menu-shortcuts">'
    +   '<a href="' + L.majors + '">' + CLV15 + ' 대학 학과 안내</a>'
    +   '<a href="' + L.selector + '">' + CLV15 + ' 과목 선택 실습</a>'
    +   '<a href="' + L.apply + '">' + CLV15 + ' 수강신청</a>'
    + '</div>'
    + '</div></div>';

  /* ── 렌더링 ── */
  headerEl.insertAdjacentHTML('beforebegin', svgDefs);
  headerEl.outerHTML = banner + header + mobileMenu;

  /* ── 푸터 ── */
  var footerEl = document.getElementById('om-footer');
  if (footerEl) {
    footerEl.outerHTML = '<footer>'
      + '<p>\u00A9 2026 충청남도교육청 \u00B7 <a href="' + L.home + '">온마당 홈으로</a></p>'
      + '</footer>';
  }

  /* ── 모바일 메뉴 JS ── */
  var menu = document.getElementById('mobileMenu');
  var openBtn = document.querySelector('.hamburger');
  var closeBtn = menu.querySelector('.mobile-menu-close');

  function openMenu() {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
})();

/* ── GitHub API 캐시 fetch (sessionStorage, 5분 TTL) ── */
window.cachedFetch = function (url, ttlMs) {
  var TTL = ttlMs || 300000;
  var key = 'cf:' + url;
  try {
    var c = JSON.parse(sessionStorage.getItem(key));
    if (c && Date.now() - c.t < TTL) {
      return Promise.resolve({
        ok: true, status: 200,
        json: function () { return Promise.resolve(c.d); },
        headers: new Map([['Link', c.l || '']])
      });
    }
  } catch (e) { /* ignore */ }
  return fetch(url).then(function (res) {
    if (!res.ok) return res;
    var link = res.headers.get('Link') || '';
    return res.json().then(function (data) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data, l: link }));
      } catch (e) { /* quota exceeded — skip */ }
      return {
        ok: true, status: res.status,
        json: function () { return Promise.resolve(data); },
        headers: new Map([['Link', link]])
      };
    });
  });
};
