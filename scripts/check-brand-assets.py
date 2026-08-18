#!/usr/bin/env python3
"""Check that NooBeehood brand assets are portable and complete."""

from pathlib import Path
import re
import struct
import sys
import xml.etree.ElementTree as ET

PROTOTYPES = [
    "logos/concepts/noobeehood-concept-1-open-wings.svg",
    "logos/concepts/noobeehood-concept-2-linked-hive.svg",
    "logos/concepts/noobeehood-concept-3-forward-path.svg",
    "logos/refinements/noobeehood-3a-balanced-flight.svg",
    "logos/refinements/noobeehood-3b-nested-n.svg",
    "logos/refinements/noobeehood-3c-open-cell.svg",
    "logos/refinements/wordmark-treatments/noobeehood-3a-1-underline-noobee.svg",
    "logos/refinements/wordmark-treatments/noobeehood-3a-2-underline-hood.svg",
    "logos/refinements/wordmark-treatments/noobeehood-3a-3-underline-full.svg",
]
FINAL_LOGOS = [
    f"logos/final/{layout}/noobeehood-{layout}-{variant}.svg"
    for layout in ("horizontal", "stacked", "symbol", "wordmark")
    for variant in ("full-color", "charcoal", "reversed")
]
GRAPHICS = [
    "icons/noobeehood-app-icon.svg",
    *[
        f"graphics/splash/splash-{theme}-{orientation}.svg"
        for theme in ("light", "dark")
        for orientation in ("portrait", "landscape")
    ],
    "graphics/welcome/find-your-footing.svg",
    "graphics/welcome/find-your-people.svg",
    "graphics/welcome/build-your-hive.svg",
]
SVG_ASSETS = [Path("assets/brand") / path for path in PROTOTYPES + FINAL_LOGOS + GRAPHICS]
REQUIRED_FILES = [
    Path("assets/brand/fonts/NunitoSans-Bold.ttf"),
    Path("assets/brand/fonts/NunitoSans-Medium.ttf"),
    Path("assets/brand/fonts/OFL.txt"),
    Path("assets/brand/tokens.css"),
    Path("assets/brand/brand-kit-preview.svg"),
    Path("assets/brand/brand-kit-preview.png"),
    Path("docs/brand-guidelines.md"),
]
PNG_SIZES = {
    Path(f"assets/brand/icons/noobeehood-app-icon-{size}.png"): (size, size)
    for size in (16, 32, 64, 128, 256, 512, 1024)
}
ROOT = Path(__file__).resolve().parents[1]
APPROVED_COLORS = {
    "#F6B800",
    "#D97706",
    "#241F17",
    "#FFF1B8",
    "#FFF9E8",
    "#FFFEF8",
    "#3F6B45",
}
BANNED_TAGS = {"a", "filter", "image", "mask", "script", "style"}
COLOR_RE = re.compile(r"#[0-9a-fA-F]{6}\b")


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def check_svg(path: Path) -> list[str]:
    if not path.exists():
        return [f"missing {path.relative_to(ROOT)}"]

    errors: list[str] = []
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as error:
        return [f"{path.name}: invalid XML: {error}"]

    if local_name(root.tag) != "svg":
        errors.append(f"{path.name}: root element must be svg")
    if not root.get("viewBox"):
        errors.append(f"{path.name}: root needs viewBox")
    for attribute in ("width", "height"):
        if root.get(attribute) is not None:
            errors.append(f"{path.name}: root must not set {attribute}")

    elements = list(root.iter())
    for required in ("title", "desc"):
        matches = [element for element in elements if local_name(element.tag) == required]
        if not matches or not "".join(matches[0].itertext()).strip():
            errors.append(f"{path.name}: needs a non-empty {required}")

    for element in elements:
        tag = local_name(element.tag)
        if tag in BANNED_TAGS:
            errors.append(f"{path.name}: banned {tag} element")
        if "logos/final" in path.as_posix() and tag == "text":
            errors.append(f"{path.name}: final logos must outline all text")
        for value in element.attrib.values():
            for color in COLOR_RE.findall(value):
                if color.upper() not in APPROVED_COLORS:
                    errors.append(f"{path.name}: unapproved color {color.upper()}")

    return errors


def check_png(path: Path, expected: tuple[int, int]) -> list[str]:
    if not path.exists():
        return [f"missing {path.relative_to(ROOT)}"]
    data = path.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return [f"{path.name}: invalid PNG"]
    actual = struct.unpack(">II", data[16:24])
    return [] if actual == expected else [f"{path.name}: expected {expected}, got {actual}"]


def main() -> int:
    errors = [error for path in SVG_ASSETS for error in check_svg(ROOT / path)]
    errors.extend(
        f"missing {path}" for path in REQUIRED_FILES if not (ROOT / path).exists()
    )
    errors.extend(
        error
        for path, expected in PNG_SIZES.items()
        for error in check_png(ROOT / path, expected)
    )
    if errors:
        print("Brand asset check failed:")
        print("\n".join(f"- {error}" for error in errors))
        return 1

    print(
        f"Brand asset check passed: {len(SVG_ASSETS)} SVGs, "
        f"{len(PNG_SIZES)} PNGs, {len(REQUIRED_FILES)} supporting files"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
