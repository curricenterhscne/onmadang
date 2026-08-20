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
    about:    base + 'about/',
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

  /* ── 상단 안내 배너 ──
     띄울 문구가 있을 때만 banner를 '<div class="renewal-banner" role="note">…</div>' 형태로 채운다.
     빈 문자열이면 배너가 렌더링되지 않는다. (.renewal-banner 스타일은 common.css에 남겨 두었다.)
     ⚠️ 다시 쓸 때는 apply/app.html·design/selector/guide.html의 인라인 배너도 함께 볼 것. */
  var banner = '';

  /* ── 서브메뉴 데이터 ── */
  var subMenus = {
    about: [
      { label: '고교학점제란?',          href: L.about + 'what-is.html' },
      { label: '학생 주도성과 고교학점제', href: L.about + 'student-agency.html' }
    ],
    design: [
      { label: '진로 나침반',    href: L.design + 'compass/'  },
      { label: '학과·과목 탐색', href: L.majors               },
      { label: '과목 선택 실습', href: L.selector             },
      { label: '내 선택 점검',   href: L.design + 'check/'    }
    ],
    safety: [
      { label: '학교 교육과정',   href: base + 'safety/schoolcurriculum.html' },
      { label: '충남온라인학교',   href: base + 'safety/onlineschool.html' },
      { label: '공동교육과정',     href: base + 'safety/jointcurricula.html' },
      { label: '학교 밖 교육',     href: base + 'safety/off-campus_courses.html' }
    ],
    board: [
      { label: '공지사항', href: L.board },
      { label: '자료실',   href: base + 'board/resources.html' }
    ]
  };

  function ddHtml(items) {
    var h = '<div class="gnb-dd">';
    for (var i = 0; i < items.length; i++) {
      h += '<a href="' + items[i].href + '">' + items[i].label + '</a>';
    }
    return h + '</div>';
  }

  /* ── GNB 메뉴 항목 (데스크톱) ── */
  function gnbItems() {
    return ''
      + '<div class="gnb-item"><a href="' + L.about + '" class="gnb-top' + (active === 'about' ? ' active' : '') + '">고교학점제</a>' + ddHtml(subMenus.about) + '</div>'
      + '<div class="gnb-item"><a href="' + L.design + '" class="gnb-top' + (active === 'design' ? ' active' : '') + '">진로\u00B7학업 설계</a>' + ddHtml(subMenus.design) + '</div>'
      + '<div class="gnb-item"><a href="' + L.safety + '" class="gnb-top' + (active === 'safety' ? ' active' : '') + '">4대 안전망</a>' + ddHtml(subMenus.safety) + '</div>'
      + '<div class="gnb-item"><a href="' + L.board  + '" class="gnb-top' + (active === 'board'  ? ' active' : '') + '">알림\u00B7소통 마당</a>' + ddHtml(subMenus.board) + '</div>';
  }

  /* ── 모바일 메뉴 항목 ── */
  function mobileMenuItems() {
    var menus = [
      { key: 'about',  label: '고교학점제',     href: L.about,   subs: subMenus.about },
      { key: 'design', label: '진로\u00B7학업 설계', href: L.design, subs: subMenus.design },
      { key: 'safety', label: '4대 안전망',     href: L.safety,  subs: subMenus.safety },
      { key: 'board',  label: '알림\u00B7소통 마당', href: L.board,  subs: subMenus.board }
    ];
    var h = '';
    for (var i = 0; i < menus.length; i++) {
      var m = menus[i];
      if (!m.href) {
        h += '<span class="disabled">' + m.label + '</span>';
        continue;
      }
      var act = m.key === active ? ' active' : '';
      h += '<button class="mob-toggle' + act + '" data-menu="' + m.key + '">' + m.label + '</button>';
      h += '<div class="mob-sub" data-menu="' + m.key + '">';
      for (var j = 0; j < m.subs.length; j++) {
        h += '<a href="' + m.subs[j].href + '">' + m.subs[j].label + '</a>';
      }
      h += '</div>';
    }
    return h;
  }

  /* ── 헤더 HTML ── */
  var header = '<header>'
    + '<div class="nav">'
    + '<a href="' + L.home + '" class="brand">'
    +   CLV38
    +   '<span class="brand-txt"><b>온마당</b><span>충남 고교학점제 종합지원</span></span>'
    + '</a>'
    + '<nav class="nav-links" aria-label="주 메뉴">' + gnbItems() + '</nav>'
    + '<div class="head-tools">'
    +   '<a href="' + L.selector + '" class="head-link">' + CLV15 + '<span>과목 선택 실습</span></a>'
    + '</div>'
    + '<button class="hamburger" aria-label="메뉴 열기">\u2630</button>'
    + '</div></header>';

  /* ── 모바일 메뉴 HTML ── */
  var mobileMenu = '<div class="mobile-menu" id="mobileMenu" aria-hidden="true">'
    + '<div class="mobile-menu-panel">'
    + '<button class="mobile-menu-close" aria-label="메뉴 닫기">\u2715</button>'
    + '<nav class="mobile-menu-nav" aria-label="모바일 메뉴">' + mobileMenuItems() + '</nav>'
    + '<div class="mobile-menu-divider"></div>'
    + '<div class="mobile-menu-shortcuts">'
    +   '<a href="' + L.selector + '">' + CLV15 + ' 과목 선택 실습</a>'
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

  /* ── 모바일 아코디언 ── */
  var toggles = menu.querySelectorAll('.mob-toggle');
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener('click', (function (btn) {
      return function () {
        var key = btn.getAttribute('data-menu');
        var sub = menu.querySelector('.mob-sub[data-menu="' + key + '"]');
        var wasOpen = btn.classList.contains('open');
        // 모두 닫기
        for (var j = 0; j < toggles.length; j++) {
          toggles[j].classList.remove('open');
          var s = menu.querySelector('.mob-sub[data-menu="' + toggles[j].getAttribute('data-menu') + '"]');
          if (s) s.classList.remove('open');
        }
        // 토글
        if (!wasOpen) {
          btn.classList.add('open');
          if (sub) sub.classList.add('open');
        }
      };
    })(toggles[i]));
  }
})();

/* ── GitHub API 캐시 fetch (sessionStorage, 1분 TTL) ── */
window.cachedFetch = function (url, ttlMs) {
  var TTL = ttlMs || 60000;
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
