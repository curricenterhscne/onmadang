#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PNG → WebP/JPG 변환 — design-map.json에서 dest가 확장자 없이 지정된 항목(= 사진) 처리.

규칙 (docs/design-renewal/계획.md 2단계 기준):
- <dest>.webp   : 1440폭 (1x, 일반 디스플레이)
- <dest>@2x.webp: 2880폭 (2x, 고밀도 디스플레이)
- <dest>.jpg    : 폴백 (webp 미지원 구형 브라우저용, 1440폭)
- 품질 80 내외

Pillow만 사용 (빌드 도구를 사이트에 들이지 않기 위해 docs/design-renewal/_tools/ 에만 둔다).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MAP_PATH = os.path.join(ROOT, "docs", "design-renewal", "design-map.json")

QUALITY = 80
WIDTH_1X = 1440
WIDTH_2X = 2880


def save_variant(im, path, width, quality, fmt):
    w, h = im.size
    if width < w:
        ratio = width / w
        resized = im.resize((width, round(h * ratio)), Image.LANCZOS)
    else:
        resized = im
    save_kwargs = {"quality": quality}
    if fmt == "JPEG":
        save_kwargs["optimize"] = True
    else:
        save_kwargs["method"] = 6
    resized.save(path, fmt, **save_kwargs)
    return os.path.getsize(path)


def main():
    with open(MAP_PATH, encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for item in data["files"]:
        if not item.get("use"):
            continue
        src = item["src"]
        dest = item["dest"]
        if dest is None or not src.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        # 확장자 없는 dest만 "사진 반입 대상" (SVG는 optimize_svg.py가 처리)
        if os.path.splitext(dest)[1]:
            continue

        src_abs = os.path.join(ROOT, src)
        dest_abs = os.path.join(ROOT, dest)
        os.makedirs(os.path.dirname(dest_abs), exist_ok=True)

        im = Image.open(src_abs).convert("RGB")
        before = os.path.getsize(src_abs)

        webp1x = dest_abs + ".webp"
        webp2x = dest_abs + "@2x.webp"
        jpg1x = dest_abs + ".jpg"

        s1 = save_variant(im, webp1x, WIDTH_1X, QUALITY, "WEBP")
        s2 = save_variant(im, webp2x, WIDTH_2X, QUALITY, "WEBP")
        s3 = save_variant(im, jpg1x, WIDTH_1X, QUALITY, "JPEG")

        rows.append((src, before, webp1x, s1, webp2x, s2, jpg1x, s3))

    for src, before, webp1x, s1, webp2x, s2, jpg1x, s3 in rows:
        total = s1 + s2 + s3
        print("원본: %s (%.1fMB)" % (src, before / 1e6))
        print("  %-55s %8.1fKB" % (os.path.relpath(webp1x, ROOT), s1 / 1024))
        print("  %-55s %8.1fKB" % (os.path.relpath(webp2x, ROOT), s2 / 1024))
        print("  %-55s %8.1fKB" % (os.path.relpath(jpg1x, ROOT), s3 / 1024))
        print("  합계 %.1fKB (원본 대비 %.1f%%)" % (total / 1024, 100.0 * total / before))

    print("\n총 %d개 사진 반입 완료" % len(rows))


if __name__ == "__main__":
    sys.exit(main())
