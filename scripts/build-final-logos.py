#!/usr/bin/env python3
"""Generate final NooBeehood SVG logos with outlined Nunito Sans text."""

from argparse import ArgumentParser
from math import ceil
from pathlib import Path
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets/brand"
FONT_BOLD = BRAND / "fonts/NunitoSans-Bold.ttf"
FONT_MEDIUM = BRAND / "fonts/NunitoSans-Medium.ttf"
OUT = BRAND / "logos/final"

GOLD = "#F6B800"
AMBER = "#D97706"
CHARCOAL = "#241F17"
BEESWAX = "#FFF1B8"
WHITE = "#FFFEF8"


def number(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")


class Outliner:
    def __init__(self, path: Path):
        self.font = TTFont(path)
        self.glyphs = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.metrics = self.font["hmtx"].metrics
        self.units = self.font["head"].unitsPerEm

    def text(
        self,
        value: str,
        x: float,
        baseline: float,
        size: float,
        fill: str,
        letter_spacing: float = -2.5,
    ) -> tuple[str, float]:
        scale = size / self.units
        paths = []
        cursor = x
        for character in value:
            glyph_name = self.cmap[ord(character)]
            svg_pen = SVGPathPen(self.glyphs, ntos=number)
            pen = TransformPen(svg_pen, (scale, 0, 0, -scale, cursor, baseline))
            self.glyphs[glyph_name].draw(pen)
            paths.append(f'    <path d="{svg_pen.getCommands()}" fill="{fill}"/>')
            cursor += self.metrics[glyph_name][0] * scale + letter_spacing
        return "\n".join(paths), cursor - letter_spacing


def symbol(variant: str, transform: str = "") -> str:
    if variant == "full-color":
        wing_fill, body_fill, stroke, bands = BEESWAX, GOLD, CHARCOAL, CHARCOAL
    elif variant == "charcoal":
        wing_fill = body_fill = "none"
        stroke = bands = CHARCOAL
    else:
        wing_fill = body_fill = "none"
        stroke = bands = WHITE

    transform_attr = f' transform="{transform}"' if transform else ""
    return f'''  <g{transform_attr}>
    <g transform="rotate(-8 160 180)">
      <path d="M130 179C86 179 54 158 52 126C50 100 68 82 93 85C121 89 144 114 148 157L130 179Z" fill="{wing_fill}" stroke="{stroke}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M190 179C234 179 266 158 268 126C270 100 252 82 227 85C199 89 176 114 172 157L190 179Z" fill="{wing_fill}" stroke="{stroke}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M160 107L206 134V250L160 277L114 250V134L160 107Z" fill="{body_fill}" stroke="{stroke}" stroke-width="12" stroke-linejoin="round"/>
      <path d="M116 176H204M116 218H204" fill="none" stroke="{bands}" stroke-width="14"/>
    </g>
  </g>'''


def wordmark(
    variant: str,
    x: float,
    baseline: float,
    size: float,
    bold: Outliner,
    medium: Outliner,
) -> tuple[str, float]:
    if variant == "full-color":
        first, second, underline = CHARCOAL, AMBER, GOLD
    elif variant == "charcoal":
        first = second = underline = CHARCOAL
    else:
        first = second = underline = WHITE

    noobee, split = bold.text("NooBee", x, baseline, size, first)
    hood, end = medium.text("hood", split, baseline, size, second)
    line_y = baseline + size * 0.3
    markup = (
        f'  <g aria-label="NooBeehood">\n{noobee}\n{hood}\n'
        f'    <path d="M{number(x + 2)} {number(line_y)}H{number(split - 3)}" '
        f'fill="none" stroke="{underline}" stroke-width="{number(size * 0.1)}" '
        f'stroke-linecap="round"/>\n  </g>'
    )
    return markup, end


def svg(title: str, desc: str, view_box: str, content: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">{desc}</desc>
{content}
</svg>
'''


def build() -> dict[Path, str]:
    bold = Outliner(FONT_BOLD)
    medium = Outliner(FONT_MEDIUM)
    files: dict[Path, str] = {}

    for variant in ("full-color", "charcoal", "reversed"):
        mark, _ = wordmark(variant, 380, 214, 100, bold, medium)
        files[OUT / "horizontal" / f"noobeehood-horizontal-{variant}.svg"] = svg(
            f"NooBeehood horizontal logo, {variant}",
            "The Balanced Flight bee beside the outlined NooBeehood wordmark.",
            "0 0 1200 360",
            f"{symbol(variant, 'translate(20 0)')}\n{mark}",
        )

        probe, word_end = wordmark(variant, 0, 0, 82, bold, medium)
        word_width = word_end
        word_x = (900 - word_width) / 2
        mark, _ = wordmark(variant, word_x, 610, 82, bold, medium)
        files[OUT / "stacked" / f"noobeehood-stacked-{variant}.svg"] = svg(
            f"NooBeehood stacked logo, {variant}",
            "The Balanced Flight bee centered above the outlined NooBeehood wordmark.",
            "0 0 900 700",
            f"{symbol(variant, 'translate(290 60)')}\n{mark}",
        )

        files[OUT / "symbol" / f"noobeehood-symbol-{variant}.svg"] = svg(
            f"NooBeehood symbol, {variant}",
            "A simplified forward-tilted bee with two rounded wings and a hexagonal body.",
            "0 0 320 320",
            symbol(variant),
        )

        probe, word_end = wordmark(variant, 20, 105, 100, bold, medium)
        width = ceil(word_end + 20)
        files[OUT / "wordmark" / f"noobeehood-wordmark-{variant}.svg"] = svg(
            f"NooBeehood wordmark, {variant}",
            "The outlined NooBeehood wordmark with hood emphasized and NooBee underlined.",
            f"0 0 {width} 160",
            probe,
        )

    return files


def main() -> int:
    parser = ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail when generated files are stale")
    args = parser.parse_args()
    files = build()

    if args.check:
        stale = [path for path, content in files.items() if not path.exists() or path.read_text() != content]
        if stale:
            print("Stale generated logos:")
            print("\n".join(f"- {path.relative_to(ROOT)}" for path in stale))
            return 1
        print(f"Generated logos current: {len(files)} SVGs")
        return 0

    for path, content in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    print(f"Generated {len(files)} outlined SVG logos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
