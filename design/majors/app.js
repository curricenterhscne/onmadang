/* =============================================================
   2022 개정 교육과정 계열별 학과 안내 — app.js
   Design: Soft Pastel Studio (Direction A)
   ============================================================= */

// ──────────────────────────────────────────────────────────────
// CONFIG  ·  카테고리 메타데이터
//   - id        : manifest.json 의 category id 와 매칭
//   - name      : UI 표시 이름
//   - sub       : 영문 보조 라벨 (DM Mono 한 줄)
//   - icon      : <symbol id="i-..."> 의 suffix (예: 'book')
//   - cssVar    : CSS 변수 prefix (--{cssVar}-tint / -mid / -ink)
// ──────────────────────────────────────────────────────────────
const CAT_META = {
  humanities:  { name: '인문학',     sub: 'Humanities',    icon: 'book',    cssVar: 'humanities' },
  social:      { name: '사회',       sub: 'Social Sci.',   icon: 'people',  cssVar: 'social' },
  business:    { name: '경상',       sub: 'Business',      icon: 'chart',   cssVar: 'business' },
  education:   { name: '사범',       sub: 'Education',     icon: 'cap',     cssVar: 'education' },
  natural:     { name: '자연과학',   sub: 'Natural Sci.',  icon: 'flask',   cssVar: 'natural' },
  engineering: { name: '공학',       sub: 'Engineering',   icon: 'gear',    cssVar: 'engineering' },
  agriculture: { name: '농생명과학', sub: 'Agri-Bio',      icon: 'leaf',    cssVar: 'agriculture' },
  arts:        { name: '예체능',     sub: 'Arts & PE',     icon: 'palette', cssVar: 'arts' },
  future:      { name: '융합미래',   sub: 'Future·Conv.',  icon: 'spark',   cssVar: 'future' },
  medical:     { name: '의료보건',   sub: 'Medical',       icon: 'heart',   cssVar: 'medical' },
};

const BASE_URL = './';

const QUICK_KEYWORDS = ['인공지능', '심리학', '간호학', '디자인', '데이터'];

// ──────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────
let manifest = null;
let allDepts = [];             // { ...dept, categoryId, categoryName, color }
let loadedCats = new Set();
let pendingCats = new Set();

let mode = 'keyword';          // 'keyword' | 'subject'
let activeCat = 'all';         // category filter
let searchQuery = '';
let selectedSubjects = new Set();
let autoSelectedSubjects = new Set();
let browseMode = false;        // true when filtering/searching → hide hero/landing

