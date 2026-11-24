#!/usr/bin/env python3
"""2026-11-23 업체 메일분 반입 — 드라이브 [1_필수] 전체(노트북에서 받아 옮긴 zip, 원본은 design-source/2026-11-23/zip_1_필수/).
11-19 1차분 뒤에 새로 생긴 sub05 파일은 지역연계 아이콘 sub05_00_icon_03(11-19 17:44)과
sub05_00_bg_01.png(11-23), 원본 .ai뿐이다. 나머지 sub05 SVG는 11-19분과 같은지 여기서 확인한다."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from optimize_svg import optimize_svg
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
V = os.path.join(ROOT, "design-source", "2026-11-23", "zip_1_필수", "1_필수", "04_요소")
SAME = {
 "icon/sub05_00_icon_01.svg": "sub/icon-enroll.svg",
 "icon/sub05_00_icon_02.svg": "sub/enroll-online.svg",
 "icon/sub05_00_icon_04.svg": "sub/enroll-dual.svg",
 "icon/sub05_00_icon_05.svg": "sub/enroll-dreamup.svg",
 "character/sub05_01_ch_01.svg": "sub/char-duo-study.svg",
 "etc/sub05_02_bubble_01.svg": "sub/bubble-closed.svg",
 "character/sub05_02_ch_01.svg": "sub/char-panda-lying.svg",
}
for src, dest in SAME.items():
    out = optimize_svg(os.path.join(V, src), False)
    cur = open(os.path.join(ROOT, "assets", "img", dest), encoding="utf-8").read()
    print(f"{src:32} {'SAME' if out == cur else 'DIFF'}  {dest}")
NEW = {"icon/sub05_00_icon_03.svg": "sub/enroll-regional.svg"}
if "--write" in sys.argv:
    for src, dest in NEW.items():
        out = optimize_svg(os.path.join(V, src), False)
        open(os.path.join(ROOT, "assets", "img", dest), "w", encoding="utf-8").write(out)
        print(f"{src:32} -> {dest} {len(out.encode()):,}B")
