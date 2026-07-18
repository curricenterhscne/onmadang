/* ============================================================
   views/report-check.js — #/report/check
   checklist 4영역 O/X/보류 + 학점 항목 자동 제안 + 친구 조언 + 수정 메모
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* 학점 관련 자동 제안: courses(step4.coursePlan.summary) 데이터로 O/X 힌트 */
function creditAutoHints(cp, req) {
  const sum = cp?.summary || {};
  const gb = sum.groupBreakdown || {};
  const total = Number(sum.totalCredits) || 0;
  const kme = ['국어', '수학', '영어'].reduce((a, g) => a + (Number(gb[g]) || 0), 0);
  const meetsGroups = (req.requiredByGroup || []).every(r => (Number(gb[r.group]) || 0) >= r.credits);
  return {
    '교육과정.1': total >= (req.graduation?.total || 192) ? 'O' : 'X',   // 192학점
    '교육과정.2': kme <= (req.koreanMathEnglishCap?.cap || 81) ? 'O' : 'X', // 국수영 81
    '교육과정.3': meetsGroups ? 'O' : 'X',                                  // 교과군별 필수
  };
}

const CHOICES = [
  { v: 'O', label: 'O', title: '충족' },
  { v: 'X', label: 'X', title: '미충족' },
  { v: null, label: '?', title: '보류' },
];

export async function render(view, ctx) {
  const src = await ctx.data('checklist');
  const req = await ctx.data('required-credits');
  const cp = ctx.store.get('step4.coursePlan');
  const answers = { ...(ctx.store.get('step4.checklist.answers') || {}) };
  const peer = ctx.store.get('step4.peerReview') || { given: [], received: [], revisionNote: '' };
  const hints = creditAutoHints(cp, req);

  const cats = (src.categories || []).map(cat => {
    const rows = cat.items.map((item, idx) => {
      const key = `${cat.name}.${idx}`;
      const cur = answers[key] === undefined
        ? (hints[key] !== undefined ? hints[key] : null)
        : answers[key];
      const btns = CHOICES.map(c => `
        <button type="button" class="j-choice j-choice-${c.v === null ? 'null' : c.v} ${cur === c.v ? 'is-on' : ''}"
          data-key="${key}" data-val="${c.v === null ? '' : c.v}" title="${c.title}">${c.label}</button>
      `).join('');
      const auto = hints[key] !== undefined ? `<small class="j-auto">자동 제안: <b>${hints[key]}</b> · 확정하려면 클릭</small>` : '';
      return `<li>
        <div class="j-check-q">${esc(item)}</div>
        <div class="j-check-a">${btns}</div>
        ${auto}
      </li>`;
    }).join('');
    return `
      <section class="j-card">
        <h2>${esc(cat.name)}</h2>
        ${cat.autoHint ? `<p class="j-hint">${esc(cat.autoHint)}</p>` : ''}
        <ul class="j-check-list">${rows}</ul>
      </section>`;
  }).join('');

  const givenRows = [0, 1, 2].map(i => {
    const g = peer.given[i] || {};
    return `<tr data-given="${i}">
      <td><input type="text" data-fld="friend" value="${esc(g.friend || '')}" placeholder="친구 이름"></td>
      <td><input type="text" data-fld="track" value="${esc(g.track || '')}" placeholder="계열/학과/직업"></td>
      <td><input type="text" data-fld="good"  value="${esc(g.good || '')}"  placeholder="좋은 점"></td>
      <td><input type="text" data-fld="fix"   value="${esc(g.fix || '')}"   placeholder="수정·보완할 점"></td>
    </tr>`;
  }).join('');

  const rcvRows = [0, 1, 2].map(i => {
    const r = peer.received[i] || {};
    return `<tr data-rcv="${i}">
      <td><input type="text" data-fld="friend" value="${esc(r.friend || '')}" placeholder="친구 이름 (선택)"></td>
      <td><input type="text" data-fld="advice" value="${esc(r.advice || '')}" placeholder="조언 내용"></td>
    </tr>`;
  }).join('');

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>체크리스트 · 친구 조언</h1>
        <p>4영역 자체 점검, 학점 관련 항목은 이력카드가 자동으로 제안값을 계산합니다. 확정은 O/X 버튼 클릭.</p>
      </header>

      ${cats}

      <section class="j-card">
        <h2>친구에게 준 조언 <small>(자료집 활동 20)</small></h2>
        <div class="j-table-wrap">
          <table class="j-table"><thead><tr><th>친구</th><th>계열/학과/직업</th><th>좋은 점</th><th>수정·보완할 점</th></tr></thead><tbody id="peer-given">${givenRows}</tbody></table>
        </div>
      </section>

      <section class="j-card">
        <h2>친구·선생님께 받은 조언</h2>
        <div class="j-table-wrap">
          <table class="j-table"><thead><tr><th>친구/선생님</th><th>조언 내용</th></tr></thead><tbody id="peer-rcv">${rcvRows}</tbody></table>
        </div>
        <label class="j-field" style="margin-top:12px">
          <span>조언을 바탕으로 한 수정·보완 메모 <small>(${esc(src.categories && src.categories[0] ? '' : '')}${'설계서를 어떻게 다듬을지 정리'})</small></span>
          <textarea rows="4" id="revision">${esc(peer.revisionNote || '')}</textarea>
        </label>
      </section>

      <nav class="j-nav">
        <a href="#/report/courses" class="j-btn">← 이력카드</a>
        <a href="#/report/print" class="j-btn j-btn-primary">다음: 보고서 조립·인쇄 →</a>
      </nav>
    </article>
  `;

  // 체크 버튼
  view.querySelectorAll('.j-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const v = btn.dataset.val || null;
      const group = btn.parentElement;
      group.querySelectorAll('.j-choice').forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      const next = { ...(ctx.store.get('step4.checklist.answers') || {}) };
      next[key] = v;
      ctx.store.save({ step4: { checklist: { answers: next } } });
    });
  });

  // 친구 조언
  const savePeer = (which) => {
    const tbody = view.querySelector(which === 'given' ? '#peer-given' : '#peer-rcv');
    const rows = [...tbody.querySelectorAll('tr')].map(tr => {
      const row = {};
      tr.querySelectorAll('[data-fld]').forEach(inp => { row[inp.dataset.fld] = inp.value; });
      return row;
    }).filter(r => Object.values(r).some(v => v && v.trim()));
    ctx.store.save({ step4: { peerReview: { [which]: rows } } });
  };
  view.querySelector('#peer-given').addEventListener('input', debounce(() => savePeer('given')));
  view.querySelector('#peer-rcv').addEventListener('input', debounce(() => savePeer('received')));
  view.querySelector('#revision').addEventListener('input', debounce((e) => {
    ctx.store.save({ step4: { peerReview: { revisionNote: e.target.value } } });
  }));
}
