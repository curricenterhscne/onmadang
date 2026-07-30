# CLAUDE.md — 온마당 본체 개발 컨텍스트

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽는 프로젝트 지침입니다.
> 레포 루트(`onmadang/`)에 두세요.
> 최종 갱신 2026-07-24

## 프로젝트 개요

충청남도교육청 고교학점제 종합지원 포털 **「온마당」** 본체 (`onmadang.or.kr`).
기존에 개발된 자산들을 새 메뉴 구조로 묶는 **통합 포털**이며, 자산을 새로 만들지 않고 **링크/임베드로 연동**한다.

- **개발 주체**: 담당 장학사 (직접 개발, Claude Code 활용)
- **협업**: 중등교육팀 (콘텐츠·검수)
- **런칭/배포**: 외부 인프라 용역 (정규 서버·도메인·SSL)
- **목표**: **2026년 7월 31일 — 기능적 완성** (죽은 링크 0, 전 메뉴 도달·동작, 콘텐츠 채움)

---

## ★ 진행 전략 — 기능 우선, 디자인 후행

**2026-07 전략 수정.** 이전의 "이미지 슬롯을 미리 비워두고 디자인과 병렬 진행"은 폐기한다.

```
[1단계] 전체 사이트를 기능적으로 완성한다  ← 지금 여기
             ↓  완성된 화면을 업체에 넘김
[2단계] 디자인 업체가 완성된 사이트의 "껍데기"를 교체한다
```

- 지금은 **현행 꾸꾸클럽 DS v1.0(임시 스킨) 위에서 기능을 끝내는 것**이 목표다. 비주얼 완성도에 시간을 쓰지 않는다.
- 업체는 빈 슬롯이 아니라 **동작하는 실제 화면**을 보고 디자인한다. 넘길 산출물은 슬롯ID 목록이 아니라 **완성된 사이트 URL + 화면 목록**이다.
- 따라서 코딩 시 **리스킨 가능성**이 최우선 품질 기준이다:
  - 색·서체·간격·모서리·그림자는 **전부 토큰으로**. raw 값을 인라인에 박지 않는다.
  - 같은 역할의 요소는 같은 클래스를 쓴다. 한 번 정의한 컴포넌트를 페이지마다 새로 만들지 않는다.
  - 레이아웃 구조와 시각 스타일을 섞지 않는다. 나중에 스타일만 걷어낼 수 있어야 한다.

> 디자인 결과물이 오면 **DS v2.0**으로 토큰화해 온마당에 먼저 적용하고, 형제 앱은 이후 브리지 레이어로 재스킨한다.

---

## 기술 원칙 (반드시 지킬 것)

1. **빌드 도구 없는 순수 정적 사이트** — HTML/CSS/JS만. 프레임워크·번들러 도입 금지(요청 전까지).
2. **커스텀 도메인 + GitHub Pages 배포** (`onmadang.or.kr`, CNAME 존재).
   - 내부 링크는 **반드시 상대경로** (`./about/`, `../safety/`). 절대경로(`/about/`) 금지.
   - 형제 레포로 가는 링크는 **풀 URL** 사용.
3. **캐릭터 사용 가능** — 꾸꾸클럽 캐릭터(팬꾸미·토꾸미·꾸미)의 **저작재산권이 확보되어 사용 제한이 해제되었다.**
   - 출처: `cne-design-system/assets/characters/*.svg` (CDN 참조)
   - 인라인 클로버 SVG placeholder는 여전히 유효하다. 캐릭터가 어울리지 않는 자리(작은 아이콘, 판정 결과 등)에는 계속 클로버를 쓴다.
   - 캐릭터는 **장식**이다. 정보 전달에 필수적이지 않으므로 `alt`는 캐릭터 이름 또는 `aria-hidden` 처리.
4. **디자인 토큰 우선** — raw 색값 직접 사용 금지. **아래 「디자인 토큰」 절의 실제 이름을 쓸 것.**
5. **웹 접근성(KWCAG)** — svg `aria-label`, 이미지 `alt`, landmark, 키보드 포커스, 색대비 준수.
   - 상태·판정은 **색만으로 구분하지 않는다.** 텍스트를 항상 병기한다.
