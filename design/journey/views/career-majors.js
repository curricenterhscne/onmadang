/* ============================================================
   views/career-majors.js — #/career/majors
   담은 학과 목록(majors 훅) + 관심 계열·학과 기록 + 같은 이름 다른 학과 비교
   + 계열 매칭 2028 권장과목 참고 카드
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* recommended-subjects 계열명 → 사용자 입력 매칭 (부분 일치) */
function matchRecField(userField, recs) {
  if (!userField) return null;
  const q = userField.replace(/\s+/g, '').toLowerCase();
  const list = recs.fields || [];
  return list.find(r => {
    const f = (r.field || '').replace(/\s+/g, '').toLowerCase();
    const u = (r.units || '').replace(/\s+/g, '').toLowerCase();
    return f.includes(q) || q.includes(f) || u.includes(q);
  }) || null;
}

function recRow(label, mathList, sciList) {
  const m = mathList?.length ? `<b>수학:</b> ${mathList.map(esc).join(', ')}` : '';
  const s = sciList?.length ? `<b>과학:</b> ${sciList.map(esc).join(', ')}` : '';
  const body = [m, s].filter(Boolean).join(' · ') || '<i>없음</i>';
  return `<div class="j-rec-row"><span class="j-rec-tag">${label}</span><span>${body}</span></div>`;
}

function savedMajorsHtml(list) {
  if (!list.length) return `<p class="j-hint">아직 담은 학과가 없습니다. <a href="../majors/" target="_blank" rel="noopener">대학 학과 안내 ↗</a>에서 관심 학과를 담아보세요.</p>`;
  return `
    <ul class="j-saved-list">
      ${list.map((m, i) => `
        <li>
          <div class="j-saved-head">
            <b>${esc(m.name)}</b> <span class="j-mini-badge">${esc(m.categoryName || '')}</span>
          </div>
          ${m.coreSubjects?.length ? `<div class="j-saved-body"><span>진로선택 권장</span> ${m.coreSubjects.map(esc).slice(0, 8).join(' · ')}${m.coreSubjects.length > 8 ? ' …' : ''}</div>` : ''}
          <button type="button" class="j-mini-del" data-del="${i}" aria-label="삭제">삭제</button>
        </li>
      `).join('')}
    </ul>`;
}

function readinessFields(prefix, r) {
  return `
    <div class="j-fields j-readiness">
      <label class="j-field"><span>학업역량 (교과 이수·성취 준비)</span><textarea rows="2" data-${prefix}-r="academic">${esc(r.academic || '')}</textarea></label>
      <label class="j-field"><span>진로역량 (전공 관련 활동·경험)</span><textarea rows="2" data-${prefix}-r="career">${esc(r.career || '')}</textarea></label>
      <label class="j-field"><span>공동체역량 (협업·나눔·리더십)</span><textarea rows="2" data-${prefix}-r="community">${esc(r.community || '')}</textarea></label>
    </div>`;
}

function compareSide(side, data) {
  return `
    <div class="j-compare-side" data-side="${side}">
      <h4>${side.toUpperCase()}. 후보 학과</h4>
      <div class="j-fields">
        <label class="j-field"><span>대학</span><input type="text" data-cmp="${side}.univ" value="${esc(data.univ || '')}"></label>
        <label class="j-field"><span>계열</span><input type="text" data-cmp="${side}.field" value="${esc(data.field || '')}"></label>
        <label class="j-field"><span>학과의 목표</span><textarea rows="2" data-cmp="${side}.goal">${esc(data.goal || '')}</textarea></label>
        <label class="j-field"><span>주로 배우는 내용</span><textarea rows="2" data-cmp="${side}.learn">${esc(data.learn || '')}</textarea></label>
        <label class="j-field"><span>졸업 후 진로</span><textarea rows="2" data-cmp="${side}.jobs">${esc(data.jobs || '')}</textarea></label>
        <label class="j-field"><span>관련 선택 과목</span><input type="text" data-cmp="${side}.linkedSubjects" value="${esc(data.linkedSubjects || '')}"></label>
      </div>
    </div>`;
}

