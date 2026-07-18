/* ============================================================
   views/report-print.js — #/report/print
   보고서 전체 조립: 표지 → 종합점검표 → 관심 학과 → 이력카드 → 만다라트 → 체크리스트 → 로드맵
   ============================================================ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms = 220) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function fmt(n) { return n == null || Number.isNaN(n) ? '-' : (n % 1 === 0 ? String(n) : String(Number(n.toFixed(1)))); }
function fmtDate(d = new Date()) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
}

function section(title, body) {
  return `<section class="rp-section print-avoid-break"><h2>${esc(title)}</h2>${body}</section>`;
}

function nvl(v, alt = '<i class="rp-i">미기록</i>') { return v && String(v).trim() ? esc(v) : alt; }
function nvlArr(arr, mapper) {
  if (!Array.isArray(arr) || !arr.length) return '<i class="rp-i">미기록</i>';
  return arr.map(mapper).join(', ');
}

function buildStep1(s1) {
  const strengths = (s1.prologue?.strengths || []).join(', ') || '<i class="rp-i">미기록</i>';
  const pledge = (s1.prologue?.pledge || []).filter(Boolean).join(' / ') || '<i class="rp-i">미기록</i>';
  const interest = (s1.interest?.ranks || []).map(r => `${r.rank}순위 <b>${esc(r.type)}</b>${r.jobs ? '(' + esc(r.jobs) + ')' : ''}`).join(' · ') || '<i class="rp-i">미기록</i>';
  const aptHigh = (s1.aptitude?.high || []).map(a => esc(a.area)).filter(Boolean).join(', ') || '<i class="rp-i">미기록</i>';
  const values = (s1.values?.myTop3 || []).map(v => esc(v.value)).filter(Boolean).join(', ') || '<i class="rp-i">미기록</i>';
  const jobs = (s1.jobs || []).map(j => `<b>${esc(j.name)}</b>${j.majors ? ' (' + esc(j.majors) + ')' : ''}`).join(' · ') || '<i class="rp-i">미기록</i>';
  return `
    <table class="rp-table">
      <tr><th>강점</th><td>${strengths}</td></tr>
      <tr><th>배움서약</th><td>${pledge}</td></tr>
      <tr><th>흥미 유형</th><td>${interest}</td></tr>
      <tr><th>적성 상위</th><td>${aptHigh}</td></tr>
      <tr><th>가치관</th><td>${values}</td></tr>
      <tr><th>관심 직업</th><td>${jobs}</td></tr>
      <tr><th>결론</th><td><b>${nvl(s1.summary?.conclusion)}</b></td></tr>
    </table>`;
}

function buildStep3(s3) {
  const readiness = (r) => {
    r = r || {};
    return `<ul class="rp-ul"><li>학업: ${nvl(r.academic)}</li><li>진로: ${nvl(r.career)}</li><li>공동체: ${nvl(r.community)}</li></ul>`;
  };
  const saved = (s3.savedMajors || []).map(m => `<li><b>${esc(m.name)}</b>${m.categoryName ? ' (' + esc(m.categoryName) + ')' : ''}</li>`).join('');
  return `
    <table class="rp-table">
      <tr><th>담은 학과</th><td>${saved ? `<ol class="rp-ol">${saved}</ol>` : '<i class="rp-i">미기록</i>'}</td></tr>
      <tr><th>관심 계열</th><td><b>${nvl(s3.field?.interested)}</b> — ${nvl(s3.field?.reason)}<br>${readiness(s3.field?.readiness)}</td></tr>
      <tr><th>관심 학과</th><td><b>${nvl(s3.department?.interested)}</b> — ${nvl(s3.department?.reason)}<br>${readiness(s3.department?.readiness)}</td></tr>
      <tr><th>같은 이름 비교</th><td>${nvl(s3.sameNameCompare?.deptName)} — A: ${nvl(s3.sameNameCompare?.a?.univ)} / B: ${nvl(s3.sameNameCompare?.b?.univ)}</td></tr>
    </table>`;
}

function buildStep4Courses(cp, req) {
  if (!cp || !cp.summary) return '<p class="rp-empty">selector 실습 결과가 아직 없습니다. 상단에서 파일을 불러오세요.</p>';
  const sum = cp.summary || {};
  const gb = sum.groupBreakdown || {};
  const rows = (req.requiredByGroup || []).map(r => {
    const have = Number(gb[r.group]) || 0;
    const ok = have >= r.credits;
    return `<tr><td>${esc(r.group)}</td><td class="right">${fmt(have)}</td><td class="right">${r.credits}</td><td>${ok ? '충족' : '부족'}</td></tr>`;
  }).join('');
  const total = Number(sum.totalCredits) || 0;
  const kme = ['국어', '수학', '영어'].reduce((a, g) => a + (Number(gb[g]) || 0), 0);
  const cap = req.koreanMathEnglishCap?.cap ?? 81;
  return `
    <p><b>학교:</b> ${esc(cp.schoolName || '')} ${cp.department ? '· ' + esc(cp.department) : ''}
       <br><b>총 이수:</b> ${fmt(total)} / ${req.graduation?.total || 192}학점 · <b>창체:</b> ${fmt(sum.changcheCredits)}
       <br><b>국·수·영:</b> ${fmt(kme)} / ${cap}${kme > cap ? ' <span class="rp-warn">초과</span>' : ''}</p>
    <table class="rp-table rp-numeric">
      <thead><tr><th>교과(군)</th><th class="right">이수</th><th class="right">필수</th><th>충족</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildMandarat(m) {
  if (!m) return '<p class="rp-empty">미기록</p>';
  const grades = ['grade1', 'grade2', 'grade3'];
  const has = grades.some(g => Object.values(m[g]?.cells || {}).some(v => (Array.isArray(v) ? v.length : v)));
  if (!has) return '<p class="rp-empty">미기록</p>';
  return grades.map((g, i) => {
    const cells = m[g]?.cells || {};
    const items = Object.entries(cells).filter(([, v]) => (Array.isArray(v) ? v.length : v));
    if (!items.length) return '';
    return `<div class="rp-mandala"><b>${i + 1}학년</b><ul class="rp-ul">${items.map(([k, v]) => `<li><span class="rp-mandala-k">${esc(k)}:</span> ${Array.isArray(v) ? v.map(esc).join(', ') : esc(v)}</li>`).join('')}</ul></div>`;
  }).join('');
}

function buildChecklist(cl, checklistSrc) {
  if (!cl?.answers) return '<p class="rp-empty">미기록</p>';
  const cats = (checklistSrc.categories || []).map(cat => {
    const items = cat.items.map((item, idx) => {
      const key = `${cat.name}.${idx}`;
      const v = cl.answers[key];
      const mark = v === 'O' ? '✓' : v === 'X' ? '✗' : '?';
      const cls = v === 'O' ? 'rp-ok' : v === 'X' ? 'rp-no' : 'rp-hold';
      return `<li class="${cls}"><span class="rp-mark">${mark}</span> ${esc(item)}</li>`;
    }).join('');
    return `<h4>${esc(cat.name)}</h4><ul class="rp-ul rp-check">${items}</ul>`;
  }).join('');
  return cats;
}

function buildRoadmap(r) {
  if (!r?.careerGoal && !(r?.phases || []).length) return '<p class="rp-empty">미기록</p>';
  const phases = (r.phases || []).filter(p => p.goal && p.goal.trim());
  const rows = phases.map(p => `<tr><th>${esc(p.id)}${p.years ? ` (${p.years}년)` : ''}</th><td>${esc(p.goal)}</td></tr>`).join('');
  return `
    <p><b>최종 목표:</b> ${nvl(r.careerGoal)}</p>
    ${rows ? `<table class="rp-table"><tbody>${rows}</tbody></table>` : ''}
    ${r.afterThoughts ? `<p><b>느낀 점:</b> ${esc(r.afterThoughts)}</p>` : ''}`;
}

function buildPeer(p) {
  const given = (p?.given || []).filter(x => x && (x.friend || x.track || x.good || x.fix));
  const rcv = (p?.received || []).filter(x => x && (x.friend || x.advice));
  if (!given.length && !rcv.length && !p?.revisionNote) return '';
  const givenTbl = given.length ? `<h4>친구에게 준 조언</h4><table class="rp-table"><thead><tr><th>친구</th><th>계열/학과</th><th>좋은 점</th><th>수정할 점</th></tr></thead><tbody>${given.map(x => `<tr><td>${esc(x.friend)}</td><td>${esc(x.track)}</td><td>${esc(x.good)}</td><td>${esc(x.fix)}</td></tr>`).join('')}</tbody></table>` : '';
  const rcvTbl = rcv.length ? `<h4>받은 조언</h4><ul class="rp-ul">${rcv.map(x => `<li>${esc(x.friend) || '익명'}: ${esc(x.advice)}</li>`).join('')}</ul>` : '';
  const note = p?.revisionNote ? `<h4>수정·보완 메모</h4><p>${esc(p.revisionNote)}</p>` : '';
  return givenTbl + rcvTbl + note;
}

export async function render(view, ctx) {
  const req = await ctx.data('required-credits');
  const checklistSrc = await ctx.data('checklist');

  const profile = ctx.store.get('profile') || {};
  const s1 = ctx.store.get('step1') || {};
  const s3 = ctx.store.get('step3') || {};
  const s4 = ctx.store.get('step4') || {};

  view.innerHTML = `
    <article class="j-view rp-view">
      <header class="j-view-head no-print">
        <h1>진로학업설계서 · 최종 조립</h1>
        <p>모든 단계 기록을 한 페이지에 모았습니다. 표지 정보만 채운 뒤 <b>PDF로 저장(인쇄)</b>하거나 <b>설계서 파일 저장</b>으로 백업하세요.</p>
      </header>

      <section class="j-card no-print rp-actions">
        <div class="j-fields" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));display:grid">
          <label class="j-field"><span>학교</span><input type="text" id="p-school" value="${esc(profile.school || '')}"></label>
          <label class="j-field"><span>학년</span><input type="number" id="p-grade" value="${profile.grade ?? ''}" min="1" max="3"></label>
          <label class="j-field"><span>반·번호</span><input type="text" id="p-class" value="${esc(profile.classNo || '')}"></label>
          <label class="j-field"><span>이름</span><input type="text" id="p-name" value="${esc(profile.name || '')}"></label>
        </div>
        <div class="j-inline-actions" style="margin-top:12px">
          <button class="j-btn j-btn-primary" id="btn-print">PDF로 저장 (인쇄)</button>
          <button class="j-btn" id="btn-savefile">설계서 파일 저장</button>
        </div>
      </section>

      <div class="rp-doc">
        <div class="rp-cover print-avoid-break">
          <div class="rp-cover-brand">온마당 · 진로학업설계서</div>
          <h1 class="rp-cover-title">진로학업설계서</h1>
          <table class="rp-cover-table">
            <tr><th>학교</th><td id="cov-school">${nvl(profile.school)}</td></tr>
            <tr><th>학년</th><td id="cov-grade">${nvl(profile.grade)}</td></tr>
            <tr><th>반 · 번호</th><td id="cov-class">${nvl(profile.classNo)}</td></tr>
            <tr><th>이름</th><td id="cov-name">${nvl(profile.name)}</td></tr>
            <tr><th>작성일</th><td>${fmtDate()}</td></tr>
          </table>
        </div>

        ${section('1. 자기 이해 · 종합 점검표', buildStep1(s1))}
        ${section('2. 관심 학과·계열 기록', buildStep3(s3))}
        ${section('3. 수강 이력카드 (selector)', buildStep4Courses(s4.coursePlan, req))}
        ${section('4. 만다라트 (창의적 체험활동 설계)', buildMandarat(s4.mandarat))}
        ${section('5. 체크리스트', buildChecklist(s4.checklist, checklistSrc))}
        ${section('6. 진로 로드맵', buildRoadmap(s4.roadmap))}
        ${buildPeer(s4.peerReview) ? section('7. 친구·선생님 조언', buildPeer(s4.peerReview)) : ''}
      </div>

      <nav class="j-nav no-print">
        <a href="#/report/check" class="j-btn">← 체크리스트</a>
        <a href="#/" class="j-btn">대시보드</a>
      </nav>
    </article>
  `;

  const bindProfile = (id, key, isNum = false) => {
    const inp = view.querySelector(id);
    inp.addEventListener('input', debounce(() => {
      const v = isNum ? (inp.value ? Number(inp.value) : null) : inp.value;
      ctx.store.save({ profile: { [key]: v } });
      const cov = view.querySelector(`#cov-${key === 'classNo' ? 'class' : key}`);
      if (cov) cov.textContent = String(v ?? '') || '미기록';
    }));
  };
  bindProfile('#p-school', 'school');
  bindProfile('#p-grade', 'grade', true);
  bindProfile('#p-class', 'classNo');
  bindProfile('#p-name', 'name');

  view.querySelector('#btn-print').addEventListener('click', () => { window.print(); });
  view.querySelector('#btn-savefile').addEventListener('click', () => { ctx.store.exportFile(); });
}
