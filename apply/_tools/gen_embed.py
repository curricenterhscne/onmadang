# -*- coding: utf-8 -*-
"""
dream_up/index.html 의 DATA(66강좌) -> apply/_embed_data.js 의 COURSE_DETAILS 재생성
+ Supabase courses 테이블용 INSERT SQL 생성

실행: python gen_embed.py            (검증만, 파일 안 씀)
      python gen_embed.py --write    (실제로 씀)
"""
import io, os, re, json, sys, datetime

ROOT = r'G:\curricenterhscne\onmadang'
SRC  = os.path.join(ROOT, 'dream_up', 'index.html')
DST  = os.path.join(ROOT, 'apply', '_embed_data.js')
OUTDIR = os.path.join(ROOT, 'supabase', 'sql')

WRITE = '--write' in sys.argv


def extract_array(text, varname):
    """const <varname> = [ ... ];  에서 배열만 괄호 균형으로 잘라 파싱"""
    start = text.index(varname)
    i = text.index('[', start)
    depth = 0
    in_str = False
    quote = ''
    esc = False
    for j in range(i, len(text)):
        ch = text[j]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == quote:
                in_str = False
            continue
        if ch in '"\'':
            in_str = True
            quote = ch
        elif ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                return json.loads(text[i:j + 1]), i, j + 1
    raise ValueError('배열 끝을 찾지 못했습니다: ' + varname)


def hhmm(t):
    h, m = t.split(':')
    return int(h) * 60 + int(m)