// ──────────────────────────────────────────────────────────────
// DOM HELPERS
// ──────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const cssVar = (catId, kind = 'mid') => `var(--${CAT_META[catId].cssVar}-${kind})`;

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function iconSvg(name, size = 24) {
  return `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// ──────────────────────────────────────────────────────────────
// FETCH
// ──────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

async function loadManifest() {
  manifest = await fetchJSON(BASE_URL + 'manifest.json');
  buildFilterChips();
  buildCategoryGrid();
  buildHeroIllust();
  buildQuickChips();
}

async function loadCategory(catId) {
  if (loadedCats.has(catId) || pendingCats.has(catId)) return;
  pendingCats.add(catId);
  showLoading(true);
  try {
    const meta = manifest.categories.find(c => c.id === catId);
    if (!meta) return;
    const data = await fetchJSON(BASE_URL + meta.file);
    const m = CAT_META[catId];
    data.departments.forEach(d => {
      allDepts.push({
        ...d,
        categoryId: catId,
        categoryName: m ? m.name : catId,
      });
    });
    loadedCats.add(catId);
    buildSubjectIndex();
    renderSubjectPanel();
    render();
  } catch (e) {
    console.error('Load error', catId, e);
  } finally {
    pendingCats.delete(catId);
    showLoading(pendingCats.size > 0);
  }
}

async function loadAllCategories() {
  if (!manifest) return;
  await Promise.all(manifest.categories.map(c => loadCategory(c.id)));
}

function showLoading(v) {
  $('loading').classList.toggle('visible', v);
}

// ──────────────────────────────────────────────────────────────
// SUBJECT INDEX  (과목 → 학과 역인덱스)
// ──────────────────────────────────────────────────────────────
let subjectIndex = {};

function flattenSubjects(dept) {
  const subjects = new Set();
  if (!dept.subjects) return subjects;
  Object.values(dept.subjects).forEach(g => {
    ['일반선택', '진로선택', '융합선택'].forEach(k => {
      (g[k] || []).forEach(s => subjects.add(s));
    });
  });
  return subjects;
}

function buildSubjectIndex() {
  subjectIndex = {};
  allDepts.forEach(d => {
    flattenSubjects(d).forEach(subj => {
      if (!subjectIndex[subj]) subjectIndex[subj] = new Set();
      subjectIndex[subj].add(d.id);
    });
  });
}

function getSubjectsByGroup() {
  const groups = {};
  allDepts.forEach(d => {
    if (!d.subjects) return;
    Object.entries(d.subjects).forEach(([area, types]) => {
      if (!groups[area]) groups[area] = {};
      ['일반선택', '진로선택', '융합선택'].forEach(k => {
        if (!groups[area][k]) groups[area][k] = new Set();
        (types[k] || []).forEach(s => groups[area][k].add(s));
      });
    });
  });
  return groups;
}

// ──────────────────────────────────────────────────────────────
// HERO ILLUST  (랜덤 4 calc cards floating)
// ──────────────────────────────────────────────────────────────
function buildHeroIllust() {
  // 토꾸미 img는 index.html 에 정적으로 삽입 — JS 캐시 영향 없음
}

// ──────────────────────────────────────────────────────────────
// QUICK CHIPS
// ──────────────────────────────────────────────────────────────
function buildQuickChips() {
  const wrap = $('quickChips');
  QUICK_KEYWORDS.forEach(k => {
    const b = document.createElement('button');
    b.className = 'quick-chip';
    b.textContent = k;
    b.addEventListener('click', () => {
      $('searchInput').value = k;
      $('searchInput').dispatchEvent(new Event('input'));
      $('searchInput').focus();
    });
    wrap.appendChild(b);
  });
}

// ──────────────────────────────────────────────────────────────
// FILTER CHIPS
// ──────────────────────────────────────────────────────────────
function buildFilterChips() {
  const bar = $('filterBar');
  manifest.categories.forEach(c => {
    const m = CAT_META[c.id];
    if (!m) return;
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.cat = c.id;
    btn.style.setProperty('--c-dot', cssVar(c.id, 'mid'));
    btn.innerHTML = `<span class="chip-dot"></span>${m.name}`;
    btn.addEventListener('click', () => selectCat(c.id));
    bar.appendChild(btn);
  });
  $('filterBar').querySelector('.chip-all').addEventListener('click', () => selectCat('all'));
}

function selectCat(catId) {
  activeCat = catId;
  // entering browse mode when not 'all' (or when user already typed/selected)
  if (catId !== 'all') browseMode = true;

  document.querySelectorAll('.chip').forEach(c => {
    const isActive = c.dataset.cat === catId;
    c.classList.toggle('active', isActive);
  });

  if (catId === 'all') {
    loadAllCategories();
  } else {
    loadCategory(catId);
  }
  applyMode();
  render();
}

// ──────────────────────────────────────────────────────────────
// CATEGORY GRID (landing)
// ──────────────────────────────────────────────────────────────
function buildCategoryGrid() {
  const wrap = $('categoryGrid');
  // pre-count departments per category from manifest if provided, else 0
  manifest.categories.forEach(c => {
    const m = CAT_META[c.id];
    if (!m) return;
    const count = c.count ?? '—';
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.setProperty('--cc-mid', cssVar(c.id, 'mid'));
    card.style.setProperty('--cc-ink', cssVar(c.id, 'ink'));
    card.style.setProperty('background', cssVar(c.id, 'tint'));
    card.style.setProperty('--cc-mid-shadow', cssVar(c.id, 'mid') + '55');
    card.innerHTML = `
      <div class="icn-wrap" style="color: var(--${m.cssVar}-ink)">
        ${iconSvg(m.icon, 30)}
      </div>
      <div>
        <div class="nm">${m.name}</div>
        <div class="sub">${m.sub} · ${count}개 학과</div>
      </div>
    `;
    card.addEventListener('click', () => selectCat(c.id));
    wrap.appendChild(card);
  });
}

// ──────────────────────────────────────────────────────────────
// SUBJECT PANEL
// ──────────────────────────────────────────────────────────────
function renderSubjectPanel() {
  const panel = $('subjectPanel');
  const container = $('subjectGroups');

  if (mode !== 'subject') {
    panel.classList.remove('visible');
    return;
  }
  panel.classList.add('visible');

  const groups = getSubjectsByGroup();
  const AREA_ORDER = ['국어','수학','영어','사회','과학','기술·가정/정보','예술','체육','제2외국어/한문','교양'];

  container.innerHTML = '';
  AREA_ORDER.forEach(area => {
    const g = groups[area];
    if (!g) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'subject-group';
    groupEl.innerHTML = `<div class="subject-group-name">${area}</div>`;

    const allSubjs = new Set();
    Object.values(g).forEach(s => s.forEach(x => allSubjs.add(x)));

    const listEl = document.createElement('div');
    listEl.className = 'subject-list';

    [...allSubjs].sort().forEach(subj => {
      const chip = document.createElement('button');
      chip.className = 'subject-chip' + (selectedSubjects.has(subj) ? ' selected' : '');
      chip.textContent = subj;
      chip.addEventListener('click', () => {
        if (selectedSubjects.has(subj)) selectedSubjects.delete(subj);
        else selectedSubjects.add(subj);
        renderSubjectPanel();
        render();
      });
      listEl.appendChild(chip);
    });

    groupEl.appendChild(listEl);
    container.appendChild(groupEl);
  });
}

// ──────────────────────────────────────────────────────────────
// SEARCH & FILTER
// ──────────────────────────────────────────────────────────────
function searchKeyword(q) {
  if (!q) return allDepts;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return allDepts.filter(d => {
    const haystack = [
      d.name, d.desc, d.mainCourses, d.basicCourses,
      ...(d.careers || []), ...(d.licenses || []),
      ...(d.similarDepts || [])
    ].join(' ').toLowerCase();
    return terms.every(t => haystack.includes(t));
  });
}

function searchBySubjects(selected) {
  if (!selected.size) return allDepts;
  const scored = allDepts.map(d => {
    const dSubjs = flattenSubjects(d);
    const matches = [...selected].filter(s => dSubjs.has(s));
    return { dept: d, matches, score: matches.length };
  }).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.map(x => ({ ...x.dept, _matches: x.matches, _score: x.score }));
}

function getFiltered() {
  let results;
  if (mode === 'subject') {
    results = searchBySubjects(selectedSubjects);
  } else {
    results = searchKeyword(searchQuery);
  }
  if (activeCat !== 'all') {
    results = results.filter(d => d.categoryId === activeCat);
  }
  return results;
}

// ──────────────────────────────────────────────────────────────
// HIGHLIGHT
// ──────────────────────────────────────────────────────────────
function highlight(text, query) {
  if (!query) return escHtml(text);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = escHtml(text);
  terms.forEach(t => {
    const re = new RegExp(escRe(escHtml(t)), 'gi');
    result = result.replace(re, m => `<mark>${m}</mark>`);
  });
  return result;
}

// ──────────────────────────────────────────────────────────────
// APPLY MODE  (browse vs landing class toggling)
// ──────────────────────────────────────────────────────────────
function applyMode() {
  const app = $('app');
  app.classList.toggle('browse-mode', browseMode && mode === 'keyword');
  app.classList.toggle('subject-mode', mode === 'subject');
}

// ──────────────────────────────────────────────────────────────
// RENDER CARDS
// ──────────────────────────────────────────────────────────────
function render() {
  const grid = $('cardsGrid');
  const statsCount = $('statsCount');
  const statsMode = $('statsMode');

  const results = getFiltered();
  statsCount.textContent = `${results.length}개 학과`;
  statsMode.textContent =
    mode === 'subject' && selectedSubjects.size
      ? `과목 ${selectedSubjects.size}개 선택`
      : searchQuery
      ? `"${searchQuery}" 검색 결과`
      : activeCat !== 'all'
      ? CAT_META[activeCat]?.name + ' 계열'
      : '전체 학과';

  if (results.length === 0) {
    grid.innerHTML = `
      <div class="kk-empty">
        <img src="https://cdn.jsdelivr.net/gh/curricenterhscne/cne-design-system@main/assets/characters/tokkumi.svg"
             alt="토꾸미" class="kk-empty__char">
        <h3 class="kk-empty__title">찾는 학과가 없어요</h3>
        <p class="kk-empty__body">다른 키워드나 계열을 선택해 보세요.<br>행운은 준비된 사람의 것이에요!</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  results.forEach((d, i) => {
    const meta = CAT_META[d.categoryId];
    if (!meta) return;
    const card = document.createElement('div');
    card.className = 'dept-card kk-card kk-card--hover';
    card.style.setProperty('--cc-tint', `var(--${meta.cssVar}-tint)`);
    card.style.setProperty('--cc-ink',  `var(--${meta.cssVar}-ink)`);
    card.style.animationDelay = `${Math.min(i * 22, 260)}ms`;

    const careers = (d.careers || []).slice(0, 3);
    const matchBadge = d._score
      ? `<span class="dept-match kk-badge kk-badge--recommend">${iconSvg('star', 11)} ${d._score}개 매칭</span>`
      : '';

    const matchTags = d._matches
      ? d._matches.slice(0, 2).map(m => `<span class="tag match kk-badge kk-badge--recommend">${escHtml(m)}</span>`).join('')
      : '';

    const hl = (text) =>
      mode === 'keyword' && searchQuery
        ? highlight(text, searchQuery)
        : escHtml(text);

    card.innerHTML = `
      <div class="dept-card-head">
        <div class="dept-icon">${iconSvg(meta.icon, 24)}</div>
        <div class="dept-meta">
          <span class="dept-cat-pill kk-badge">${escHtml(meta.name)}</span>
          <div class="dept-name">${hl(d.name)}</div>
          ${matchBadge}
        </div>
      </div>
      <div class="dept-desc">${hl(d.desc)}</div>
      <div class="dept-tags">
        ${matchTags}
        ${careers.map(c => `<span class="tag">${escHtml(c)}</span>`).join('')}
        ${(d.careers || []).length > 3 ? `<span class="tag">+${(d.careers || []).length - 3}</span>` : ''}
      </div>
      <div class="dept-footer">
        <span>유사학과 ${(d.similarDepts || []).length}</span>
        ${(d.licenses || []).length ? `<span class="sep">·</span><span>자격증 ${(d.licenses || []).length}</span>` : ''}
        <span class="arr">${iconSvg('arrow', 14)}</span>
      </div>`;

    card.addEventListener('click', () => openModal(d));
    grid.appendChild(card);
  });
}

