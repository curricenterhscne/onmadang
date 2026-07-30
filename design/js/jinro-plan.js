/*!
 * jinro-plan.js — selector 내보내기 파일 → 과목 단위 복원
 * 온마당 「진로·학업 설계」 / 내 선택 점검
 *
 * 원칙
 *  - DOM 비의존 순수 함수. 브라우저·Node 양쪽에서 동작.
 *  - design/selector/ 의 코드를 수정하지 않고 같은 데이터만 읽는다.
 *  - 학점 집계는 selector 의 _buildSummary() 로직을 그대로 재현한다.
 *    (index.html:1731~1771 실측 — 지정군은 selections 무관 전량 집계,
 *     선택군은 selections 해당분만 subj.opCredit || group.groupCredit)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JinroPlan = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA = 'cne_course_selector/v1';
  var SEM_LABEL = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'];

  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function fmt(n) { return n % 1 === 0 ? n : parseFloat(n.toFixed(1)); }

  function parseKey(k) {
    var m = /^g(\d+)-s(\d+)-sem(\d+)$/.exec(k);
    return m ? { gi: +m[1], si: +m[2], sem: +m[3] } : null;
  }

  /** 편성표 경로 (selector index.html:1034 와 동일 규칙) */
  function catalogUrl(year, code, base) {
    base = base || '../selector/data';
    return base + '/curriculum_' + year + '/' + encodeURIComponent(code) + '.json';
  }

  function validate(plan) {
    if (!plan || typeof plan !== 'object') return '파일을 읽을 수 없습니다.';
    if (plan.schema !== SCHEMA) return '과목 선택 실습에서 내보낸 파일이 아닙니다.';
    if (!plan.schoolCode) return '파일에 학교 정보가 없습니다.';
    if (!Array.isArray(plan.selections)) return '선택 정보가 없습니다.';
    return null;
  }

  /** 창의적 체험활동 학점 (selector 와 동일: 학기별 시수 합 / 16) */
  function changcheCredits(catalog) {
    var cc = catalog && catalog.changche;
    if (!cc) return 0;
    var total = 0;
    for (var i = 0; i < 6; i++) {
      var sum = 0;
      Object.keys(cc).forEach(function (k) { sum += num(cc[k][i]); });
      total += sum / 16;
    }
    return total;
  }

  /**
   * plan + catalog → 과목 단위 복원
   * @returns {{ok:boolean, level:string, error:string|null, meta:object,
   *            items:Array, totals:object, byGroup:object, unmapped:object,
   *            offered:Set, mismatch:object|null}}
   */
  function resolve(plan, catalog, alias) {
    var err = validate(plan);
    if (err) return { ok: false, level: 'none', error: err };

    if (!catalog || !Array.isArray(catalog.groups)) {
      // 편성표를 못 불러온 경우 — summary 만으로 축소 동작.
      // summary.groupBreakdown 은 편성표 group 값이라 '한국사'가 '사회'에 섞여 있다.
      // 그래서 사회·한국사 두 교과군은 판정 불가로 표시한다.
      var sm = plan.summary || {};
      var bg = {}, um = {}, hasBreakdown = !!(sm.groupBreakdown && Object.keys(sm.groupBreakdown).length);
      if (hasBreakdown) {
        Object.keys(sm.groupBreakdown).forEach(function (g) {
          var key = alias.byGroup && alias.byGroup[g];
          if (key) bg[key] = fmt((bg[key] || 0) + num(sm.groupBreakdown[g]));
          else um[g] = fmt((um[g] || 0) + num(sm.groupBreakdown[g]));
        });
      }
      return {
        ok: true, level: 'summary', error: null,
        meta: metaOf(plan),
        items: [], offered: null,
        hasBreakdown: hasBreakdown,
        socialUnsplit: hasBreakdown,     // 사회 ↔ 한국사 분리 불가
        totals: {
          subjectCredits: fmt(num(sm.totalCredits) - num(sm.changcheCredits)),
          changche: num(sm.changcheCredits),
          total: num(sm.totalCredits)
        },
        byGroup: bg, unmapped: um, mismatch: null
      };
    }

    var sel = {};
    plan.selections.forEach(function (k) { sel[k] = true; });

    var items = [];
    var offered = {};

    catalog.groups.forEach(function (group, gi) {
      (group.subjects || []).forEach(function (subj, si) {
        if (subj && subj.name) offered[subj.name] = true;
      });
      if (group.isSoonjeung) return;

      var fixed = group.division === '지정';
      (group.subjects || []).forEach(function (subj, si) {
        for (var i = 0; i < 6; i++) {
          var credit;
          if (fixed) {
            credit = num((subj.semCredits || [])[i]);
            if (!credit) continue;
          } else {
            if (!sel['g' + gi + '-s' + si + '-sem' + i]) continue;
            credit = num(subj.opCredit || group.groupCredit || 0);
          }
          items.push({
            name: subj.name || '(이름 없음)',
            group: subj.group || '기타',
            type: subj.type || '',
            area: subj.area || '',
            achievement: subj.achievement || '',
            rank: subj.rank || '',
            sem: i,
            semLabel: SEM_LABEL[i],
            credits: credit,
            fixed: fixed,
            division: group.division || ''
          });
        }
      });
    });

    // 교과군 집계 — summary.groupBreakdown 을 쓰지 않고 직접 재집계한다.
    // (편성표에 '한국사' 교과군이 없어 summary 를 그대로 쓰면 사회·한국사가 동시에 틀린다)
    var byGroup = {}, unmapped = {};
    items.forEach(function (it) {
      var key = (alias.bySubjectName && alias.bySubjectName[it.name])
             || (alias.byGroup && alias.byGroup[it.group]);
      if (key) byGroup[key] = fmt((byGroup[key] || 0) + it.credits);
      else unmapped[it.group] = fmt((unmapped[it.group] || 0) + it.credits);
    });

    var subjectCredits = 0;
    items.forEach(function (it) { subjectCredits += it.credits; });
    var cc = changcheCredits(catalog);

    // selector summary 와 교차검증 (일치해야 정상)
    var mismatch = null;
    if (plan.summary && plan.summary.totalCredits != null) {
      var mine = fmt(subjectCredits + cc);
      var theirs = num(plan.summary.totalCredits);
      if (Math.abs(mine - theirs) > 0.05) mismatch = { mine: mine, summary: theirs };
    }

    return {
      ok: true, level: 'full', error: null,
      hasBreakdown: true, socialUnsplit: false,
      meta: metaOf(plan),
      items: items,
      offered: offered,
      totals: { subjectCredits: fmt(subjectCredits), changche: fmt(cc), total: fmt(subjectCredits + cc) },
      byGroup: byGroup,
      unmapped: unmapped,
      mismatch: mismatch
    };
  }

  function metaOf(plan) {
    return {
      year: plan.year || '',
      schoolCode: plan.schoolCode || '',
      schoolName: plan.schoolName || plan.schoolCode || '',
      department: plan.department || null,
      exportedAt: plan.exportedAt || null,
      preset: plan.preset || null
    };
  }

  /**
   * 편성표 파일 코드 해석 — selector onSchoolChange() 와 동일 규칙.
   * 학과가 있는 학교는 학과별 코드가 따로 있다. (예: N100002532(영어과))
   */
  function catalogCode(plan, schools) {
    var base = plan.schoolCode;
    if (!plan.department || !Array.isArray(schools)) return base;
    var school = null;
    for (var i = 0; i < schools.length; i++) {
      if (schools[i]['학교코드'] === base) { school = schools[i]; break; }
    }
    if (!school) return base;
    var list = school['departments_' + plan.year] || [];
    for (var j = 0; j < list.length; j++) {
      if (list[j].dept === plan.department) return list[j].code;
    }
    return base;
  }

  /** 과목명 → 대표 학기(가장 이른 학기) */
  function firstSemOf(items, name) {
    var s = null;
    items.forEach(function (it) { if (it.name === name && (s === null || it.sem < s)) s = it.sem; });
    return s;
  }

  return {
    SCHEMA: SCHEMA,
    SEM_LABEL: SEM_LABEL,
    parseKey: parseKey,
    catalogUrl: catalogUrl,
    catalogCode: catalogCode,
    validate: validate,
    resolve: resolve,
    firstSemOf: firstSemOf
  };
});
