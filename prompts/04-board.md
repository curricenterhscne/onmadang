# 04 · 알림·소통 마당 (데이터 분리)

공지·자료는 **비개발자(팀)가 코드 없이 추가**할 수 있도록 JSON으로 분리합니다.

## 데이터 파일
- `board/data/notices.json` — 공지 예시 5건
- `board/data/resources.json` — 자료 예시 5건

### notices.json 스키마 예시
```json
[
  {
    "id": 1,
    "title": "2026-2학기 공동교육과정 수강신청 안내",
    "date": "2026-05-20",
    "badge": "important",        // important | new | online | (없으면 생략)
    "link": "#",
    "pinned": true
  }
]
```

### resources.json 스키마 예시
```json
[
  {
    "id": 1,
    "title": "2026 진로·학업 설계 가이드",
    "date": "2026-05-18",
    "fileType": "PDF",           // PDF | HWP | XLSX ...
    "fileUrl": "#"
  }
]
```

## 렌더링
- `assets/js/board.js`가 JSON을 `fetch`해서 목록 렌더
  - 배지(중요=빨강 / 신규=그린 / 온라인=스카이), 날짜, 첨부 아이콘
  - pinned 항목 상단 고정
- `board/notice.html`, `board/resources.html`에서 board.js 사용
- 단순 클라이언트 사이드 검색 + 더보기(또는 페이지네이션)

## 문서화
- README(또는 board/data/README.md)에 JSON 스키마와 "항목 추가 방법"을 비개발자용으로 설명
  (어떤 필드가 필수인지, 날짜 형식, 배지 종류 등)

## 주의
- fetch 경로는 상대경로(`./data/notices.json`)
- 완료 후 커밋
