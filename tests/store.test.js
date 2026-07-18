/* ============================================================
   tests/store.test.js — journey/store.js 유닛 테스트
   실행: node --test tests/store.test.js
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefault, load, save, get, getState, wipe, progress,
  exportFile, openFile, hasCache, SCHEMAS, CACHE_KEY_NAME,
} from '../design/journey/store.js';

/* ── 기본값 생성 ─────────────────────────────────────── */

test('createDefault: 스키마·5단계 구조가 초기값으로 생성된다', () => {
  const d = createDefault();
  assert.equal(d.schema, SCHEMAS.JINRO);
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.curriculumVersion ?? d.meta.curriculumVersion, '2022');
  // step1~step4 구조 확인
  assert.ok(d.step1 && d.step1.prologue && Array.isArray(d.step1.prologue.strengths));
  assert.equal(d.step1.prologue.pledge.length, 3);
  assert.equal(d.step2.quiz.structure.done, false);
  assert.equal(d.step2.mySchool.visitedSelector, false);
  assert.equal(d.step3.field.interested, '');
  assert.equal(d.step4.coursePlan, null);
  assert.deepEqual(d.step4.mandarat.grade1.cells, {});
  assert.equal(d.step4.roadmap.careerGoal, '');
});

test('wipe() → get()이 기본값을 반환한다', () => {
  wipe();
  assert.equal(get('step1.prologue.strengths').length, 0);
  assert.equal(get('step4.coursePlan'), null);
});

/* ── save 병합 ───────────────────────────────────────── */

test('save(patch)는 깊은 병합, 기존 다른 필드를 유지한다', () => {
  wipe();
  save({ profile: { school: '온마당고', name: '홍길동' } });
  save({ profile: { grade: 3 } });
  const p = get('profile');
  assert.equal(p.school, '온마당고');
  assert.equal(p.name, '홍길동');
  assert.equal(p.grade, 3);
  // 병합이 아닌 배열은 통째로 대체
  save({ step1: { prologue: { strengths: ['성실', '분석', '공감'] } } });
  save({ step1: { prologue: { strengths: ['도전'] } } });
  assert.deepEqual(get('step1.prologue.strengths'), ['도전']);
});

test('save 후 meta.updatedAt 갱신', () => {
  wipe();
  const before = get('meta.updatedAt');
  // 다음 tick에서 확인
  return new Promise(res => setTimeout(res, 5)).then(() => {
    save({ profile: { school: 'A' } });
    const after = get('meta.updatedAt');
    assert.ok(new Date(after).getTime() >= new Date(before).getTime());
  });
});

/* ── get 경로 ────────────────────────────────────────── */

test('get: 점(.) 경로 탐색과 미존재 경로 undefined 반환', () => {
  wipe();
  save({ step2: { quiz: { structure: { done: true, score: 4 } } } });
  assert.equal(get('step2.quiz.structure.done'), true);
  assert.equal(get('step2.quiz.structure.score'), 4);
  assert.equal(get('step2.quiz.nonexistent'), undefined);
  assert.equal(get('nowhere.deep.path'), undefined);
});

/* ── progress 판정 ───────────────────────────────────── */

test('progress: 초기값은 모두 미완료, final=false', () => {
  wipe();
  const p = progress();
  assert.equal(p.step1.done, 0);
  assert.equal(p.step2.done, 0);
  assert.equal(p.step3.done, 0);
  assert.equal(p.step4.done, 0);
  assert.equal(p.step5.done, 0);
  assert.equal(p.final, false);
});

test('progress: step1.prologue는 강점 3개 + 배움서약 1줄 이상', () => {
  wipe();
  save({ step1: { prologue: { strengths: ['a', 'b'] } } });
  assert.equal(progress().step1.items.prologue, false);
  save({ step1: { prologue: { strengths: ['a', 'b', 'c'], pledge: ['성실히 임한다', '', ''] } } });
  assert.equal(progress().step1.items.prologue, true);
});

test('progress: step1.summary는 conclusion 채워지면 완료', () => {
  wipe();
  save({ step1: { summary: { conclusion: '관심 학과는 심리학과이다' } } });
  assert.equal(progress().step1.items.summary, true);
});

