/* ============================================================
   알림·소통 마당 — 읽기·화면 모듈 (2026-11-18)
   board/notices.html · notice.html · resources.html · resource-view.html,
   홈(index.html) 알림·소통 마당 목록이 함께 쓴다.

   데이터: Supabase 표 board_posts (읽기 공개, RLS가 지운 글을 숨긴다)
   쓰기는 board/admin/ → Edge Function board-admin 만 한다.
   anon 키는 공개용이다(apply/app.html·assets/js/enroll-status.js와 같은 프로젝트).

   상세 페이지는 marked + DOMPurify를 먼저 불러와야 한다(본문은 신뢰하지 않는 입력).
   ============================================================ */
(function () {
  'use strict';

  var SB_URL = 'https://yhrgvnttjlitukrxdfdo.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlocmd2bnR0amxpdHVrcnhkZmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDYzNDAsImV4cCI6MjA5Nzc4MjM0MH0.FKtEr-59H1hl1Aucb-x1MFQkAC--ylV0BEX5gg1lpg8';
  var BUCKET = 'board-files';
  var PER = 20;
  var NEW_DAYS = 7;

  /* 게시판 설정 — 분류를 바꾸려면 여기와 board/admin/의 같은 표를 함께 고친다 */
  var BOARDS = {
    notice: {
      name: '공지사항', list: 'notices.html', view: 'notice.html',
      categories: [], importantFilter: true
    },
    resource: {
      name: '자료실', list: 'resources.html', view: 'resource-view.html',
      categories: ['서식', '매뉴얼', '연수자료', '홍보자료'], importantFilter: false
    }
  };

  /* ── 공통 ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtShort(iso) { var d = new Date(iso); return pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function fmtFull(iso) { var d = new Date(iso); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  function isNew(iso) { return Date.now() - new Date(iso).getTime() < NEW_DAYS * 864e5; }

  function rest(path, wantCount) {
    var headers = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
    if (wantCount) headers.Prefer = 'count=exact';
    return fetch(SB_URL + '/rest/v1/' + path, { headers: headers }).then(function (r) {
      if (!r.ok) throw new Error('게시판 서버 응답 오류 (' + r.status + ')');
      var total = null;
      var cr = r.headers.get('content-range');
      if (cr && cr.indexOf('/') > -1) total = parseInt(cr.split('/')[1], 10);
      return r.json().then(function (data) { return { data: data, total: total }; });
    });
  }

  var LIST_COLS = 'id,board,title,category,is_important,attachments,created_at';

  function list(board, opt) {
    opt = opt || {};
    var page = opt.page || 1, per = opt.per || PER;
    var q = 'board_posts?select=' + LIST_COLS + '&board=eq.' + board;
    if (opt.category) q += '&category=eq.' + encodeURIComponent(opt.category);
    if (opt.important) q += '&is_important=is.true';
    q += '&order=' + (opt.pinFirst === false ? '' : 'is_important.desc,') + 'created_at.desc,id.desc';
    q += '&offset=' + (page - 1) * per + '&limit=' + per;
    return rest(q, true);
  }
  function getPost(id) {
    return rest('board_posts?select=*&id=eq.' + id).then(function (r) { return r.data[0] || null; });
  }
  function adjacent(post) {
    var base = 'board_posts?select=id,title&board=eq.' + post.board;
    var t = encodeURIComponent(post.created_at);
    return Promise.all([
      rest(base + '&created_at=lt.' + t + '&order=created_at.desc&limit=1'),
      rest(base + '&created_at=gt.' + t + '&order=created_at.asc&limit=1')
    ]).then(function (rs) { return { older: rs[0].data[0] || null, newer: rs[1].data[0] || null }; })
      .catch(function () { return { older: null, newer: null }; });
  }

  function fileUrl(f) {
    if (f.url) { try { return new URL(f.url).href; } catch (e) { return '#'; } }
    var p = String(f.path || '').split('/').map(encodeURIComponent).join('/');
    return SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + p + '?download=' + encodeURIComponent(f.name || 'file');
  }
  /* 그림 첨부 — 본문 아래에 그림으로 보인다(2026-11-18). 첨부 목록에서도 원본을 내려받을 수 있다.
     w·h(올릴 때 잰 크기)가 있으면 자리를 미리 잡아 화면 밀림을 막는다. alt는 관리 화면 「그림 설명」, 없으면 파일 이름 */
  var IMG_EXT = /\.(png|jpe?g|gif|webp)$/i;
  function isImage(f) {
    if (f.path) return IMG_EXT.test(f.path);
    try { return IMG_EXT.test(new URL(f.url).pathname); } catch (e) { return false; }
  }
  function imageSrc(f) {
    if (f.url) return fileUrl(f);
    return SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + String(f.path).split('/').map(encodeURIComponent).join('/');
  }
  function imagesHtml(files) {
    return (files || []).filter(isImage).map(function (f) {
      var alt = f.alt || String(f.name || '').replace(/\.[^.]+$/, '');
      var wh = (f.w > 0 && f.h > 0) ? ' width="' + (f.w | 0) + '" height="' + (f.h | 0) + '"' : '';
      return '<figure class="bd-fig"><img src="' + esc(imageSrc(f)) + '" alt="' + esc(alt) + '"' + wh + ' loading="lazy" decoding="async"></figure>';
    }).join('');
  }

  function fileIcon(name, isLink) {
    if (isLink) return '🔗';
    var ext = (String(name).split('.').pop() || '').toLowerCase();
    var map = { pdf: '📄', hwp: '📝', hwpx: '📝', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊',
      zip: '🗜️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', mp4: '🎬' };
    return map[ext] || '📎';
  }
  function fmtSize(b) {
    if (!b) return '';
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + 'KB';
    return (b / 1024 / 1024).toFixed(1) + 'MB';
  }

  function renderMarkdown(md) {
    if (!md || !String(md).trim()) return '';
    if (!window.marked || !window.DOMPurify) return '<p>' + esc(md).replace(/\n/g, '<br>') + '</p>';
    var html = window.marked.parse(String(md), { breaks: true, gfm: true });
    var clean = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    var box = document.createElement('div');
    box.innerHTML = clean;
    box.querySelectorAll('a[href]').forEach(function (a) {
      if (/^https?:/i.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    });
    return box.innerHTML;
  }

  function badges(p) {
    var h = '';
    if (p.is_important) h += '<span class="bd-badge is-imp">중요</span>';
    if (p.category) h += '<span class="bd-badge">' + esc(p.category) + '</span>';
    if (isNew(p.created_at)) h += '<span class="bd-badge is-new">새 글</span>';
    return h;
  }

  function stateHtml(msg, detail, spin) {
    return '<div class="bd-state" role="status">' + (spin ? '<div class="bd-spin" aria-hidden="true"></div>' : '') +
      '<p>' + esc(msg) + '</p>' + (detail ? '<small>' + detail + '</small>' : '') + '</div>';
  }

  /* ── 목록 화면 ── */
  function mountList(board, root) {
    var cfg = BOARDS[board];
    var params = new URLSearchParams(location.search);
    var st = { page: Math.max(1, parseInt(params.get('page'), 10) || 1), filter: params.get('cat') || '' };

    var chips = [{ v: '', t: '전체' }];
    if (cfg.importantFilter) chips.push({ v: '!imp', t: '중요' });
    cfg.categories.forEach(function (c) { chips.push({ v: c, t: c }); });

    root.innerHTML =
      '<nav class="bd-tabs" aria-label="게시판">' +
        '<a class="bd-tab" href="./notices.html"' + (board === 'notice' ? ' aria-current="page"' : '') + '>공지사항</a>' +
        '<a class="bd-tab" href="./resources.html"' + (board === 'resource' ? ' aria-current="page"' : '') + '>자료실</a>' +
      '</nav>' +
      '<div class="bd-box">' +
        (chips.length > 1 ? '<div class="bd-filter" role="group" aria-label="분류">' +
          chips.map(function (c) { return '<button type="button" class="bd-chip" data-v="' + esc(c.v) + '">' + esc(c.t) + '</button>'; }).join('') +
          '<span class="bd-total" aria-live="polite"></span></div>' : '') +
        '<div class="bd-list"></div><nav class="bd-pages" aria-label="쪽 이동"></nav>' +
      '</div>';

    var listEl = root.querySelector('.bd-list'), pagesEl = root.querySelector('.bd-pages'), totalEl = root.querySelector('.bd-total');

    root.querySelectorAll('.bd-chip').forEach(function (b) {
      b.addEventListener('click', function () { st.filter = b.dataset.v; st.page = 1; load(true); });
    });

    function syncUrl() {
      var u = new URL(location.href);
      st.page > 1 ? u.searchParams.set('page', st.page) : u.searchParams.delete('page');
      st.filter ? u.searchParams.set('cat', st.filter) : u.searchParams.delete('cat');
      history.replaceState(null, '', u);
    }

    function load(fromUser) {
      root.querySelectorAll('.bd-chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === st.filter)); });
      listEl.innerHTML = stateHtml('불러오는 중입니다.', '', true);
      pagesEl.innerHTML = '';
      var opt = { page: st.page };
      if (st.filter === '!imp') opt.important = true; else if (st.filter) opt.category = st.filter;
      list(board, opt).then(function (r) {
        var total = r.total || 0;
        if (totalEl) totalEl.textContent = '총 ' + total + '건';
        if (!r.data.length) { listEl.innerHTML = stateHtml('등록된 글이 없습니다.'); return; }
        var start = total - (st.page - 1) * PER;
        listEl.innerHTML =
          '<table class="bd-table"><caption class="sr-only">' + esc(cfg.name) + ' 목록</caption>' +
          '<thead><tr><th scope="col" class="c-num">번호</th><th scope="col">제목</th><th scope="col" class="c-date">날짜</th></tr></thead><tbody>' +
          r.data.map(function (p, i) {
            var href = './' + cfg.view + '?id=' + p.id;
            var files = (p.attachments || []).length;
            return '<tr' + (p.is_important ? ' class="is-imp"' : '') + '>' +
              '<td class="c-num">' + (p.is_important ? '중요' : (start - i)) + '</td>' +
              '<td><div class="bd-title">' + badges(p) + '<a href="' + href + '">' + esc(p.title) + '</a>' +
                (files ? '<span class="bd-clip" title="첨부 ' + files + '개"><span aria-hidden="true">📎</span><span class="sr-only">첨부 ' + files + '개</span></span>' : '') +
              '</div></td>' +
              '<td class="c-date"><time datetime="' + esc(p.created_at) + '" title="' + fmtFull(p.created_at) + '">' + fmtShort(p.created_at) + '</time></td></tr>';
          }).join('') + '</tbody></table>';
        renderPages(Math.ceil(total / PER));
        if (fromUser) syncUrl();
      }).catch(function (e) {
        listEl.innerHTML = stateHtml('목록을 불러오지 못했습니다.', esc(e.message) + ' <a href="#" data-retry>다시 시도</a>');
        var a = listEl.querySelector('[data-retry]');
        if (a) a.addEventListener('click', function (ev) { ev.preventDefault(); load(); });
      });
    }

    function renderPages(n) {
      if (n <= 1) return;
      function btn(label, page, opts) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bd-pg'; b.textContent = label;
        if (opts.current) b.setAttribute('aria-current', 'page');
        if (opts.aria) b.setAttribute('aria-label', opts.aria);
        b.disabled = !!opts.disabled;
        if (!opts.disabled && !opts.current) b.addEventListener('click', function () { st.page = page; load(true); window.scrollTo({ top: 0 }); });
        pagesEl.appendChild(b);
      }
      btn('‹ 이전', st.page - 1, { disabled: st.page === 1, aria: '이전 쪽' });
      var s = Math.max(1, Math.min(st.page - 2, n - 4)), e = Math.min(n, s + 4);
      for (var p = s; p <= e; p++) btn(String(p), p, { current: p === st.page, aria: p + '쪽' });
      btn('다음 ›', st.page + 1, { disabled: st.page === n, aria: '다음 쪽' });
    }

    load(false);
  }

  /* ── 상세 화면 ── */
  function mountView(board, root) {
    var cfg = BOARDS[board];
    var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    var hero = document.querySelector('.page-hero');
    var h1 = hero && hero.querySelector('h1'), crumb = document.getElementById('bd-crumb'), meta = hero && hero.querySelector('.bd-meta');

    if (!(id > 0)) { location.replace('./' + cfg.list); return; }
    root.innerHTML = '<div class="bd-card">' + stateHtml('불러오는 중입니다.', '', true) + '</div>';

    getPost(id).then(function (p) {
      if (!p || p.board !== board) {
        if (p && BOARDS[p.board]) { location.replace('./' + BOARDS[p.board].view + '?id=' + p.id); return; }
        throw new Error('글을 찾을 수 없습니다. 지워졌거나 주소가 잘못되었습니다.');
      }
      document.title = p.title + ' · ' + cfg.name + ' · 온마당';
      if (h1) h1.textContent = p.title;
      if (crumb) crumb.textContent = p.title;
      if (meta) meta.innerHTML = badges(p) +
        '<span>작성일 <time datetime="' + esc(p.created_at) + '">' + fmtFull(p.created_at) + '</time></span>' +
        (p.updated_at && fmtFull(p.updated_at) !== fmtFull(p.created_at) ? '<span>수정일 ' + fmtFull(p.updated_at) + '</span>' : '');

      var files = p.attachments || [];
      var filesHtml = files.length ? '<section class="bd-files" aria-labelledby="bd-files-h"><h2 id="bd-files-h">첨부 ' + files.length + '개</h2><ul>' +
        files.map(function (f) {
          var link = !!f.url;
          return '<li><a class="bd-file" href="' + esc(fileUrl(f)) + '"' + (link ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span class="f-ico" aria-hidden="true">' + fileIcon(f.name, link) + '</span>' +
            '<span class="f-name">' + esc(f.name) + '</span>' +
            '<span class="f-act">' + (link ? '바로 가기 (새 창)' : '내려받기' + (f.size ? ' · ' + fmtSize(f.size) : '')) + '</span></a></li>';
        }).join('') + '</ul></section>' : '';

      var body = renderMarkdown(p.body);
      root.innerHTML = '<article class="bd-card">' +
        (board === 'resource' ? filesHtml : '') +
        '<div class="bd-body">' + (body || (imagesHtml(files) ? '' : '<p class="bd-empty-body">본문이 없습니다.</p>')) + imagesHtml(files) + '</div>' +
        (board === 'resource' ? '' : filesHtml) +
        (p.author ? '<p class="bd-by">등록 ' + esc(p.author) + '</p>' : '') +
        '<nav class="bd-adj" aria-label="다른 글"><div class="adj prev"></div><a class="btn-pill" href="./' + cfg.list + '">목록으로</a><div class="adj next"></div></nav>' +
        '</article>';

      adjacent(p).then(function (a) {
        if (a.older) root.querySelector('.adj.prev').innerHTML = '<span>이전 글</span><a href="./' + cfg.view + '?id=' + a.older.id + '">' + esc(a.older.title) + '</a>';
        if (a.newer) root.querySelector('.adj.next').innerHTML = '<span>다음 글</span><a href="./' + cfg.view + '?id=' + a.newer.id + '">' + esc(a.newer.title) + '</a>';
      });
    }).catch(function (e) {
      if (h1) h1.textContent = cfg.name;
      if (crumb) crumb.textContent = '글을 찾을 수 없음';
      root.innerHTML = '<div class="bd-card">' + stateHtml(e.message, '<a href="./' + cfg.list + '">목록으로 돌아가기</a>') + '</div>';
    });
  }

  /* ── 홈·첫 화면용 최근 글 ── */
  function latest(board, n) {
    return list(board, { per: n || 5, pinFirst: false }).then(function (r) { return r.data; });
  }

  window.OM_BOARD = {
    BOARDS: BOARDS, SB_URL: SB_URL, SB_KEY: SB_KEY, BUCKET: BUCKET,
    list: list, getPost: getPost, latest: latest, fileUrl: fileUrl, renderMarkdown: renderMarkdown,
    isImage: isImage, imagesHtml: imagesHtml,
    esc: esc, fmtShort: fmtShort, fmtFull: fmtFull, fmtSize: fmtSize,
    mountList: mountList, mountView: mountView
  };

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.querySelector('[data-board-list]');
    if (el) mountList(el.getAttribute('data-board-list'), el);
    var v = document.querySelector('[data-board-view]');
    if (v) mountView(v.getAttribute('data-board-view'), v);
  });
})();
