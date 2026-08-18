# NooBeehood Logo Refinement Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Produce three simplified refinements of the selected Forward Path logo direction.

**Architecture:** Add three self-contained SVG combination marks under a dedicated refinement directory. Extend the existing standard-library asset contract check, then render a single SVG/PNG comparison sheet with librsvg.

**Tech Stack:** SVG, Python 3 standard library, librsvg

---

### Task 1: Extend the asset contract

**Files:**
- Modify: `scripts/check-brand-assets.py`

1. Add the three expected refinement SVG paths.
2. Run `python3 scripts/check-brand-assets.py`.
3. Confirm it fails only because the refinement files are missing.
4. Commit the failing contract with the two refinement plan documents.

### Task 2: Build the three refinements

**Files:**
- Create: `assets/brand/logos/refinements/noobeehood-3a-balanced-flight.svg`
- Create: `assets/brand/logos/refinements/noobeehood-3b-nested-n.svg`
- Create: `assets/brand/logos/refinements/noobeehood-3c-open-cell.svg`

1. Build each symbol using only vector paths and approved colors.
2. Use the same single-color wordmark in every file: one text element with weighted `tspan` elements.
3. Run `python3 scripts/check-brand-assets.py`.
4. Confirm all six concept/refinement SVGs pass.

### Task 3: Render and review

**Files:**
- Create: `assets/brand/logos/refinements/noobeehood-logo-refinements.svg`
- Create: `assets/brand/logos/refinements/noobeehood-logo-refinements.png`
- Create: `assets/brand/logos/refinements/previews/*.png`

1. Render each refinement on Honeycomb Cream at 1600px wide.
2. Render the comparison sheet with clear 3A/3B/3C labels.
3. Inspect for clipping, accidental character details, wordmark spacing, and meaningful geometric differences.
4. Revise only identified visual defects.

### Task 4: Verify and commit

Run:

```bash
python3 scripts/check-brand-assets.py
for svg in assets/brand/logos/refinements/*.svg; do
  rsvg-convert "$svg" --output "$(mktemp -t noobeehood).png"
done
git diff --check
```

Commit the refinement assets and previews after verification.