test('progress: step2 퀴즈 3종 done 및 mySchool 방문', () => {
  wipe();
  save({
    step2: {
      quiz: {
        structure: { done: true, score: 5 },
        grading: { done: true, score: 4 },
        hierarchy: { done: true, score: 5 },
      },
      mySchool: { visitedSelector: true },
    },
  });
  const s2 = progress().step2;
  assert.equal(s2.items.structure, true);
  assert.equal(s2.items.grading, true);
  assert.equal(s2.items.hierarchy, true);
  assert.equal(s2.items.mySchool, true);
  assert.equal(s2.complete, true);
});

test('progress: step4.mandarat 학년 1개 이상에서 셀 4개 이상 채우면 완료', () => {
  wipe();
  save({ step4: { mandarat: { grade1: { cells: { c1: '동아리', c2: '봉사' } } } } });
  assert.equal(progress().step4.items.mandarat, false);
  save({ step4: { mandarat: { grade1: { cells: { c1: '동아리', c2: '봉사', c3: '독서', c4: '체력' } } } } });
  assert.equal(progress().step4.items.mandarat, true);
});

test('progress: final 판정 — summary + coursePlan + 체크리스트 50%↑ + roadmap 필요', () => {
  wipe();
  save({
    step1: { summary: { conclusion: '심리학과' } },
    step4: {
      coursePlan: { plan: { schema: SCHEMAS.SELECTOR } },
      checklist: { answers: { 'a.0': 'O', 'a.1': 'O', 'a.2': 'X', 'a.3': null } },
      roadmap: { careerGoal: '상담심리사' },
    },
  });
  assert.equal(progress().final, true);
  // 체크리스트 50% 미만이면 실패
  wipe();
  save({
    step1: { summary: { conclusion: '심리학과' } },
    step4: {
      coursePlan: { plan: {} },
      checklist: { answers: { 'a.0': 'O', 'a.1': null, 'a.2': null, 'a.3': null } },
      roadmap: { careerGoal: '상담심리사' },
    },
  });
  assert.equal(progress().final, false);
});

/* ── exportFile ↔ openFile 왕복 ─────────────────────── */

test('exportFile → openFile: 왕복 무손실 (핵심 사용자 데이터 보존)', async () => {
  wipe();
  save({
    profile: { school: '충남고', grade: 2, name: '학생1' },
    step1: {
      prologue: { strengths: ['성실', '분석', '공감'], pledge: ['최선을 다한다', '', ''] },
      interest: { ranks: [{ rank: 1, type: 'S', tScore: 62, traits: '사람 지향', jobs: '상담사' }] },
      summary: { conclusion: '심리학과 진학 목표' },
    },
    step4: { roadmap: { careerGoal: '임상심리 전문가' } },
  });
  const { json, name } = exportFile({ download: false });
  assert.match(name, /^진로학업설계_\d{8}\.json$/);
  const before = JSON.parse(JSON.stringify(getState()));

  wipe();
  assert.equal(get('profile.school'), '');

  const result = await openFile(json);
  assert.equal(result.kind, 'jinro');

  assert.equal(get('profile.school'), '충남고');
  assert.equal(get('profile.grade'), 2);
  assert.deepEqual(get('step1.prologue.strengths'), ['성실', '분석', '공감']);
  assert.equal(get('step1.interest.ranks')[0].type, 'S');
  assert.equal(get('step1.summary.conclusion'), '심리학과 진학 목표');
  assert.equal(get('step4.roadmap.careerGoal'), '임상심리 전문가');
  // schema 유지
  assert.equal(get('schema'), before.schema);
});

/* ── cne_course_selector/v1 판별 · summary 집계 ─────── */

