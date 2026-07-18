/* ============================================================
   views/career-roadmap.js — #/career/roadmap
   roadmap.json phases 타임라인 편집 + 활동 후 느낌
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export async function render(view, ctx) {
  const src = await ctx.data('roadmap');
  const s4 = ctx.store.get('step4.roadmap') || { careerGoal: '', phases: [], afterThoughts: '' };

  const phaseDefs = src.roadmap.phases || [];
  const storedPhases = new Map((s4.phases || []).map(p => [p.id, p]));

  const phasesHtml = phaseDefs.map((def, i) => {
    const saved = storedPhases.get(def.id) || {};
    const label = def.editableYears
      ? `<input type="number" data-years="${def.id}" value="${saved.years ?? ''}" placeholder="N" min="1" max="99"> 년 후`
      : esc(def.label);
    return `
      <li class="j-phase" data-phase="${def.id}">
        <div class="j-phase-marker">${i + 1}</div>
        <div class="j-phase-body">
          <div class="j-phase-label">${label}</div>
          <textarea rows="3" data-goal="${def.id}" placeholder="달성하고자 하는 목표 · 달성 계획 · 준비 방법">${esc(saved.goal || '')}</textarea>
        </div>
      </li>`;
  }).join('');

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>진로 로드맵</h1>
        <p>${esc(src.roadmap.instruction)}</p>
      </header>

      <section class="j-card">
        <h2>내 최종 진로 목표</h2>
        <label class="j-field">
          <span>이 로드맵을 관통하는 최종 목표 (필수 — 채워지면 3단계 로드맵 항목이 완료로 표시됩니다)</span>
          <textarea rows="2" id="career-goal" placeholder="예: 임상심리 전문가로 성인 정서 문제 상담·연구를 하는 사람이 되고 싶다.">${esc(s4.careerGoal || '')}</textarea>
        </label>
      </section>

      <section class="j-card">
        <h2>시기별 목표 타임라인</h2>
        <ol class="j-timeline">${phasesHtml}</ol>
      </section>

      <section class="j-card">
        <h2>활동 후 느낌</h2>
        <label class="j-field">
          <span>${esc(src.roadmap.afterActivity)}</span>
          <textarea rows="4" id="after-thoughts">${esc(s4.afterThoughts || '')}</textarea>
        </label>
      </section>

      <nav class="j-nav">
        <a href="#/career/mandarat" class="j-btn">← 만다라트</a>
        <a href="#/planner/selector" class="j-btn j-btn-primary">4단계: 과목 선택 실습 →</a>
      </nav>
    </article>
  `;

  const goalEl = view.querySelector('#career-goal');
  goalEl.addEventListener('input', debounce(() => {
    ctx.store.save({ step4: { roadmap: { careerGoal: goalEl.value } } });
  }));

  const savePhases = () => {
    const list = phaseDefs.map(def => {
      const li = view.querySelector(`.j-phase[data-phase="${def.id}"]`);
      const goal = li.querySelector(`textarea[data-goal="${def.id}"]`).value;
      const yearsEl = li.querySelector(`input[data-years="${def.id}"]`);
      return { id: def.id, years: yearsEl ? (yearsEl.value ? Number(yearsEl.value) : null) : null, goal };
    });
    ctx.store.save({ step4: { roadmap: { phases: list } } });
  };
  view.querySelectorAll('.j-phase textarea, .j-phase input').forEach(el => {
    el.addEventListener('input', debounce(savePhases));
  });

  view.querySelector('#after-thoughts').addEventListener('input', debounce((e) => {
    ctx.store.save({ step4: { roadmap: { afterThoughts: e.target.value } } });
  }));
}
