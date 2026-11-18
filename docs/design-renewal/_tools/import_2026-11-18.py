#!/usr/bin/env python3
"""2026-11-18 업체 04_요소 재납품분 반입 — optimize_svg.optimize_svg로 정리해 assets/img/에 넣는다.
업체 파일명과 내용이 다른 것: sub03_01_icon_2025.svg 안의 글자가 2026, _2026.svg 안이 2025 (업체에 알림). 내용 기준으로 넣는다."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from optimize_svg import optimize_svg
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
V = os.path.join(ROOT, "design-source", "2026-11-18", "04_요소")
MAP = {
 "icon/sub01_01_icon_01.svg": "sub/icon-before.svg",
 "icon/sub01_01_icon_02.svg": "sub/icon-after.svg",
 "icon/sub01_01_icon_03.svg": "sub/bg-industry.svg",
 "icon/sub01_01_icon_04.svg": "sub/bg-learner.svg",
 "icon/sub01_01_icon_05.svg": "sub/bg-competency.svg",
 "icon/sub01_01_icon_06.svg": "sub/bg-population.svg",
 "icon/sub01_01_icon_07.svg": "sub/bg-inequality.svg",
 "icon/sub01_01_icon_08.svg": "sub/bg-environment.svg",
 "icon/sub01_02_icon_02.svg": "sub/agency-value.svg",
 "icon/sub01_02_icon_03.svg": "sub/agency-dilemma.svg",
 "icon/sub01_02_icon_04.svg": "sub/agency-responsibility.svg",
 "icon/sub01_02_icon_05.svg": "sub/aar-anticipation.svg",
 "icon/sub01_02_icon_06.svg": "sub/aar-action.svg",
 "icon/sub01_02_icon_07.svg": "sub/aar-reflection.svg",
 "icon/sub01_02_icon_08.svg": "sub/upd-levels.svg",
 "icon/sub01_02_icon_09.svg": "sub/upd-coagency.svg",
 "icon/sub01_02_icon_10.svg": "sub/upd-wellbeing.svg",
 "icon/sub01_02_icon_11.svg": "sub/upd-choice.svg",
 "icon/sub01_02_icon_12.svg": "sub/axis-authority.svg",
 "icon/sub01_02_icon_13.svg": "sub/axis-responsibility.svg",
 "icon/sub02_01_icon_02.svg": "sub/test-interest.svg",
 "icon/sub02_01_icon_03.svg": "sub/test-aptitude.svg",
 "icon/sub02_01_icon_04.svg": "sub/test-values.svg",
 "icon/sub03_01_icon_2026.svg": "sub/year-2025.svg",   # 파일명 뒤바뀜(내용 2025)
 "icon/sub03_01_icon_2025.svg": "sub/year-2026.svg",   # 파일명 뒤바뀜(내용 2026)
 "icon/sub03_01_icon_2027.svg": "sub/year-2027.svg",
 "icon/sub03_02_icon_01.svg": "sub/online-home.svg",
 "icon/sub03_02_icon_02.svg": "sub/online-video.svg",
 "icon/sub03_03_icon_01.svg": "sub/joint-school.svg",
 "icon/sub03_03_icon_02.svg": "sub/joint-regional.svg",
 "icon/sub03_03_icon_03.svg": "sub/joint-online.svg",
 "icon/sub03_03_icon_04.svg": "sub/joint-apply.svg",
 "icon/sub03_04_icon_01.svg": "sub/outside-curriculum.svg",
 "icon/sub03_04_icon_02.svg": "sub/outside-system.svg",
 "character/sub04_01_ch_01.svg": "sub/char-rabbit-megaphone.svg",
 "icon/menu_icon01.svg": "common/menu-selector.svg",
 "icon/menu_icon02.svg": "common/menu-enroll.svg",
 "hero/main_content_icon_1.svg": "home/badge-start.svg",      # 퍼플 #8B5ED4 반영본
 "hero/main_content_ch_7.svg": "home/char-board-goal.svg",    # 퍼플 #8B5ED4 반영본
}
for src, dest in MAP.items():
    out = optimize_svg(os.path.join(V, src), False)
    p = os.path.join(ROOT, "assets", "img", dest)
    open(p, "w", encoding="utf-8").write(out)
    print(f"{src:34} -> {dest:32} {len(out.encode()):>7,}B")
# 업체 수정본에도 옛 퍼플이 남은 두 파일은 직접 치환
for f in ("sub/icon-about.svg", "sub/icon-design.svg"):
    p = os.path.join(ROOT, "assets", "img", f); t = open(p, encoding="utf-8").read()
    n = t.lower().count("#946ad7"); t = t.replace("#946AD7", "#8B5ED4").replace("#946ad7", "#8B5ED4")
    open(p, "w", encoding="utf-8").write(t); print(f, "purple", n)
