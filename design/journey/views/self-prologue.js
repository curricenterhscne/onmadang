/* ============================================================
   views/self-prologue.js — #/self/prologue
   자료집 활동 P: 강점 선택 · 문장완성 · 배움서약
   ============================================================ */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function debounce(fn, ms = 220) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export async function render(view, ctx) {
  const src = await ctx.data('strengths');
  const s = ctx.store.get('step1.prologue') || {};
  const selected = new Set(s.strengths || []);
  const sentences = { ...(s.sentences || {}) };
  const pledge = [...(s.pledge || ['', '', ''])];
  const commonWithFriend = s.commonWithFriend || '';

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>프롤로그 · 나에게 물어봄</h1>
        <p>강점과 삶의 키워드를 짚고, 배움서약을 적으며 여정을 시작합니다. 입력은 자동 저장됩니다.</p>
      </header>

      <section class="j-card" aria-labelledby="ph1">
        <h2 id="ph1">1. 나의 강점 <small>(3개 이상 선택)</small></h2>
        <p class="j-hint">${esc(src.instruction || '')}</p>
        <div class="j-chip-grid" id="chip-grid">
          ${src.words.map(w => `
            <button type="button" class="j-chip ${selected.has(w) ? 'is-on' : ''}" data-word="${esc(w)}" aria-pressed="${selected.has(w) ? 'true' : 'false'}">${esc(w)}</button>
          `).join('')}
        </div>
        <p class="j-count"><b id="chip-count">${selected.size}</b>개 선택됨</p>
        <label class="j-field">
          <span>친구와 겹치는 강점 · 공통점</span>
          <input type="text" id="fld-common" value="${esc(commonWithFriend)}" placeholder="예: 성실한, 낙천적인">
        </label>
      </section>

      <section class="j-card" aria-labelledby="ph2">
        <h2 id="ph2">2. 문장 완성</h2>
        <div class="j-fields">
          <label class="j-field">
            <span>나는 (        )할 때 가장 행복해요.</span>
            <input type="text" data-key="happy" value="${esc(sentences.happy || '')}">
          </label>
          <label class="j-field">
            <span>내가 좋아하는 것은 (        )입니다.</span>
            <input type="text" data-key="like" value="${esc(sentences.like || '')}">
          </label>
          <label class="j-field">
            <span>내가 잘 하는 것은 (        )입니다.</span>
            <input type="text" data-key="good" value="${esc(sentences.good || '')}">
          </label>
          <label class="j-field">
            <span>내가 존경하는 인물</span>
            <input type="text" data-key="respectWho" value="${esc(sentences.respectWho || '')}">
          </label>
          <label class="j-field">
            <span>그 이유</span>
            <input type="text" data-key="respectWhy" value="${esc(sentences.respectWhy || '')}">
          </label>
        </div>
      </section>

      <section class="j-card" aria-labelledby="ph3">
        <h2 id="ph3">3. 나의 배움서약</h2>
        <p class="j-hint">${esc(src.pledge?.prompt || '')} <small>예: ${esc(src.pledge?.example || '')}</small></p>
        <div class="j-fields">
          ${[0, 1, 2].map(i => `
            <label class="j-field">
              <span>서약 ${i + 1}</span>
              <input type="text" data-pledge="${i}" value="${esc(pledge[i] || '')}" placeholder="${i === 0 ? '한 줄 이상 채우면 이 단계가 완료로 표시됩니다' : ''}">
            </label>
          `).join('')}
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/" class="j-btn">← 대시보드</a>
        <a href="#/self/tests" class="j-btn j-btn-primary">다음: 검사 결과 기록 →</a>
      </nav>
    </article>
  `;

  const chipGrid = view.querySelector('#chip-grid');
  const chipCount = view.querySelector('#chip-count');
  chipGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.j-chip');
    if (!btn) return;
    const w = btn.dataset.word;
    if (selected.has(w)) selected.delete(w); else selected.add(w);
    btn.classList.toggle('is-on');
    btn.setAttribute('aria-pressed', selected.has(w) ? 'true' : 'false');
    chipCount.textContent = String(selected.size);
    ctx.store.save({ step1: { prologue: { strengths: [...selected] } } });
  });

  const commonField = view.querySelector('#fld-common');
  commonField.addEventListener('input', debounce(() => {
    ctx.store.save({ step1: { prologue: { commonWithFriend: commonField.value } } });
  }));

  view.querySelectorAll('input[data-key]').forEach(inp => {
    inp.addEventListener('input', debounce(() => {
      ctx.store.save({ step1: { prologue: { sentences: { [inp.dataset.key]: inp.value } } } });
    }));
  });

  view.querySelectorAll('input[data-pledge]').forEach(inp => {
    inp.addEventListener('input', debounce(() => {
      const idx = Number(inp.dataset.pledge);
      const next = [...(ctx.store.get('step1.prologue.pledge') || ['', '', ''])];
      next[idx] = inp.value;
      ctx.store.save({ step1: { prologue: { pledge: next } } });
    }));
  });
}
