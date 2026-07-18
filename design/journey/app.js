/* ============================================================
   journey/app.js — 해시 라우터 + 뷰 lazy 로더 + data 캐시
   ============================================================ */

import * as store from './store.js';

/* ── 라우트 ↔ 뷰 매핑 ────────────────────────────────── */

const ROUTES = {
  '/': 'dashboard',
  '/self/prologue': 'self-prologue',
  '/self/tests': 'self-tests',
  '/self/jobs': 'self-jobs',
  '/self/summary': 'self-summary',
  '/curriculum/structure': 'curr-structure',
  '/curriculum/grading': 'curr-grading',
  '/curriculum/hierarchy': 'curr-hierarchy',
  '/career/majors': 'career-majors',
  '/career/mandarat': 'career-mandarat',
  '/career/roadmap': 'career-roadmap',
  '/report/courses': 'report-courses',
  '/report/check': 'report-check',
  '/report/print': 'report-print',
};

const BREADCRUMB = {
  '/': ['진로·학업 설계'],
  '/self/prologue': ['1. 자기 이해', '프롤로그'],
  '/self/tests': ['1. 자기 이해', '흥미·적성·가치관 검사'],
  '/self/jobs': ['1. 자기 이해', '내 직업 미리 봄'],
  '/self/summary': ['1. 자기 이해', '종합 점검'],
  '/curriculum/structure': ['2. 교육과정 이해', '교과 편제'],
  '/curriculum/grading': ['2. 교육과정 이해', '성적 산출'],
  '/curriculum/hierarchy': ['2. 교육과정 이해', '과목 위계'],
  '/career/majors': ['3. 진로설계 활동', '학과 탐색'],
  '/career/mandarat': ['3. 진로설계 활동', '만다라트'],
  '/career/roadmap': ['3. 진로설계 활동', '진로 로드맵'],
  '/report/courses': ['5. 종합 보고서', '수강 이력카드'],
  '/report/check': ['5. 종합 보고서', '체크리스트·조언'],
  '/report/print': ['5. 종합 보고서', '보고서 인쇄'],
};

/* ── data() 캐시 헬퍼 (상대경로 ../data/) ─────────────── */

const dataCache = new Map();
async function data(name) {
  if (dataCache.has(name)) return dataCache.get(name);
  const url = `../data/${name}.json`;
  const p = fetch(url).then(res => {
    if (!res.ok) throw new Error(`데이터 로드 실패: ${name} (${res.status})`);
    return res.json();
  }).catch(err => { dataCache.delete(name); throw err; });
  dataCache.set(name, p);
  return p;
}

/* ── 상단 "내 설계서" 바 렌더 ─────────────────────────── */

