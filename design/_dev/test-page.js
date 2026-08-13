/* check 화면 통합 테스트 — node test-page.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = require('path').resolve(__dirname, '..', '..');
const PAGE = path.join(ROOT, 'design/check/index.html');
const PAGE_DIR = path.dirname(PAGE);

/* ── 실제 학교 편성표로 내보내기 파일 1건 생성 ───────────────── */
const Plan = require('../js/jinro-plan.js');
const dir = path.join(ROOT, 'design/selector/data/curriculum_2026');
const code = path.basename(fs.readdirSync(dir).filter(f => !f.includes('('))[0], '.json');
const catalog = JSON.parse(fs.readFileSync(`${dir}/${code}.json`, 'utf-8'));

function autoSelect(cat, drop) {
  const sel = [];
  cat.groups.forEach((g, gi) => {
    if (g.isSoonjeung) return;
    if (g.division === '지정') {
      g.subjects.forEach((s, si) => (s.semCredits || []).forEach((c, i) => {
        if (parseFloat(c)) sel.push(`g${gi}-s${si}-sem${i}`);
      }));
      return;
    }
    const m = /택\s*(\d+)/.exec(g.selectCount || '');
    const n = Math.max(0, (m ? +m[1] : 1) - (drop || 0));
    (g.semesters || []).forEach((active, semIdx) => {
      if (!active) return;
      for (let si = 0; si < Math.min(n, g.subjects.length); si++) sel.push(`g${gi}-s${si}-sem${semIdx}`);
    });
  });
  return sel;
}

const R0 = Plan.resolve({ schema: 'cne_course_selector/v1', year: '2026', schoolCode: code,
  schoolName: '샘플고A', department: null, selections: autoSelect(catalog, 1) },
  catalog, JSON.parse(fs.readFileSync(`${ROOT}/design/data/group-alias.json`, 'utf-8')));
const bd = {}; R0.items.forEach(it => bd[it.group] = (bd[it.group] || 0) + it.credits);

const exportFile = {
  schema: 'cne_course_selector/v1',
  exportedAt: new Date().toISOString(),
  year: '2026', schoolCode: code, schoolName: '샘플고A', department: null,
  selections: autoSelect(catalog, 1), preset: null,
  summary: { totalCredits: R0.totals.total, changcheCredits: R0.totals.changche, groupBreakdown: bd }
};
// 디버그용 덤프. 배포 대상이 아니므로 _dev/ 안에만 쓴다 (레포 루트로 새어나가지 않게).
fs.writeFileSync(`${__dirname}/sample-export.json`, JSON.stringify(exportFile, null, 2));

