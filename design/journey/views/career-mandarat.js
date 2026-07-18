/* ============================================================
   views/career-mandarat.js — #/career/mandarat
   8항목 만다라트 (자율/동아리/봉사/진로/체험/탐구/독서/기타)
   학년 3장 탭, 모바일=바텀시트 편집, 데스크톱=그리드 직접 입력
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

const GRADES = [1, 2, 3];
const GRADE_KEYS = { 1: 'grade1', 2: 'grade2', 3: 'grade3' };

/* 만다라트 9-칸 배치:
   (0,0) autonomy  (0,1) club       (0,2) volunteer
   (1,0) career    (1,1) 중심(활동) (1,2) careerExp
   (2,0) inquiry   (2,1) reading    (2,2) etc
*/
const LAYOUT = [
  ['autonomy', 'club', 'volunteer'],
  ['career',   null,   'careerExp'],
  ['inquiry',  'reading','etc'],
];

function cellsAsMap(cellsData) {
  const map = {};
  Object.entries(cellsData || {}).forEach(([k, v]) => {
    map[k] = Array.isArray(v) ? v.filter(x => x && String(x).trim()) : (v ? [v] : []);
  });
  return map;
}

function cellPreview(items) {
  if (!items || !items.length) return '<span class="j-empty-note">(비어 있음 — 눌러 편집)</span>';
  return items.map(esc).join(' · ');
}

function renderGrid(grade, cellsData, cellsMeta, opt = {}) {
  const { readonly = false, center = null } = opt;
  return `
    <div class="j-mandala ${readonly ? 'is-readonly' : ''}" data-grade="${grade}">
      ${LAYOUT.map(row => row.map(cellId => {
        if (cellId == null) {
          return `<div class="j-mandala-cell is-center">
            <div class="j-mandala-title">${grade}학년<br>창의적 체험활동</div>
            <div class="j-mandala-center-note">${esc(center || '중앙: 학년별 주제')}</div>
          </div>`;
        }
        const meta = cellsMeta.find(c => c.id === cellId) || { name: cellId, desc: '' };
        const items = cellsData[cellId] || [];
        return `
          <button type="button" class="j-mandala-cell" data-cell="${cellId}" ${readonly ? 'disabled' : ''}>
            <div class="j-mandala-title">${esc(meta.name)}</div>
            <div class="j-mandala-items">${cellPreview(items)}</div>
          </button>`;
      }).join('')).join('')}
    </div>`;
}

