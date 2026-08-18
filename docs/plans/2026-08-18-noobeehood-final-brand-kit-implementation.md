# NooBeehood Final Brand Kit Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Turn the approved 3A identity into a complete platform-neutral logo, icon, splash, welcome-graphic, color-token, font, and guideline package.

**Architecture:** Keep SVG masters as the source of truth. Convert the Nunito Sans wordmark to paths at build time with a small FontTools script run through ephemeral `uv`, then render PNG derivatives with librsvg. Validate every required SVG and PNG with the existing Python standard-library checker.

**Tech Stack:** SVG, CSS custom properties, Python 3, FontTools via `uv`, librsvg, ImageMagick identification

---

### Task 1: Expand the final-kit contract

**Files:**
- Modify: `scripts/check-brand-assets.py`

Add required paths for final logo lockups, icon masters/exports, splash SVGs, welcome SVGs, font/license files, color tokens, and guidelines. Require final logo SVGs to contain no `text` elements and verify PNG dimensions from their IHDR headers.

Run `python3 scripts/check-brand-assets.py` and confirm it fails only because final-kit files are missing.

### Task 2: Add Nunito Sans and outline generation

**Files:**
- Create: `assets/brand/fonts/NunitoSans-Bold.ttf`
- Create: `assets/brand/fonts/NunitoSans-Medium.ttf`
- Create: `assets/brand/fonts/OFL.txt`
- Create: `scripts/build-final-logos.py`

Copy the official Google Fonts files and SIL Open Font License. Build wordmark glyph paths with `TTFont`, `getGlyphSet`, `SVGPathPen`, and `TransformPen`. Run through `uv run --with fonttools` so the repository gains no runtime dependency.

### Task 3: Generate final logo family

**Files:**
- Create: `assets/brand/logos/final/horizontal/*.svg`
- Create: `assets/brand/logos/final/stacked/*.svg`
- Create: `assets/brand/logos/final/symbol/*.svg`
- Create: `assets/brand/logos/final/wordmark/*.svg`

Generate full-color, charcoal, and reversed variants for each layout. All wordmarks must be paths, not text.

### Task 4: Generate icons and token files

**Files:**
- Create: `assets/brand/icons/noobeehood-app-icon.svg`
- Create: `assets/brand/icons/noobeehood-app-icon-{16,32,64,128,256,512,1024}.png`
- Create: `assets/brand/tokens.css`

Keep the app-icon master square and unmasked with a safe margin. Export deterministic PNG sizes from the SVG master. Define primary, secondary, surface, text, success, and semantic alias variables in CSS only.

### Task 5: Create splash and welcome graphics

**Files:**
- Create: `assets/brand/graphics/splash/splash-{light,dark}-{portrait,landscape}.svg`
- Create: `assets/brand/graphics/welcome/find-your-footing.svg`
- Create: `assets/brand/graphics/welcome/find-your-people.svg`
- Create: `assets/brand/graphics/welcome/build-your-hive.svg`

Use only approved colors and vector geometry. Splash graphics center the symbol over restrained partial cells. Welcome graphics tell the three approved stories without embedded copy so the application can localize text independently.

### Task 6: Document and preview

**Files:**
- Create: `docs/brand-guidelines.md`
- Create: `assets/brand/brand-kit-preview.svg`
- Create: `assets/brand/brand-kit-preview.png`

Document logo usage, clearspace, minimum sizes, colors, typography, imagery, splash/welcome usage, and export commands. Render one overview sheet for visual review.

### Task 7: Verify and commit

Run:

```bash
python3 scripts/check-brand-assets.py
uv run --with fonttools python scripts/build-final-logos.py --check
find assets/brand -name '*.svg' -print0 | xargs -0 -n1 rsvg-convert --output /tmp/noobeehood-check.png
git diff --check
```

Confirm the checker passes, generated logo files are current, SVGs render, and the working tree is clean after commit.
