/* ============================================================
   views/self-tests.js — #/self/tests
   흥미(H형) · 적성 · 가치관 검사 안내 + 결과 기록
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

async function loadAll(ctx) {
  return {
    interest: await ctx.data('holland-interest-types'),
    aptitude: await ctx.data('aptitude-types'),
    values: await ctx.data('work-values'),
    external: await ctx.data('external-sites'),
  };
}

function careernetUrl(external) {
  const jobs = external.jobExploration || [];
  return (jobs.find(x => x.name?.includes('커리어넷')) || {}).url || 'https://www.career.go.kr';
}

/* ── 흥미 (Holland H형) ─────────────────────────────── */
function renderInterest(data, ctx, cnetUrl) {
  const cur = ctx.store.get('step1.interest') || { ranks: [], topJobExample: {}, reflection: '' };
  const ranks = [1, 2, 3, 4, 5, 6];
  const rankRow = (rk) => {
    const row = (cur.ranks || []).find(r => r.rank === rk) || { rank: rk, type: '', tScore: null, traits: '', jobs: '' };
    const opts = ['', 'R', 'I', 'A', 'S', 'E', 'C']
      .map(v => `<option value="${v}" ${row.type === v ? 'selected' : ''}>${v || '유형 선택'}</option>`).join('');
    return `
      <tr data-rank="${rk}">
        <td class="rk">${rk}순위</td>
        <td><select data-fld="type">${opts}</select></td>
        <td><input type="number" data-fld="tScore" value="${row.tScore ?? ''}" placeholder="T점수" step="0.1"></td>
        <td><input type="text"   data-fld="traits" value="${esc(row.traits)}" placeholder="성격 특성"></td>
        <td><input type="text"   data-fld="jobs"   value="${esc(row.jobs)}"   placeholder="관심 있는 대표 직업"></td>
      </tr>`;
  };

  return `
    <section class="j-card" aria-labelledby="int-h">
      <h2 id="int-h">① 직업흥미검사 (H형)</h2>
      <p class="j-hint">${esc(data.test.name)} · 약 ${data.test.minutes}분 · ${data.test.items}문항. 커리어넷에서 검사 후, 아래에 결과를 옮겨 적습니다.</p>
      <p><a class="j-btn j-btn-primary" href="${cnetUrl}" target="_blank" rel="noopener">커리어넷에서 검사하기 ↗</a></p>

      <details class="j-details">
        <summary>흥미유형 6가지 요약 (R·I·A·S·E·C)</summary>
        <div class="j-mini-grid">
          ${data.types.map(t => `
            <div class="j-mini">
              <div class="j-mini-h"><b>${esc(t.code)}</b> <span>${esc(t.name)}</span></div>
              <div class="j-mini-b"><small>${esc(t.traits)}</small></div>
              <div class="j-mini-f">🎯 ${esc(t.jobGroups)}</div>
            </div>
          `).join('')}
        </div>
      </details>

      <h3>결과 기록 <small>(1~6순위)</small></h3>
      <div class="j-table-wrap">
        <table class="j-table" id="int-tbl">
          <thead><tr><th>순위</th><th>유형</th><th>T점수</th><th>성격 특성</th><th>대표 직업</th></tr></thead>
          <tbody>${ranks.map(rankRow).join('')}</tbody>
        </table>
      </div>

      <h3>1순위 유형 · 관심 직업 예시</h3>
      <div class="j-fields">
        <label class="j-field"><span>유형</span><input type="text" data-tj="type"     value="${esc(cur.topJobExample?.type || '')}"></label>
        <label class="j-field"><span>직업군</span><input type="text" data-tj="jobGroup" value="${esc(cur.topJobExample?.jobGroup || '')}"></label>
        <label class="j-field"><span>직업</span><input type="text" data-tj="job"      value="${esc(cur.topJobExample?.job || '')}"></label>
        <label class="j-field"><span>관련 학과</span><input type="text" data-tj="major" value="${esc(cur.topJobExample?.major || '')}"></label>
      </div>
      <label class="j-field">
        <span>검사 결과가 평소 생각과 어떻게 같거나 다른가?</span>
        <textarea rows="3" data-int="reflection">${esc(cur.reflection || '')}</textarea>
      </label>
    </section>`;
}