6. **회원가입·서버 저장 0** — 학생 개인정보를 서버로 보내지 않는다. `apply/`의 Supabase는 수강신청 전용이며 다른 기능에서 접근 금지.
7. **2022 개정 교육과정 단일 기준** — 2015 개정 데이터·분기를 새로 만들지 않는다.
8. **★ 추정하지 말고 실측할 것** — 토큰 이름, 데이터 구조, 내보내기 스키마는 **문서가 아니라 실제 파일을 열어 확인한다.** 이 문서의 기술도 시간이 지나면 어긋날 수 있다. (2026-07 시점에 실제로 토큰 이름과 데이터 신뢰도가 문서와 달랐던 전례가 있다.)

---

## 디자인 토큰 ⚠️ 실측 기준

**레포에 토큰 체계가 두 개 공존한다. 페이지가 어느 쪽에 속하는지 먼저 확인할 것.**

### ① 본체 페이지 — `assets/css/common.css`

`design/index.html`, `design/check/`, `safety/`, `board/`, `dual_credit/`, `off-campus_courses/`, 신규 페이지 전부.

```
--bg #DAF2FC   --brand #4F6EBE   --brand-d #3a539b   --brand-l #6d8ad6
--accent #7BCE7C   --accent-d #5fb260   --online #7EC8E3   --online-d #2a8db5   --plum #b59ddb
--ink #1f2b44   --ink-soft #51607d   --ink-faint #8597ad
--line #c5dcef   --surface #fff   --soft #eef7fc
--radius 18px   --radius-sm 12px   --radius-pill 999px
--shadow / --shadow-sm / --shadow-lg   --maxw 860px
```

> **`--color-*` 토큰은 본체에 존재하지 않는다.** 이전 문서에 그렇게 적혀 있었으나 실제와 다르다. 본체 페이지에서 `var(--color-brand)`를 쓰면 아무것도 적용되지 않는다.

### ② `design/majors/` · `design/selector/` — CDN 디자인 시스템

`cne-design-system`의 `tokens/design-tokens.css` + `components/components.css`를 CDN으로 참조하며, 여기서만 **`--color-*`와 `.kk-*` 컴포넌트**를 쓴다. 두 폴더는 공통 헤더/푸터를 쓰지 않는다.

- 서체: **Pretendard** (`@v1.3.9` 버전 핀 고정됨)
- 배지 규칙: ★권장=그린 / ◆핵심=진블루 / 온라인=스카이
- ⚠️ **DS CDN이 아직 `@main`이다.** 커밋 해시 `@b851419`로 핀 고정 필요 (미적용, polish 항목).

---

## 공통 헤더·푸터

```html
<div id="om-header" data-active="design"></div>
...
<div id="om-footer"></div>
<script src="../../assets/js/common.js"></script>
```

- `common.js`가 placeholder를 **`outerHTML`로 교체**한다. 실행 후 `#om-header`는 사라지는 것이 정상이다.
- base 경로는 자기 `<script src>`에서 자동 계산하므로 경로를 정확히 쓸 것.
- GNB·모바일 메뉴·리뉴얼 배너·클로버 SVG defs가 함께 주입된다.
- `data-active` 값: `home` `design` `safety` `board`

### 공통 헤더가 제공하는 전역 유틸

`common.js`는 헤더/푸터만 주입하는 것이 아니다. 아래 전역을 함께 제공한다.

| 전역 | 위치 | 역할 |
|---|---|---|
| `window.cachedFetch(url, ttlMs)` | `common.js:203` | sessionStorage 캐시 fetch. 기본 TTL 1분. GitHub API rate limit(비인증 60회/시간) 보호용 |
| `#clv` SVG symbol | `common.js` | 인라인 클로버. `<use href="#clv"/>`로 사용 |

---

## 메뉴 구조 (GNB 순서 고정)

순서를 바꾸지 말 것. **안내가 항상 첫 번째.**

| # | 대메뉴 | 폴더 | 하위 | 상태 |
|---|---|---|---|---|
| 1 | **고교학점제 안내** | `about/` | 고교학점제란? / 학생 주도성과 고교학점제 | ❌ 미구축 (P0) |
| 2 | **진로·학업 설계** | `design/` | 아래 참조 | ⚠️ 재편 중 |
| 3 | **4대 안전망** | `safety/` | 학교 교육과정 / 충남온라인학교 / 공동교육과정 / 학교 밖 교육 | ✅ 완료 |
| 4 | **알림·소통 마당** | `board/` | 공지사항 / 자료실 | ✅ 기능 완료 (게시글 입력만 남음) |

### 「진로·학업 설계」 = 질문 3관문 구조 (2026-07 재편)

