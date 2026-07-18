/* ============================================================
   views/self-summary.js — #/self/summary
   Step1 전체를 자동 취합해 읽기 전용 종합점검표 + 결론 입력
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function empty(v) {
  if (v == null) return true;
  if (typeof v === 'string') return !v.trim();
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function rowOK(label, ok, hintText, hintHref) {
  return `
    <tr class="${ok ? 'is-ok' : 'is-miss'}">
      <td>${esc(label)}</td>
      <td>${ok ? '<span class="j-ok">기록됨</span>' : `<span class="j-miss">비어 있음</span> <a class="j-mini-link" href="${hintHref}">${esc(hintText)} →</a>`}</td>
    </tr>`;
}

export async function render(view, ctx) {
  const s1 = ctx.store.get('step1') || {};
  const summary = s1.summary || {};

  const strengths = s1.prologue?.strengths || [];
  const pledge = (s1.prologue?.pledge || []).filter(x => x && x.trim());
  const sentences = s1.prologue?.sentences || {};
  const interest = s1.interest?.ranks?.filter(r => r.type) || [];
  const topJob = s1.interest?.topJobExample || {};
  const aptHigh = (s1.aptitude?.high || []).filter(r => r.area);
  const aptLow  = (s1.aptitude?.low  || []).filter(r => r.area);
  const valsMy   = (s1.values?.myTop3   || []).filter(r => r.value);
  const valsTest = (s1.values?.testTop3 || []).filter(r => r.value);
  const hopeJob = s1.values?.hopeJob || {};
  const jobs = (s1.jobs || []).filter(j => j.name);
  const jobFuture = (s1.jobFuture || []).filter(f => f.job || f.prediction);
  const insight = s1.jobFutureInsight || '';

  const check = [
    ['강점 3개 이상 선택', strengths.length >= 3, '프롤로그로 이동', '#/self/prologue'],
    ['배움서약 1줄 이상',  pledge.length >= 1,     '프롤로그로 이동', '#/self/prologue'],
    ['문장 완성(행복/좋아함/잘함/존경)', ['happy', 'like', 'good', 'respectWho'].every(k => !empty(sentences[k])), '프롤로그로 이동', '#/self/prologue'],
    ['흥미검사 1순위 유형',  !!interest[0]?.type,   '검사 기록으로 이동', '#/self/tests'],
    ['1순위 관심 직업 예시', !empty(topJob.job) || !empty(topJob.major), '검사 기록으로 이동', '#/self/tests'],
    ['적성 상위 영역 1개 이상', aptHigh.length >= 1, '검사 기록으로 이동', '#/self/tests'],
    ['가치관 상위 3개 기록', valsMy.length >= 1 || valsTest.length >= 1, '검사 기록으로 이동', '#/self/tests'],
    ['희망 직업 · 실현 가치', !empty(hopeJob.job), '검사 기록으로 이동', '#/self/tests'],
    ['관심 직업 카드 1개 이상', jobs.length >= 1, '직업 탐색으로 이동', '#/self/jobs'],
    ['미래 변화 예측 1개 이상', jobFuture.length >= 1, '직업 탐색으로 이동', '#/self/jobs'],
    ['깨달은 점 서술', !empty(insight), '직업 탐색으로 이동', '#/self/jobs'],
  ];

  const doneCount = check.filter(([, ok]) => ok).length;

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>종합 점검 · 나를 다시 봄</h1>
        <p>1단계에서 남긴 기록을 한자리에 모았습니다. 빈 항목이 있으면 해당 활동으로 돌아가 채워 주세요.</p>
      </header>

      <section class="j-card" aria-labelledby="chk-h">
        <h2 id="chk-h">종합 점검표 <small>(${doneCount} / ${check.length})</small></h2>
        <div class="j-table-wrap">
          <table class="j-table j-chk">
            <thead><tr><th>항목</th><th>상태</th></tr></thead>
            <tbody>
              ${check.map(([label, ok, ht, hh]) => rowOK(label, ok, ht, hh)).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="j-card" aria-labelledby="rc-h">
        <h2 id="rc-h">1단계 기록 요약 <small>(자동 취합, 읽기 전용)</small></h2>
        <dl class="j-dl">
          <dt>선택한 강점 (${strengths.length})</dt>
          <dd>${strengths.length ? strengths.map(esc).join(', ') : '<i>없음</i>'}</dd>

          <dt>흥미 유형 순위</dt>
          <dd>${interest.length ? interest.map(r => `${r.rank}순위: <b>${esc(r.type)}</b>${r.tScore != null ? ` (T=${r.tScore})` : ''}${r.jobs ? ` — ${esc(r.jobs)}` : ''}`).join(' · ') : '<i>없음</i>'}</dd>

          <dt>1순위 대표 직업</dt>
          <dd>${topJob.job || topJob.major ? `${esc(topJob.type || '')} ${esc(topJob.jobGroup || '')} · <b>${esc(topJob.job || '')}</b> · ${esc(topJob.major || '')}` : '<i>없음</i>'}</dd>

          <dt>적성 상위</dt>
          <dd>${aptHigh.length ? aptHigh.map(a => `${esc(a.area)}${a.percentile != null ? ` (${a.percentile})` : ''}`).join(' · ') : '<i>없음</i>'}</dd>

          <dt>적성 보완</dt>
          <dd>${aptLow.length ? aptLow.map(a => `${esc(a.area)} → ${esc(a.effort || '')}`).join(' · ') : '<i>없음</i>'}</dd>

          <dt>가치관 (내 예상 · 검사 결과)</dt>
          <dd>내: ${valsMy.map(v => esc(v.value)).join(', ') || '<i>없음</i>'} · 검사: ${valsTest.map(v => esc(v.value)).join(', ') || '<i>없음</i>'}</dd>

          <dt>희망 직업 · 실현 가치</dt>
          <dd>${esc(hopeJob.job || '<i>없음</i>')} → ${esc(hopeJob.realizedValues || '')}</dd>

          <dt>관심 직업 (${jobs.length})</dt>
          <dd>${jobs.length ? jobs.map(j => `<b>${esc(j.name)}</b>${j.majors ? ` (${esc(j.majors)})` : ''}`).join(' · ') : '<i>없음</i>'}</dd>

          <dt>미래 변화 인사이트</dt>
          <dd>${esc(insight) || '<i>없음</i>'}</dd>
        </dl>
      </section>

      <section class="j-card" aria-labelledby="cc-h">
        <h2 id="cc-h">결론</h2>
        <p class="j-hint">문장을 완성해 주세요. 이 결론이 채워지면 1단계가 최종 완료로 표시됩니다.</p>
        <label class="j-field">
          <span>탐색 결과를 종합할 때, 관심 직업(학과)은 (        )이다.</span>
          <textarea rows="3" id="fld-conclusion" placeholder="예: 심리학과 · 임상심리 전문가로 진로를 좁혀가고자 한다.">${esc(summary.conclusion || '')}</textarea>
        </label>
        <div class="j-fields">
          <label class="j-field">
            <span>미래 전망 (긍정/부정)</span>
            <select id="fld-positive">
              <option value=""     ${summary.futureOutlookPositive == null ? 'selected' : ''}>선택</option>
              <option value="true" ${summary.futureOutlookPositive === true ? 'selected' : ''}>긍정적</option>
              <option value="false" ${summary.futureOutlookPositive === false ? 'selected' : ''}>부정적</option>
            </select>
          </label>
          <label class="j-field">
            <span>그렇게 판단한 이유</span>
            <textarea rows="2" id="fld-reason">${esc(summary.reason || '')}</textarea>
          </label>
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/self/jobs" class="j-btn">← 직업 탐색</a>
        <a href="#/curriculum/structure" class="j-btn j-btn-primary">다음 단계: 교육과정 이해 →</a>
      </nav>
    </article>
  `;

  view.querySelector('#fld-conclusion').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { summary: { conclusion: e.target.value } } });
  }));
  view.querySelector('#fld-positive').addEventListener('change', (e) => {
    const v = e.target.value;
    ctx.store.save({ step1: { summary: { futureOutlookPositive: v === '' ? null : v === 'true' } } });
  });
  view.querySelector('#fld-reason').addEventListener('input', debounce((e) => {
    ctx.store.save({ step1: { summary: { reason: e.target.value } } });
  }));
}
