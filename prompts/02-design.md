# 02 · 진로·학업 설계 + 자산 ①② 연동

ASSETS.md의 ①②와 브리지 규칙을 따르세요. **자산을 새로 만들지 말고 링크/임베드만.**

## design/index.html (5단계 허브)
- 5단계 흐름: 자기 이해 → 교육과정 이해 → 진로설계 활동 → **과목 선택 실습** → 종합 보고서
- 4단계(과목 선택 실습) 카드만 `practice.html`로 연결, 나머지는 각 상세 페이지로.
- 메인(index.html)의 5단계 디자인과 톤 일치.

## design/practice.html (과목 선택 실습) — 핵심
연동 자산:
- 대학 학과·권장 과목: https://curricenterhscne.github.io/2022-curriculum-majors/
- 과목 선택 실습:      https://curricenterhscne.github.io/course_selector_cne/

요구사항:
1. 두 도구 소개 카드 + "새 탭에서 열기"(`target="_blank" rel="noopener"`)
2. iframe 임베드 옵션(반응형, 최소높이 720px) — 단, `X-Frame-Options` 차단 시
   자동으로 링크 카드만 보이는 **폴백** 처리(JS로 로드 실패 감지 또는 안내 문구).
3. ①↔② 브리지(want/core/majorId) 흐름 설명 안내 박스.
   브리지 로직은 자산이 보유 → 본체는 링크만 정확히, 파라미터 가공 불필요.

## 나머지 상세 페이지
- self/curriculum/career/report: 안내 콘텐츠 골격(플레이스홀더 텍스트).
- report(종합 보고서)는 추후 selector 결과를 이어받아 출력하는 기능 예정 → 지금은 설명 + 자리만.

## 주의
- 외부 링크 풀 URL, 내부 상세 이동은 상대경로
- 완료 후 커밋