export async function render(view, ctx) {
  const src = await ctx.data('mandarat');
  const s4 = ctx.store.get('step4.mandarat') || {};
  const example = src.examplePreset || {};

  const activeGrade = { current: 1 };

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>만다라트로 창의적 체험활동 설계</h1>
        <p>중앙에 학년별 목표, 주변 8칸에 자율·동아리·봉사·진로·체험·탐구·독서·기타 활동 아이디어를 채워보세요. 학년 1개에서 4칸 이상 채우면 완료로 표시됩니다.</p>
      </header>

      <section class="j-card">
        <h2>학년 선택</h2>
        <nav class="j-tabs" role="tablist" aria-label="학년">
          ${GRADES.map((g, i) => `<button role="tab" class="j-tab ${i === 0 ? 'is-on' : ''}" data-grade="${g}" aria-selected="${i === 0 ? 'true' : 'false'}">${g}학년</button>`).join('')}
        </nav>
        <div id="grid-region"></div>
      </section>

      <section class="j-card j-example">
        <h2>참고: ${esc(example.career || '')} 예시 <small>(읽기 전용)</small></h2>
        <details class="j-details">
          <summary>예시 그리드 보기</summary>
          ${renderGrid(example.grade || 1, cellsAsMap(example.cells), src.cells, { readonly: true, center: example.career + ' 진로' })}
        </details>
      </section>

      <section class="j-card j-eval">
        <h2>평가요소 안내 <small>(${esc(src.evaluationFactors?.source || '')})</small></h2>
        <ul class="j-list">
          ${(src.evaluationFactors?.factors || []).map(f => `<li><b>${esc(f.name)}</b> — ${esc(f.desc)}<br><small>${(f.sub || []).map(esc).join(' · ')}</small></li>`).join('')}
        </ul>
      </section>

      <div class="j-sheet" id="cell-sheet" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="j-sheet-backdrop"></div>
        <div class="j-sheet-panel">
          <header class="j-sheet-head">
            <b id="sheet-title">항목 편집</b>
            <button class="j-sheet-close" aria-label="닫기">✕</button>
          </header>
          <p class="j-sheet-desc" id="sheet-desc"></p>
          <div class="j-sheet-body" id="sheet-body"></div>
          <footer class="j-sheet-foot">
            <button class="j-btn" id="sheet-add">+ 항목 추가</button>
            <button class="j-btn j-btn-primary" id="sheet-save">저장</button>
          </footer>
        </div>
      </div>

      <nav class="j-nav">
        <a href="#/career/majors" class="j-btn">← 학과 탐색</a>
        <a href="#/career/roadmap" class="j-btn j-btn-primary">다음: 진로 로드맵 →</a>
      </nav>
    </article>
  `;

  const gridRegion = view.querySelector('#grid-region');

  const paint = () => {
    const gk = GRADE_KEYS[activeGrade.current];
    const cells = cellsAsMap((s4[gk] && s4[gk].cells) || {});
    gridRegion.innerHTML = renderGrid(activeGrade.current, cells, src.cells);
  };
  paint();

  view.querySelectorAll('.j-tabs .j-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      view.querySelectorAll('.j-tabs .j-tab').forEach(b => { b.classList.remove('is-on'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-selected', 'true');
      activeGrade.current = Number(btn.dataset.grade);
      Object.assign(s4, ctx.store.get('step4.mandarat') || {});
      paint();
    });
  });

  const sheet = view.querySelector('#cell-sheet');
  const sheetTitle = view.querySelector('#sheet-title');
  const sheetDesc = view.querySelector('#sheet-desc');
  const sheetBody = view.querySelector('#sheet-body');
  const sheetAdd = view.querySelector('#sheet-add');
  const sheetSave = view.querySelector('#sheet-save');
  const sheetClose = view.querySelector('.j-sheet-close');

  let editingCellId = null;

  const openSheet = (cellId) => {
    editingCellId = cellId;
    const meta = src.cells.find(c => c.id === cellId);
    if (!meta) return;
    const gk = GRADE_KEYS[activeGrade.current];
    const current = (s4[gk]?.cells?.[cellId]) || [];
    sheetTitle.textContent = `${activeGrade.current}학년 · ${meta.name}`;
    sheetDesc.textContent = meta.desc || '';
    sheetBody.innerHTML = '';
    (current.length ? current : ['']).forEach(v => appendRow(v));
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeSheet = () => {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const appendRow = (v = '') => {
    const row = document.createElement('div');
    row.className = 'j-sheet-row';
    row.innerHTML = `<input type="text" value="${esc(v)}" placeholder="세부 목표"><button type="button" class="j-mini-del" aria-label="삭제">✕</button>`;
    row.querySelector('.j-mini-del').addEventListener('click', () => row.remove());
    sheetBody.appendChild(row);
    row.querySelector('input').focus();
  };
  sheetAdd.addEventListener('click', () => appendRow(''));
  sheetSave.addEventListener('click', () => {
    if (!editingCellId) return;
    const values = [...sheetBody.querySelectorAll('input')]
      .map(i => i.value.trim())
      .filter(Boolean);
    const gk = GRADE_KEYS[activeGrade.current];
    const nextCells = { ...(ctx.store.get(`step4.mandarat.${gk}.cells`) || {}), [editingCellId]: values };
    ctx.store.save({ step4: { mandarat: { [gk]: { cells: nextCells } } } });
    Object.assign(s4, ctx.store.get('step4.mandarat') || {});
    paint();
    closeSheet();
  });
  sheetClose.addEventListener('click', closeSheet);
  view.querySelector('.j-sheet-backdrop').addEventListener('click', closeSheet);

  gridRegion.addEventListener('click', (e) => {
    const cell = e.target.closest('.j-mandala-cell[data-cell]');
    if (!cell) return;
    openSheet(cell.dataset.cell);
  });
}
