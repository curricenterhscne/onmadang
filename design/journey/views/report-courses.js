/* ============================================================
   views/report-courses.js — #/report/courses
   selector 이력카드: 교과군×학점 · 필수이수 충족·부족 · 국수영 81 · 192 진행률
   ============================================================ */

const SELECTOR_CACHE_KEY = 'onmadang.jinro.selector';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt(n) {
  if (n == null || Number.isNaN(n)) return '-';
  return n % 1 === 0 ? String(n) : String(Number(n.toFixed(1)));
}
function readSelectorCache() {
  try {
    const raw = localStorage.getItem(SELECTOR_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.schema !== 'cne_course_selector/v1') return null;
    return data;
  } catch { return null; }
}

export async function render(view, ctx) {
  const req = await ctx.data('required-credits');
  const cache = readSelectorCache();
  const banner = cache
    ? `<div class="j-hook-banner">
        <div>
          <b>최근 selector 실습 결과가 있습니다.</b>
          <p class="j-hint" style="margin:2px 0 0">
            학교: ${esc(cache.schoolName || '')}${cache.department ? ' · ' + esc(cache.department) : ''}
            ${cache.exportedAt ? ' · ' + esc(cache.exportedAt.slice(0, 16).replace('T', ' ')) : ''}
          </p>
        </div>
        <button type="button" id="load-cache" class="j-btn j-btn-primary">이력카드로 불러오기</button>
      </div>`
    : '';

  const cp = ctx.store.get('step4.coursePlan');
  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>수강 이력카드 (자동 생성)</h1>
        <p>4단계 <a href="#/planner/selector">과목 선택 실습</a>을 여정 안에서 진행하면 결과가 자동으로 이 화면에 반영됩니다. 이미 파일이 있다면 상단 <b>파일 열기</b> 또는 <b>드래그앤드롭</b>으로 불러오세요.</p>
      </header>
      ${banner}
      <div id="report-body">${renderBody(cp, req)}</div>

      <nav class="j-nav">
        <a href="#/career/roadmap" class="j-btn">← 진로 로드맵</a>
        <a href="#/report/check" class="j-btn j-btn-primary">다음: 체크리스트 →</a>
      </nav>
    </article>
  `;

  const btn = view.querySelector('#load-cache');
  if (btn) {
    btn.addEventListener('click', async () => {
      const c = readSelectorCache();
      if (!c) return;
      await ctx.store.openFile(JSON.stringify(c));
      view.querySelector('#report-body').innerHTML = renderBody(ctx.store.get('step4.coursePlan'), req);
    });
  }
}

function renderBody(cp, req) {
  if (!cp || !cp.summary) {
    return `
      <section class="j-card j-empty">
        <h2>아직 이력카드가 없습니다</h2>
        <p>4단계 실습에서 저장한 <code>과목선택_*.json</code> 파일을 상단 바로 불러오세요. 파일에 담긴 교과군별 학점이 여기에 자동 반영됩니다.</p>
      </section>`;
  }

  const sum = cp.summary || {};
  const gb = sum.groupBreakdown || {};
  const requiredByGroup = req.requiredByGroup || [];
  const cap = req.koreanMathEnglishCap?.cap ?? 81;

  const kme = ['국어', '수학', '영어'].reduce((a, g) => a + (Number(gb[g]) || 0), 0);
  const total = Number(sum.totalCredits) || 0;

  const rows = requiredByGroup.map(r => {
    const have = Number(gb[r.group]) || 0;
    const ok = have >= r.credits;
    const diff = have - r.credits;
    const badge = ok
      ? `<span class="j-badge is-ok">충족 +${fmt(diff)}</span>`
      : `<span class="j-badge is-miss">부족 ${fmt(diff)}</span>`;
    return `<tr class="${ok ? 'is-ok' : 'is-miss'}">
      <td>${esc(r.group)}</td>
      <td class="right"><b>${fmt(have)}</b></td>
      <td class="right">${r.credits}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('');

  const totalMax = req.graduation?.total || 192;
  const pct = Math.min(100, Math.round((total / totalMax) * 100));

  return `
    <section class="j-card">
      <h2>학교 · 학과 · 시나리오</h2>
      <ul class="j-list">
        <li><b>학교:</b> ${esc(cp.schoolName || '')} ${cp.schoolCode ? `<small>(${esc(cp.schoolCode)})</small>` : ''}</li>
        ${cp.department ? `<li><b>학과:</b> ${esc(cp.department)}</li>` : ''}
        ${cp.year ? `<li><b>편성표 연도:</b> ${esc(cp.year)}</li>` : ''}
        ${cp.preset ? `<li><b>권장 과목 프리셋:</b> ${esc(cp.preset)}</li>` : ''}
        ${cp.exportedAt ? `<li><b>내보낸 시각:</b> ${esc(cp.exportedAt)}</li>` : ''}
      </ul>
    </section>

    <section class="j-card">
      <h2>전체 진행률 <small>(졸업 기준 ${totalMax}학점)</small></h2>
      <div class="j-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="height:12px">
        <div class="j-progress-bar" style="width:${pct}%"></div>
      </div>
      <p class="j-count"><b>${fmt(total)}</b> / ${totalMax}학점 · ${pct}% ${total < totalMax ? `<span class="j-badge is-miss">${totalMax - total}학점 부족</span>` : `<span class="j-badge is-ok">기준 충족</span>`}</p>
      <p class="j-hint">창의적 체험활동: <b>${fmt(sum.changcheCredits)}</b> / ${req.graduation?.creativeActivities || 18}학점</p>
    </section>

    <section class="j-card">
      <h2>교과(군)별 필수 이수 학점</h2>
      <div class="j-table-wrap">
        <table class="j-table j-chk">
          <thead><tr><th>교과(군)</th><th class="right">이수</th><th class="right">필수</th><th>충족</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <section class="j-card ${kme > cap ? 'is-warn' : ''}">
      <h2>국·수·영 상한 규칙</h2>
      <p><b>${fmt(kme)}</b>학점 (국 ${fmt(gb['국어'] || 0)} + 수 ${fmt(gb['수학'] || 0)} + 영 ${fmt(gb['영어'] || 0)})
        ${kme > cap ? `<span class="j-badge is-miss">${cap} 초과 · ${fmt(kme - cap)}학점 조정 필요</span>` : `<span class="j-badge is-ok">${cap} 이하</span>`}</p>
      <p class="j-hint">${esc(req.koreanMathEnglishCap?.rule || '')}</p>
    </section>
  `;
}
