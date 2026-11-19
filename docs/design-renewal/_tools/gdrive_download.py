#!/usr/bin/env python3
"""업체 구글 드라이브 공개 폴더를 하위 폴더째 내려받는다 (2026-11-19).
쓰는 법:  python3 -I docs/design-renewal/_tools/gdrive_download.py <폴더ID> <저장 폴더> [건너뛸 확장자 …]
  예)     python3 -I docs/design-renewal/_tools/gdrive_download.py 1Aoy... design-source/2026-11-20/1_필수 .ai
- 「링크가 있는 모든 사용자」 공개 폴더만 된다(embeddedfolderview 목록 + drive.usercontent 직접 내려받기).
- 이미 있는 파일은 건너뛴다. '~'로 시작하는 임시 파일은 받지 않는다.
- 폴더 ID는 공개 저장소에 적지 않는다 — Todoist 「업체 추가 화면 반입」 설명에 있다.
- 교육청망은 드라이브가 막혀 있다. 집·노트북 망에서 받는다."""
import re, sys, html, os, urllib.request
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})).read()
def walk(fid,out,skip_ext=()):
    os.makedirs(out,exist_ok=True)
    t=get(f'https://drive.google.com/embeddedfolderview?id={fid}').decode('utf-8')
    for m in re.finditer(r'<a href="([^"]+)"[^>]*>.*?<div class="flip-entry-title">([^<]+)</div>',t,re.S):
        name=html.unescape(m.group(2)); u=m.group(1)
        if name.startswith('~'): continue
        f=re.search(r'folders/([\w-]+)',u)
        if f: walk(f.group(1),os.path.join(out,name),skip_ext); continue
        d=re.search(r'file/d/([\w-]+)',u).group(1)
        p=os.path.join(out,name)
        if name.lower().endswith(skip_ext) or os.path.exists(p): print('skip',p); continue
        b=get(f'https://drive.usercontent.google.com/download?id={d}&export=download&confirm=t')
        open(p,'wb').write(b); print(len(b),p)
if __name__ == "__main__":
    walk(sys.argv[1], sys.argv[2], tuple(sys.argv[3:]))
