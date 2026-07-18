/* ============================================================
   views/dashboard.js — #/ 대시보드
   시작 3택 + 5단계 진행률 카드 + 미완료 활동 바로가기
   ============================================================ */

const STEP_META = [
  { id: 'self',       n: 1, label: '자기 이해',       desc: '흥미·적성·가치관을 탐색합니다',       route: '#/self/prologue' },
  { id: 'curriculum', n: 2, label: '교육과정 이해',   desc: '2022 개정 편제·평가·위계를 이해합니다', route: '#/curriculum/structure' },
  { id: 'majors',     n: 3, label: '진로설계 활동',   desc: '학과 탐색·만다라트·로드맵을 작성합니다', route: '#/career/majors' },
  { id: 'planner',    n: 4, label: '과목 선택 실습',  desc: '학교 편성표로 3년간 과목을 선택합니다', route: '#/planner/selector' },
  { id: 'report',     n: 5, label: '종합 보고서',     desc: 'A4 인쇄용 진로학업설계서를 조립합니다', route: '#/report/print' },
];

const ACTIVITY_ROUTES = {
  'step1.prologue': '#/self/prologue',
  'step1.interest': '#/self/tests',
  'step1.aptitude': '#/self/tests',
  'step1.values':   '#/self/tests',
  'step1.jobs':     '#/self/jobs',
  'step1.summary':  '#/self/summary',
  'step2.structure':'#/curriculum/structure',
  'step2.grading':  '#/curriculum/grading',
  'step2.hierarchy':'#/curriculum/hierarchy',
  'step2.mySchool': '#/planner/selector',
  'step3.field':      '#/career/majors',
  'step3.department': '#/career/majors',
  'step3.sameName':   '#/career/majors',
  'step4.coursePlan': '#/planner/selector',
  'step4.mandarat':   '#/career/mandarat',
  'step4.roadmap':    '#/career/roadmap',
  'step5.checklistHalf': '#/report/check',
};

const ACTIVITY_LABELS = {
  'step1.prologue': '1단계 · 프롤로그 (강점 3개 + 배움서약)',
  'step1.interest': '1단계 · 직업흥미검사 결과 기록',
  'step1.aptitude': '1단계 · 직업적성검사 결과 기록',
  'step1.values':   '1단계 · 직업가치관 검사 결과',
  'step1.jobs':     '1단계 · 내 직업 미리 봄',
  'step1.summary':  '1단계 · 종합 점검(관심 진로 결론)',
  'step2.structure':'2단계 · 교과 편제 이해',
  'step2.grading':  '2단계 · 성적 산출 방식 퀴즈',
  'step2.hierarchy':'2단계 · 과목 위계 퀴즈',
  'step2.mySchool': '2단계 · 우리 학교 교육과정 살펴보기',
  'step3.field':      '3단계 · 관심 계열 정하기',
  'step3.department': '3단계 · 관심 학과 정하기',
  'step3.sameName':   '3단계 · 같은 이름, 다른 학과 비교',
  'step4.coursePlan': '4단계 · 과목 선택 실습(selector)',
  'step4.mandarat':   '3단계 · 만다라트로 창체 설계',
  'step4.roadmap':    '3단계 · 진로 로드맵 목표 정하기',
  'step5.checklistHalf': '5단계 · 체크리스트(반 이상 응답)',
};

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function pctFromStep(step) {
  return step.total > 0 ? Math.round((step.done / step.total) * 100) : 0;
}

function startPanel(ctx, hasCache) {
  const wrap = el(`
    <section class="j-start" aria-labelledby="start-h">
      <h2 id="start-h">이번 세션 시작하기</h2>
      <p class="j-start-lead">진로학업설계서는 <b>파일 하나</b>로 관리합니다. 세션이 끝나기 전 <b>[파일로 저장]</b>하고, 다음 세션에서 그 파일을 열어 이어가세요.</p>
      <div class="j-start-grid">
        <button class="j-start-card ${hasCache ? '' : 'is-muted'}" data-action="resume" ${hasCache ? '' : 'disabled'}>
          <div class="j-start-ic">↩️</div>
          <div class="j-start-title">이어서 하기</div>
          <div class="j-start-desc">${hasCache ? '이 기기에 저장된 임시 캐시로 이어갑니다' : '이 기기에 저장된 캐시가 없습니다'}</div>
        </button>
        <button class="j-start-card" data-action="open">
          <div class="j-start-ic">📂</div>
          <div class="j-start-title">파일 열기</div>
          <div class="j-start-desc">전에 저장한 설계서 파일을 불러옵니다</div>
        </button>
        <button class="j-start-card" data-action="new">
          <div class="j-start-ic">🌱</div>
          <div class="j-start-title">새로 시작</div>
          <div class="j-start-desc">임시 캐시를 지우고 처음부터 진행합니다</div>
        </button>
      </div>
    </section>
  `);
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'resume') {
      // 이미 store.load()로 캐시가 로드되어 있음 — 대시보드만 새로 그림
      renderProgress(ctx);
      hideStartPanel();
    } else if (action === 'open') {
      document.getElementById('open-file-input')?.click();
    } else if (action === 'new') {
      if (!confirm('현재 캐시를 지우고 새로 시작합니다. 계속할까요?')) return;
      ctx.store.wipe();
      renderProgress(ctx);
      hideStartPanel();
    }
  });
  return wrap;
}

