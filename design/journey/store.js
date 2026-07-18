/* ============================================================
   journey/store.js — 진로학업설계서 상태 저장소
   순수 ES module (DOM 무의존). node --test로 검증 가능.
   ============================================================ */

const CACHE_KEY = 'onmadang.jinro.v1';
const SCHEMA = 'onmadang_jinro/v1';
const SELECTOR_SCHEMA = 'cne_course_selector/v1';
const SCHEMA_VERSION = 1;

let state = null;

/* ── 유틸 ─────────────────────────────────────────────── */

function nowISO() { return new Date().toISOString(); }

function kstISO() {
  const d = new Date(Date.now() + 9 * 3600000);
  return d.toISOString().replace('Z', '+09:00');
}

function kstDate() {
  const d = new Date(Date.now() + 9 * 3600000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function safeStorage() {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    const ls = globalThis.localStorage;
    const probe = '__jinro_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch { return null; }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function mergeDeep(target, patch) {
  if (!isPlainObject(patch)) return patch;
  const out = isPlainObject(target) ? { ...target } : {};
  for (const k of Object.keys(patch)) {
    const pv = patch[k];
    if (isPlainObject(pv) && isPlainObject(out[k])) {
      out[k] = mergeDeep(out[k], pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
}

function getPath(obj, path) {
  if (!path) return obj;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isFilled(s) { return typeof s === 'string' && s.trim().length > 0; }

/* ── 기본 상태 ────────────────────────────────────────── */

export function createDefault() {
  return {
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: null,
    lastFileSavedAt: null,
    meta: {
      createdAt: nowISO(),
      updatedAt: nowISO(),
      curriculumVersion: '2022',
    },
    profile: { school: '', grade: null, classNo: '', name: '' },
    step1: {
      prologue: {
        strengths: [],
        commonWithFriend: '',
        sentences: { happy: '', like: '', good: '', respectWho: '', respectWhy: '' },
        pledge: ['', '', ''],
      },
      interest: {
        ranks: [],
        topJobExample: { type: '', jobGroup: '', job: '', major: '' },
        reflection: '',
      },
      aptitude: { high: [], low: [], reflection: '' },
      values: {
        myTop3: [], testTop3: [], mismatchNote: '', byOrientation: [],
        hopeJob: { job: '', realizedValues: '' },
      },
      jobs: [],
      jobFuture: [],
      jobFutureInsight: '',
      summary: { futureOutlookPositive: null, reason: '', conclusion: '' },
    },
    step2: {
      quiz: {
        structure: { done: false, score: null },
        grading: { done: false, score: null },
        hierarchy: { done: false, score: null },
      },
      mySchool: { visitedSelector: false, schoolName: '' },
    },
    step3: {
      field: {
        interested: '', reason: '',
        considerations: [],
        readiness: { academic: '', career: '', community: '' },
      },
      department: {
        interested: '', reason: '',
        universities: [],
        readiness: { academic: '', career: '', community: '' },
      },
      deptInfo: { requiredCompetency: '', neededSubjects: '', jobFields: '' },
      sameNameCompare: { deptName: '', a: {}, b: {}, similarDepts: [] },
      savedMajors: [],
    },
    step4: {
      coursePlan: null,
      mandarat: { grade1: { cells: {} }, grade2: { cells: {} }, grade3: { cells: {} } },
      peerReview: { given: [], received: [], revisionNote: '' },
      audit: { byTerm: [] },
      checklist: { answers: {} },
      roadmap: { careerGoal: '', phases: [], afterThoughts: '' },
    },
  };
}

/* ── 저장/이벤트 ─────────────────────────────────────── */

function persist() {
  const ls = safeStorage();
  if (!ls) return;
  try { ls.setItem(CACHE_KEY, JSON.stringify(state)); } catch { /* quota 등 무시 */ }
}

function emitChange(detail) {
  if (typeof globalThis.window !== 'undefined' && typeof globalThis.CustomEvent === 'function') {
    try {
      globalThis.window.dispatchEvent(new globalThis.CustomEvent('jinro:change', { detail: detail || {} }));
    } catch { /* 무시 */ }
  }
}

/* ── 공개 API ─────────────────────────────────────────── */

export function load() {
  const ls = safeStorage();
  if (ls) {
    try {
      const raw = ls.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.schema === SCHEMA) {
          state = mergeDeep(createDefault(), parsed);
          return state;
        }
      }
    } catch { /* 손상 무시 */ }
  }
  state = createDefault();
  return state;
}

export function hasCache() {
  const ls = safeStorage();
  if (!ls) return false;
  try {
    const raw = ls.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed && parsed.schema === SCHEMA);
  } catch { return false; }
}

export function save(patch) {
  if (!state) load();
  state = mergeDeep(state, patch || {});
  state.meta.updatedAt = nowISO();
  persist();
  emitChange({ kind: 'save' });
  return state;
}

export function get(path) {
  if (!state) load();
  return getPath(state, path);
}

export function getState() {
  if (!state) load();
  return state;
}

export function wipe() {
  const ls = safeStorage();
  if (ls) { try { ls.removeItem(CACHE_KEY); } catch { /* 무시 */ } }
  state = createDefault();
  emitChange({ kind: 'wipe' });
  return state;
}

/* ── 완료 판정 & 진행률 ──────────────────────────────── */

function step1Items() {
  const s = state.step1;
  return {
    prologue: s.prologue.strengths.length >= 3 && s.prologue.pledge.some(isFilled),
    interest: !!(s.interest.ranks[0] && s.interest.ranks[0].type),
    aptitude: s.aptitude.high.length > 0 || s.aptitude.low.length > 0 || isFilled(s.aptitude.reflection),
    values: s.values.myTop3.length > 0 || s.values.testTop3.length > 0,
    jobs: s.jobs.length > 0,
    summary: isFilled(s.summary.conclusion),
  };
}

function step2Items() {
  const q = state.step2.quiz;
  return {
    structure: !!q.structure.done,
    grading: !!q.grading.done,
    hierarchy: !!q.hierarchy.done,
    mySchool: !!state.step2.mySchool.visitedSelector,
  };
}

function step3Items() {
  const s = state.step3;
  return {
    field: isFilled(s.field.interested),
    department: isFilled(s.department.interested),
    sameName: isFilled(s.sameNameCompare.deptName),
  };
}

function step4Items() {
  const s = state.step4;
  const hasCoursePlan = !!(s.coursePlan && (s.coursePlan.plan || s.coursePlan.selections));
  const mandaratOk = ['grade1', 'grade2', 'grade3'].some(g => {
    const cells = (s.mandarat[g] && s.mandarat[g].cells) || {};
    return Object.values(cells).filter(isFilled).length >= 4;
  });
  return {
    coursePlan: hasCoursePlan,
    mandarat: mandaratOk,
    roadmap: isFilled(s.roadmap.careerGoal),
  };
}

function step5Items() {
  const s = state.step4;
  const answers = (s.checklist && s.checklist.answers) || {};
  const total = Object.keys(answers).length;
  const answered = Object.values(answers).filter(v => v === 'O' || v === 'X').length;
  return {
    checklistHalf: total > 0 && answered / total >= 0.5,
    ready: !!(isFilled(state.step1.summary.conclusion)
      && s.coursePlan && (s.coursePlan.plan || s.coursePlan.selections)
      && total > 0 && answered / total >= 0.5
      && isFilled(s.roadmap.careerGoal)),
  };
}

function stepAgg(items) {
  const done = Object.values(items).filter(Boolean).length;
  const total = Object.keys(items).length;
  return { items, done, total, complete: total > 0 && done === total };
}

export function progress() {
  if (!state) load();
  const p1 = stepAgg(step1Items());
  const p2 = stepAgg(step2Items());
  const p3 = stepAgg(step3Items());
  const p4 = stepAgg(step4Items());
  const p5 = stepAgg(step5Items());
  return {
    step1: p1, step2: p2, step3: p3, step4: p4, step5: p5,
    final: p5.items.ready,
  };
}

/* ── 파일 저장/열기 ──────────────────────────────────── */

export function exportFile(options = {}) {
  if (!state) load();
  const payload = {
    ...state,
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: kstISO(),
  };
  const json = JSON.stringify(payload, null, 2);
  const name = `진로학업설계_${kstDate()}.json`;
  state.lastFileSavedAt = payload.exportedAt;
  state.meta.updatedAt = nowISO();
  persist();
  emitChange({ kind: 'exportFile' });

  if (options.download !== false
      && typeof globalThis.document !== 'undefined'
      && typeof globalThis.Blob !== 'undefined'
      && typeof globalThis.URL !== 'undefined'
      && typeof globalThis.URL.createObjectURL === 'function') {
    try {
      const blob = new globalThis.Blob([json], { type: 'application/json' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => { try { globalThis.URL.revokeObjectURL(url); } catch { /* 무시 */ } }, 5000);
    } catch { /* 무시 — 다운로드 실패해도 payload 반환 */ }
  }
  return { name, json, payload };
}

async function readInput(input) {
  if (input == null) throw new Error('파일이 없습니다');
  if (typeof input === 'string') return input;
  if (typeof input.text === 'function') return input.text();
  throw new Error('지원하지 않는 입력 형식입니다');
}

export async function openFile(input) {
  const text = await readInput(input);
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('JSON 파싱 실패'); }
  if (!data || typeof data !== 'object') throw new Error('빈 파일이거나 잘못된 형식입니다');

  if (data.schema === SCHEMA) return importJinro(data);
  if (data.schema === SELECTOR_SCHEMA) return importSelectorPayload(data);
  throw new Error(`지원하지 않는 파일입니다 (schema=${data.schema || '없음'})`);
}

function importJinro(data) {
  const base = createDefault();
  state = mergeDeep(base, data);
  state.schema = SCHEMA;
  state.schemaVersion = SCHEMA_VERSION;
  state.meta.updatedAt = nowISO();
  persist();
  emitChange({ kind: 'openFile', variant: 'jinro' });
  return { kind: 'jinro', state };
}

function importSelectorPayload(data) {
  if (!state) load();
  state.step4.coursePlan = {
    importedFrom: 'selector-json',
    importedAt: nowISO(),
    schema: SELECTOR_SCHEMA,
    exportedAt: data.exportedAt || null,
    year: data.year || null,
    schoolCode: data.schoolCode || '',
    schoolName: data.schoolName || '',
    department: data.department || null,
    preset: data.preset || null,
    selections: Array.isArray(data.selections) ? [...data.selections] : [],
    summary: data.summary || null,
    plan: data,
  };
  if (data.schoolName) state.step2.mySchool.schoolName = data.schoolName;
  state.step2.mySchool.visitedSelector = true;
  state.meta.updatedAt = nowISO();
  persist();
  emitChange({ kind: 'openFile', variant: 'selector' });
  return { kind: 'selector', state, summary: data.summary || null };
}

/* ── 정보 헬퍼 ────────────────────────────────────────── */

export const SCHEMAS = { JINRO: SCHEMA, SELECTOR: SELECTOR_SCHEMA };
export const CACHE_KEY_NAME = CACHE_KEY;
