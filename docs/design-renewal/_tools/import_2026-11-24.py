#!/usr/bin/env python3
"""2026-11-24 업체 메일분 반입 — 고교-대학 연계 제도 안내(sub03_04_01) 아이콘 5개, 404 캐릭터.
원본: 담당자가 받은 zip(추가261124) → design-source/2026-11-24/추가261124/ (git 제외)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from optimize_svg import optimize_svg
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
V = os.path.join(ROOT, "design-source", "2026-11-24", "추가261124")
MAP = {
 "sub03_04_01_icon_01.svg": "sub/dc-univ.svg",        # 협약 대학
 "sub03_04_01_icon_02.svg": "sub/dc-course.svg",      # 개설 과목
 "sub03_04_01_icon_03.svg": "sub/dc-credit.svg",      # 이수 학점
 "sub03_04_01_icon_04.svg": "sub/dc-people.svg",      # 수강 인원
 "sub03_04_01_icon_05.svg": "sub/dc-curriculum.svg",  # 과목 교육과정 바로가기
 "404_ch_01.svg":           "sub/char-kku-book.svg",  # 없는 주소 안내
}
for src, dest in MAP.items():
    out = optimize_svg(os.path.join(V, src), False)
    open(os.path.join(ROOT, "assets", "img", dest), "w", encoding="utf-8").write(out)
    print(f"{src:26} -> {dest:26} {len(out.encode()):>7,}B")