test('openFile: selector JSON을 자동 판별해 step4.coursePlan에 저장, summary 유지', async () => {
  wipe();
  const selectorPayload = {
    schema: SCHEMAS.SELECTOR,
    exportedAt: '2026-07-18T10:00:00+09:00',
    year: '2026',
    schoolCode: 'A000001',
    schoolName: '충남과학고',
    department: '자연계열',
    selections: ['g0-s1-sem0', 'g0-s1-sem1', 'g2-s3-sem2'],
    preset: 'science',
    summary: {
      totalCredits: 192,
      changcheCredits: 18,
      groupBreakdown: {
        '국어': 8, '수학': 16, '영어': 8,
        '사회(역사/도덕 포함)': 10, '과학': 20, '한국사': 6,
        '체육': 10, '예술': 10, '기술·가정/정보/제2외국어/한문/교양': 16,
      },
    },
  };
  const result = await openFile(JSON.stringify(selectorPayload));
  assert.equal(result.kind, 'selector');

  const cp = get('step4.coursePlan');
  assert.ok(cp, 'coursePlan 채워짐');
  assert.equal(cp.importedFrom, 'selector-json');
  assert.equal(cp.schoolCode, 'A000001');
  assert.equal(cp.department, '자연계열');
  assert.deepEqual(cp.selections, ['g0-s1-sem0', 'g0-s1-sem1', 'g2-s3-sem2']);
  assert.equal(cp.preset, 'science');

  // 학점 집계 (192/174·84·81 규칙과 일치)
  const sum = cp.summary;
  assert.equal(sum.totalCredits, 192);
  assert.equal(sum.changcheCredits, 18);
  // 필수이수 최소 학점: 국8·수8·영8·사8·과10·한국사6·체10·예10·생활교양16 = 84
  const requiredMin = { '국어': 8, '수학': 8, '영어': 8, '사회(역사/도덕 포함)': 8, '과학': 10, '한국사': 6, '체육': 10, '예술': 10, '기술·가정/정보/제2외국어/한문/교양': 16 };
  const requiredTotal = Object.values(requiredMin).reduce((a, b) => a + b, 0);
  assert.equal(requiredTotal, 84);
  Object.entries(requiredMin).forEach(([g, min]) => {
    assert.ok((sum.groupBreakdown[g] || 0) >= min, `${g}: ${sum.groupBreakdown[g]} ≥ ${min}`);
  });
  // 국수영 총합 ≤ 81 규칙
  const kme = sum.groupBreakdown['국어'] + sum.groupBreakdown['수학'] + sum.groupBreakdown['영어'];
  assert.ok(kme <= 81, `국수영 합 ${kme} ≤ 81`);

  // mySchool 학교명 자동 반영
  assert.equal(get('step2.mySchool.schoolName'), '충남과학고');
  assert.equal(get('step2.mySchool.visitedSelector'), true);

  // step4.coursePlan 완료 판정
  assert.equal(progress().step4.items.coursePlan, true);
});

/* ── 잘못된 파일 거부 ────────────────────────────────── */

test('openFile: JSON 아니면 예외', async () => {
  await assert.rejects(() => openFile('이건 JSON이 아닙니다'), /JSON/);
});

test('openFile: 알 수 없는 schema는 예외', async () => {
  const payload = JSON.stringify({ schema: 'unknown/v9', data: {} });
  await assert.rejects(() => openFile(payload), /지원하지 않는/);
});

test('openFile: schema 없는 객체는 예외', async () => {
  const payload = JSON.stringify({ foo: 'bar' });
  await assert.rejects(() => openFile(payload), /지원하지 않는/);
});

test('openFile: null/빈 값은 예외', async () => {
  await assert.rejects(() => openFile('null'), /빈|잘못/);
  await assert.rejects(() => openFile(null), /파일/);
});

/* ── localStorage 없이도 동작 ─────────────────────────── */

test('localStorage 미지원 환경에서도 load/save/wipe가 예외 없이 동작', () => {
  // node 환경엔 원래 localStorage가 없음 — 이 자체가 검증
  assert.equal(typeof globalThis.localStorage, 'undefined');
  wipe();
  save({ profile: { school: '테스트고' } });
  assert.equal(get('profile.school'), '테스트고');
  assert.equal(hasCache(), false);
});

/* ── 상수 노출 ────────────────────────────────────────── */

test('CACHE_KEY_NAME은 onmadang.jinro.v1', () => {
  assert.equal(CACHE_KEY_NAME, 'onmadang.jinro.v1');
});