/* ── 적성 ──────────────────────────────────────────── */
function renderAptitude(data, ctx, cnetUrl) {
  const cur = ctx.store.get('step1.aptitude') || { high: [], low: [], reflection: '' };
  const highRow = (i) => {
    const r = cur.high[i] || {};
    return `
      <tr data-hi="${i}">
        <td><input type="text"   data-fld="area"       value="${esc(r.area)}"       placeholder="영역"></td>
        <td><input type="number" data-fld="percentile" value="${r.percentile ?? ''}" placeholder="백분위" step="0.1"></td>
        <td><input type="text"   data-fld="interested" value="${esc(r.interested)}" placeholder="관심 있는 직업"></td>
        <td><input type="text"   data-fld="new"        value="${esc(r.new)}"        placeholder="새로 알게된 직업"></td>
        <td><input type="text"   data-fld="toCheck"    value="${esc(r.toCheck)}"    placeholder="더 알아볼 직업"></td>
      </tr>`;
  };
  const lowRow = (i) => {
    const r = cur.low[i] || {};
    return `
      <tr data-lo="${i}">
        <td><input type="text" data-fld="area"   value="${esc(r.area)}"   placeholder="보완할 영역"></td>
        <td><input type="text" data-fld="effort" value="${esc(r.effort)}" placeholder="내가 할 수 있는 노력"></td>
      </tr>`;
  };

  return `
    <section class="j-card" aria-labelledby="apt-h">
      <h2 id="apt-h">② 직업적성검사</h2>
      <p class="j-hint">${esc(data.test.name)} · 약 ${data.test.minutes}분 · ${data.test.items}문항.</p>
      <p><a class="j-btn j-btn-primary" href="${cnetUrl}" target="_blank" rel="noopener">커리어넷에서 검사하기 ↗</a></p>

      <details class="j-details">
        <summary>11개 적성 영역 요약</summary>
        <ul class="j-list">
          ${data.areas.map(a => `<li><b>${esc(a.name)}</b> — ${esc(a.desc)} <small>🎯 ${esc(a.jobs)}</small></li>`).join('')}
        </ul>
      </details>

      <h3>상위 3영역 결과</h3>
      <div class="j-table-wrap">
        <table class="j-table" id="apt-hi">
          <thead><tr><th>영역</th><th>백분위</th><th>관심 직업</th><th>새로 알게된 직업</th><th>더 알아볼 직업</th></tr></thead>
          <tbody>${[0, 1, 2].map(highRow).join('')}</tbody>
        </table>
      </div>

      <h3>하위 영역 · 보완 계획</h3>
      <div class="j-table-wrap">
        <table class="j-table" id="apt-lo">
          <thead><tr><th>영역</th><th>노력</th></tr></thead>
          <tbody>${[0, 1].map(lowRow).join('')}</tbody>
        </table>
      </div>

      <label class="j-field">
        <span>느낀 점 · 진로 계획에 반영할 것</span>
        <textarea rows="3" data-apt="reflection">${esc(cur.reflection || '')}</textarea>
      </label>
    </section>`;
}

/* ── 가치관 ────────────────────────────────────────── */
function renderValues(data, ctx, cnetUrl) {
  const cur = ctx.store.get('step1.values') || {};
  const my = cur.myTop3 || [];
  const test = cur.testTop3 || [];
  const rows = (arr, prefix) => [0, 1, 2].map(i => {
    const r = arr[i] || {};
    return `
      <tr data-${prefix}="${i}">
        <td><input type="text"   data-fld="value" value="${esc(r.value)}" placeholder="가치명"></td>
        <td><input type="number" data-fld="score" value="${r.score ?? ''}" placeholder="점수" step="0.1"></td>
      </tr>`;
  }).join('');

  return `
    <section class="j-card" aria-labelledby="val-h">
      <h2 id="val-h">③ 직업가치관 검사</h2>
      <p class="j-hint">${esc(data.test.name)} · 약 ${data.test.minutes}분 · ${data.test.items}문항.</p>
      <p><a class="j-btn j-btn-primary" href="${cnetUrl}" target="_blank" rel="noopener">커리어넷에서 검사하기 ↗</a></p>

      <details class="j-details">
        <summary>12개 가치 · 4지향</summary>
        <div class="j-mini-grid">
          ${data.values.map(v => `<div class="j-mini"><div class="j-mini-h"><b>${esc(v.name)}</b></div><div class="j-mini-b">${esc(v.desc)}</div></div>`).join('')}
        </div>
        <p class="j-hint" style="margin-top:8px">지향: ${data.orientations.map(o => `<b>${esc(o.name)}</b>(${o.values.join('·')})`).join(' · ')}</p>
      </details>

      <h3>내가 생각한 상위 3가치</h3>
      <div class="j-table-wrap">
        <table class="j-table" id="val-my"><thead><tr><th>가치</th><th>점수</th></tr></thead><tbody>${rows(my, 'my')}</tbody></table>
      </div>

      <h3>검사 결과 상위 3가치</h3>
      <div class="j-table-wrap">
        <table class="j-table" id="val-test"><thead><tr><th>가치</th><th>점수</th></tr></thead><tbody>${rows(test, 'test')}</tbody></table>
      </div>

      <label class="j-field"><span>내 예상과 검사 결과 차이점</span><textarea rows="2" data-vl="mismatchNote">${esc(cur.mismatchNote || '')}</textarea></label>

      <h3>희망 직업으로 실현되는 나의 가치</h3>
      <div class="j-fields">
        <label class="j-field"><span>희망 직업</span><input type="text" data-hj="job" value="${esc(cur.hopeJob?.job || '')}"></label>
        <label class="j-field"><span>이 직업으로 실현되는 가치</span><textarea rows="2" data-hj="realizedValues">${esc(cur.hopeJob?.realizedValues || '')}</textarea></label>
      </div>
      <p class="j-hint">예: ${esc(data.example.job)} → ${esc(data.example.realized)}</p>
    </section>`;
}