이전의 5단계 선형 구조(자기이해 → 교육과정이해 → 진로설계활동 → 과목선택실습 → 종합보고서)는 **폐기**했다.
수업용 워크북을 그대로 웹으로 옮겼다가 실패한 전례가 있다. **완주를 전제하는 구조를 다시 만들지 말 것.**

허브(`design/index.html`)는 위계 없는 카드 3장으로 구성한다.

> ① 뭘 골라야 할지 모르겠어요 · ② 우리 학교에 뭐가 있는지 모르겠어요 · ③ 내가 고른 게 맞는지 모르겠어요

| 하위 | 경로 | 역할 |
|---|---|---|
| 진로 나침반 | `design/compass/` | 커리어넷 검사 결과 → 계열 후보 제시 (검사 자체는 만들지 않음) |
| 학과·과목 탐색 | `design/majors/` | 학과 → 권장과목 → selector 브리지 |
| 과목 선택 실습 | `design/selector/` | 학교 편성표 시뮬레이션 |
| 내 선택 점검 | `design/check/` | selector 내보내기 파일 → 판정 7종 + A4 점검표 |
| (본문 링크만) | `design/outside/` | 학교에 없는 과목 듣는 법 |

**설계 원칙**
- 어느 지점에서 들어와도 그 화면 하나만으로 값을 준다. "1단계부터 하세요" 류 문구 금지. 번호는 순서가 아니라 이름표다.
- 산출물은 "빈칸을 채운 설계서"가 아니라 **판정 결과지**다. 다 안 채워도 유효해야 한다.
- 판정에 점수·등급을 부여하지 않는다. "무엇이 몇 학점 모자란지 + 어떻게 하면 되는지"로 쓴다.
- 수강신청은 학교별 오프라인이므로 **인쇄(A4 1장) + 이미지/텍스트 공유**가 종착점이다.

---

## 자산 연동

자세한 명세는 `ASSETS.md` 참조.

| 자산 | 위치 | 연동 방식 |
|---|---|---|
| ① 대학 학과·권장 과목 | `design/majors/` (폴더 통합) | 내부 상대경로 |
| ② 과목 선택 실습 | `design/selector/` (폴더 통합) | 내부 상대경로 |
| ③ 공동교육과정 수강신청 | 외부 (신규 개발 중) → 현재 `safety/enrollment-closed.html`로 안내 | 외부 링크 |
| ⓪ 디자인 시스템 | CDN (`curricenterhscne/cne-design-system`) | CDN 참조 |

**①↔② 브리지**: 학과 모달 → `?want=&core=&majorId=` → selector 자동선택 → 토스트.
이 로직은 ①②가 이미 보유. 브리지 URL은 상대경로(`../selector/`).

---

## 앱·모듈 레지스트리

이 레포에는 여러 독립적인 앱/모듈이 공존한다.
**`CLAUDE.md`가 있는 폴더는 반드시 그 문서를 먼저 읽을 것.** 없는 폴더는 코드를 직접 확인한다.

| 폴더 문서 | 상태 |
|---|---|
| `apply/CLAUDE.md` | ✅ (admin/ 내용 포함 — admin 전용 문서는 두지 않음) |
| `board/CLAUDE.md` | ✅ |
| `design/CLAUDE.md` | ✅ |
| `design/majors/CLAUDE.md` · `design/selector/CLAUDE.md` | ✅ (수정 금지 경계·데이터 명세) |
| `dual_credit/CLAUDE.md` | ✅ |
| `safety/` · `off-campus_courses/` | ❌ 없음 — 정적 콘텐츠 페이지라 별도 문서를 두지 않는다 |

| 폴더 | 성격 | 공통 헤더/푸터 | 핵심 파일 | 비고 |
|---|---|---|---|---|
| `about/` | 고교학점제 안내 | ✅ 사용 | — | **미구축 (P0)** |
| `apply/` | 수강신청 앱 (Supabase) | ❌ 독립 | `index.html`, `_embed_data.js` | 실시간 좌석 예약 |
| `apply/admin/` | 수강신청 관리자 대시보드 | ❌ 독립 | `index.html` | Edge Functions API |
| `board/` | 공지·자료실 | ✅ 사용 | `index.html` `notice.html` `resources.html` `resource-view.html` | GitHub Issues API (라벨 `공지`/`자료`) |
| `dual_credit/` | 강좌 안내·카탈로그 | ✅ 사용 | `index.html`, `courses.html` | DATA 인라인 |
| `design/` | 진로·학업 설계 허브 | ✅ 사용 | `index.html` | 3관문 구조로 재편 중 |
| `design/check/` | 내 선택 점검 | ✅ 사용 | `index.html` | 판정 7종 · A4 인쇄 |
| `design/compass/` | 진로 나침반 | ✅ 사용 | — | 예정 |
| `design/outside/` | 미개설 과목 대안 | ✅ 사용 | — | 예정 |
| `design/majors/` | 대학 학과 안내 (자산①) | ✅ 사용 + CDN DS | `index.html`, `app.js` | 기존 로직 유지 |
| `design/selector/` | 과목 선택 실습 (자산②) | ✅ 사용 + CDN DS | `index.html`, `guide.html` | 기존 로직 유지 |
| `safety/` | 4대 안전망 페이지들 | ✅ 사용 | 5개 HTML | 정적 콘텐츠 |
| `off-campus_courses/` | 학교 밖 교육 강좌 | ✅ 사용 | `index.html` | — |