function hideStartPanel() {
  document.querySelector('.j-start')?.classList.add('is-hidden');
}

function stepCard(step, meta) {
  const pct = pctFromStep(step);
  const done = step.done;
  const total = step.total;
  const href = meta.route;
  const badge = meta.external ? '<span class="j-badge">외부 도구</span>' : '';
  const tag = meta.external ? 'a' : 'a';
  return `
    <${tag} class="j-step-card ${step.complete ? 'is-done' : ''}" href="${href}"${meta.external ? '' : ''} data-step="${meta.id}">
      <div class="j-step-num">${meta.n}</div>
      <div class="j-step-body">
        <div class="j-step-head">
          <h3>${meta.label}</h3>
          ${badge}
        </div>
        <p class="j-step-desc">${meta.desc}</p>
        <div class="j-step-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${meta.label} 진행률 ${pct}%">
          <div class="j-step-bar" style="width:${pct}%"></div>
        </div>
        <div class="j-step-meta">${done} / ${total} 항목 · ${pct}%</div>
      </div>
    </${tag}>
  `;
}

function incompleteList(prog) {
  const rows = [];
  for (const key of Object.keys(ACTIVITY_ROUTES)) {
    const [step, id] = key.split('.');
    const items = prog[step]?.items || {};
    if (items[id] === false) {
      rows.push(`
        <li>
          <a href="${ACTIVITY_ROUTES[key]}">
            <span class="j-incomplete-label">${ACTIVITY_LABELS[key] || key}</span>
            <span class="j-incomplete-go" aria-hidden="true">→</span>
          </a>
        </li>
      `);
    }
  }
  if (!rows.length) {
    return `<section class="j-incomplete"><h2>미완료 활동</h2><p class="j-empty-note">모든 활동을 완료했습니다. 5단계에서 보고서를 조립하세요.</p></section>`;
  }
  return `
    <section class="j-incomplete" aria-labelledby="inc-h">
      <h2 id="inc-h">미완료 활동 바로가기</h2>
      <ul class="j-incomplete-list">${rows.join('')}</ul>
    </section>`;
}

function renderProgress(ctx) {
  const p = ctx.store.progress();
  const target = document.getElementById('progress-region');
  if (!target) return;
  const cards = STEP_META.map(m => stepCard(p[`step${m.n}`], m)).join('');
  const finalTag = p.final
    ? '<span class="j-final-tag is-done">최종 조립 준비 완료</span>'
    : '<span class="j-final-tag">최종 조립까지 남은 항목이 있습니다</span>';
  target.innerHTML = `
    <section class="j-flow" aria-label="5단계 진행 상태">
      <div class="j-flow-head">
        <h2>5단계 진행 상태</h2>
        ${finalTag}
      </div>
      <div class="j-flow-grid">${cards}</div>
    </section>
    ${incompleteList(p)}
  `;
}

export async function render(view, ctx) {
  const hasCache = ctx.store.hasCache();
  view.classList.add('j-view-dashboard');
  view.innerHTML = `
    <div class="j-dash">
      <header class="j-dash-hero">
        <h1>진로·학업 설계 여정</h1>
        <p>내 진로를 이해하고, 과목을 설계하고, 한 장의 보고서로 정리합니다.</p>
      </header>
      <div id="start-region"></div>
      <div id="progress-region"></div>
    </div>
  `;
  document.getElementById('start-region').appendChild(startPanel(ctx, hasCache));
  renderProgress(ctx);
}
