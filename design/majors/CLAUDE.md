# CLAUDE.md — 대학 학과와 권장 과목 안내 (design/majors/)

> **통합 자산 ①.** 원본 레포 `curricenterhscne/2022-curriculum-majors`.
> **공통 헤더/푸터 사용** (`common.js` + `common.css`). CDN 디자인 시스템(`--color-*`, `.kk-*`)도 함께 쓴다.
> 최종 검증 2026-07-24 (실측)

## ⚠️ 수정 금지 경계

**핵심 로직(데이터 로드, 학과 모달, 브리지 URL 생성)을 재구현하거나 수정하지 않는다.**
데이터 파일을 **읽는 것**은 허용된다. `design/check/`가 권장과목 대조에 사용한다.

## 구조

```
majors/
├─ index.html          약 1,270줄
├─ app.js              약 670줄
├─ manifest.json
└─ 01-humanities.json ~ 10-medical.json   계열별 학과 데이터
```

## 데이터 — 10계열 130개 학과 (실측)

| 파일 | 계열 | 학과 | | 파일 | 계열 | 학과 |
|---|---|---|---|---|---|---|
| 01-humanities | 인문학 | 11 | | 06-engineering | 공학 | 26 |
| 02-social | 사회 | 14 | | 07-agriculture | 농생명과학 | 12 |
| 03-business | 경상 | 8 | | 08-arts | 예체능 | 5 |
| 04-education | 사범 | 27 | | 09-future | 융합미래분야 | 5 |
| 05-natural | 자연과학 | 9 | | 10-medical | 의료보건 | 13 |

> 이전 문서의 "170여 학과"는 실제와 다르다. **130개**다.

### 파일 구조

```json
{ "category": "인문학", "categoryId": "…",
  "departments": [{
    "id", "name", "desc",
    "mainCourses", "basicCourses", "majorCourses",
    "similarDepts", "careers", "licenses", "subjects"
  }] }
```

최상위 키는 `departments`다. `majors`가 아니다.

## ② selector 와의 브리지

학과 모달의 "이 학과 권장 과목으로 과목 선택 실습" 버튼 →
`../selector/?want=<과목들>&core=<과목들>&majorId=<학과ID>`

생성 함수: **`app.js:446 buildSelectorUrl()`**. **재구현 금지.**

## 하지 말 것

- 핵심 로직 수정·재구현 ❌
- 공통 헤더/푸터(`common.js`) ✅ 적용 완료 (2026-07-30)
- 브리지 파라미터 이름 변경 ❌ (`want` `core` `majorId` 고정)
- 학과 수를 문서에서 추정 ❌ → `departments` 배열 길이를 직접 셀 것
