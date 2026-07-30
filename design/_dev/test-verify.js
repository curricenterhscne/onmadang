/* 판정 엔진 실데이터 검증 — node test-verify.js */
const fs = require('fs');
const path = require('path');

const REPO = require('path').resolve(__dirname, '..', '..');
const ASSETS = require('path').resolve(__dirname, '..', 'data');
const Plan = require('../js/jinro-plan.js');
const Verify = require('../js/jinro-verify.js');

const J = p => JSON.parse(fs.readFileSync(p, 'utf-8'));

const rules = {
  requiredCredits: J(`${ASSETS}/required-credits.json`),
  grading:         J(`${ASSETS}/grading.json`),
  hierarchy:       J(`${ASSETS}/subject-hierarchy.json`),
  recommended:     J(`${ASSETS}/recommended-subjects.json`),
  alias:           J('../data/group-alias.json')
};

/** 학생이 안내대로 고른 경우를 모사: 선택군마다 selectCount 만큼 앞에서 채움 */
function autoSelect(catalog, take) {
  const sel = [];
  catalog.groups.forEach((g, gi) => {
    if (g.isSoonjeung) return;
    if (g.division === '지정') {
      g.subjects.forEach((s, si) =>
        (s.semCredits || []).forEach((c, i) => { if (parseFloat(c)) sel.push(`g${gi}-s${si}-sem${i}`); }));
      return;
    }
    const m = /택\s*(\d+)/.exec(g.selectCount || '');
    let n = m ? +m[1] : 1;
    if (take != null) n = Math.max(0, n - take);           // 일부러 덜 고르게
    (g.semesters || []).forEach((active, semIdx) => {
      if (!active) return;
      for (let si = 0; si < Math.min(n, g.subjects.length); si++) sel.push(`g${gi}-s${si}-sem${semIdx}`);
    });
  });
  return sel;
}

function makePlan(year, code, name, catalog, take) {
  return {
    schema: 'cne_course_selector/v1',
    exportedAt: new Date().toISOString(),
    year, schoolCode: code, schoolName: name, department: null,
    selections: autoSelect(catalog, take),
    preset: null,
    summary: null
  };
}

function line(c) {
  const badge = { ok: '  OK  ', warn: ' WARN ', error: 'ERROR ', unknown: '  ?   ' }[c.level];
  let s = `  [${badge}] ${c.title}${c.value ? '  — ' + c.value : ''}`;
  if (c.detail) s += `\n           ${c.detail}`;
  if (c.fix)    s += `\n           → ${c.fix}`;
  return s;
}

function run(label, year, code, name, take, intent) {
  const catalog = J(`${REPO}/design/selector/data/curriculum_${year}/${code}.json`);
  const plan = makePlan(year, code, name, catalog, take);
  const R = Plan.resolve(plan, catalog, rules.alias);
  const rep = Verify.verify({ resolved: R, rules, intent });

  console.log('\n' + '='.repeat(78));
  console.log(`▶ ${label}`);
  console.log(`  학교=${name} (${code}) ${year}학년도 | 복원수준=${rep.level} | 선택 ${plan.selections.length}건`);
  console.log(`  교과 ${rep.totals.subjectCredits} + 창체 ${rep.totals.changche} = 총 ${rep.totals.total}학점`);
  console.log(`  판정: ok ${rep.counts.ok} / warn ${rep.counts.warn} / error ${rep.counts.error} / unknown ${rep.counts.unknown}`);
  console.log('-'.repeat(78));
  rep.checks.forEach(c => console.log(line(c)));
  const gr = rep.checks.find(c => c.id === 'group-required');
  if (gr && gr.rows) {
    console.log('\n  [교과(군)별 이수]');
    gr.rows.forEach(r => console.log(`    ${r.ok ? '✓' : '✗'} ${r.group.padEnd(30)} ${String(r.got).padStart(5)} / ${r.need}`));
    if (Object.keys(R.unmapped).length) console.log('    · 필수이수 판정 제외(전문교과 등):', JSON.stringify(R.unmapped, null, 0));
  }
  return { R, rep };
}

