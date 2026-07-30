# CLAUDE.md — 과목 선택 실습 (design/selector/)

> **통합 자산 ②.** 원본 레포 `curricenterhscne/course_selector_cne`.
> **공통 헤더/푸터 사용** (`common.js` + `common.css`). CDN 디자인 시스템(`--color-*`, `.kk-*`)도 함께 쓴다.
> 최종 검증 2026-07-24 (실측)

## ⚠️ 수정 금지 경계

**핵심 로직(데이터 로드, 학점 집계, 브리지 파라미터 처리, 내보내기/가져오기)을 재구현하거나 수정하지 않는다.**
데이터 파일을 **읽는 것**은 허용된다. 실제로 `design/check/`가 같은 편성표를 읽어 판정한다.

## 구조

```
selector/
├─ index.html    단일 파일 앱 (약 88KB, 스타일·로직 인라인)
├─ guide.html    사용 안내
└─ data/
   ├─ schools.json                 학교 목록
   ├─ courseDB.json                834과목 마스터 DB
   ├─ curriculum_2025_index.json   {학교코드: {updated, size}}
   ├─ curriculum_2026_index.json
   ├─ curriculum_2025/{code}.json  93개
   └─ curriculum_2026/{code}.json  94개     ← 합계 187개
```

## 편성표 JSON 구조 (실측)

```
{
  groups: [{
    division,      // "지정" | "선택 1" | "선택 2" …
    selectCount,   // "X" | "학기별 택 2" …
    semesters,     // [bool ×6]
    groupCredit, isSoonjeung, isElectiveDiff, splitCredits, isCollapsed,
    subjects: [{
      name,        // 과목명
      group,       // 교과(군)  ⚠️ '한국사' 교과군 없음 — '사회'에 포함
      type,        // 공통 | 일반 | 진로 | 융합
      area,        // 보통 | 전문교과 | 과학계열 | 체육계열 | 예술계열 | 외국어⋅국제 계열
      basic, range,
      semCredits,  // [학점 문자열 ×6]  (1-1,1-2,2-1,2-2,3-1,3-2)
      opCredit,    // 선택군 학점 (10,282개 중 6,964개 보유 — 우선 사용)
      achievement, // "5단계" | "3단계" | "P"
      rank,        // "5등급" | "-"   ← 석차등급 산출 여부
      course, remarks
    }]
  }],
  changche: { "0": [시수 ×6], "1": […], "2": […] }
}
```

- 편성표 URL: `data/curriculum_${year}/${encodeURIComponent(code)}.json` (`index.html:1034`)
- 학과가 있는 학교는 `schools.json`의 `departments_{year}[].code` 사용 (예: `N100002532(영어과)`)
- 파일명에 괄호·한글이 들어가므로 **`encodeURIComponent` 필수**

## 저장 방식

**localStorage 미사용.** 메모리 상태 + 파일 내보내기/가져오기. 드래그앤드롭 import 지원.

```json
{ "schema":"cne_course_selector/v1", "exportedAt":"…+09:00",
  "year":"2026", "schoolCode":"…", "schoolName":"…", "department":null,
  "selections":["g0-s0-sem0", …], "preset":null,
  "summary":{ "totalCredits":…, "changcheCredits":…, "groupBreakdown":{…} } }
```

- `selections` 키 = `` `g${gi}-s${si}-sem${semIdx}` `` (semIdx 0~5) — `index.html:1386`
- **`g{gi}-s{si}` → `groups[gi].subjects[si]`로 완전 복원 가능**
- import 시 `schema` 문자열을 검사한다. 외부에서 읽을 때도 동일하게 검사할 것

## 학점 집계 규칙 (`_buildSummary`, index.html:1731~1771)

외부에서 재현할 때 반드시 이대로 할 것.

```
창체학점 = Σ(i=0..5) [ Σ(모든 changche 배열[i]) / 16 ]
groups.forEach((group, gi) => {
  if (group.isSoonjeung) return;              // 순증 그룹 제외 (187건 중 9건)
  if (group.division === '지정')               // selections 무관, 전량 집계
      → subj.semCredits[i] 합산
  else                                         // selections 해당분만
      → credit = subj.opCredit || group.groupCredit
})
```

## ⚠️ summary.groupBreakdown 을 그대로 쓰지 말 것

키가 편성표 `subject.group` 값이라 **한국사가 사회에 섞여 있다.** 그대로 쓰면 사회(8학점)·한국사(6학점) 판정이 **동시에** 틀린다.
→ `selections` + 편성표로 직접 재집계하고 `design/data/group-alias.json`으로 매핑한다. `summary`는 교차검증용으로만.

## ① majors 와의 브리지

`?want=<과목들>&core=<과목들>&majorId=<학과ID>` → 학교 선택 시 해당 과목 자동 선택 + 토스트.
`majors/app.js:446 buildSelectorUrl()`이 생성한다. **재구현 금지.**

## 하지 말 것

- 핵심 로직 수정·재구현 ❌
- 공통 헤더/푸터(`common.js`) ✅ 적용 완료 (2026-07-30)
- `summary.groupBreakdown` 직접 사용 ❌
- `opCredit` 무시하고 `groupCredit`만 사용 ❌ (선택군 학점이 틀어진다)
- `isSoonjeung` 그룹을 집계에 포함 ❌
