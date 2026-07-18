/* ============================================================
   views/curr-grading.js — #/curriculum/grading
   성취도 A~E + 석차 5등급 + 예외 · matchQuiz 6문항
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function render(view, ctx) {
  const src = await ctx.data('grading');
  const stored = ctx.store.get('step2.quiz.grading') || { done: false, score: null };
  const rows = src.matchQuiz?.rows || [];
  const choices = src.matchQuiz?.choices || [];

  const bandRows = src.achievement5.bands.map(([range, letter]) => `
    <tr><td>${esc(range)}</td><td><b>${esc(letter)}</b></td></tr>
  `).join('');
  const rankRows = src.rankGrades5.map(g => `
    <tr><td class="rk">${g.grade}등급</td><td>${esc(g.cumulative)}</td><td>${esc(g.band)}</td></tr>
  `).join('');

  const exceptions = src.exceptions.map(x => `
    <li>
      <b>${esc(x.scope)}</b> — ${esc(x.treatment)}
      ${x.subjects ? `<small>대상: ${x.subjects.map(esc).join(' · ')}</small>` : ''}
    </li>
  `).join('');

  const quizItems = rows.map((r, i) => {
    const opts = ['<option value="">선택하세요</option>']
      .concat(choices.map(c => `<option value="${esc(c)}">${esc(c)}</option>`)).join('');
    return `
      <div class="j-quiz-item" data-q="${i}">
        <div class="j-quiz-prompt">
          <b>Q${i + 1}. ${esc(r.slot)}</b>
          <div class="j-quiz-clue">기록 예시 · <code>${esc(r.clue.record)}</code></div>
        </div>
        <select data-sel="${i}">${opts}</select>
        <details class="j-quiz-ans" hidden><summary>정답 · 해설</summary>
          <p><b>정답:</b> ${esc(r.answer)}<br><b>왜?</b> ${esc(r.why)}</p>
        </details>
      </div>`;
  }).join('');

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>성적 산출 방식 · A~E + 5등급</h1>
        <p>${esc(src.principle)}</p>
      </header>

      <section class="j-card">
        <h2>성취도 A~E <small>(절대평가)</small></h2>
        <p class="j-hint">${esc(src.achievement5.appliesTo)}</p>
        <div class="j-table-wrap">
          <table class="j-table"><thead><tr><th>학업성취율</th><th>성취도</th></tr></thead><tbody>${bandRows}</tbody></table>
        </div>
      </section>

      <section class="j-card">
        <h2>석차 5등급 <small>(상대평가)</small></h2>
        <div class="j-table-wrap">
          <table class="j-table"><thead><tr><th>등급</th><th>누적 비율</th><th>구간 폭</th></tr></thead><tbody>${rankRows}</tbody></table>
        </div>
      </section>

      <section class="j-card">
        <h2>예외 · 특례</h2>
        <ul class="j-list j-list-exceptions">${exceptions}</ul>
      </section>

      <section class="j-card">
        <h2>이수 기준</h2>
        <p>${esc(src.creditCompletion.rule)}</p>
        <p class="j-hint">${esc(src.creditCompletion.graduation)}</p>
      </section>

      <section class="j-card">
        <h2>매칭 퀴즈 <small>(${rows.length}문항, 힌트: 성적 기재 방식이 곧 과목 유형 단서)</small></h2>
        <p class="j-hint">${esc(src.matchQuiz.instruction)}</p>
        <div class="j-quiz-list">${quizItems}</div>
        <div class="j-quiz-actions">
          <button type="button" class="j-btn j-btn-primary" id="grade">채점</button>
          <button type="button" class="j-btn" id="retry" hidden>재도전</button>
          <span id="score" class="j-quiz-score">${stored.done && stored.score != null ? `이전 점수 ${stored.score} / ${rows.length}` : ''}</span>
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/curriculum/structure" class="j-btn">← 편제</a>
        <a href="#/curriculum/hierarchy" class="j-btn j-btn-primary">다음: 과목 위계 →</a>
      </nav>
    </article>
  `;

  const grade = () => {
    let correct = 0;
    rows.forEach((r, i) => {
      const item = view.querySelector(`.j-quiz-item[data-q="${i}"]`);
      const sel = item.querySelector('select');
      const ok = sel.value === r.answer;
      item.classList.toggle('is-correct', ok);
      item.classList.toggle('is-wrong', !ok);
      item.querySelector('.j-quiz-ans').hidden = false;
      if (ok) correct++;
    });
    view.querySelector('#score').textContent = `${correct} / ${rows.length}`;
    ctx.store.save({ step2: { quiz: { grading: { done: correct === rows.length, score: correct } } } });
    view.querySelector('#grade').hidden = true;
    view.querySelector('#retry').hidden = false;
  };
  const retry = () => {
    rows.forEach((_, i) => {
      const item = view.querySelector(`.j-quiz-item[data-q="${i}"]`);
      item.classList.remove('is-correct', 'is-wrong');
      item.querySelector('select').value = '';
      item.querySelector('.j-quiz-ans').hidden = true;
    });
    view.querySelector('#score').textContent = '';
    view.querySelector('#grade').hidden = false;
    view.querySelector('#retry').hidden = true;
  };
  view.querySelector('#grade').addEventListener('click', grade);
  view.querySelector('#retry').addEventListener('click', retry);
}