// ──────────────────────────────────────────────────────────────
// MODAL
// ──────────────────────────────────────────────────────────────
// selector bridge URL 생성
// want = 일반선택+융합선택 (권장), core = 진로선택 (핵심)
function buildSelectorUrl(d) {
  const want = [], core = [];
  if (d.subjects) {
    Object.values(d.subjects).forEach(g => {
      (g['일반선택'] || []).forEach(s => want.push(s));
      (g['융합선택'] || []).forEach(s => want.push(s));
      (g['진로선택'] || []).forEach(s => core.push(s));
    });
  }
  const p = new URLSearchParams();
  if (want.length) p.set('want', want.join(','));
  if (core.length) p.set('core', core.join(','));
  p.set('from', 'majors');
  p.set('majorId', d.name);
  return `../selector/?${p.toString()}`;
}

function openModal(d) {
  const meta = CAT_META[d.categoryId];
  if (!meta) return;
  const overlay = $('modalOverlay');
  overlay.classList.remove('hidden');

  const modal = $('modal');
  modal.style.setProperty('--cc-tint', `var(--${meta.cssVar}-tint)`);
  modal.style.setProperty('--cc-ink',  `var(--${meta.cssVar}-ink)`);

  $('modalIcon').innerHTML = iconSvg(meta.icon, 28);
  $('modalIcon').style.background = `var(--${meta.cssVar}-tint)`;
  $('modalIcon').style.color = `var(--${meta.cssVar}-ink)`;
  $('modalCategory').textContent = meta.name + ' 계열';
  $('modalCategory').style.background = `var(--${meta.cssVar}-tint)`;
  $('modalCategory').style.color = `var(--${meta.cssVar}-ink)`;
  $('modalTitle').textContent = d.name;

  const body = $('modalBody');
  const highlightedSubjects = d._matches ? new Set(d._matches) : selectedSubjects;

  // Subjects table
  const AREA_ORDER = ['국어','수학','영어','사회','과학','기술·가정/정보','예술','체육','제2외국어/한문','교양'];
  let subjectRows = '';
  if (d.subjects) {
    AREA_ORDER.forEach(area => {
      const g = d.subjects[area];
      if (!g) return;
      const renderSubjList = (arr, type) => {
        if (!arr || !arr.length) return '<span style="color:var(--ink-4)">—</span>';
        const badgeCls = type === '진로선택' ? 'kk-badge kk-badge--core' : 'kk-badge kk-badge--recommend';
        return arr.map(s => {
          const hi = highlightedSubjects.has(s);
          return `<span class="subject-item ${badgeCls}${hi ? ' highlighted' : ''}">${escHtml(s)}</span>`;
        }).join('');
      };
      subjectRows += `<tr>
        <td class="area-cell">${area}</td>
        <td><div class="subject-item-list">${renderSubjList(g['일반선택'], '일반선택')}</div></td>
        <td><div class="subject-item-list">${renderSubjList(g['진로선택'], '진로선택')}</div></td>
        <td><div class="subject-item-list">${renderSubjList(g['융합선택'], '융합선택')}</div></td>
      </tr>`;
    });
  }

  body.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">학과 소개</div>
      <div class="modal-desc">${escHtml(d.desc)}</div>
    </div>

    ${d.mainCourses ? `
    <div class="modal-section">
      <div class="modal-section-title">주요 과목</div>
      <div class="modal-desc">${escHtml(d.mainCourses)}</div>
    </div>` : ''}

    ${d.basicCourses && d.basicCourses !== '(위 주요 과목 참조)' ? `
    <div class="modal-section">
      <div class="modal-section-title">기초 교양</div>
      <div class="modal-desc">${escHtml(d.basicCourses)}</div>
    </div>` : ''}

    ${(d.careers || []).length ? `
    <div class="modal-section">
      <div class="modal-section-title">졸업 후 진로</div>
      <div class="modal-tags">${d.careers.map(c => `<span class="modal-tag career kk-badge kk-badge--core">${escHtml(c)}</span>`).join('')}</div>
    </div>` : ''}

    ${(d.licenses || []).length ? `
    <div class="modal-section">
      <div class="modal-section-title">관련 자격증·시험</div>
      <div class="modal-tags">${d.licenses.map(l => `<span class="modal-tag license kk-badge kk-badge--neutral">${escHtml(l)}</span>`).join('')}</div>
    </div>` : ''}

    ${(d.similarDepts || []).length ? `
    <div class="modal-section">
      <div class="modal-section-title">유사 학과</div>
      <div class="modal-tags">${d.similarDepts.map(s => `<span class="modal-tag similar kk-badge kk-badge--neutral">${escHtml(s)}</span>`).join('')}</div>
    </div>` : ''}

    ${subjectRows ? `
    <div class="modal-section">
      <div class="modal-section-title">권장 선택 과목 (고등학교)</div>
      <div class="subjects-table-wrap kk-table-wrap">
        <table class="subjects-table kk-table">
          <thead>
            <tr>
              <th>교과</th>
              <th><span class="kk-badge kk-badge--recommend">★</span> 일반선택</th>
              <th><span class="kk-badge kk-badge--core">◆</span> 진로선택</th>
              <th><span class="kk-badge kk-badge--recommend">★</span> 융합선택</th>
            </tr>
          </thead>
          <tbody>${subjectRows}</tbody>
        </table>
      </div>
    </div>
    <div class="modal-section" style="padding-top:var(--space-4);border-top:1px solid var(--color-border);margin-top:var(--space-2);">
      <a href="${buildSelectorUrl(d)}" class="kk-btn kk-btn--accent">
        이 학과 권장 과목으로 과목 선택 실습 →
      </a>
    </div>` : ''}
  `;

  // freeze background scroll
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ──────────────────────────────────────────────────────────────
// EVENT HANDLERS
// ──────────────────────────────────────────────────────────────
$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

$('searchInput').addEventListener('input', e => {
  const val = e.target.value.trim();
  if (mode === 'subject') {
    const q = val.toLowerCase();
    autoSelectedSubjects.forEach(s => selectedSubjects.delete(s));
    autoSelectedSubjects.clear();
    if (q) {
      const matched = Object.keys(subjectIndex).filter(s => s.toLowerCase().includes(q));
      matched.slice(0, 5).forEach(s => {
        selectedSubjects.add(s);
        autoSelectedSubjects.add(s);
      });
    }
    renderSubjectPanel();
    render();
  } else {
    searchQuery = val;
    browseMode = val.length > 0 || activeCat !== 'all';
    if (searchQuery) loadAllCategories();
    applyMode();
    render();
  }
});

document.querySelectorAll('.search-mode button').forEach(btn => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    document.querySelectorAll('.search-mode button').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });

    if (mode === 'subject') {
      $('searchInput').placeholder = '선택과목 이름으로 검색…';
      $('searchInput').value = '';
      autoSelectedSubjects.clear();
      loadAllCategories().then(() => {
        renderSubjectPanel();
        applyMode();
        render();
      });
    } else {
      $('searchInput').placeholder = '학과명, 키워드, 진로, 자격증 검색…';
      $('searchInput').value = '';
      searchQuery = '';
      $('subjectPanel').classList.remove('visible');
      selectedSubjects.clear();
      autoSelectedSubjects.clear();
      browseMode = activeCat !== 'all';
      applyMode();
      render();
    }
  });
});

$('subjectClear').addEventListener('click', () => {
  selectedSubjects.clear();
  autoSelectedSubjects.clear();
  $('searchInput').value = '';
  renderSubjectPanel();
  render();
});

// ──────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────
(async () => {
  showLoading(true);
  try {
    await loadManifest();
    await loadAllCategories();
    applyMode();
    render();
  } catch (e) {
    console.error('Init error', e);
    $('cardsGrid').innerHTML = `
      <div class="empty">
        <div class="empty-icn">${iconSvg('search', 28)}</div>
        <div class="empty-title">데이터를 불러올 수 없습니다</div>
        <div class="empty-sub">manifest.json 과 카테고리별 JSON 파일이 같은 폴더에 있는지 확인해 주세요.<br><small style="font-family:monospace; color:var(--ink-4)">${escHtml(e.message)}</small></div>
      </div>`;
  } finally {
    showLoading(false);
  }
})();