export async function render(view, ctx) {
  const recs = await ctx.data('recommended-subjects').catch(() => ({ fields: [] }));

  const s3 = ctx.store.get('step3') || {};
  const saved = s3.savedMajors || [];
  const field = s3.field || {};
  const dept  = s3.department || {};
  const cmp   = s3.sameNameCompare || {};

  view.innerHTML = `
    <article class="j-view">
      <header class="j-view-head">
        <h1>진로설계 · 학과 탐색</h1>
        <p>관심 학과를 담고, 계열/학과의 이유·역량 계획을 세우고, 같은 이름 다른 학과를 비교합니다.</p>
      </header>

      <section class="j-card">
        <h2>내가 담은 학과 <small>(<a href="../majors/" target="_blank" rel="noopener">대학 학과 안내 ↗</a>에서 담기)</small></h2>
        <div id="saved-region">${savedMajorsHtml(saved)}</div>
      </section>

      <section class="j-card">
        <h2>관심 계열</h2>
        <div class="j-fields">
          <label class="j-field"><span>관심 있는 계열</span><input type="text" id="f-field" value="${esc(field.interested || '')}" placeholder="예: 컴퓨터, 생명과학, 인문사회 …"></label>
          <label class="j-field"><span>그 이유</span><textarea rows="2" id="f-reason">${esc(field.reason || '')}</textarea></label>
        </div>
        <h3>역량 준비 계획</h3>
        ${readinessFields('f', field.readiness || {})}
        <div id="rec-region" class="j-rec-region"></div>
      </section>

      <section class="j-card">
        <h2>관심 학과</h2>
        <div class="j-fields">
          <label class="j-field"><span>관심 있는 학과</span><input type="text" id="d-interested" value="${esc(dept.interested || '')}" placeholder="예: 심리학과"></label>
          <label class="j-field"><span>그 이유</span><textarea rows="2" id="d-reason">${esc(dept.reason || '')}</textarea></label>
        </div>
        <h3>역량 준비 계획</h3>
        ${readinessFields('d', dept.readiness || {})}
      </section>

      <section class="j-card">
        <h2>같은 이름, 다른 학과 비교</h2>
        <p class="j-hint">같은 학과명이라도 대학마다 학과 목표·배우는 내용·진로가 다를 수 있습니다. 두 학과를 나란히 비교해 보세요.</p>
        <label class="j-field" style="margin-bottom:10px"><span>비교할 학과명</span><input type="text" id="cmp-name" value="${esc(cmp.deptName || '')}" placeholder="예: 심리학과"></label>
        <div class="j-compare-grid">
          ${compareSide('a', cmp.a || {})}
          ${compareSide('b', cmp.b || {})}
        </div>
      </section>

      <nav class="j-nav">
        <a href="#/curriculum/hierarchy" class="j-btn">← 과목 위계</a>
        <a href="#/career/mandarat" class="j-btn j-btn-primary">다음: 만다라트 →</a>
      </nav>
    </article>
  `;

  // 담은 학과 삭제
  const savedRegion = view.querySelector('#saved-region');
  savedRegion.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const idx = Number(btn.dataset.del);
    const list = [...(ctx.store.get('step3.savedMajors') || [])];
    list.splice(idx, 1);
    ctx.store.save({ step3: { savedMajors: list } });
    savedRegion.innerHTML = savedMajorsHtml(list);
  });

  // 계열 필드
  const fField = view.querySelector('#f-field');
  const fReason = view.querySelector('#f-reason');
  const updateRec = () => {
    const region = view.querySelector('#rec-region');
    const match = matchRecField(fField.value, recs);
    if (!match) { region.innerHTML = ''; return; }
    region.innerHTML = `
      <div class="j-rec-card">
        <div class="j-rec-head"><b>2028 권장 과목 참고</b> · ${esc(match.field)} <small>(${esc(match.units || '')})</small></div>
        ${recRow('핵심', match.core?.math, match.core?.science)}
        ${recRow('권장', match.recommended?.math, match.recommended?.science)}
        <p class="j-hint" style="margin-top:6px">${esc(recs.legend?.core || '')} · ${esc(recs.legend?.recommended || '')}</p>
      </div>`;
  };
  updateRec();
  fField.addEventListener('input', debounce(() => {
    ctx.store.save({ step3: { field: { interested: fField.value } } });
    updateRec();
  }));
  fReason.addEventListener('input', debounce(() => {
    ctx.store.save({ step3: { field: { reason: fReason.value } } });
  }));

  // 학과 필드
  view.querySelector('#d-interested').addEventListener('input', debounce((e) => {
    ctx.store.save({ step3: { department: { interested: e.target.value } } });
  }));
  view.querySelector('#d-reason').addEventListener('input', debounce((e) => {
    ctx.store.save({ step3: { department: { reason: e.target.value } } });
  }));

  // 역량 3종 (계열·학과 각각)
  const readinessSave = (prefix, key) => (e) => {
    const pathTop = prefix === 'f' ? 'field' : 'department';
    ctx.store.save({ step3: { [pathTop]: { readiness: { [key]: e.target.value } } } });
  };
  view.querySelectorAll('[data-f-r]').forEach(el => el.addEventListener('input', debounce(readinessSave('f', el.dataset.fR))));
  view.querySelectorAll('[data-d-r]').forEach(el => el.addEventListener('input', debounce(readinessSave('d', el.dataset.dR))));

  // 비교
  view.querySelector('#cmp-name').addEventListener('input', debounce((e) => {
    ctx.store.save({ step3: { sameNameCompare: { deptName: e.target.value } } });
  }));
  view.querySelectorAll('[data-cmp]').forEach(el => el.addEventListener('input', debounce(() => {
    const [side, key] = el.dataset.cmp.split('.');
    ctx.store.save({ step3: { sameNameCompare: { [side]: { [key]: el.value } } } });
  })));
}