/* ── 뷰 진입점 ─────────────────────────────────────── */
export async function render(view, ctx) {
  const { interest, aptitude, values, external } = await loadAll(ctx);
  const cnet = careernetUrl(external);

  const tabs = [
    { id: 'int', label: '흥미(H형)' },
    { id: 'apt', label: '적성' },
    { id: 'val', label: '가치관' },
  ];

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>흥미 · 적성 · 가치관 검사</h1>
        <p>검사는 <b>커리어넷</b>에서, 결과 기록만 여기에 남깁니다.</p>
      </header>

      <nav class="j-tabs" role="tablist" aria-label="검사 종류">
        ${tabs.map((t, i) => `<button role="tab" class="j-tab ${i === 0 ? 'is-on' : ''}" data-tab="${t.id}" aria-selected="${i === 0 ? 'true' : 'false'}">${t.label}</button>`).join('')}
      </nav>

      <div id="pane-int" class="j-pane">${renderInterest(interest, ctx, cnet)}</div>
      <div id="pane-apt" class="j-pane" hidden>${renderAptitude(aptitude, ctx, cnet)}</div>
      <div id="pane-val" class="j-pane" hidden>${renderValues(values, ctx, cnet)}</div>

      <nav class="j-nav">
        <a href="#/self/prologue" class="j-btn">← 프롤로그</a>
        <a href="#/self/jobs" class="j-btn j-btn-primary">다음: 관심 직업 →</a>
      </nav>
    </article>
  `;

  // 탭
  view.querySelectorAll('.j-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      view.querySelectorAll('.j-tab').forEach(b => { b.classList.remove('is-on'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-on'); btn.setAttribute('aria-selected', 'true');
      ['int', 'apt', 'val'].forEach(id => view.querySelector('#pane-' + id).hidden = id !== btn.dataset.tab);
    });
  });

  // 흥미 저장
  const intTbl = view.querySelector('#int-tbl');
  intTbl.addEventListener('input', debounce((e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const rk = Number(tr.dataset.rank);
    const cur = ctx.store.get('step1.interest.ranks') || [];
    const idx = cur.findIndex(r => r.rank === rk);
    const row = idx >= 0 ? { ...cur[idx] } : { rank: rk };
    tr.querySelectorAll('[data-fld]').forEach(inp => {
      const k = inp.dataset.fld;
      row[k] = k === 'tScore' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
    });
    const next = [...cur];
    if (idx >= 0) next[idx] = row; else next.push(row);
    next.sort((a, b) => a.rank - b.rank);
    ctx.store.save({ step1: { interest: { ranks: next } } });
  }));

  view.querySelectorAll('input[data-tj]').forEach(inp => inp.addEventListener('input', debounce(() => {
    ctx.store.save({ step1: { interest: { topJobExample: { [inp.dataset.tj]: inp.value } } } });
  })));
  view.querySelector('textarea[data-int]').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { interest: { reflection: e.target.value } } });
  }));

  // 적성 저장
  const saveHiLo = (which) => {
    const tbl = view.querySelector(which === 'high' ? '#apt-hi' : '#apt-lo');
    const rows = [...tbl.querySelectorAll('tbody tr')];
    const next = rows.map(tr => {
      const row = {};
      tr.querySelectorAll('[data-fld]').forEach(inp => {
        const k = inp.dataset.fld;
        row[k] = k === 'percentile' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
      });
      return row;
    }).filter(r => Object.values(r).some(v => v !== '' && v !== null));
    ctx.store.save({ step1: { aptitude: { [which]: next } } });
  };
  view.querySelector('#apt-hi').addEventListener('input', debounce(() => saveHiLo('high')));
  view.querySelector('#apt-lo').addEventListener('input', debounce(() => saveHiLo('low')));
  view.querySelector('textarea[data-apt]').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { aptitude: { reflection: e.target.value } } });
  }));

  // 가치관 저장
  const saveVals = (which) => {
    const tbl = view.querySelector(which === 'my' ? '#val-my' : '#val-test');
    const rows = [...tbl.querySelectorAll('tbody tr')];
    const next = rows.map(tr => {
      const row = {};
      tr.querySelectorAll('[data-fld]').forEach(inp => {
        const k = inp.dataset.fld;
        row[k] = k === 'score' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
      });
      return row;
    }).filter(r => r.value || r.score !== null);
    const key = which === 'my' ? 'myTop3' : 'testTop3';
    ctx.store.save({ step1: { values: { [key]: next } } });
  };
  view.querySelector('#val-my').addEventListener('input', debounce(() => saveVals('my')));
  view.querySelector('#val-test').addEventListener('input', debounce(() => saveVals('test')));
  view.querySelector('textarea[data-vl]').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { values: { mismatchNote: e.target.value } } });
  }));
  view.querySelectorAll('[data-hj]').forEach(inp => inp.addEventListener('input', debounce(() => {
    ctx.store.save({ step1: { values: { hopeJob: { [inp.dataset.hj]: inp.value } } } });
  })));
}
