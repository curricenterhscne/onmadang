# 온마당 — 충남 고교학점제 종합지원 포털

충청남도교육청 고교학점제 종합지원 포털 「온마당」 본체 레포입니다.

## 빠른 시작

```bash
# 1) 로컬 미리보기 (빌드 불필요)
python3 -m http.server 8000
# → http://localhost:8000

# 2) GitHub Pages 배포
#    Settings → Pages → Source: main / (root)
#    → https://<계정>.github.io/onmadang/
```

## Claude Code로 개발 이어가기

이 레포는 Claude Code 기반으로 개발합니다. 시작 시 Claude Code가 `CLAUDE.md`를 자동으로 읽습니다.

```bash
claude   # 레포 루트에서 실행
```

그다음 `prompts/` 폴더의 지시를 **순서대로** 사용하세요:

| 순서 | 파일 | 내용 |
|---|---|---|
| 0 | `prompts/00-setup.md` | 초기 세팅·CSS 토큰 분리·index 리팩터링 |
| 1 | `prompts/01-skeleton.md` | 하위 페이지 골격 + 공통 헤더/푸터 |
| 2 | `prompts/02-design.md` | 진로·학업 설계 + 자산 ①② 연동 |
| 3 | `prompts/03-safety.md` | 4대 안전망 + 자산 ③ 연동 |
| 4 | `prompts/04-board.md` | 공지·자료실(JSON 분리) |
| 5 | `prompts/05-polish.md` | 반응형·접근성·배포 마무리 |

각 단계 완료 후 커밋 → Pages 링크 확인 → 다음 단계.

## 핵심 문서

- **`CLAUDE.md`** — 프로젝트 원칙·디자인 토큰·메뉴 구조·금지사항 (Claude Code 자동 참조)
- **`ASSETS.md`** — 기존 자산 URL·연동 위치·브리지 규칙
- **`index.html`** — 메인 페이지 시안 (작동하는 자산 링크 포함)

## 메뉴 구조

1. 고교학점제 안내 · 2. 진로·학업 설계 · 3. 4대 안전망 · 4. 알림·소통 마당

## 연동 자산 (형제 레포/외부, 새로 만들지 않음)

- ① https://curricenterhscne.github.io/2022-curriculum-majors/
- ② https://curricenterhscne.github.io/course_selector_cne/
- ③ https://gongdong-enrollment.vercel.app/
- ⓪ https://curricenterhscne.github.io/cne-design-system/

## 주의사항

- GitHub Pages 프로젝트 페이지 → 내부 링크는 **상대경로**만(`./`, `../`).
- 캐릭터는 **인라인 클로버 placeholder**만. 권리 미확보 외부 캐릭터 사용 금지(디자인 용역에서 정식 교체).
- 빌드 도구 없는 순수 정적 사이트 유지.

## 역할

- **개발**: 담당 장학사 (Claude Code)
- **콘텐츠·검수**: 중등교육팀 (`board/data/*.json`, 본문 텍스트)
- **런칭·배포**: 외부 인프라 용역 (정규 서버·`onmadang.or.kr`·SSL)

## 진행 체크리스트

- [ ] 0~5 프롬프트 순차 진행
- [ ] 콘텐츠 팀과 분담
- [ ] 캐릭터 정식 교체(용역)
- [ ] 인프라 용역 도메인 전환
