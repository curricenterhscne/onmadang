/* ============================================================
   views/self-jobs.js — #/self/jobs
   관심 직업 3종 · 미래 변화 예측 · 깨달은 점
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

const JOB_FIELDS = [
  ['name', '직업명'],
  ['coreAbility', '핵심 능력'],
  ['majors', '관련 학과'],
  ['tasks', '하는 일'],
  ['salary', '임금(월/연)'],
  ['howToPrepare', '준비 방법'],
  ['licenses', '자격증'],
  ['fit', '나와 잘 맞는 이유'],
];

function jobCard(idx, job = {}) {
  return `
    <details class="j-card j-job" ${job.name ? 'open' : ''} data-job="${idx}">
      <summary>
        <b>관심 직업 ${idx + 1}</b>
        <span class="j-job-title">${esc(job.name || '아직 미입력')}</span>
      </summary>
      <div class="j-fields">
        ${JOB_FIELDS.map(([k, label]) => {
          const isLong = ['tasks', 'howToPrepare', 'fit'].includes(k);
          return `
            <label class="j-field">
              <span>${label}</span>
              ${isLong
                ? `<textarea rows="2" data-fld="${k}">${esc(job[k] || '')}</textarea>`
                : `<input type="text" data-fld="${k}" value="${esc(job[k] || '')}">`}
            </label>`;
        }).join('')}
      </div>
    </details>`;
}

function futureRow(idx, row = {}) {
  return `
    <tr data-fu="${idx}">
      <td><input type="text"   data-fld="job"        value="${esc(row.job || '')}"        placeholder="직업"></td>
      <td><textarea rows="2"   data-fld="prediction" placeholder="10년 후 어떻게 변할까?">${esc(row.prediction || '')}</textarea></td>
    </tr>`;
}

export async function render(view, ctx) {
  const jobs = ctx.store.get('step1.jobs') || [];
  const future = ctx.store.get('step1.jobFuture') || [];
  const insight = ctx.store.get('step1.jobFutureInsight') || '';

  const jobRows = [0, 1, 2].map(i => jobCard(i, jobs[i] || {}));
  const fuRows = [0, 1, 2].map(i => futureRow(i, future[i] || {}));

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>내 직업 미리 봄 · 미래 변화 예측</h1>
        <p>관심 있는 직업 3개를 살펴보고, 미래 변화까지 함께 생각합니다.</p>
      </header>

      <section aria-labelledby="jb-h">
        <h2 id="jb-h">관심 직업 3종</h2>
        ${jobRows.join('')}
      </section>

      <section class="j-card" aria-labelledby="fu-h">
        <h2 id="fu-h">직업별 미래 변화 예측</h2>
        <p class="j-hint">기술·사회 변화, 인구 변화 등을 고려해 10년 뒤 이 직업이 어떻게 달라질지 적어보세요.</p>
        <div class="j-table-wrap">
          <table class="j-table" id="fu-tbl">
            <thead><tr><th>직업</th><th>예측</th></tr></thead>
            <tbody>${fuRows.join('')}</tbody>
          </table>
        </div>
        <label class="j-field">
          <span>이 활동을 통해 새롭게 알게된 점 · 나의 진로 선택에 반영할 점</span>
          <textarea rows="4" id="insight">${esc(insight)}</textarea>
        </label>
      </section>

      <nav class="j-nav">
        <a href="#/self/tests" class="j-btn">← 검사 기록</a>
        <a href="#/self/summary" class="j-btn j-btn-primary">다음: 종합 점검 →</a>
      </nav>
    </article>
  `;

  // 직업 카드 저장
  view.querySelectorAll('.j-job').forEach(details => {
    const idx = Number(details.dataset.job);
    const titleSpan = details.querySelector('.j-job-title');
    details.addEventListener('input', debounce(() => {
      const cur = [...(ctx.store.get('step1.jobs') || [])];
      while (cur.length <= idx) cur.push({});
      const row = { ...cur[idx] };
      details.querySelectorAll('[data-fld]').forEach(inp => { row[inp.dataset.fld] = inp.value; });
      cur[idx] = row;
      const trimmed = cur.map(j => j || {});
      // 완전히 빈 뒤쪽 카드 제거
      while (trimmed.length && !Object.values(trimmed[trimmed.length - 1]).some(v => v && String(v).trim())) trimmed.pop();
      ctx.store.save({ step1: { jobs: trimmed } });
      titleSpan.textContent = row.name || '아직 미입력';
    }));
  });

  // 미래 변화 저장
  view.querySelector('#fu-tbl').addEventListener('input', debounce(() => {
    const rows = [...view.querySelectorAll('#fu-tbl tbody tr')];
    const next = rows.map(tr => {
      const r = {};
      tr.querySelectorAll('[data-fld]').forEach(inp => { r[inp.dataset.fld] = inp.value; });
      return r;
    }).filter(r => (r.job && r.job.trim()) || (r.prediction && r.prediction.trim()));
    ctx.store.save({ step1: { jobFuture: next } });
  }));

  view.querySelector('#insight').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { jobFutureInsight: e.target.value } });
  }));
}
