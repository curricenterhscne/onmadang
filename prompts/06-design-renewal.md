# 06 · 디자인 리뉴얼 (업체 디자인 → 본체 적용)

> 먼저 읽을 것: `docs/design-renewal/계획.md` → `점검표_2026-10-14.md` → `design-map.json`
> 원본: `design-source/2026-10-14_test/` (**수정 금지**, git 제외)
> 각 단계 끝에서 멈추고 결과를 보여줄 것. 커밋·푸시는 승인 후에만.

## 1단계 — 점검·매핑 확인
- `design-map.json`의 `src` 파일이 실제로 있는지, `where`가 `index.html`의 실제 섹션/클래스와 맞는지 대조한다.
- `screen_main.png`를 열어 라벨 위치와 매핑이 맞는지 확인한다. 틀린 곳은 `design-map.json`을 고친다.
- ⏸ 대조 결과 표

## 2단계 — 에셋 반입
- `use: true` 항목만 `dest`로 복사·최적화한다. 원본은 건드리지 않는다.
  - SVG: XML 선언·`id="_레이어_1"`·`data-name`·불필요한 `<defs><style>`를 정리(가능하면 속성으로 인라인), `viewBox` 유지, `width/height` 제거
  - `status: ok-mono`: 단색 `fill`을 `currentColor`로 바꿔 CSS `color`로 색을 넣을 수 있게
  - PNG(`dest`에 확장자 없음): `<dest>.webp`(1440폭, 2880폭 `@2x`) + `<dest>.jpg` 폴백. 품질 80 내외
- 도구가 필요하면 `design/_dev/`처럼 **배포 제외 폴더**(`docs/design-renewal/_tools/`)에 둔다. 빌드 도구를 사이트에 도입하지 않는다.
- ⏸ 생성 파일 목록과 용량(원본 대비)

## 3단계 — 토큰 교체
- `docs/design-renewal/tokens-draft.css`의 값을 `assets/css/common.css` `:root`에 반영한다. **이름 변경 금지**, 새 토큰만 추가.
- 영향 페이지를 HTTP 서버(`python3 -m http.server 8080`)로 열어 확인: 홈, `about/`, `design/`, `design/check/`(인쇄 미리보기 포함), `safety/`, `board/`, `dual_credit/`.
- 글자/배경 조합 명도대비를 계산해 4.5:1(큰 글자 3:1) 미달 목록을 보고한다.
- ⏸ 전후 스크린샷 + 미달 목록

## 4단계 — 홈 리스킨
- 섹션 순서를 시안대로: hero → about-sec → design-sec → safety-sec → **board-sec(맨 아래로 이동)**.
- 섹션 하나씩 진행. 매 섹션마다 Playwright로 1440px 스크린샷을 찍어 `screen_main.png` 같은 구간과 나란히 붙여 `docs/design-renewal/qa/<섹션>.png`로 저장하고 차이를 줄인다.
- **링크·문구·기능은 그대로.** 시안 문구가 현재와 다르면 바꾸지 말고 목록으로 보고한다(문체 원칙 5-1 판단은 담당자).
- 재납품 대기 요소(`status: reissue`)는 자리만 잡고 기존 캐릭터/클로버로 임시 표시.
- 4대 안전망 반원 4분할은 업체 파일이 없으므로 SVG(또는 CSS)로 직접 그린다. 각 칸은 링크이며 키보드 포커스가 보여야 한다.
- 캐릭터 동선 점선은 PC(≥980px)에서만, 장식이므로 `aria-hidden="true"`.
- ⏸ 섹션별 비교 이미지

## 5단계 — 헤더·GNB·푸터
- 시안 헤더(필 형태 메뉴, 우측 「과목 선택 실습」 CTA)를 `common.js`/`common.css`에 반영. 로고는 재납품 전까지 기존 클로버+텍스트.
- **「꾸꾸클럽」을 `subMenus.about` 맨 뒤에 추가** → `about/kkukku-club.html` 신설(내용은 플레이스홀더, 공통 헤더/푸터 + GoatCounter 포함). 대메뉴는 4개 그대로.
- `common.js`를 안 쓰는 페이지(`apply/app.html`, `design/selector/guide.html`, 부속 페이지)는 건드리지 않는다.
- 푸터: 시안이 비어 있으므로 배경을 `--brand`로만 바꾸고 나머지는 유지.
- ⏸ 헤더 PC/모바일 캡처

## 6단계 — 모바일 구현안
- 390px에서 홈 전체 캡처(`docs/design-renewal/qa/mobile-home.png`). 업체 검토용이다. 관문 카드 세로 쌓기, 안전망 2×2, 점선 숨김.
- ⏸ 캡처 전달

## 마무리
- `WORKLOG.md`에 기록, `CLAUDE.md` 「디자인 토큰」 절의 값 갱신(실측 후), 레지스트리에 `docs/design-renewal/` 추가.
- 커밋 메시지 한국어로 제안만 하고 승인 대기.
