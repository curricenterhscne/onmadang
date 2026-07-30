/*!
 * jinro-verify.js — 과목 선택 판정 엔진
 * 온마당 「진로·학업 설계」 / 내 선택 점검
 *
 * 원칙
 *  - DOM 비의존 순수 함수. 콘솔 단독 테스트 가능.
 *  - 각 판정은 독립. 하나가 unknown 이어도 나머지는 산출된다.
 *  - 문구는 "무엇이 몇 학점 모자란지 + 어떻게 하면 되는지"로 쓴다.
 *    판정 결과에 점수·등급을 부여하지 않는다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JinroVerify = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OK = 'ok', WARN = 'warn', ERROR = 'error', UNKNOWN = 'unknown';

  function fmt(n) { return n % 1 === 0 ? n : parseFloat(n.toFixed(1)); }
  function uniq(a) { var s = {}, r = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; r.push(x); } }); return r; }

  function check(o) {
    return {
      id: o.id, level: o.level, title: o.title,
      value: o.value || '', detail: o.detail || '',
      fix: o.fix || '', ref: o.ref || '', link: o.link || ''
    };
  }

  /* ── 1. 졸업 총 이수학점 ────────────────────────────────────────────── */
  function checkTotal(R, rules) {
    var need = rules.requiredCredits.graduation.total;   // 192
    var got = R.totals.total;
    if (!got) {
      return check({
        id: 'total-192', level: UNKNOWN, title: '졸업 총 이수학점',
        detail: '이수학점 정보를 읽지 못했습니다.',
        fix: '과목 선택 실습에서 파일을 다시 내보내 주세요.', link: '../selector/'
      });
    }
    if (got >= need) {
      return check({
        id: 'total-192', level: OK, title: '졸업 총 이수학점',
        value: got + '학점 / ' + need + '학점',
        detail: '교과 ' + R.totals.subjectCredits + '학점 + 창의적 체험활동 ' + R.totals.changche + '학점',
        ref: '교육부 고시 제2022-33호 총론'
      });
    }
    var gap = fmt(need - got);
    return check({
      id: 'total-192', level: ERROR, title: '졸업 총 이수학점',
      value: got + '학점 / ' + need + '학점',
      detail: '졸업 기준에 ' + gap + '학점 모자랍니다.',
      fix: gap + '학점(보통 4학점 과목 ' + Math.ceil(gap / 4) + '과목)을 더 담으면 채워집니다.',
      ref: '교육부 고시 제2022-33호 총론', link: '../selector/'
    });
  }

  /* ── 2. 교과(군)별 필수이수학점 ─────────────────────────────────────── */
  function checkGroups(R, rules) {
    var req = rules.requiredCredits.requiredByGroup;

    // 편성표도 없고 groupBreakdown 도 없으면 '미달'이 아니라 '확인 불가'다.
    if (!R.hasBreakdown) {
      return check({
        id: 'group-required', level: UNKNOWN, title: '교과(군)별 필수이수학점',
        detail: '편성표를 불러오지 못해 교과(군)별 이수학점을 확인할 수 없습니다.',
        fix: '과목 선택 실습에서 파일을 다시 내보내 주세요.',
        ref: '교육부 고시 제2022-33호 학점 배당 기준', link: '../selector/'
      });
    }

    // summary 만 있는 경우 편성표의 '사회'에 한국사가 섞여 있어 두 교과군을 분리할 수 없다.
    var UNSPLIT = ['사회(역사/도덕 포함)', '한국사'];
    var rows = [], short = [], skipped = [];
    req.forEach(function (r) {
      if (R.socialUnsplit && UNSPLIT.indexOf(r.group) >= 0) {
        rows.push({ group: r.group, got: null, need: r.credits, ok: null });
        skipped.push(r.group);
        return;
      }
      var got = R.byGroup[r.group] || 0;
      var ok = got >= r.credits;
      rows.push({ group: r.group, got: got, need: r.credits, ok: ok });
      if (!ok) short.push(r.group + ' ' + fmt(r.credits - got) + '학점');
    });

    var extra = Object.keys(R.unmapped || {});
    var note = extra.length
      ? ' (전문교과·계열 과목 ' + extra.join('·') + '은 필수이수 판정에서 제외했습니다)'
      : '';
    var skipNote = skipped.length
      ? ' ' + skipped.join('·') + '은 편성표 없이 분리할 수 없어 확인하지 못했습니다.'
      : '';

    var c;
    if (!short.length && !skipped.length) {
      c = check({
        id: 'group-required', level: OK, title: '교과(군)별 필수이수학점',
        value: req.length + '개 교과(군) 모두 충족',
        detail: '9개 교과(군)의 필수이수학점을 모두 채웠습니다.' + note,
        ref: '교육부 고시 제2022-33호 학점 배당 기준'
      });
    } else if (!short.length) {
      c = check({
        id: 'group-required', level: UNKNOWN, title: '교과(군)별 필수이수학점',
        value: (req.length - skipped.length) + '개 충족 · ' + skipped.length + '개 확인 불가',
        detail: '확인한 교과(군)은 모두 충족했습니다.' + skipNote + note,
        fix: '남은 교과(군)은 담임 또는 교육과정 담당 선생님과 확인해 주세요.',
        ref: '교육부 고시 제2022-33호 학점 배당 기준'
      });
    } else {
      c = check({
        id: 'group-required', level: ERROR, title: '교과(군)별 필수이수학점',
        value: short.length + '개 교과(군) 부족',
        detail: short.join(' · ') + '이 모자랍니다.' + skipNote + note,
        fix: '모자란 교과(군)에서 과목을 더 선택하면 충족됩니다. 총 학점이 192여도 교과(군)별 기준을 못 채우면 졸업할 수 없습니다.',
        ref: '교육부 고시 제2022-33호 학점 배당 기준', link: '../selector/'
      });
    }
    c.rows = rows;
    return c;
  }

  /* ── 3. 국어·수학·영어 이수학점 상한 (동적) ─────────────────────────── */
  /* 원문: "국어, 수학, 영어 교과의 이수 학점 총합은 81학점을 초과하지 않도록 하며,
   *        교과 이수 학점이 174학점을 초과하는 경우에는 초과 이수 학점의 50%를 넘지 않도록 함"
   *  → 상한 = 81 + max(0, 교과이수학점 - 174) × 0.5
   *  두 개의 별도 규칙이 아니라 하나의 동적 상한이다. */
  function checkKME(R, rules) {
    if (!R.hasBreakdown) {
      return check({
        id: 'kme-cap', level: UNKNOWN, title: '국어·수학·영어 이수학점',
        detail: '편성표를 불러오지 못해 확인할 수 없습니다.',
        ref: '교육부 고시 제2022-33호 총론'
      });
    }
    var base = rules.requiredCredits.koreanMathEnglishCap.cap;      // 81
    var subjBase = rules.requiredCredits.graduation.subjects;       // 174
    var kmeGroups = rules.alias.kmeGroups;

    var got = 0;
    kmeGroups.forEach(function (g) { got += (R.byGroup[g] || 0); });
    got = fmt(got);

    var excess = Math.max(0, R.totals.subjectCredits - subjBase);
    var cap = fmt(base + excess * 0.5);
    var capNote = excess > 0
      ? '교과 이수학점이 ' + R.totals.subjectCredits + '학점으로 ' + subjBase + '학점을 ' + fmt(excess) + '학점 초과해, 상한이 ' + base + ' + ' + fmt(excess * 0.5) + ' = ' + cap + '학점입니다.'
      : '교과 이수학점이 ' + subjBase + '학점 이하이므로 상한은 ' + base + '학점입니다.';

    if (got <= cap) {
      return check({
        id: 'kme-cap', level: OK, title: '국어·수학·영어 이수학점',
        value: got + '학점 / 상한 ' + cap + '학점',
        detail: capNote,
        ref: '교육부 고시 제2022-33호 총론'
      });
    }
    return check({
      id: 'kme-cap', level: ERROR, title: '국어·수학·영어 이수학점',
      value: got + '학점 / 상한 ' + cap + '학점',
      detail: capNote + ' 현재 ' + fmt(got - cap) + '학점 초과했습니다.',
      fix: '국어·수학·영어에서 ' + fmt(got - cap) + '학점을 줄이고 다른 교과(군)에서 채우면 됩니다.',
      ref: '교육부 고시 제2022-33호 총론', link: '../selector/'
    });
  }

  /* ── 4. 과목 위계 ──────────────────────────────────────────────────── */
  function splitPrereq(s) {
    // "공통수학1·2" → 공통수학1, 공통수학2 / "대수+미적분Ⅰ" → 대수, 미적분Ⅰ
    var out = [];
    s.split('+').forEach(function (part) {
      part = part.trim();
      var m = /^(.*?)(\d)·(\d)$/.exec(part);
      if (m) { out.push(m[1] + m[2]); out.push(m[1] + m[3]); }
      else out.push(part);
    });
    return out;
  }

  function checkHierarchy(R, rules) {
    if (R.level !== 'full') {
      return check({
        id: 'hierarchy', level: UNKNOWN, title: '과목 위계(듣는 순서)',
        detail: '편성표를 불러오지 못해 자동 확인이 어렵습니다.',
        fix: '수학·과학은 순서가 있는 과목이 있습니다. 담임 또는 교육과정 담당 선생님과 확인해 주세요.',
        ref: '2022 개정 교육과정 수학·과학 위계'
      });
    }
    var first = {};
    R.items.forEach(function (it) {
      if (first[it.name] === undefined || it.sem < first[it.name]) first[it.name] = it.sem;
    });

    var edges = [];
    ['math', 'science'].forEach(function (k) {
      var e = (rules.hierarchy[k] && rules.hierarchy[k].paths && rules.hierarchy[k].paths.edges) || [];
      e.forEach(function (pair) { edges.push(pair); });
    });

    var missing = [], reversed = [];
    edges.forEach(function (pair) {
      var target = pair[1];
      if (first[target] === undefined) return;              // 안 담았으면 볼 것 없음
      splitPrereq(pair[0]).forEach(function (pre) {
        if (first[pre] === undefined) missing.push(pre + ' → ' + target);
        else if (first[pre] > first[target]) reversed.push(pre + '(' + (first[pre] + 1) + '번째 학기) → ' + target + '(' + (first[target] + 1) + '번째 학기)');
      });
    });
    missing = uniq(missing); reversed = uniq(reversed);

    if (!missing.length && !reversed.length) {
      return check({
        id: 'hierarchy', level: OK, title: '과목 위계(듣는 순서)',
        value: '이상 없음',
        detail: '수학·과학의 선수 과목 순서에 문제가 없습니다.',
        ref: '2022 개정 교육과정 수학·과학 위계'
      });
    }
    var d = [];
    if (missing.length) d.push('선수 과목을 담지 않았습니다 — ' + missing.join(', '));
    if (reversed.length) d.push('순서가 뒤집혔습니다 — ' + reversed.join(', '));
    return check({
      id: 'hierarchy', level: WARN, title: '과목 위계(듣는 순서)',
      value: (missing.length + reversed.length) + '건 확인 필요',
      detail: d.join(' / '),
      fix: '앞 과목을 먼저 배치하거나, 학교에 개설이 없으면 공동교육과정으로 이수하는 방법이 있습니다.',
      ref: '2022 개정 교육과정 수학·과학 위계', link: '../outside/'
    });
  }

  /* ── 5. 석차등급 산출 여부 ─────────────────────────────────────────── */
  /* 편성표 subject.rank 를 1순위로 쓴다. 학교가 실제 편성한 값이므로
   * grading.json 의 규칙 추론보다 정확하며 학교별 예외까지 반영된다. */
  function checkRank(R, rules) {
    if (R.level !== 'full') {
      return check({
        id: 'rank-exempt', level: UNKNOWN, title: '석차등급이 나오는 과목 / 안 나오는 과목',
        detail: '편성표를 불러오지 못해 자동 확인이 어렵습니다.',
        ref: '고등학교 학업성적관리 시행지침'
      });
    }
    var withRank = [], noRank = [], passOnly = [];
    var seen = {};
    R.items.forEach(function (it) {
      if (seen[it.name]) return; seen[it.name] = 1;
      if (it.achievement === 'P') passOnly.push(it.name);
      else if (it.rank === '5등급') withRank.push(it.name);
      else noRank.push(it.name + (it.achievement === '3단계' ? '(성취도 3단계)' : ''));
    });
    var c = check({
      id: 'rank-exempt', level: OK, title: '석차등급이 나오는 과목 / 안 나오는 과목',
      value: '석차 산출 ' + withRank.length + '과목 · 미산출 ' + (noRank.length + passOnly.length) + '과목',
      detail: '석차등급이 나오지 않는 과목은 성취도(A~E 또는 A~C)만, 교양 교과(군)은 이수여부(P)만 기록됩니다. 유불리를 따지기보다 배우고 싶은 과목인지로 판단하세요.',
      ref: '편성표 rank 필드 + 고등학교 학업성적관리 시행지침'
    });
    c.lists = { withRank: withRank, noRank: noRank, passOnly: passOnly };
    return c;
  }

  /* ── 6. 희망 학과 권장과목 대조 ────────────────────────────────────── */
  function flatten(o) {
    var out = [];
    Object.keys(o || {}).forEach(function (k) { (o[k] || []).forEach(function (n) { out.push(n); }); });
    return out;
  }

  function findField(rules, fieldName) {
    var fs = (rules.recommended && rules.recommended.fields) || [];
    for (var i = 0; i < fs.length; i++) if (fs[i].field === fieldName) return fs[i];
    return null;
  }

  function checkMajorFit(R, rules, intent) {
    if (!intent || !intent.field) {
      return check({
        id: 'major-fit', level: UNKNOWN, title: '희망 학과 권장과목',
        detail: '희망 계열·학과를 아직 고르지 않았습니다.',
        fix: '학과·과목 탐색에서 관심 학과를 고르면 핵심·권장과목을 함께 확인할 수 있습니다.',
        link: '../majors/'
      });
    }
    var f = findField(rules, intent.field);
    if (!f) {
      return check({
        id: 'major-fit', level: UNKNOWN, title: '희망 학과 권장과목',
        detail: '「' + intent.field + '」 분야는 권장과목 표에 없습니다. 인문계열과 자율·자유전공학부는 권장과목을 두지 않습니다.',
        ref: '경희대 2028 자연계열 교과 이수 권장과목 안내(2025.4.)'
      });
    }
    var have = {}; R.items.forEach(function (it) { have[it.name] = 1; });
    var core = flatten(f.core), reco = flatten(f.recommended);
    var coreMiss = uniq(core.filter(function (n) { return !have[n]; }));
    var recoMiss = uniq(reco.filter(function (n) { return !have[n]; }));

    if (!coreMiss.length) {
      return check({
        id: 'major-fit', level: OK, title: '희망 학과 권장과목 — ' + f.field,
        value: '핵심과목 ' + core.length + '개 모두 이수',
        detail: recoMiss.length ? '권장과목 중 아직 담지 않은 것: ' + recoMiss.join(', ') + ' (필수는 아닙니다)' : '핵심·권장과목을 모두 담았습니다.',
        ref: '경희대 2028 자연계열 교과 이수 권장과목 안내(2025.4.)'
      });
    }
    return check({
      id: 'major-fit', level: WARN, title: '희망 학과 권장과목 — ' + f.field,
      value: '핵심과목 ' + coreMiss.length + '개 미이수',
      detail: '아직 담지 않은 핵심과목: ' + coreMiss.join(', ') + (recoMiss.length ? ' / 권장과목: ' + recoMiss.join(', ') : ''),
      fix: '핵심과목은 한두 개 빠졌다고 지원 자격이 없어지지는 않지만, 가능하면 담는 편이 좋습니다.',
      ref: '경희대 2028 자연계열 교과 이수 권장과목 안내(2025.4.)', link: '../majors/'
    });
  }

  /* ── 7. 권장과목 중 우리 학교 미개설 ──────────────────────────────── */
  function checkOfferGap(R, rules, intent) {
    if (!intent || !intent.field || R.level !== 'full' || !R.offered) {
      return check({
        id: 'offer-gap', level: UNKNOWN, title: '우리 학교에 없는 권장과목',
        detail: '희망 계열을 고르면 우리 학교 개설 여부를 함께 확인할 수 있습니다.',
        link: '../majors/'
      });
    }
    var f = findField(rules, intent.field);
    if (!f) return check({ id: 'offer-gap', level: OK, title: '우리 학교에 없는 권장과목', value: '해당 없음' });

    var all = uniq(flatten(f.core).concat(flatten(f.recommended)));
    var gap = all.filter(function (n) { return !R.offered[n]; });

    if (!gap.length) {
      return check({
        id: 'offer-gap', level: OK, title: '우리 학교에 없는 권장과목',
        value: '없음',
        detail: '권장과목이 모두 우리 학교에 개설되어 있습니다.'
      });
    }
    return check({
      id: 'offer-gap', level: WARN, title: '우리 학교에 없는 권장과목',
      value: gap.length + '과목',
      detail: gap.join(', ') + '은(는) 우리 학교 편성표에 없습니다.',
      fix: '학교에 개설되지 않은 과목은 공동교육과정이나 충남온라인학교로 이수할 수 있습니다. 한 학기에 2과목까지 신청할 수 있습니다.',
      ref: '공동교육과정 운영 안내', link: '../outside/'
    });
  }

  /* ── 실행 ──────────────────────────────────────────────────────────── */
  function verify(input) {
    var R = input.resolved, rules = input.rules, intent = input.intent || {};
    if (!R || !R.ok) {
      return { ok: false, error: (R && R.error) || '파일을 읽을 수 없습니다.', checks: [] };
    }
    var checks = [
      checkTotal(R, rules),
      checkGroups(R, rules),
      checkKME(R, rules),
      checkHierarchy(R, rules),
      checkRank(R, rules),
      checkMajorFit(R, rules, intent),
      checkOfferGap(R, rules, intent)
    ];
    var counts = { ok: 0, warn: 0, error: 0, unknown: 0 };
    checks.forEach(function (c) { counts[c.level]++; });
    return {
      ok: true, error: null,
      meta: R.meta, totals: R.totals, level: R.level,
      mismatch: R.mismatch || null,
      counts: counts, checks: checks
    };
  }

  return { verify: verify, splitPrereq: splitPrereq, LEVELS: { OK: OK, WARN: WARN, ERROR: ERROR, UNKNOWN: UNKNOWN } };
});
