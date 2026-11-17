-- ============================================================
-- 기존 GitHub 이슈 게시글 → board_posts (2026-11-18 생성, 1회 실행)
-- board.sql을 먼저 실행한다. 번호(id)·작성일을 그대로 옮긴다. 다시 실행해도 같은 번호는 건너뛴다.
-- 첨부 링크(GitHub 첨부·구글 드라이브)는 본문에서 빼서 attachments로 옮겼다(파일은 원래 주소 그대로).
-- ============================================================

insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (1, 'notice', $om$26학년도 여름방학 꿈키움 학교 밖 교육 창의적체험활동 강좌 및 수강신청 안내$om$, $om$**강좌 안내 보기 링크: [https://onmadang.or.kr/off-campus_courses/dream_up_26-s.html](https://onmadang.or.kr/off-campus_courses/dream_up_26-s.html)**
(수강 신청 기간이 종료되었습니다.)

학생 맞춤형 교육과정 다양화와 자기주도적 진로학업설계 역량 강화를 위한 2026학년도 여름방학 꿈키움 학교 밖 교육 창의적체험활동을 다음과 같이 안내합니다. 관심 있는 학생들은 기간 내 신청하여 주시기 바랍니다.

**꿈 키움 학교 밖 교육 창의적체험활동?**
대학의 전문 인력과 시설을 활용하여 전문 분야에 대한 실험 및 연구활동을 진행하는 대면형 교육과정으로 학생들의 과목 선택권과 학습권을 보장하는 미래형 교육과정입니다. 고교학점제 전면 적용을 맞아 기존의 대학연계 공동교육과정이 <학교 밖 교육>으로 한 단계 더 발돋움합니다.


1. 대상: 충청남도 관내 고등학교 재학생(무학년제 운영, 일부 강좌 학년 제한)
          - 이동을 고려하여 소속교 소재 지역에서 개설되는 강좌에 수강 신청 권장
2. 개설 예정 강좌: 마음의 색과 모양을 찾는 아트 프로젝트 외 88강좌
3. 운영 기간: 2026. 7. 20.(월) ~ 8. 9.(일) [강좌별 세부 일정 확인 요망]
4. 수강 인원: 강좌별 5명 이상, 15명 이내
5. 수강 신청 일정
 ① 개설 강좌 안내: 26. 6. 19. ~
 ② 1차 수강 신청: 26. 6. 25.(목) 18:00 ~ 6. 28.(일) 15:00,
    안내 링크 참조(온마당 로그인 필요 없음), 선착순 접수(학생 개별 신청, 조기마감 가능)
 ③ 1차 수강 신청 현황 안내: 2026. 6. 30.(화) 12:00
 ④ 2차 수강 신청: 26. 6. 30.(화) 18:00 ~ 21:00, 선착순 접수 (마감 안된 강좌 대상)
 ⑤ 수강 대상자 및 개설 강좌 확정 안내: ~ 2026. 7. 2.(목) 공문 및 SMS 안내
6. 수강신청 유의 사항
  - 강좌에 따라 운영 일시와 장소가 다르니 수업 운영 계획서 필히 확인
  - 1개의 강좌만 신청 가능(2개 이상 신청된 경우 최초 신청 강좌만 인정)
  - 수강 신청 종료 후, 추가 모집 계획이 없으므로 신중하게 신청
  - 강좌 운영 장소까지 이동은 학부모 책임하에 학생별 개별 이동
  ※ 수강 신청 문의: 충청남도교육청 중등교육과 041-640-7224, 041-640-7221
7. 이수 처리 안내
 - 총 수업시수의 2/3 이상 출석한 학생에 대해 이수 처리 후 승인
 - 이수 기준 충족 시 창의적체험활동 시수 인정 및 학교생활기록부 특기사항 기재
   (예시) 2026학년도 학교 밖 교육기관(대학)에서 ◯◯◯강좌를 ◯◯시간 수강하여 (객관적 학습내용)을 학습함.$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-06-30T10:43:48Z', '2026-08-03T00:47:41Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (3, 'notice', $om$26학년도 2학기 고교-대학 연계 학점 인정 학교 밖 교육 과목 강좌 및 수강 신청 안내$om$, $om$수강신청은 마감되었습니다. 과목별 내용은 아래 링크를 참고해주시기 바랍니다.

[과목 안내] https://onmadang.or.kr/dual_credit/

학생 맞춤형 교육과정 다양화와 자기주도적 진로학업설계 역량 강화를 위한 2026학년도 2학기 고교-대학 연계 학점 인정 학교 밖 교육 과목을 다음과 같이 안내합니다. 관심 있는 학생들은 기간 내 신청하여 주시기 바랍니다.

**고교-대학 연계 학점 인정 학교 밖 교육이란?**
대학의 전문성에 기반하여 제공하는 교육 내용 중 고등학교 단계에 해당하는 내용을 선별하여 새롭게 구성한 심화 과목으로, 협약 대학이 학교 밖 교육 기관으로서 개설·운영하며, 과목을 이수한 학생에게 고등학교 학점을 인정하고 학생이 해당 대학 진학 시 대학 학점으로 추가 인정하는 과정입니다.

1. 대상: 충청남도 관내 고등학교 1~2학년 재학생(무학년제 운영, 일부 강좌 학년 제한)
2. 개설 예정 강좌: 협약 5개 대학 14개 과목 [안내 링크 참조] [https://onmadang.or.kr/dual_credit/](https://onmadang.or.kr/dual_credit/)
3. 협약(개설) 대학: 국립공주대학교, 단국대학교, 백석대학교, 순천향대학교, 충남대학교
4. 운영 기간: 2026. 8. 22.(토) ~ 12. 13.(일) [강좌별 세부 일정 확인 요망]
5. 수강 인원: 강좌별 5명 이상, 15명 이내
6. 이수 학점
  - 과목별 2학점 (학교 밖 교육은 3년간 최대 8학점 이내 이수 가능)
  - 이수 후 해당 대학 진학 시 대학 학점으로 추가 인정 (대학별 인정 기준 상이, [안내 자료] 참조)
7. 수강 신청 일정
   ① 개설 강좌 안내 : 2026. 7. 9.(목) ~
   ② 수강 신청 : 2026. 7. 16.(목) 18:00 ~, 안내 링크 참조 (학생 개별 온라인 신청, 선착순)
   ③ 개설 강좌 확정 및 안내 : 신청 마감 후 별도 공지 (공문 및 SMS)
8. 수강 신청 유의 사항
  - 강좌에 따라 운영 일시와 장소가 다르니 수업 운영 계획서 필히 확인
  - 1개의 강좌만 신청 가능
  - 수강 신청 종료 후, 추가 모집 계획이 없으므로 신중하게 신청
  - 강좌 운영 장소까지 이동은 학부모 책임하에 학생별 개별 이동
  - 수강 포기 가능 기간(수업 시작 후 2주) 이후 이수 기준 미도달 시 학교생활기록부에 미이수 기록
  ※ 수강 신청 문의: 충청남도교육청 중등교육과 041-640-7224, 041-640-7221
9. 이수 처리 안내
  - 총 수업시수의 2/3 이상 출석한 학생에 대해 이수 처리 후 승인
  - 이수 기준 충족 시 학교생활기록부 교과학습 발달상황에 과목명, 이수 학점, 객관적 학습 내용 기재 (성적 미기재, ‘학교 밖 교육’으로 표시)$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-07-09T08:00:32Z', '2026-08-03T07:57:31Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (4, 'resource', $om$고교학점제 안내 리플렛(교육과정평가원)$om$, $om$$om$, $om$홍보자료$om$, false, $om$[{"name": "한국교육과정평가원 고교학점제 안내 리플렛.pdf", "url": "https://github.com/user-attachments/files/29956252/default.pdf"}]$om$::jsonb, 'GitHub 이전', '2026-07-13T07:02:42Z', '2026-07-13T07:09:09Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (5, 'resource', $om$2026년 고교학점제 학부모 설명회(충남)$om$, $om$[![2026년 고교학점제 학부모 설명회(충남)](https://i9.ytimg.com/vi/wyMZDnSz9kE/mqdefault.jpg?v=6a5edfad&sqp=CPDm-9IG&rs=AOn4CLDt27dV-L0eom04bdBIWqD767CVvA)](https://youtu.be/wyMZDnSz9kE?si=S5ap9gVsINZepV-E)
(이미지를 클릭하시면, 영상이 재생됩니다.)$om$, $om$연수자료$om$, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-07-21T04:22:22Z', '2026-07-21T04:22:22Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (6, 'notice', $om$26학년도 1학기 꿈키움 학교 밖 교육 창의적체험활동 참가 학생 만족도 조사 및 이수 확인$om$, $om$2026학년도 1학기 꿈키움 학교 밖 교육 창의적체험활동에 대한 학생 만족도 조사를 아래 링크로 실시합니다.
만족도 조사를 마치면 이수 결과를 확인할 수 있는 링크가 제공되니, 조사 후 본인의 이수 결과도 함께 확인해 주시기 바랍니다.

{만족도 조사 및 이수 결과 확인 기간이 종료되었습니다}

건강하고 보람찬 여름방학 보내시길 바랍니다.$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-07-24T05:56:16Z', '2026-08-20T02:00:13Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (7, 'notice', $om$2026-2학기 참학력온라인공동교육과정 수업계획서 안내$om$, $om$2학기 참학력온라인공동교육과정 수업계획을 아래 링크에서 조회할 수 있습니다. 대략적인 수업 일정과 준비사항을 확인하시기 바랍니다.

수업 일정, 내용, 평가 등은 2학기 개강 후 변경될 수 있으니, 첫번째 수업 때 수업 선생님께 개별 문의 부탁드립니다. 

[2026-2학기 참학력온라인공동교육과정 수업계획 조회 사이트]
https://script.google.com/macros/s/AKfycbzDqzS9W4Pr3D1mdz4vjqCUnoeVlsD_AWxtCY8u055sYI881RXo43vI7yl_GNJYsI17ig/exec

>문의처
카카오톡-친구-충남온라인학교 채널 - 채팅
 - 수업계획에 관련된 문의만 가능하며, 수강 신청 및 포기 관련 문의는 불가합니다.
 - 수강 포기는 수업 시작 후 2주 이내에 소속교 공동교육과정 담당 선생님을 통해서 수강포기원을 제출해야 합니다.
 - 다음 학기 수강 신청은 11월에 안내될 예정입니다.

>참고
수강신청 링크: https://enrollment-cne.vercel.app/
수강신청 매뉴얼: https://enrollment-cne-git-main-curricenterhscnes-projects.vercel.app/manual-student.html$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-08-10T03:11:10Z', '2026-08-10T03:11:10Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (8, 'notice', $om$26학년도 여름방학 꿈키움 학교 밖 교육 창의적체험활동 참가 학생 만족도 조사 및 이수 확인$om$, $om$2026학년도 여름방학 꿈키움 학교 밖 교육 창의적체험활동에 대한 학생 만족도 조사를 아래 링크로 실시합니다.
만족도 조사를 마치면 이수 결과를 확인할 수 있는 링크가 제공되니, 조사 후 본인의 이수 결과도 함께 확인해 주시기 바랍니다.

만족도 조사 링크: https://forms.gle/zNjZMAgvV8Qo7kkNA
만족도 조사 기간: 2026. 8. 20.(목) ~ 2026. 8. 23.(일)


배움과 성장이 함께하는 2학기 시작을 응원합니다.$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-08-20T02:01:01Z', '2026-08-20T12:20:43Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (9, 'notice', $om$2026학년도 2학기 참학력 온라인 공동교육과정 수강 학생 오리엔테이션 안내$om$, $om$2026학년도 2학기 참학력 온라인 공동교육과정 수강 방법과 유의사항 등에 대해 안내하는 오리엔테이션이 다음과 같이 실시됩니다.

1. 수업 시작일 : 2026.08.24.(월)
2. 수업 오리엔테이션 : 2026.08.20.(목) 19:00
3. 수업 오리엔테이션 접속 안내
  - 방법 : 유튜브 실시간 라이브 스트리밍 방송 (충남온라인학교 공식 채널)
  - 링크 : https://youtube.com/live/uJbPtkA_5JU?feature=share

** 오리엔테이션은 정규 수업 시간은 아닙니다 - 출결이 기록되진 않습니다. 
*** 온라인공동교육과정 수강에 꼭 필요한 안내가 있을 예정이니 가급적 꼭 참여해주시기 바랍니다.$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-08-20T07:11:42Z', '2026-08-20T12:20:37Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (10, 'notice', $om$2026학년도 2학기 고교-대학 연계 학점 인정 학교 밖 교육 과목 과목 첫 수업 안내$om$, $om$2026학년도 2학기 고교-대학 연계 학점 인정 학교 밖 교육 과목 과목 첫 수업 관련 공지 사항입니다.

아래 링크를 참고해주시기 바랍니다.

https://onmadang.or.kr/dual_credit/inform/dual_credit_2026_2_start.html$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-08-20T12:19:55Z', '2026-08-20T12:19:55Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (11, 'notice', $om$2026학년도 2학기 꿈키움 학교 밖 교육 창의적체험활동 수강 신청 마감 안내$om$, $om$2026학년도 2학기 꿈키움 학교 밖 교육 창의적체험활동 수강 신청은 마감되었습니다.

아래 링크를 참조해주세요.

https://onmadang.or.kr/dream_up/$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-09-03T11:24:32Z', '2026-09-15T13:34:35Z') on conflict (id) do nothing;
insert into public.board_posts (id, board, title, body, category, is_important, attachments, author, created_at, updated_at) values (12, 'notice', $om$[지역연계] 2026학년도 겨울방학 · 2027학년도 1학기 지역연계 수강신청 기간 안내$om$, $om$<img width="2880" height="4424" alt="수강신청기간_안내_v3" src="https://github.com/user-attachments/assets/d09f45a3-f06c-44d1-b47f-7e14c13a97e2" />

2026학년도 겨울방학 및 2027학년도 1학기 지역연계 수강신청 기간을 안내합니다.
지역별 신청 방법과 일정을 확인하시고 기간 내에 꼭 신청해 주세요.

---

**천안** · 온마당 · ☎ 041-529-0574
- 1차: 11.21.(토) 09:30 ~ 12:30
- 2차: 11.24.(화) 17:00 ~ 11.25.(수) 09:00

**공주** · ☎ 041-850-2314
- 별도 안내

**보령** · 온마당 · ☎ 041-930-6334
- 1차: 11.21.(토) 14:00 ~ 11.22.(일) 18:00
- 2차: 11.25.(수) 10:00 ~ 16:00

**아산** · 온마당 · ☎ 041-539-2413
- 1차: 11.21.(토) 09:30 ~ 12:30
- 2차: 11.24.(화) 17:00 ~ 11.25.(수) 09:00

**서산** · 온마당 · ☎ 041-660-0317
- 1차: 11.21.(토) 09:00 ~ 11.24.(화) 18:00
- 2차: 11.28.(토) 09:00 ~ 11.30.(월) 21:00

**논산계룡** · 온마당 · ☎ 041-730-7176
- 1차: 11.21.(토) 09:00 ~ 12:00
- 2차: 11.24.(화) 09:00 ~ 18:00

**당진** · 온마당 · ☎ 041-351-2522
- 1차: 11.21.(토) 09:00 ~ 11.22.(일) 16:00
- 2차: 11.25.(수) 09:00 ~ 17:00

**금산** · 학교신청 · ☎ 041-750-8841
- 1차: 11.23.(월) 09:00 ~ 11.30.(월) 12:00

**부여** · 온마당 · ☎ 041-830-8253
- 1차: 11.29.(일) 10:00 ~ 16:00
- 2차: 11.30.(월) 09:00 ~ 12.4.(금) 15:00

**서천** · 학교신청 · ☎ 041-950-6016
- 1차: 11.18.(수) ~ 11.27.(금)

**청양** · 학교신청 · ☎ 041-940-4414
- 1차: 11.23.(월) 09:00 ~ 11.30.(월) 18:00

**홍성** · 온마당 · ☎ 041-630-5535
- 1차: 11.21.(토) 13:00 ~ 11.22.(일) 17:00
- 2차: 11.23.(월) 09:00 ~ 17:00

**예산** · 온마당 · ☎ 041-330-3625
- 2026학년도 겨울방학 1차: 11.21.(토) 10:00 ~ 11.22.(일) 16:00
- 2026학년도 겨울방학 2차: 11.23.(월) 10:00 ~ 19:00
- 1학기 1차: 11.28.(토) 10:00 ~ 11.29.(일) 16:00
- 1학기 2차: 11.30.(월) 10:00 ~ 19:00

**태안** · 학교신청 · ☎ 041-670-8214
- 추후 안내

---

※ 1차·2차는 2027학년도 1학기 수강신청 기간이며, 모든 일정은 2026년 기준입니다.
※ 지역별 일정은 사정에 따라 변경될 수 있으며, 세부 사항은 각 지역 담당 주무관에게 문의해 주시기 바랍니다.$om$, null, false, $om$[]$om$::jsonb, 'GitHub 이전', '2026-11-16T08:42:17Z', '2026-11-16T08:48:31Z') on conflict (id) do nothing;

-- 새 글 번호가 옮긴 번호 다음부터 매겨지도록
select setval(pg_get_serial_sequence('public.board_posts','id'), greatest((select max(id) from public.board_posts), 1));

select board, count(*) from public.board_posts group by board;
