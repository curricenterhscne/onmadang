# ASSETS.md — 기존 자산 명세 및 연동 규칙

본체(`onmadang`)는 아래 자산을 관리한다. ①②는 `design/` 하위 폴더로 통합 완료, ③은 외부 서비스로 운영.

---

## ⓪ 온마당 디자인 시스템 (DS)

- **레포**: `curricenterhscne/cne-design-system`
- **배포**: https://curricenterhscne.github.io/cne-design-system/
- **상태**: 자체 제작 임시 v1.0 (캐릭터 등 일부 자산 권리 미확보 → 디자인 용역으로 정식화 예정)
- **본체 연동**: 색·서체·배지 규칙을 `assets/css/tokens.css`에 동기화.
  CDN 직접 참조보다 **토큰을 본체에 복제**해 두는 것을 권장(레포 private·브랜치명 이슈로 CDN이 깨질 수 있음).
- **캐릭터**: 본체에서는 **인라인 클로버 SVG placeholder만** 사용. 정식 캐릭터는 권리 확보 후 교체.

## ① 대학 학과와 권장 과목 안내

- **원본 레포**: `curricenterhscne/2022-curriculum-majors`
- **통합 위치**: `design/majors/` (폴더 복사, 헤더/푸터 온마당 공통으로 교체)
- **상태**: DS v1.0 적용·서브헤더 네비 완료, 온마당 헤더/푸터/breadcrumb 통합
- **내용**: 2022 개정 교육과정 기반 10개 계열·170여 학과 탐색(키워드/과목 역검색)
- **연동 위치**: `design/index.html` (진로·학업 설계 랜딩), GNB 바로가기

## ② 과목 선택 실습 (Selector)

- **원본 레포**: `curricenterhscne/course_selector_cne`
- **통합 위치**: `design/selector/` (폴더 복사, 헤더/푸터 온마당 공통으로 교체)
- **상태**: DS 적용 + ① 브리지 연동 완료, 온마당 헤더/푸터/breadcrumb 통합
- **내용**: 학교 선택 시 want/core 과목 자동 선택 + 토스트 알림
- **연동 위치**: `design/index.html`

### ①↔② 브리지 흐름 (상대경로로 전환 완료)
```
[① 학과 모달 — design/majors/]
   "이 학과 권장 과목으로 과목 선택 실습" 버튼
        │
        ▼  URL 파라미터 전달 (상대경로: ../selector/?...)
   ?want=<과목들>&core=<과목들>&majorId=<학과ID>
        │
        ▼
[② Selector — design/selector/] 진입 → 학교 선택 시 해당 과목 자동 선택 + 토스트
```
- 브리지 로직은 ①②가 이미 보유.
- 본체 내 상대경로(`../selector/`, `../majors/`)로 연결.

## ③ 참학력 공동교육과정 수강신청

- **레포/호스팅**: 별도 (Vercel)
- **배포**: ~~https://gongdong-enrollment.vercel.app/~~ (폐쇄됨, 신규 개발 중)
- **상태**: 기존 서비스 폐쇄, 새 시스템 개발 중
- **연동 위치**: `safety/jointcurricula.html` (4대 안전망 > 공동교육과정)
- **현재 처리**: 수강신청 링크 클릭 시 `safety/enrollment-closed.html`(기간 외 안내 페이지)로 이동. 신규 시스템 완성 후 URL 교체 예정.

---

## 연동 시 공통 규칙

1. ①② 자산은 `design/` 하위 폴더에 통합. 내부 링크는 **상대경로**.
2. ⓪③ 등 외부 자산 링크는 **풀 URL** + `target="_blank" rel="noopener"`.
3. 본체 내부 페이지 이동은 **상대경로**.
4. 자산이 다운되어도 본체가 멀쩡하도록, 본체 콘텐츠와 자산을 분리.

## 주소 체계 (참고)

베타 단계에서는 GitHub Pages로 운영.
- 본체: `curricenterhscne.github.io/onmadang/` → (정식) `onmadang.or.kr`
- ①② 자산: 본체 내 `design/majors/`, `design/selector/` (통합 완료)
- ③ 자산: 별도 서비스 (신규 개발 중)

정식 오픈(11월) 단계에서 도메인 전환은 **인프라 용역**과 별도 검토.
