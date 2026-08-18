# NooBeehood Logo Concepts Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Produce three reviewable Connected NooBee SVG logo concepts and a rendered comparison sheet.

**Architecture:** Keep each concept as one self-contained, accessible SVG using only vector geometry and the approved palette. Use one Python standard-library check to enforce portable SVG structure, then render PNG previews with the already-installed `rsvg-convert` and combine them with ImageMagick.

**Tech Stack:** SVG 1.1/2, Python 3 standard library, librsvg, ImageMagick

---

### Task 1: Add the asset contract check

**Files:**
- Create: `scripts/check-brand-assets.py`

**Step 1: Write the failing check**

Create a Python script that expects these files:

- `assets/brand/logos/concepts/noobeehood-concept-1-open-wings.svg`
- `assets/brand/logos/concepts/noobeehood-concept-2-linked-hive.svg`
- `assets/brand/logos/concepts/noobeehood-concept-3-forward-path.svg`

For each SVG, parse it with `xml.etree.ElementTree` and assert that it:

- has an SVG root and `viewBox`;
- includes non-empty `title` and `desc` elements;
- contains no raster `image` elements;
- contains no scripts, external links, filters, masks, or embedded style blocks;
- uses only approved brand colors;
- has no `width` or `height` attributes on the root, preserving responsive scaling.

**Step 2: Run the check to verify it fails**

Run: `python3 scripts/check-brand-assets.py`

Expected: FAIL because all three concept SVGs are missing.

**Step 3: Commit the failing check**

```bash
git add scripts/check-brand-assets.py docs/plans/2026-08-18-noobeehood-logo-concepts-implementation.md
git commit -m "test: define NooBeehood SVG asset contract"
```

### Task 2: Create concept 1 — Open Wings

**Files:**
- Create: `assets/brand/logos/concepts/noobeehood-concept-1-open-wings.svg`

**Step 1: Build the minimal concept**

Create a horizontal combination mark using a gold hexagonal body, warm rounded wings, charcoal bee structure, and subtle `N` negative space. Include the `NooBeehood` wordmark with `NooBee` emphasized and `hood` quieter.

**Step 2: Run the check**

Run: `python3 scripts/check-brand-assets.py`

Expected: FAIL only because concepts 2 and 3 are still missing.

### Task 3: Create concepts 2 and 3

**Files:**
- Create: `assets/brand/logos/concepts/noobeehood-concept-2-linked-hive.svg`
- Create: `assets/brand/logos/concepts/noobeehood-concept-3-forward-path.svg`

**Step 1: Build concept 2 — Linked Hive**

Use connected cells and rounded wing forms to emphasize community and shared knowledge while retaining a readable geometric bee.

**Step 2: Build concept 3 — Forward Path**

Use an upward-leaning bee and restrained flight-path cue to emphasize arrival, exploration, and progress.

**Step 3: Run the check to verify it passes**

Run: `python3 scripts/check-brand-assets.py`

Expected: PASS for all three SVGs.

**Step 4: Commit the concepts**

```bash
git add assets/brand/logos/concepts
git commit -m "feat: add NooBeehood logo concepts"
```

### Task 4: Render and inspect the comparison sheet

**Files:**
- Create: `assets/brand/logos/concepts/previews/*.png`
- Create: `assets/brand/logos/concepts/noobeehood-logo-concepts.png`

**Step 1: Render each concept**

Run `rsvg-convert` at 1600px wide with a Honeycomb Cream background.

**Step 2: Build the comparison sheet**

Use ImageMagick to stack the three rendered concepts vertically with simple labels.

**Step 3: Inspect visually**

Confirm:

- every mark reads as a bee;
- each wordmark is legible;
- no geometry is clipped;
- the concepts are meaningfully distinct;
- all three still belong to the approved Connected NooBee direction.

Revise only visible defects or contract violations.

**Step 4: Run final verification**

```bash
python3 scripts/check-brand-assets.py
git diff --check
```

Expected: three SVG checks pass and no whitespace errors are reported.

**Step 5: Commit previews**

```bash
git add assets/brand/logos/concepts
 git commit -m "docs: add NooBeehood logo concept previews"
```
