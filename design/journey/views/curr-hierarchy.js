/* ============================================================
   views/curr-hierarchy.js — #/curriculum/hierarchy
   수학·과학 이수경로 SVG + pathQuizAnswers + suneung 안내 + selector 링크
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pathDiagram(section) {
  const c = section.paths.common;
  const gen = section.paths.general;
  const car = section.paths.career;
  const commonLabel = c.length === 4 ? '통합과학1·2 + 실험1·2' : (c.join('·'));

  const nodeRow = (items, cls) => items.map(n => `<span class="node ${cls}">${esc(n)}</span>`).join('');

  return `
    <div class="j-hier">
      <div class="row"><span class="col-label">공통</span><div class="col-nodes">${nodeRow([commonLabel], 'is-common')}</div></div>
      <div class="arrow" aria-hidden="true">↓</div>
      <div class="row"><span class="col-label">일반선택</span><div class="col-nodes">${nodeRow(gen, 'is-general')}</div></div>
      <div class="arrow" aria-hidden="true">↓</div>
      <div class="row"><span class="col-label">진로선택</span><div class="col-nodes">${nodeRow(car, 'is-career')}</div></div>
    </div>
    <details class="j-details">
      <summary>이수경로 상세 (선수 관계)</summary>
      <ul class="j-list">
        ${section.paths.edges.map(([a, b]) => `<li><b>${esc(a)}</b> → ${esc(b)}</li>`).join('')}
      </ul>
      <ul class="j-list">
        ${section.notes.map(n => `<li>${esc(n)}</li>`).join('')}
      </ul>
    </details>
  `;
}

function normalize(s) { return String(s || '').replace(/\s+/g, '').replace(/[,·、/]/g, ',').toLowerCase(); }
function tokens(s) { return normalize(s).split(',').filter(Boolean); }
function looseMatch(user, expected) {
  const u = tokens(user);
  const e = tokens(expected);
  if (u.length === 0) return false;
  return e.every(t => u.some(x => x.includes(t) || t.includes(x)));
}

export async function render(view, ctx) {
  const src = await ctx.data('subject-hierarchy');
  const suneung = await ctx.data('suneung');
  const stored = ctx.store.get('step2.quiz.hierarchy') || { done: false, score: null };
  const ans = src.pathQuizAnswers || {};

  const mySchoolName = ctx.store.get('step2.mySchool.schoolName') || '';
  const visited = !!ctx.store.get('step2.mySchool.visitedSelector');

  const suneungRows = (suneung.table || []).map(r => `
    <tr><td>${esc(r.area)}</td><td>${esc(r.subjects)}${r.absolute ? ' <small>(절대평가)</small>' : ''}</td></tr>
  `).join('');

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>보통교과 과목의 위계</h1>
        <p>수학·과학은 선수 학습이 뚜렷합니다. 이수 순서를 이해하고 학과 요구와 맞춰 설계하세요.</p>
      </header>

      <section class="j-card">
        <h2>원칙</h2>
        <ul class="j-list">${src.principles.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      </section>

      <section class="j-card">
        <h2>수학 이수경로</h2>
        ${pathDiagram(src.math)}
      </section>

      <section class="j-card">
        <h2>과학 이수경로</h2>
        ${pathDiagram(src.science)}
      </section>

      <section class="j-card j-suneung">
        <h2>2028 통합수능과의 관계</h2>
        <p class="j-hint">${esc(suneung.keyChange)}</p>
        <div class="j-table-wrap">
          <table class="j-table"><thead><tr><th>영역</th><th>과목</th></tr></thead><tbody>${suneungRows}</tbody></table>
        </div>
        <p class="j-hint">${esc(suneung.implication)}</p>
      </section>

      <section class="j-card">
        <h2>이수경로 퀴즈</h2>
        <p class="j-hint">빈칸에 순서대로 알맞은 과목명(대표군)을 채워 넣으세요. 여러 개는 쉼표로 구분.</p>
        <div class="j-quiz-item" data-q="mathSequence">
          <label class="j-field">
            <span>Q1. 수학: [공통과목] → (       ) → (       )</span>
            <input type="text" placeholder="예: 대수·미적분Ⅰ , 미적분Ⅱ" data-qi>
          </label>
          <details class="j-quiz-ans" hidden><summary>정답</summary><p><b>정답:</b> ${esc(ans.mathSequence.join(' → '))}</p></details>
        </div>
        <div class="j-quiz-item" data-q="scienceSequence">
          <label class="j-field">
            <span>Q2. 과학: [공통과목] → (       ) → (       )</span>
            <input type="text" placeholder="예: 물리학, 역학과 에너지 / 전자기와 양자" data-qi>
          </label>
          <details class="j-quiz-ans" hidden><summary>정답</summary><p><b>정답:</b> ${esc(ans.scienceSequence.join(' → '))}</p></details>
        </div>
        <div class="j-quiz-actions">
          <button type="button" class="j-btn j-btn-primary" id="grade">채점</button>
          <button type="button" class="j-btn" id="retry" hidden>재도전</button>
          <span id="score" class="j-quiz-score">${stored.done && stored.score != null ? `이전 점수 ${stored.score} / 2` : ''}</span>
        </div>
      </section>

      <section class="j-card j-selector-link">
        <h2>우리 학교 편제표로 실습</h2>
        <p>이론을 익혔다면, 실제 학교 편성표를 열어 3년간 과목을 선택해 봅니다. 완료하면 이력카드가 자동 생성됩니다.</p>
        <div class="j-fields">
          <label class="j-field">
            <span>우리 학교 이름 (선택)</span>
            <input type="text" id="my-school" value="${esc(mySchoolName)}" placeholder="예: 충남고등학교">
          </label>
        </div>
        <div class="j-inline-actions">
          <a class="j-btn j-btn-primary" href="../selector/" id="go-selector">과목 선택 실습 열기 ↗</a>
          <label class="j-check">
            <input type="checkbox" id="visited" ${visited ? 'checked' : ''}>
            <span>우리 학교 교육과정을 살펴봤습니다</span>
          </label>
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/curriculum/grading" class="j-btn">← 성적 산출</a>
        <a href="#/career/majors" class="j-btn j-btn-primary">다음 단계: 진로설계 활동 →</a>
      </nav>
    </article>
  `;

  const grade = () => {
    let correct = 0;
    ['mathSequence', 'scienceSequence'].forEach(key => {
      const item = view.querySelector(`.j-quiz-item[data-q="${key}"]`);
      const inp = item.querySelector('input');
      const expected = (ans[key] || []).slice(1).join(','); // 첫번째는 공통과목 예시로 이미 제시
      const ok = looseMatch(inp.value, expected);
      item.classList.toggle('is-correct', ok);
      item.classList.toggle('is-wrong', !ok);
      item.querySelector('.j-quiz-ans').hidden = false;
      if (ok) correct++;
    });
    view.querySelector('#score').textContent = `${correct} / 2`;
    ctx.store.save({ step2: { quiz: { hierarchy: { done: correct === 2, score: correct } } } });
    view.querySelector('#grade').hidden = true;
    view.querySelector('#retry').hidden = false;
  };
  const retry = () => {
    ['mathSequence', 'scienceSequence'].forEach(key => {
      const item = view.querySelector(`.j-quiz-item[data-q="${key}"]`);
      item.classList.remove('is-correct', 'is-wrong');
      item.querySelector('input').value = '';
      item.querySelector('.j-quiz-ans').hidden = true;
    });
    view.querySelector('#score').textContent = '';
    view.querySelector('#grade').hidden = false;
    view.querySelector('#retry').hidden = true;
  };
  view.querySelector('#grade').addEventListener('click', grade);
  view.querySelector('#retry').addEventListener('click', retry);

  const schoolInp = view.querySelector('#my-school');
  const visitedCB = view.querySelector('#visited');
  const goBtn = view.querySelector('#go-selector');

  schoolInp.addEventListener('input', () => {
    ctx.store.save({ step2: { mySchool: { schoolName: schoolInp.value } } });
  });
  visitedCB.addEventListener('change', () => {
    ctx.store.save({ step2: { mySchool: { visitedSelector: visitedCB.checked } } });
  });
  goBtn.addEventListener('click', () => {
    ctx.store.save({ step2: { mySchool: { visitedSelector: true } } });
  });
}
