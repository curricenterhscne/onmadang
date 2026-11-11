#!/usr/bin/env python3
"""공개 저장소에 학생 자료가 들어가는 것을 막는 검사.

사용:
  python tools/privacy_scan.py --staged     커밋 전 검사 (.githooks/pre-commit)
  python tools/privacy_scan.py --all        추적 중인 파일 전체 검사
  python tools/privacy_scan.py --history    모든 브랜치의 이력 전체 검사
  python tools/privacy_scan.py --expiry     docs/privacy/register.json의 종료일 검사

찾은 값은 출력하지 않는다. 검사 결과가 로그에 남아도 개인정보가 새지 않도록 파일과 종류, 개수만 쓴다.
규칙에 걸린 파일이 정당하면 tools/privacy_allow.txt에 경로와 이유를 적는다.
"""
import argparse
import datetime
import fnmatch
import json
import os
import re
import subprocess
import sys

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or '.'
ALLOW_FILE = os.path.join(ROOT, 'tools', 'privacy_allow.txt')
REGISTER = os.path.join(ROOT, 'docs', 'privacy', 'register.json')

PHONE = re.compile(rb'(?<![0-9])01[016789][- .]?[0-9]{3,4}[- .]?[0-9]{4}(?![0-9])')
RRN = re.compile(rb'(?<![0-9])[0-9]{6}-[1-4][0-9]{6}(?![0-9])')
# 따옴표로 묶인 두세 글자 한글 중 성씨로 시작하는 값. 많이 모여 있으면 명단으로 본다
SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진지엄채원천방공현함변염여추도석선설마길연위표명기반왕금옥육인맹제모탁국어은편용'
NAME = re.compile('["\'>,|]([' + SURNAMES + '][가-힣]{1,2})["\'<,|]')
# 가운데를 가린 이름 (예: 홍*동). 가려도 강좌·이수 결과와 묶이면 학생 자료다
MASKED = re.compile('["\'>,|]([가-힣A-Za-z]\\*{1,6}[가-힣A-Za-z]{0,2})["\'<,|]')
NAME_LIMIT = 30
PHONE_LIMIT = 5
SENSITIVE_PATH = re.compile(r'명단|출석|출결|성적|roster|attendance/pages|students?\.(csv|xlsx|json)', re.I)
DATA_FILE = re.compile(r'\.(csv|tsv|xls|xlsx|hwp|hwpx)$', re.I)
SCAN_LIMIT = 8 * 1024 * 1024


def load_allow():
    pats = []
    if os.path.exists(ALLOW_FILE):
        with open(ALLOW_FILE, encoding='utf-8') as f:
            for line in f:
                line = line.split('#', 1)[0].strip()
                if line:
                    pats.append(line)
    return pats


def allowed(path, pats):
    return any(fnmatch.fnmatch(path, p) for p in pats)


def inspect(path, data):
    """(종류, 개수) 목록을 돌려준다. 값은 담지 않는다."""
    found = []
    if SENSITIVE_PATH.search(path):
        found.append(('민감한 경로', 1))
    if DATA_FILE.search(path):
        found.append(('자료 파일 형식', 1))
    if data is None or len(data) > SCAN_LIMIT or b'\0' in data[:4096]:
        return found
    phones = {m.group(0) for m in PHONE.finditer(data)}
    phones = {p for p in phones if re.sub(rb'[^0-9]', b'', p) not in (b'01012345678', b'01000000000')}
    if len(phones) >= PHONE_LIMIT:
        found.append(('휴대전화 번호', len(phones)))
    rrn = {m.group(0) for m in RRN.finditer(data)}
    if rrn:
        found.append(('주민등록번호 형식', len(rrn)))
    text = data.decode('utf-8', 'ignore')  # 한글 범위는 글자 단위로 봐야 한다. 바이트에 적용하면 맞지 않는다
    names = {m.group(1) for m in NAME.finditer(text)}
    if len(names) >= NAME_LIMIT:
        found.append(('이름으로 보이는 값', len(names)))
    masked = {m.group(1) for m in MASKED.finditer(text)}
    if len(masked) >= NAME_LIMIT:
        found.append(('가린 이름으로 보이는 값', len(masked)))
    return found


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True).stdout


def read(path):
    try:
        with open(os.path.join(ROOT, path), 'rb') as f:
            return f.read()
    except OSError:
        return None


def paths(raw):
    return [p for p in raw.decode('utf-8', 'replace').split('\0') if p]


def scan_staged(allow):
    hits = {}
    for p in paths(git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')):
        if allowed(p, allow):
            continue
        r = inspect(p, git('show', ':' + p))
        if r:
            hits[p] = r
    return hits


def scan_all(allow):
    hits = {}
    for p in paths(git('ls-files', '-z')):
        if allowed(p, allow):
            continue
        r = inspect(p, read(p))
        if r:
            hits[p] = r
    return hits


def scan_history(allow):
    """모든 브랜치의 모든 파일 버전을 검사한다. 같은 내용은 한 번만 읽는다."""
    seen = {}
    for line in git('rev-list', '--all', '--objects').decode('utf-8', 'replace').splitlines():
        oid, _, path = line.partition(' ')
        if path and oid not in seen:
            seen[oid] = path
    kinds = git('cat-file', '--batch-check=%(objectname) %(objecttype)', '--batch-all-objects').decode().splitlines()
    blobs = {k.split()[0] for k in kinds if k.endswith(' blob')}
    hits = {}
    for oid, path in seen.items():
        if oid not in blobs or allowed(path, allow):
            continue
        r = inspect(path, git('cat-file', 'blob', oid))
        if r:
            hits.setdefault(path, []).append((oid[:10], r))
    return hits


def scan_expiry():
    if not os.path.exists(REGISTER):
        return ['register.json이 없습니다.']
    with open(REGISTER, encoding='utf-8') as f:
        items = json.load(f)['items']
    today = datetime.date.today().isoformat()
    late = []
    for it in items:
        if it.get('status') == 'active' and it.get('end') and it['end'] < today:
            late.append(f"{it['path']}: 종료일 {it['end']}이 지났습니다. 조치: {it.get('after_end', '')}")
    return late


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    for f in ('staged', 'all', 'history', 'expiry'):
        g.add_argument('--' + f, action='store_true')
    a = ap.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if a.expiry:
        late = scan_expiry()
        for x in late:
            print(x)
        print('종료일 지난 항목 없음' if not late else f'{len(late)}건 조치 필요')
        return 1 if late else 0
    allow = load_allow()
    hits = scan_history(allow) if a.history else scan_all(allow) if a.all else scan_staged(allow)
    for p in sorted(hits):
        print(p, hits[p])
    if hits:
        print(f'\n개인정보로 의심되는 파일 {len(hits)}개. 공개 저장소에 넣으면 안 됩니다.')
        print('자료가 아니라면 tools/privacy_allow.txt에 경로와 이유를 적으십시오.')
        return 1
    print('검사 통과')
    return 0


if __name__ == '__main__':
    sys.exit(main())