/* ── 로컬 파일 fetch 셰임 ──────────────────────────────────── */
function makeFetch(baseDir) {
  return (url) => {
    const p = path.resolve(baseDir, url);
    return new Promise((res) => {
      if (!fs.existsSync(p)) return res({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
      res({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf-8'))) });
    });
  };
}

(async () => {
  const html = fs.readFileSync(PAGE, 'utf-8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: undefined,
    url: 'https://onmadang.or.kr/design/check/',
    beforeParse(win) {
      win.fetch = makeFetch(PAGE_DIR);
      win.print = () => { win.__printed = true; };
      win.scrollTo = () => {};
      win.Element.prototype.scrollIntoView = () => {};
    }
  });
  const win = dom.window, doc = win.document;

  // 외부 스크립트 수동 주입 — common.js 는 자기 src 로 base 경로를 계산하므로
  // src 속성을 그대로 달아 준다 (실제 브라우저와 동일 조건)
  ['../../assets/js/common.js', '../js/jinro-plan.js', '../js/jinro-verify.js'].forEach(rel => {
    const s = doc.createElement('script');
    s.textContent = fs.readFileSync(path.resolve(PAGE_DIR, rel), 'utf-8');
    doc.head.appendChild(s);
  });
  // 페이지 인라인 스크립트 재실행 (외부 스크립트보다 먼저 파싱됐으므로)
  const inline = [...doc.querySelectorAll('script:not([src])')].pop();
  const s2 = doc.createElement('script');
  s2.textContent = inline.textContent;
  doc.head.appendChild(s2);

  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(200);

  const out = [];
  const log = (...a) => out.push(a.join(' '));

  log('▶ 1. 초기 로드');
  // common.js 는 placeholder 를 outerHTML 로 교체하므로 #om-header 는 사라지는 것이 정상
  log('   공통 헤더 주입:', doc.querySelector('header .nav') ? 'OK' : '실패');
  log('   리뉴얼 배너:', doc.querySelector('.renewal-banner') ? 'OK' : '실패');
  log('   GNB 항목 수:', doc.querySelectorAll('header .gnb-top, header .nav-disabled').length);
  log('   활성 메뉴:', (doc.querySelector('header .gnb-top.active') || {}).textContent || '(없음)');
  log('   모바일 메뉴:', doc.querySelector('.mobile-menu') ? 'OK' : '실패');
  log('   푸터 주입:', doc.querySelector('footer') ? 'OK' : '실패');
  log('   계열 셀렉트 옵션 수:', doc.querySelectorAll('#field-sel option').length);
  log('   결과 영역 숨김:', doc.getElementById('result').classList.contains('jn-hidden') ? 'OK' : '실패');

  log('\n▶ 2. 잘못된 파일 투입');
  win.eval(`(function(){
    var fr = { onload:null, onerror:null, readAsText:function(){ this.result='{"schema":"other"}'; this.onload(); } };
    window.FileReader = function(){ return fr; };
  })()`);
  const fileInput = doc.getElementById('file');
  Object.defineProperty(fileInput, 'files', { value: [{ name: 'x.json' }], configurable: true });
  fileInput.dispatchEvent(new win.Event('change'));
  await wait(120);
  log('   오류 표시:', !doc.getElementById('err').classList.contains('jn-hidden') ? 'OK' : '실패');
  log('   오류 문구:', doc.getElementById('err').textContent);

  log('\n▶ 3. 정상 파일 투입');
  const payload = JSON.stringify(exportFile);
  win.eval(`(function(){
    var fr = { onload:null, onerror:null, readAsText:function(){ this.result=${JSON.stringify(payload)}; this.onload(); } };
    window.FileReader = function(){ return fr; };
  })()`);
  fileInput.dispatchEvent(new win.Event('change'));
  await wait(400);

  log('   결과 영역 표시:', !doc.getElementById('result').classList.contains('jn-hidden') ? 'OK' : '실패');
  log('   메타:', doc.getElementById('meta').textContent.replace(/\s+/g, ' ').trim());
  log('   총괄:', [...doc.querySelectorAll('#totals .jn-total')].map(d => d.textContent.replace(/\s+/g,' ').trim()).join(' | '));
  const checks = [...doc.querySelectorAll('#checks .jn-check')];
  log('   판정 항목 수:', checks.length);
  checks.forEach(c => {
    log('    - [' + c.querySelector('.jn-badge').textContent + '] '
      + c.querySelector('.jn-check__title').textContent
      + (c.querySelector('.jn-check__value') ? ' — ' + c.querySelector('.jn-check__value').textContent : ''));
  });
  log('   교과군 표 행수:', doc.querySelectorAll('.jn-table tbody tr').length);
  log('   각주 노출:', !doc.querySelector('.jn-footnote').classList.contains('jn-hidden') ? 'OK' : '실패');

  log('\n▶ 4. 희망 계열 선택 → 재판정');
  const sel = doc.getElementById('field-sel');
  sel.value = '의학(의예)';
  sel.dispatchEvent(new win.Event('change'));
  await wait(200);
  const major = [...doc.querySelectorAll('#checks .jn-check')].find(c => /희망 학과/.test(c.textContent));
  log('   major-fit 배지:', major.querySelector('.jn-badge').textContent);
  log('   내용:', major.querySelector('.jn-check__detail').textContent.slice(0, 120));

  log('\n▶ 5. 인쇄 / 복사 / 초기화');
  doc.getElementById('print').click(); await wait(50);
  log('   인쇄 호출:', win.__printed ? 'OK' : '실패');
  let copied = null;
  win.navigator.clipboard = { writeText: t => { copied = t; return Promise.resolve(); } };
  doc.getElementById('copy').click(); await wait(120);
  log('   복사 텍스트 줄수:', copied ? copied.split('\n').length : '실패');
  log('   복사 첫 3줄:', copied ? copied.split('\n').slice(0, 3).join(' / ') : '');
  doc.getElementById('again').click(); await wait(100);
  log('   초기화 후 결과 숨김:', doc.getElementById('result').classList.contains('jn-hidden') ? 'OK' : '실패');

  log('\n▶ 6. 접근성 점검');
  log('   lang:', doc.documentElement.lang);
  log('   h1 개수:', doc.querySelectorAll('h1').length);
  const dz = doc.getElementById('drop');
  log('   드롭존 중첩 인터랙티브:', (dz.getAttribute('role')==='button' && dz.querySelector('button')) ? '있음(문제)' : '없음');
  log('   GNB 진로·학업 설계 하위:', [...doc.querySelectorAll('header .gnb-dd a')].filter(a=>/design/.test(a.getAttribute('href')||'')).map(a=>a.textContent+'→'+a.getAttribute('href')).join(' , '));
  log('   alert role:', doc.getElementById('err').getAttribute('role'));
  log('   표 th scope:', [...doc.querySelectorAll('.jn-table th[scope]')].length + '개');
  log('   버튼 중 라벨 없는 것:', [...doc.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length);

  console.log(out.join('\n'));
})();
