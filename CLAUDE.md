# CLAUDE.md — 온마당 본체 개발 컨텍스트

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽는 프로젝트 지침입니다.
> 레포 루트(`onmadang/`)에 두세요.

## 프로젝트 개요

충청남도교육청 고교학점제 종합지원 포털 **「온마당」** 본체.
기존에 개발된 자산들을 새 메뉴 구조로 묶는 **통합 포털**이며, 자산을 새로 만들지 않고 **링크/임베드로 연동**한다.

- **개발 주체**: 담당 장학사 (직접 개발, Claude Code 활용)
- **협업**: 중등교육팀 (콘텐츠·검수)
- **런칭/배포**: 외부 인프라 용역 (정규 서버·도메인·SSL)
- **목표**: 2026년 7월 초 베타 오픈

## 기술 원칙 (반드시 지킬 것)

1. **빌드 도구 없는 순수 정적 사이트** — HTML/CSS/JS만. 프레임워크·번들러 도입 금지(요청 전까지).
2. **GitHub Pages 프로젝트 페이지로 배포** → 주소가 `<계정>.github.io/onmadang/` 하위.
   - 내부 링크는 **반드시 상대경로** (`./about/`, `../safety/`). 절대경로(`/about/`) 금지.
   - 형제 레포(자산)로 가는 링크는 **풀 URL** 사용.
3. **캐릭터는 인라인 클로버 SVG placeholder만 사용.**
   - ⚠️ 현재 임시 DS는 타 용역 캐릭터를 권리 미확보 상태로 차용 → 본체엔 절대 넣지 말 것.
   - 정식 캐릭터는 추후 디자인 용역에서 권리 확보 후 `assets/characters/`만 교체.
4. **디자인 토큰 우선** — raw 색값 직접 사용 금지, `var(--color-*)` 사용.
5. **웹 접근성(KWCAG)** — svg `aria-label`, 이미지 `alt`, landmark, 키보드 포커스, 색대비 준수.

## 디자인 토큰 (꾸꾸클럽 DS v1.0, 임시)

```
--color-bg:        #DAF2FC   /* 라이트블루 배경, theme-color */
--color-brand:     #4F6EBE   /* 진블루 — 로고·헤더·◆핵심 배지 */
--color-brand-d:   #3a539b
--color-accent:    #7BCE7C   /* 그린 — ★권장·행운(네잎클로버) */
--color-accent-d:  #5fb260
--color-online:    #7EC8E3   /* 스카이 — 온라인학교·온라인 배지 */
--color-online-d:  #2a8db5
```
- 서체: **Pretendard**
- 배지 규칙: ★권장=그린 / ◆핵심=진블루 / 온라인=스카이

## 메뉴 구조 (GNB 순서 고정)

순서를 바꾸지 말 것. **안내가 항상 첫 번째.**

1. **고교학점제 안내** (`about/`) — 고교학점제란? / 학생 주도성과 고교학점제
2. **진로·학업 설계** (`design/`) — 자기 이해 / 교육과정 이해 / 진로설계 활동 / 과목 선택 실습 / 종합 보고서
3. **4대 안전망** (`safety/`) — 학교 교육과정 / 충남온라인학교 / 공동교육과정 / 학교 밖 교육
4. **알림·소통 마당** (`board/`) — 공지사항 / 자료실

## 기존 자산 연동 (새로 만들지 말 것 — 링크만)

자세한 명세는 `ASSETS.md` 참조. 형제 레포로 운영되며 본체는 링크/임베드만 한다.

| 자산 | URL | 연동 위치 |
|---|---|---|
| ① 대학 학과·권장 과목 | https://curricenterhscne.github.io/2022-curriculum-majors/ | `design/practice.html` |
| ② 과목 선택 실습 | https://curricenterhscne.github.io/course_selector_cne/ | `design/practice.html` |
| ③ 공동교육과정 수강신청 | ~~https://gongdong-enrollment.vercel.app/~~ (폐쇄, 신규 개발 중) → 현재 `safety/enrollment-closed.html`로 안내 | `safety/jointcurricula.html` |
| ⓪ 디자인 시스템 | https://curricenterhscne.github.io/cne-design-system/ | 전역 CSS |

**①↔② 브리지**: 학과 모달 → `?want=&core=&majorId=` 파라미터 → selector 자동선택 → 토스트.
이 로직은 자산이 이미 보유. 본체는 **링크만 정확히 연결**하고 건드리지 않는다.

## 작업 방식

- `prompts/` 폴더의 단계별 프롬프트를 순서대로 사용.
- 각 단계 완료 후 의미 단위로 커밋(메시지는 한국어).
- 콘텐츠 텍스트는 플레이스홀더로 두고, 팀이 교체할 수 있게 한다.
- 공지·자료는 코드가 아닌 `board/data/*.json`으로 분리.

## 하지 말 것

- 자산(①②③) 내부 로직 재구현 ❌ → 링크로 연결
- 절대경로 내부 링크 ❌
- 권리 미확보 캐릭터 이미지 사용 ❌
- 빌드 도구·프레임워크 임의 도입 ❌
- GNB 순서 변경 ❌