### 공유 모듈 (`design/`)

| 파일 | 역할 |
|---|---|
| `design/js/jinro-plan.js` | selector 내보내기 파일 → 편성표로 과목 복원. DOM 비의존 |
| `design/js/jinro-verify.js` | 판정 엔진 7종. DOM 비의존, 콘솔 단독 테스트 가능 |
| `design/css/jinro.css` | 진로·학업 설계 공용 스타일 + A4 인쇄 |
| `design/data/*.json` | 2022 개정 콘텐츠 자산 17종 (편제·평가·필수이수·위계·2028 권장과목 등) |
| `design/_dev/` | 개발용 테스트. **배포 제외 대상** |

### ⚠️ selector 데이터 사용 시 반드시 지킬 것

- 편성표: `design/selector/data/curriculum_{year}/{code}.json` (2025: 93 / 2026: 94)
- `selections` 키 `g{gi}-s{si}-sem{0~5}` → `groups[gi].subjects[si]`로 복원 가능
- 학점 집계는 selector `_buildSummary()`를 재현한다 — 지정군은 selections 무관 전량, 선택군은 `subj.opCredit || group.groupCredit`, `isSoonjeung` 그룹 제외
- **`summary.groupBreakdown`을 그대로 쓰지 말 것.** 편성표에 `한국사` 교과군이 없고 `사회`에 섞여 있어 두 판정이 동시에 틀린다 → `design/data/group-alias.json`으로 재집계
- 석차등급 산출 여부는 편성표 `subject.rank`(`5등급`/`-`)를 1순위로 쓴다. 규칙 추론보다 정확하다

### 데이터 동기화 주의

`apply/_embed_data.js`와 `dual_credit/courses.html`은 **동일한 14개 강좌 데이터**를 각각 보유한다 (필드명이 다름).
강좌 정보 수정 시 **반드시 양쪽 동시 수정**. 필드 매핑은 각 폴더의 CLAUDE.md 참조.

---

## 작업 방식

- `prompts/` 폴더의 단계별 프롬프트를 순서대로 사용.
- 각 단계 완료 후 의미 단위로 커밋(메시지는 한국어). **커밋·푸시는 승인 후에만.**
- 작업 기록은 `WORKLOG.md`에 남긴다.
- 콘텐츠 텍스트는 팀이 교체할 수 있도록 플레이스홀더나 명확한 구획으로 작성.
- 새로운 앱/모듈 추가 시 해당 폴더에 `CLAUDE.md`를 작성하고 위 레지스트리에 등록.
- **폴더 문서에 줄 수·개수 같은 변동값을 적을 때는 "약"을 붙이고, 함수명·필드명은 코드를 열어 대조한 뒤 적는다.** 실제로 존재하지 않는 함수명이 문서에 남아 있던 전례가 있다.
- **로컬 확인은 HTTP 서버로.** `fetch`를 쓰는 페이지는 `file://`에서 동작하지 않는다 → `python3 -m http.server 8080`

## 하지 말 것

- ①② 자산의 핵심 로직(데이터 로드, 브리지 파라미터 처리 등) 재구현 ❌ → 기존 코드 유지
- 절대경로 내부 링크 ❌
- 빌드 도구·프레임워크 임의 도입 ❌
- GNB 순서 변경 ❌
- 본체 페이지에 `var(--color-*)` 사용 ❌ → 존재하지 않는 토큰이다
- 학생 정보를 서버·localStorage에 저장 ❌
- 완주를 전제하는 선형 구조 ❌ (실패 전례 있음)
- 비주얼 완성도에 시간 쏟기 ❌ → 껍데기는 디자인 업체가 교체한다
