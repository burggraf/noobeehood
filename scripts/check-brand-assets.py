#!/usr/bin/env python3
"""Check that NooBeehood logo concepts are portable, accessible SVGs."""

from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ASSETS = [
    Path("assets/brand/logos/concepts/noobeehood-concept-1-open-wings.svg"),
    Path("assets/brand/logos/concepts/noobeehood-concept-2-linked-hive.svg"),
    Path("assets/brand/logos/concepts/noobeehood-concept-3-forward-path.svg"),
    Path("assets/brand/logos/refinements/noobeehood-3a-balanced-flight.svg"),
    Path("assets/brand/logos/refinements/noobeehood-3b-nested-n.svg"),
    Path("assets/brand/logos/refinements/noobeehood-3c-open-cell.svg"),
    Path("assets/brand/logos/refinements/wordmark-treatments/noobeehood-3a-1-underline-noobee.svg"),
    Path("assets/brand/logos/refinements/wordmark-treatments/noobeehood-3a-2-underline-hood.svg"),
    Path("assets/brand/logos/refinements/wordmark-treatments/noobeehood-3a-3-underline-full.svg"),
]
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
        for value in element.attrib.values():
            for color in COLOR_RE.findall(value):
                if color.upper() not in APPROVED_COLORS:
                    errors.append(f"{path.name}: unapproved color {color.upper()}")

    return errors


def main() -> int:
    errors = [error for path in ASSETS for error in check_svg(ROOT / path)]
    if errors:
        print("Brand asset check failed:")
        print("\n".join(f"- {error}" for error in errors))
        return 1

    print(f"Brand asset check passed: {len(ASSETS)} SVG logo assets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