function fmtRel(iso) {
  if (!iso) return '아직 저장한 파일이 없습니다';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '알 수 없음';
  const diff = Date.now() - t;
  if (diff < 60000) return '방금 전 저장';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전 저장`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전 저장`;
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

function updateSaveBar() {
  const el = document.getElementById('save-time');
  if (el) el.textContent = fmtRel(store.get('lastFileSavedAt'));
}

/* ── 진행률 (헤더 바 밑 프로그레스) ─────────────────── */

function updateHeaderProgress() {
  const el = document.getElementById('journey-progress');
  if (!el) return;
  const p = store.progress();
  const total = p.step1.total + p.step2.total + p.step3.total + p.step4.total + p.step5.total;
  const done = p.step1.done + p.step2.done + p.step3.done + p.step4.done + p.step5.done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  el.style.width = pct + '%';
  el.setAttribute('aria-valuenow', String(pct));
}

/* ── breadcrumb 갱신 ─────────────────────────────────── */

function updateBreadcrumb(path) {
  const el = document.getElementById('journey-crumbs');
  if (!el) return;
  const parts = BREADCRUMB[path] || ['진로·학업 설계'];
  const html = ['<a href="../">진로·학업 설계</a>']
    .concat(parts.slice(path === '/' ? 1 : 0).map(t => `<span> › ${t}</span>`))
    .join('');
  el.innerHTML = html;
}

/* ── 라우터 ──────────────────────────────────────────── */

function parseHash() {
  const raw = (globalThis.location.hash || '#/').replace(/^#/, '');
  return raw || '/';
}

async function render(path) {
  const view = document.getElementById('view');
  if (!view) return;
  const name = ROUTES[path];

  if (!name) {
    globalThis.location.hash = '#/';
    return;
  }

  view.setAttribute('aria-busy', 'true');
  updateBreadcrumb(path);

  let mod;
  try {
    mod = await import(`./views/${name}.js`);
  } catch (e) {
    view.innerHTML = `
      <section class="j-empty">
        <h2>준비 중</h2>
        <p>이 화면은 아직 개발 중입니다. 대시보드로 돌아가 다른 활동을 진행해 주세요.</p>
        <p><a class="j-btn" href="#/">대시보드로 이동</a></p>
      </section>`;
    view.setAttribute('aria-busy', 'false');
    updateHeaderProgress();
    updateSaveBar();
    return;
  }

  view.innerHTML = '';
  try {
    await mod.render(view, { store, data, navigate, progress: store.progress });
  } catch (e) {
    view.innerHTML = `<section class="j-empty"><h2>화면을 그리지 못했습니다</h2><p>${escapeHtml(e.message)}</p></section>`;
  }
  view.setAttribute('aria-busy', 'false');
  view.focus?.();
  updateHeaderProgress();
  updateSaveBar();
  globalThis.scrollTo?.({ top: 0, behavior: 'instant' });
}

function navigate(path) {
  const clean = path.startsWith('#') ? path : ('#' + (path.startsWith('/') ? path : '/' + path));
  if (globalThis.location.hash === clean) render(parseHash());
  else globalThis.location.hash = clean;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── 파일 저장/열기 UI 바인딩 ────────────────────────── */

function bindSaveBar() {
  const saveBtn = document.getElementById('btn-save-file');
  const openBtn = document.getElementById('btn-open-file');
  const openInput = document.getElementById('open-file-input');
  const wipeBtn = document.getElementById('btn-wipe');
  const dropzone = document.getElementById('dropzone');
  const status = document.getElementById('save-status');

  const flash = (msg, ok = true) => {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle('is-error', !ok);
    status.classList.add('is-visible');
    clearTimeout(flash._t);
    flash._t = setTimeout(() => status.classList.remove('is-visible'), 2500);
  };

  saveBtn?.addEventListener('click', () => {
    store.exportFile();
    updateSaveBar();
    flash('파일로 저장했습니다');
  });

  openBtn?.addEventListener('click', () => openInput?.click());
  openInput?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await store.openFile(f);
      flash(res.kind === 'selector' ? 'selector 시뮬레이션을 4단계로 가져왔습니다' : '설계서를 불러왔습니다');
      updateSaveBar();
      updateHeaderProgress();
      render(parseHash());
    } catch (err) {
      flash(err.message || '파일을 읽지 못했습니다', false);
    }
    e.target.value = '';
  });

  wipeBtn?.addEventListener('click', () => {
    if (!confirm('현재 기록을 모두 지우고 새로 시작합니다. 계속할까요?')) return;
    if (!confirm('다시 한 번 확인합니다. 정말 지울까요? (되돌릴 수 없습니다)')) return;
    store.wipe();
    updateSaveBar();
    updateHeaderProgress();
    render('/');
  });

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(t => dropzone.addEventListener(t, e => {
      e.preventDefault(); e.stopPropagation(); dropzone.classList.add('is-hover');
    }));
    ['dragleave', 'drop'].forEach(t => dropzone.addEventListener(t, e => {
      e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('is-hover');
    }));
    dropzone.addEventListener('drop', async (e) => {
      const f = [...(e.dataTransfer?.files || [])].find(x => x.name.endsWith('.json'));
      if (!f) return flash('.json 파일만 지원합니다', false);
      try {
        const res = await store.openFile(f);
        flash(res.kind === 'selector' ? 'selector 시뮬레이션을 4단계로 가져왔습니다' : '설계서를 불러왔습니다');
        updateSaveBar();
        updateHeaderProgress();
        render(parseHash());
      } catch (err) {
        flash(err.message || '파일을 읽지 못했습니다', false);
      }
    });
  }
}

/* ── 부팅 ────────────────────────────────────────────── */

function boot() {
  store.load();
  bindSaveBar();
  updateSaveBar();
  updateHeaderProgress();

  window.addEventListener('hashchange', () => render(parseHash()));
  window.addEventListener('jinro:change', () => {
    updateSaveBar();
    updateHeaderProgress();
  });

  render(parseHash());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
