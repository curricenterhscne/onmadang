#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SVG 최적화 — design-map.json의 use:true SVG 항목을 정리해 assets/로 복사한다.

규칙 (docs/design-renewal/계획.md 2단계 기준):
- XML 선언 제거
- 루트 <svg>의 id="_레이어_1" data-name="레이어 1" 제거
- <defs><style>.cls-N{...}</style></defs> 의 클래스를 각 요소에 속성으로 인라인하고 제거
  (여러 SVG를 한 페이지에 inline으로 쓸 때 .cls-1 같은 클래스명이 충돌하는 것을 막기 위함)
- viewBox 유지, width/height 속성 제거 (CSS/HTML에서 크기 지정)
- status: ok-mono → 단색 fill을 fill="currentColor"로 바꿔 CSS color로 색을 넣을 수 있게
- 그 외(ok, ok-minor)는 원본 다색 그대로, 인라인화만 수행

배포 대상 아님 — docs/design-renewal/_tools/ 는 .gitignore 대상이 아니라도 사이트 런타임에 쓰이지 않는다.
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MAP_PATH = os.path.join(ROOT, "docs", "design-renewal", "design-map.json")


def parse_style_classes(style_text):
    """'.cls-1 { fill: #fff; } .cls-2, .cls-3 {...}' -> {'cls-1': 'fill:#fff', 'cls-2': 'fill:#fff', ...}
    쉼표로 묶인 선택자(.cls-2, .cls-3 { ... })도 각 클래스에 같은 선언을 적용한다.
    같은 클래스에 선언이 여러 번(예: fill 규칙 + letter-spacing 규칙) 나오면 뒤에 나온 것을 누적(병합)한다."""
    classes = {}
    for m in re.finditer(r"([.\w,\s-]+)\{([^}]*)\}", style_text):
        selector = m.group(1)
        decls = m.group(2)
        names = re.findall(r"\.(cls-\d+)", selector)
        if not names:
            continue
        pairs = [p.strip() for p in decls.split(";") if p.strip()]
        norm_pairs = [re.sub(r"\s*:\s*", ":", p) for p in pairs]
        for name in names:
            existing = classes.get(name, [])
            # 같은 속성명이 이미 있으면 뒤 규칙으로 덮어쓴다 (CSS cascade와 동일)
            existing_props = {p.split(":", 1)[0]: i for i, p in enumerate(existing)}
            for np in norm_pairs:
                prop = np.split(":", 1)[0]
                if prop in existing_props:
                    existing[existing_props[prop]] = np
                else:
                    existing.append(np)
            classes[name] = existing
    return {k: ";".join(v) for k, v in classes.items()}


def inline_classes(svg_text, classes):
    """class="cls-1" 속성을 style="fill:#fff;..." 로 치환"""
    def repl(m):
        cls_attr = m.group(0)
        names = m.group(1).split()
        decls = []
        for n in names:
            if n in classes:
                decls.append(classes[n])
        if not decls:
            return cls_attr
        return 'style="%s"' % ";".join(decls)

    return re.sub(r'class="([^"]+)"', repl, svg_text)


def strip_defs_style(svg_text):
    """<defs><style>...</style></defs> 블록 제거 (다른 내용이 defs 안에 있으면 style 태그만 제거)"""
    def repl(m):
        inner = m.group(1)
        inner_wo_style = re.sub(r"<style[^>]*>.*?</style>", "", inner, flags=re.S)
        inner_wo_style = inner_wo_style.strip()
        if not inner_wo_style:
            return ""
        return "<defs>%s</defs>" % inner_wo_style

    return re.sub(r"<defs>(.*?)</defs>", repl, svg_text, flags=re.S)


def clean_root_svg_tag(svg_text):
    svg_text = re.sub(r'\s+id="_레이어_1"', "", svg_text)
    svg_text = re.sub(r'\s+data-name="레이어 1"', "", svg_text)
    # 루트 <svg ...> 태그에서만 width/height 제거 (viewBox는 유지)
    def repl(m):
        tag = m.group(0)
        tag = re.sub(r'\s+width="[^"]*"', "", tag)
        tag = re.sub(r'\s+height="[^"]*"', "", tag)
        return tag

    svg_text = re.sub(r"<svg\b[^>]*>", repl, svg_text, count=1)
    return svg_text


def to_currentcolor(svg_text):
    """단색 아이콘: fill:#xxxxxx 또는 fill="#xxxxxx" 를 currentColor로, fill:none은 유지"""
    svg_text = re.sub(
        r'fill:\s*#[0-9a-fA-F]{3,8}', 'fill:currentColor', svg_text
    )
    svg_text = re.sub(
        r'fill="#[0-9a-fA-F]{3,8}"', 'fill="currentColor"', svg_text
    )
    # class/style이 아예 없는 <path> (fill 속성 자체가 없어 기본 검정) -> 명시적으로 지정
    def add_fill(m):
        tag = m.group(0)
        if "fill=" in tag or "style=" in tag:
            return tag
        if tag.endswith("/>"):
            return tag[:-2] + ' fill="currentColor"/>'
        return tag[:-1] + ' fill="currentColor">'

    svg_text = re.sub(r"<path\b[^>]*/?>", add_fill, svg_text)
    return svg_text


def squeeze_whitespace(svg_text):
    svg_text = re.sub(r">\s+<", "><", svg_text)
    svg_text = svg_text.strip()
    return svg_text


def optimize_svg(src_path, is_mono):
    text = open(src_path, encoding="utf-8").read()
    # XML 선언 제거
    text = re.sub(r"^\s*<\?xml[^>]*\?>\s*", "", text)

    style_m = re.search(r"<style[^>]*>(.*?)</style>", text, flags=re.S)
    if style_m:
        classes = parse_style_classes(style_m.group(1))
        text = inline_classes(text, classes)
        text = strip_defs_style(text)

    text = clean_root_svg_tag(text)

    if is_mono:
        text = to_currentcolor(text)

    text = squeeze_whitespace(text)
    return text


def main():
    with open(MAP_PATH, encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for item in data["files"]:
        if not item.get("use"):
            continue
        src = item["src"]
        dest = item["dest"]
        if dest is None or not src.endswith(".svg"):
            continue
        status = item["status"]
        is_mono = status == "ok-mono"

        src_abs = os.path.join(ROOT, src)
        dest_abs = os.path.join(ROOT, dest)
        os.makedirs(os.path.dirname(dest_abs), exist_ok=True)

        before_size = os.path.getsize(src_abs)
        optimized = optimize_svg(src_abs, is_mono)
        with open(dest_abs, "w", encoding="utf-8", newline="\n") as f:
            f.write(optimized)
        after_size = os.path.getsize(dest_abs)

        results.append((src, dest, before_size, after_size, status))

    print("%-70s %10s %10s %8s  %s" % ("dest", "before", "after", "ratio", "status"))
    for src, dest, before, after, status in results:
        ratio = "%.1f%%" % (100.0 * after / before) if before else "-"
        print("%-70s %10d %10d %8s  %s" % (dest, before, after, ratio, status))

    print("\n총 %d개 SVG 반입 완료" % len(results))


if __name__ == "__main__":
    sys.exit(main())
