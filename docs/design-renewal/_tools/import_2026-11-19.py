#!/usr/bin/env python3
"""2026-11-19 업체 회신분 반입 — 꾸꾸클럽 캐릭터 이름 제목(sub01_03_title_02~04).
같은 회신의 아이콘 파일명 정정(sub03_01_icon_2025/2026)은 11-18에 그림 기준으로 이미 넣었으므로
사이트 파일은 바뀌지 않는다(새 2025 = 옛 2026, 새 2026 = 옛 2025, 바이트 일치 확인)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from optimize_svg import optimize_svg
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
V = os.path.join(ROOT, "design-source", "2026-11-19", "04_요소")
MAP = {
 "etc/sub01_03_title_02.svg": "kkukku/name-toki.svg",
 "etc/sub01_03_title_03.svg": "kkukku/name-pan.svg",
 "etc/sub01_03_title_04.svg": "kkukku/name-kku.svg",
}
for src, dest in MAP.items():
    out = optimize_svg(os.path.join(V, src), False)
    p = os.path.join(ROOT, "assets", "img", dest)
    open(p, "w", encoding="utf-8").write(out)
    print(f"{src:28} -> {dest:24} {len(out.encode()):>7,}B")

# 수강신청 화면(드라이브 「추가_수강신청」, 11-19 1차분). sub05_00_icon_03(지역연계)은 폴더에 없어 기존 아이콘을 쓴다.
E = os.path.join(ROOT, "design-source", "2026-11-19", "추가_수강신청")
MAP2 = {
 "SVG/sub05_00_icon_01.svg": "sub/icon-enroll.svg",          # 머리 영역 책
 "SVG/sub05_00_icon_02.svg": "sub/enroll-online.svg",
 "SVG/sub05_00_icon_04.svg": "sub/enroll-dual.svg",
 "SVG/sub05_00_icon_05.svg": "sub/enroll-dreamup.svg",
 "SVG/sub05_01_ch_01.svg":   "sub/char-duo-study.svg",       # sub05_01(apply/app.html) 반영 때 쓴다
 "SVG/sub05_02_bubble_01.svg": "sub/bubble-closed.svg",
 "SVG/sub05_02_ch_01.svg":   "sub/char-panda-lying.svg",
}
for src, dest in MAP2.items():
    out = optimize_svg(os.path.join(E, src), False)
    p = os.path.join(ROOT, "assets", "img", dest)
    open(p, "w", encoding="utf-8").write(out)
    print(f"{src:28} -> {dest:24} {len(out.encode()):>7,}B")
# 머리 영역 사진(흑백 원본 6000×4000, 7.9MB) → 1440폭 JPG. 색은 CSS 곱하기로 얹는다(4대 안전망 머리와 같은 방식).
# 이 컴퓨터에 Pillow가 없어 macOS sips를 쓴다
import subprocess
p = os.path.join(ROOT, "assets", "img", "sub", "hero-enroll.jpg")
subprocess.run(["sips", "-Z", "1440", "-s", "format", "jpeg", "-s", "formatOptions", "72",
                os.path.join(E, "22271658.jpg"), "--out", p], check=True, capture_output=True)
print("hero-enroll.jpg", os.path.getsize(p))