// ── 1. 정상 케이스 (안내대로 다 고름)
const dir = `${REPO}/design/selector/data/curriculum_2026`;
const files = fs.readdirSync(dir).filter(f => !f.includes('(')).sort();
const code1 = path.basename(files[0], '.json');
run('정상 — 선택군을 안내대로 모두 채운 경우', '2026', code1, '샘플고A');

// ── 2. 미달 케이스 (선택군마다 1과목씩 덜 고름) + 희망계열 지정
run('미달 — 선택군마다 1과목씩 덜 고른 경우 (희망: 의학(의예))', '2026', code1, '샘플고A', 1, { field: '의학(의예)' });

// ── 3. 열화 케이스 (편성표 없이 summary 만)
console.log('\n' + '='.repeat(78));
console.log('▶ 열화 — 편성표를 불러오지 못한 경우 (summary 만)');
const catalog1 = J(`${dir}/${code1}.json`);
const p3 = makePlan('2026', code1, '샘플고A', catalog1, null);
// 실제 내보내기처럼 summary 를 채운다 (편성표 group 값 그대로 = 한국사가 사회에 섞임)
const R0 = Plan.resolve(makePlan('2026', code1, '샘플고A', catalog1, null), catalog1, rules.alias);
const bd = {}; R0.items.forEach(it => bd[it.group] = (bd[it.group] || 0) + it.credits);
p3.summary = { totalCredits: R0.totals.total, changcheCredits: R0.totals.changche, groupBreakdown: bd };
const R3 = Plan.resolve(p3, null, rules.alias);
const rep3 = Verify.verify({ resolved: R3, rules, intent: {} });
console.log(`  복원수준=${rep3.level} | 판정: ok ${rep3.counts.ok} / warn ${rep3.counts.warn} / error ${rep3.counts.error} / unknown ${rep3.counts.unknown}`);
console.log('-'.repeat(78));
rep3.checks.forEach(c => console.log(line(c)));

// ── 4. 스키마 오류
// ── 3b. 완전 열화 (summary 조차 없음)
console.log('\n' + '='.repeat(78));
console.log('▶ 완전 열화 — summary 도 없는 경우');
const p3b = makePlan('2026', code1, '샘플고A', catalog1, null);
const rep3b = Verify.verify({ resolved: Plan.resolve(p3b, null, rules.alias), rules, intent: {} });
console.log(`  판정: ok ${rep3b.counts.ok} / warn ${rep3b.counts.warn} / error ${rep3b.counts.error} / unknown ${rep3b.counts.unknown}`);
rep3b.checks.forEach(c => console.log(line(c)));

console.log('\n' + '='.repeat(78));
console.log('▶ 오류 — 다른 파일을 넣은 경우');
console.log(' ', Verify.verify({ resolved: Plan.resolve({ schema: 'wrong' }, null, rules.alias), rules }).error);

// ── 5. 전 학교 회귀 — summary 교차검증 및 예외 탐지
console.log('\n' + '='.repeat(78));
console.log('▶ 회귀 — 2025·2026 전 편성표 187건에 대해 엔진 실행');
let n = 0, errs = [], groupsSeen = {}, unmappedSeen = {};
['2025', '2026'].forEach(y => {
  const d = `${REPO}/design/selector/data/curriculum_${y}`;
  fs.readdirSync(d).forEach(f => {
    const code = path.basename(f, '.json');
    try {
      const cat = J(`${d}/${f}`);
      const plan = makePlan(y, code, code, cat, null);
      const R = Plan.resolve(plan, cat, rules.alias);
      const rep = Verify.verify({ resolved: R, rules, intent: {} });
      if (!rep.ok) throw new Error('verify 실패');
      Object.keys(R.byGroup).forEach(k => groupsSeen[k] = 1);
      Object.keys(R.unmapped).forEach(k => unmappedSeen[k] = (unmappedSeen[k] || 0) + 1);
      n++;
    } catch (e) { errs.push(`${y}/${f}: ${e.message}`); }
  });
});
console.log(`  실행 성공 ${n}건 / 실패 ${errs.length}건`);
if (errs.length) errs.slice(0, 5).forEach(e => console.log('   !', e));
console.log('  매핑된 교과군:', Object.keys(groupsSeen).join(' · '));
console.log('  미매핑(전문교과·계열):', Object.keys(unmappedSeen).length ? Object.keys(unmappedSeen).join(' · ') : '없음');
