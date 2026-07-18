/* ============================================================
   views/curr-structure.js — #/curriculum/structure
   2022 개정 편제 인터랙티브 + fillQuizAnswers 빈칸 퀴즈
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TYPE_LABELS = { general: '일반선택', career: '진로선택', fusion: '융합선택' };

function subjectsBadge(g, type) {
  const list = g[type] || [];
  if (!list.length) return '';
  return `<div class="j-elective is-${type}"><span class="j-elective-tag">${TYPE_LABELS[type]}</span> ${list.map(esc).join(', ')}</div>`;
}

function groupPanel(g) {
  const commonList = (g.common || []).map(esc).join(', ');
  const commonAlt  = (g.commonAlt || []).map(esc).join(', ');
  return `
    <details class="j-details j-group">
      <summary>
        <b>${esc(g.group)}</b>
        <span class="j-group-meta">${commonList ? '공통 ' + (g.common.length) + ' · ' : ''}선${(g.general || []).length + (g.career || []).length + (g.fusion || []).length}</span>
      </summary>
      ${commonList ? `<div class="j-common"><b>공통과목</b> ${commonList}${commonAlt ? ` <small>(대안: ${commonAlt})</small>` : ''}</div>` : ''}
      ${subjectsBadge(g, 'general')}
      ${subjectsBadge(g, 'career')}
      ${subjectsBadge(g, 'fusion')}
    </details>`;
}

function quizItem(id, prompt, expected) {
  return `
    <div class="j-quiz-item" data-quiz="${id}">
      <label class="j-field">
        <span>${esc(prompt)}</span>
        <input type="text" data-q="${id}" autocomplete="off">
      </label>
      <details class="j-quiz-ans" hidden><summary>정답 · 해설</summary><p><b>정답:</b> ${esc(expected)}</p></details>
    </div>`;
}

function normalize(s) {
  return String(s || '').replace(/\s+/g, '').replace(/[,·、]/g, ',').toLowerCase();
}
function tokens(s) {
  return normalize(s).split(',').filter(Boolean);
}
function matches(user, expected) {
  const u = tokens(user);
  const e = tokens(expected);
  if (u.length === 0) return false;
  return e.every(t => u.some(x => x.includes(t) || t.includes(x)));
}

export async function render(view, ctx) {
  const src = await ctx.data('curriculum');
  const stored = ctx.store.get('step2.quiz.structure') || { done: false, score: null };

  const groupsHtml = (src.groups || []).map(groupPanel).join('');
  const keyChanges = (src.keyChanges || []).map(x => `<li>${esc(x)}</li>`).join('');
  const eTypes = src.electiveTypes || {};
  const answers = src.fillQuizAnswers || {};
  const quizKeys = Object.keys(answers);

  const prompts = {
    '㉠': '보통교과는 (       ) 과목과 (       ) 과목으로 나뉜다. (2개, 쉼표로 구분)',
    '㉡': '선택과목은 (       ), (       ), (       ) 3분류로 나뉜다.',
    '㉢': '학기제 분권 대상이 아닌(기본학점이 다른) 4개 과목(군): (       ), (       ), (       ), (       ). (한국사·과학·기술가정·정보 등 특수 학점 과목)',
    '㉣': '학기제 분권(1·2)이 적용되는 과목 종류는 (       )과목이다.',
    '㉤': '"교과별 학문 영역 내 주요 학습 내용 이해 및 탐구"에 해당하는 선택 분류는? (       )',
    '㉥': '"교과 내·교과 간 주제 융합, 실생활 응용"에 해당하는 선택 분류는? (       )',
  };

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>2022 개정 보통교과 편제</h1>
        <p>공통과 선택(일반·진로·융합)으로 구성됩니다. 학과를 정하기 전에 편제 지도부터 이해합니다.</p>
      </header>

      <section class="j-card">
        <h2>핵심 변화</h2>
        <ul class="j-list">${keyChanges}</ul>
        <div class="j-elective-legend">
          <span class="j-elective-tag is-general">${TYPE_LABELS.general}</span> ${esc(eTypes['일반선택'] || '')}<br>
          <span class="j-elective-tag is-career">${TYPE_LABELS.career}</span> ${esc(eTypes['진로선택'] || '')}<br>
          <span class="j-elective-tag is-fusion">${TYPE_LABELS.fusion}</span> ${esc(eTypes['융합선택'] || '')}
        </div>
      </section>

      <section class="j-card">
        <h2>교과(군)별 편제 <small>(펼쳐 확인)</small></h2>
        <div class="j-groups">${groupsHtml}</div>
      </section>

      <section class="j-card">
        <h2>빈칸 퀴즈 <small>(자동 채점)</small></h2>
        <p class="j-hint">각 빈칸에 답을 입력하고 채점 버튼을 누르세요. 여러 개 답변은 쉼표로 구분합니다.</p>
        <div class="j-quiz-list">
          ${quizKeys.map(k => quizItem(k, `${k} ${prompts[k] || ''}`, answers[k])).join('')}
        </div>
        <div class="j-quiz-actions">
          <button type="button" class="j-btn j-btn-primary" id="grade">채점</button>
          <button type="button" class="j-btn" id="retry" hidden>재도전</button>
          <span id="score" class="j-quiz-score">${stored.done && stored.score != null ? `이전 점수 ${stored.score} / ${quizKeys.length}` : ''}</span>
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/self/summary" class="j-btn">← 종합 점검</a>
        <a href="#/curriculum/grading" class="j-btn j-btn-primary">다음: 성적 산출 →</a>
      </nav>
    </article>
  `;

  const gradeBtn = view.querySelector('#grade');
  const retryBtn = view.querySelector('#retry');
  const scoreEl = view.querySelector('#score');

  gradeBtn.addEventListener('click', () => {
    let correct = 0;
    quizKeys.forEach(k => {
      const item = view.querySelector(`.j-quiz-item[data-quiz="${k}"]`);
      const inp = item.querySelector(`input[data-q="${k}"]`);
      const ok = matches(inp.value, answers[k]);
      item.classList.toggle('is-correct', ok);
      item.classList.toggle('is-wrong', !ok);
      item.querySelector('.j-quiz-ans').hidden = false;
      if (ok) correct++;
    });
    scoreEl.textContent = `${correct} / ${quizKeys.length}`;
    const done = correct === quizKeys.length;
    ctx.store.save({ step2: { quiz: { structure: { done, score: correct } } } });
    gradeBtn.hidden = true;
    retryBtn.hidden = false;
  });

  retryBtn.addEventListener('click', () => {
    quizKeys.forEach(k => {
      const item = view.querySelector(`.j-quiz-item[data-quiz="${k}"]`);
      item.classList.remove('is-correct', 'is-wrong');
      item.querySelector('.j-quiz-ans').hidden = true;
      item.querySelector('input').value = '';
    });
    scoreEl.textContent = '';
    gradeBtn.hidden = false;
    retryBtn.hidden = true;
  });
}
