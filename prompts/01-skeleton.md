# 01 · 페이지 골격 생성

CLAUDE.md의 메뉴 구조에 따라 모든 하위 페이지의 빈 골격을 만드세요.

## 폴더·파일
```
about/    index.html(고교학점제란?), agency.html(학생 주도성과 고교학점제)
design/   index.html(5단계 허브), self.html, curriculum.html, career.html, practice.html, report.html
safety/   index.html(안전망 개요), school.html, online.html, coop.html, outschool.html
board/    notice.html, resources.html
```

## 공통 헤더/푸터
- 모든 페이지가 동일한 헤더(GNB)·푸터를 공유해야 함.
- **권장 방식**: `assets/js/common.js`가 헤더/푸터 HTML을 주입(`fetch` 또는 JS 템플릿).
  - 헤더/푸터 마크업의 단일 출처를 만들고, 각 페이지는 빈 `<header>`/`<footer>` 또는 마운트 지점만.
- 현재 페이지에 해당하는 GNB 항목에 `active` 클래스가 자동으로 붙도록(경로 기반 판별).

## 각 페이지 공통
- tokens/base/components.css link
- `<main>`에 섹션 제목 + "준비 중" 플레이스홀더
- landmark(header/main/footer), 페이지 `<title>`, meta description

## 주의
- 내부 링크 상대경로(하위 폴더에서 위로 갈 때 `../`)
- GNB 순서 고정
- 단계 완료 후 커밋
