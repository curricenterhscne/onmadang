# ASSETS.md — 기존 자산 명세 및 연동 규칙

본체(`onmadang`)는 아래 자산을 **새로 만들지 않고 연동**한다. 모두 형제 레포/외부 서비스로 독립 운영된다.

---

## ⓪ 온마당 디자인 시스템 (DS)

- **레포**: `curricenterhscne/cne-design-system`
- **배포**: https://curricenterhscne.github.io/cne-design-system/
- **상태**: 자체 제작 임시 v1.0 (캐릭터 등 일부 자산 권리 미확보 → 디자인 용역으로 정식화 예정)
- **본체 연동**: 색·서체·배지 규칙을 `assets/css/tokens.css`에 동기화.
  CDN 직접 참조보다 **토큰을 본체에 복제**해 두는 것을 권장(레포 private·브랜치명 이슈로 CDN이 깨질 수 있음).
- **캐릭터**: 본체에서는 **인라인 클로버 SVG placeholder만** 사용. 정식 캐릭터는 권리 확보 후 교체.

## ① 대학 학과와 권장 과목 안내

- **레포**: `curricenterhscne/2022-curriculum-majors`
- **배포**: https://curricenterhscne.github.io/2022-curriculum-majors/
- **상태**: DS v1.0 적용·서브헤더 네비 완료
- **내용**: 2022 개정 교육과정 기반 10개 계열·170여 학과 탐색(키워드/과목 역검색)
- **연동 위치**: `design/practice.html` (진로·학업 설계 > 과목 선택 실습)

## ② 과목 선택 실습 (Selector)

- **레포**: `curricenterhscne/course_selector_cne`
- **배포**: https://curricenterhscne.github.io/course_selector_cne/
- **상태**: DS 적용 + ① 브리지 연동 완료
- **내용**: 학교 선택 시 want/core 과목 자동 선택 + 토스트 알림
- **연동 위치**: `design/practice.html`

### ①↔② 브리지 흐름 (그대로 유지 — 본체는 링크만)
```
[① 학과 모달]
   "이 학과 권장 과목으로 과목 선택 실습" 버튼
        │
        ▼  URL 파라미터 전달
   ?want=<과목들>&core=<과목들>&majorId=<학과ID>
        │
        ▼
[② Selector] 진입 → 학교 선택 시 해당 과목 자동 선택 + 토스트
```
- 브리지 로직은 ①②가 이미 보유.
- 본체는 두 사이트로 가는 **링크만 정확히** 두면 된다(파라미터 가공 불필요).

## ③ 참학력 공동교육과정 수강신청

- **레포/호스팅**: 별도 (Vercel)
- **배포**: https://gongdong-enrollment.vercel.app/
- **상태**: 별도 개발 완료, 검증 진행 중
- **연동 위치**: `safety/coop.html` (4대 안전망 > 공동교육과정)
- **방식**: 본체에서 새 탭 링크(큰 CTA). iframe 임베드는 X-Frame 차단 시 링크 폴백.

---

## 연동 시 공통 규칙

1. 외부 자산 링크는 **풀 URL** + `target="_blank" rel="noopener"`.
2. 본체 내부 페이지 이동은 **상대경로**.
3. iframe 임베드 시도 시 반드시 **링크 카드 폴백** 함께 둔다(차단 대비).
4. 자산이 다운되어도 본체가 멀쩡하도록, 본체 콘텐츠와 자산을 분리.

## 주소 체계 (참고)

베타 단계에서는 본체와 자산이 서로 다른 경로로 운영된다.
- 본체: `curricenterhscne.github.io/onmadang/` → (정식) `onmadang.or.kr`
- 자산: 각 `github.io` 또는 Vercel 주소 유지

정식 오픈(11월) 단계에서 리버스 프록시로 `onmadang.or.kr/majors` 식 통합은 **인프라 용역**과 별도 검토.
