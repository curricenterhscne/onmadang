# 05 · 마무리 · 품질 · 배포

## 1. 반응형
- 헤더: 모바일에서 햄버거 → 메뉴 패널 토글
- 분기 980px / 680px 확인, 모든 그리드 1열 정리

## 2. 웹 접근성 (KWCAG)
- 모든 `<svg>`에 `aria-label` 또는 `role="img"` / 장식용은 `aria-hidden`
- 이미지 `alt`, 링크 텍스트 명확화
- 색 대비(본문/배경) 확인
- 키보드 포커스 표시(`:focus-visible`), 탭 순서
- landmark(`header`/`nav`/`main`/`footer`), 본문 건너뛰기 링크(skip link)

## 3. 메타·아이콘
- 각 페이지 `og:title`, `og:description`, (가능하면) `og:image`
- favicon = 클로버 SVG
- `theme-color` = #DAF2FC

## 4. 링크·경로 점검
- 모든 내부 링크 **상대경로**인지(절대경로 색출)
- 외부 자산 링크 `target="_blank" rel="noopener"` 확인
- iframe 폴백 동작 확인

## 5. 배포 문서
- README에:
  - 로컬 미리보기: `python3 -m http.server 8000` → `localhost:8000`
  - GitHub Pages: Settings → Pages → main / root
  - 정식 도메인 전환(CNAME)은 인프라 용역 단계 안내
- `CNAME` 파일은 인프라 용역 시점에 추가(지금은 생성하지 않거나 주석 안내)

## 6. 정리
- 커밋을 의미 단위로 정리, 각 커밋 메시지 한국어 제안
- 남은 TODO를 README 하단에 체크리스트로 정리

## 점검용 셀프 체크
- [ ] GNB 순서 = 안내 → 설계 → 안전망 → 알림소통
- [ ] 캐릭터는 클로버 placeholder만(권리 미확보 자산 없음)
- [ ] 내부 링크 전부 상대경로
- [ ] 자산 ①②③ 링크 정상 + 폴백
- [ ] 모바일/접근성 통과