def fmt(mins):
    return '%02d:%02d' % (mins // 60, mins % 60)


WD = ['월', '화', '수', '목', '금', '토', '일']


def weekday_ko(datestr):
    y, m, d = (int(x) for x in datestr.split('-'))
    return WD[datetime.date(y, m, d).weekday()]


def main():
    src = io.open(SRC, encoding='utf-8').read()
    DATA, _, _ = extract_array(src, 'const DATA')
    print('원천 강좌 수: %d' % len(DATA))

    # ---------- 검증 ----------
    problems = []
    gap_counter = {}
    end_mismatch = []

    for x in DATA:
        byday = {}
        for s in x['차시']:
            byday.setdefault(s['일자'], []).append(s)
        for date, ss in byday.items():
            ss.sort(key=lambda s: hhmm(s['시작시간']))
            for a, b in zip(ss, ss[1:]):
                g = hhmm(b['시작시간']) - hhmm(a['시작시간'])
                gap_counter[g] = gap_counter.get(g, 0) + 1
        rng = re.search(r'(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})', x['수업요일시간'])
        if not rng:
            problems.append('%s 수업요일시간 범위 파싱 실패: %s' % (x['강좌코드'], x['수업요일시간']))
            continue
        declared_end = hhmm(rng.group(2))
        for date, ss in byday.items():
            calc = hhmm(ss[-1]['시작시간']) + 50
            if calc != declared_end:
                end_mismatch.append((x['강좌코드'], date, fmt(calc), rng.group(2)))

    print('차시 간격 분포(분): %s' % gap_counter)
    print('‘마지막차시 시작 + 50분’ != 수업요일시간 종료 : %d건' % len(end_mismatch))
    for r in end_mismatch[:10]:
        print('   %s %s  계산=%s  선언=%s' % r)
    for p in problems[:10]:
        print('   ! ' + p)

    # ---------- COURSE_DETAILS 생성 ----------
    details = []
    for x in DATA:
        byday = {}
        for s in x['차시']:
            byday.setdefault(s['일자'], []).append(s)

        sched = []
        for date in sorted(byday):
            ss = sorted(byday[date], key=lambda s: hhmm(s['시작시간']))
            start = ss[0]['시작시간']
            end = fmt(hhmm(ss[-1]['시작시간']) + 50)
            sched.append({
                'date': date,
                'weekday': weekday_ko(date),
                'start': start,
                'end': end,
                'sessionCount': len(ss),
            })

        sessions = [{
            'no': s['차시'],
            'date': s['일자'],
            'time': s['시작시간'],
            'content': s['내용'],
            'instructor': s['담당강사'],
        } for s in sorted(x['차시'], key=lambda s: s['차시'])]

        goals = [g for g in (x.get('학습목표1'), x.get('학습목표2')) if g and g.strip()]

        details.append({
            'code': x['강좌코드'],
            'field': ' · '.join(x['분야']),          # app이 ' · '로 split 한다
            'activityArea': x['활동영역'],
            'region': x['지역'],
            'target': x['운영대상'],
            'period': x['수업요일시간'],
            'place': x['수업장소'],
            'intro': x['한줄소개'],
            'method': x['수업방식'],
            'supply': x.get('준비물등', ''),
            'university': x['기관명'],
            'gradeRestricted': False,                # 66강좌 전부 1~3학년
            'recommendedFor': x.get('추천대상', ''),
            'learningGoals': goals,
            'instructorBio': x.get('강사소개', ''),
            'instructors': [{
                'name': i['성명'],
                'affiliation': i.get('소속', ''),
                'major': i.get('전공', ''),
            } for i in x.get('강사', [])],
            'startDate': x['운영시작일'],
            'endDate': x['운영종료일'],
            'sessionCount': len(sessions),
            'scheduleByDay': sched,
            'sessions': sessions,
        })

    print('\n생성된 COURSE_DETAILS: %d개' % len(details))
    print('분야(계열) 종류 %d: %s' % (
        len({f for x in DATA for f in x['분야']}),
        sorted({f for x in DATA for f in x['분야']})))
    print('기관 %d: %s' % (
        len({x['기관명'] for x in DATA}),
        sorted({x['기관명'] for x in DATA})))
    print('지역 %d: %s' % (
        len({x['지역'] for x in DATA}),
        sorted({x['지역'] for x in DATA})))

    # ---------- _embed_data.js 재작성 ----------
    cur = io.open(DST, encoding='utf-8').read()
    schools, _, _ = extract_array(cur, 'SCHOOLS')
    old_details, s_i, s_j = extract_array(cur, 'COURSE_DETAILS')
    print('\n기존 SCHOOLS %d개 유지, COURSE_DETAILS %d -> %d'
          % (len(schools), len(old_details), len(details)))

    new_js = cur[:s_i] + json.dumps(details, ensure_ascii=False, separators=(',', ':')) + cur[s_j:]

    # 제어문자 검사 (CLAUDE.md 주의사항 1)
    ctrl = [(m.start(), repr(m.group())) for m in re.finditer(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', new_js)]
    nl = new_js.count('\n')
    print('제어문자 개수: %d (0이어야 함)' % len(ctrl))
    print('줄 수: %d (원본 3줄 구조 유지 확인)' % (nl + 1))
    if ctrl:
        print('  !! 제어문자 발견:', ctrl[:5])

    # ---------- SQL ----------
    def esc(s):
        return s.replace("'", "''")

    CAPACITY = 15   # 전 강좌 동일 (담당자 확정)
    MIN_OPEN = 8    # 2026-09-03 담당자 확정 (기존 5에서 상향)

    lines = [
        '-- ============================================================',
        '-- 2026학년도 2학기 꿈키움 학교 밖 교육 창의적체험활동 수강신청',
        '-- courses 테이블 교체용 (기존 14강좌 + 신청 데이터 전량 삭제)',
        '-- 생성일: %s' % datetime.date.today().isoformat(),
        '-- 생성: apply/_tools/gen_embed.py --write  (직접 편집하지 말 것)',
        '--',
        '-- 컬럼 구성은 2026-09-03에 information_schema로 실측 확인했다.',
        '--   code·name·org·region text NOT NULL',
        '--   capacity int NOT NULL default 15 / enrolled_count int NOT NULL default 0',
        '--   min_open int NOT NULL default 5 / is_registerable bool NOT NULL default true',
        '--   is_closed_manual bool NOT NULL default false',
        '--',
        '-- 실행: Supabase 대시보드 > SQL Editor',
        '-- 문제가 생기면 COMMIT 대신 ROLLBACK; 하면 원상복구된다.',
        '-- ============================================================',
        '',
        'BEGIN;',
        '',
        '-- 1) 기존 데이터 삭제 (자식 테이블 먼저)',
        '--    예약 테이블은 있을 때만 지운다.',
        'DO $$',
        'BEGIN',
        "  IF EXISTS (SELECT 1 FROM information_schema.tables",
        "              WHERE table_schema='public' AND table_name='reservations') THEN",
        "    EXECUTE 'DELETE FROM reservations';",
        '  END IF;',
        'END $$;',
        '',
        'DELETE FROM enrollments;',
        'DELETE FROM courses;',
        '',
        '-- 2) 신규 %d강좌 (정원 일괄 %d명, 폐강 기준 %d명)' % (len(DATA), CAPACITY, MIN_OPEN),
        'INSERT INTO courses',
        '  (code, name, org, region, capacity, enrolled_count, min_open, is_registerable, is_closed_manual)',
        'VALUES',
    ]
    vals = []
    for x in DATA:
        vals.append("  ('%s', '%s', '%s', '%s', %d, 0, %d, true, false)" % (
            esc(x['강좌코드']), esc(x['강좌명']), esc(x['기관명']), esc(x['지역']),
            CAPACITY, MIN_OPEN))
    lines.append(',\n'.join(vals) + ';')
    lines += [
        '',
        '-- 3) 확인 (courses=%d / seats=%d 이어야 한다)' % (len(DATA), len(DATA) * CAPACITY),
        'SELECT count(*) AS courses_count, sum(capacity) AS total_seats,',
        '       count(*) FILTER (WHERE enrolled_count <> 0) AS should_be_zero',
        '  FROM courses;',
        '',
        'COMMIT;',
        '',
    ]
    sql = '\n'.join(lines)

    sqlpath = os.path.join(OUTDIR, 'courses_2026_2_creative.sql')

    if WRITE:
        io.open(DST, 'w', encoding='utf-8', newline='').write(new_js)
        io.open(sqlpath, 'w', encoding='utf-8', newline='\n').write(sql)
        print('\n[WRITE] %s 기록 완료' % DST)
        print('[WRITE] %s 기록 완료' % sqlpath)
    else:
        print('\n[DRY-RUN] --write 를 붙이면 실제로 씁니다.')
        print('SQL 미리보기:')
        print('\n'.join(sql.split('\n')[:18]))


main()
