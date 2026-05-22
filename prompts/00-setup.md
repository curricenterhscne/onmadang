# 00 · 초기 세팅

CLAUDE.md와 ASSETS.md를 먼저 읽고 그 원칙을 따르세요.

이 레포는 충남 고교학점제 종합지원 포털 '온마당'의 본체입니다.
빌드 도구 없는 순수 HTML/CSS/JS 정적 멀티페이지로 개발하고 GitHub Pages로 배포합니다.

## 할 일

1. `.nojekyll`(빈 파일), `README.md` 생성
   - README: 프로젝트 소개, 로컬 미리보기(`python3 -m http.server 8000`), GitHub Pages 배포 절차

2. `assets/css/tokens.css` 작성 — CLAUDE.md의 디자인 토큰을 `:root` CSS 변수로 정의
   (--color-bg, --color-brand(-d), --color-accent(-d), --color-online(-d) + 간격·radius·shadow)

3. `assets/css/base.css` — 리셋, Pretendard 적용, 타이포 스케일, `.wrap` 컨테이너(max-width 1180px)

4. `assets/css/components.css` — 헤더/GNB·버튼(.btn-primary/.btn-ghost)·카드·배지(.nb 등) 컴포넌트

5. `assets/characters/clover.svg` — 인라인용 클로버 심볼 저장
   - 같은 폴더 `README.md`: "정식 캐릭터는 디자인 용역 권리 확보 후 교체 예정. 권리 미확보 외부 캐릭터 사용 금지." 명시

6. 첨부할 `index.html`(온마당 메인 시안)을 위 구조에 맞게 리팩터링:
   - 인라인 `<style>`을 tokens/base/components.css로 분리하고 `<link>`로 연결
   - 클로버 SVG는 `assets/characters/clover.svg`를 `<use>`로 참조하거나 심볼 정의 유지
   - 모든 내부 링크 상대경로 확인, 자산 링크는 풀 URL 유지

## 주의
- GNB 순서 고정: 고교학점제 안내 → 진로·학업 설계 → 4대 안전망 → 알림·소통
- 내부 링크 절대경로 금지(상대경로만)
- 커밋 메시지는 한국어로, 의미 단위로 제안
