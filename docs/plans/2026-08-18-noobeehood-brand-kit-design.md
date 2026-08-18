# NooBeehood Brand Kit Design

**Status:** Approved for implementation  
**Date:** 2026-08-18

## Objective

Create a platform-neutral brand kit for the NooBeehood website and future iOS, Android, macOS, and Windows applications. The identity must feel welcoming, useful, neighborly, modern, and grounded without becoming childish or overly dependent on bee imagery.

## Selected direction: The Connected NooBee

The identity centers on a compact geometric bee made from a hexagonal body and two rounded wings. The inner wing edges create a subtle `N` in negative space. The mark has no face or cartoon details; warmth comes from rounded geometry, balanced proportions, and a slight upward posture.

The primary logo is a combination mark with the symbol on the left and `NooBeehood` on the right. `NooBee` receives greater typographic emphasis while `hood` remains readable as part of the uninterrupted brand name. The wordmark uses a rounded humanist style based on Nunito Sans and will be converted to vector outlines for final delivery.

## Color system

Retain and formalize the existing palette:

| Role | Hex | Primary use |
|---|---:|---|
| Bee Gold | `#F6B800` | Brand, key actions, highlights |
| Honey Amber | `#D97706` | Depth and active accents |
| Hive Charcoal | `#241F17` | Text, markings, dark surfaces |
| Beeswax | `#FFF1B8` | Selected and decorative areas |
| Honeycomb Cream | `#FFF9E8` | Main background |
| Pollen White | `#FFFEF8` | Raised surfaces |
| Meadow Green | `#3F6B45` | Success and local-life accents |

Gold is not used alone for small text or status communication. Charcoal-on-gold and cream-on-charcoal are the preferred high-contrast brand pairings. Additional functional shades may be introduced only where contrast or UI states require them.

## Visual language

- Partial connected-cell structures instead of wall-to-wall honeycomb patterns.
- Rounded geometry and thin connection lines.
- Restrained flight paths used as illustration guides, never navigation controls.
- Real local photography framed by brand graphics rather than replaced by bee illustrations.
- No cartoon faces, hazard stripes, excessive honey effects, or mascot-led compositions.

## Brand-kit deliverables

```text
assets/brand/
├── logos/
│   ├── concepts/
│   └── final/
├── icons/
├── graphics/
│   ├── splash/
│   └── welcome/
├── fonts/
└── tokens.css

docs/
├── brand-foundation.md
└── brand-guidelines.md
```

### Logos

Produce three initial SVG concepts within the approved Connected NooBee direction. After selection, provide horizontal, stacked, symbol-only, and wordmark-only lockups in full-color, charcoal, and reversed-white forms.

Test the symbol at favicon size. Export transparent PNGs at 16, 32, 64, 128, 256, 512, and 1024 pixels as applicable.

### App icon

Provide one square, unmasked 1024px master. Do not bake platform corner radii or masks into the artwork; Apple, Android, Windows, and macOS packaging will apply platform-specific shapes later.

### Splash graphics

Create responsive SVG artwork with:

- a centered NooBee mark;
- a restrained connected-cell pattern;
- cream and charcoal variants;
- compositions that tolerate portrait and landscape crops.

### Welcome graphics

Create three coordinated responsive SVG scenes:

1. **Find your footing** — a path entering the hive.
2. **Find your people** — cells connecting into a neighborhood.
3. **Build your hive** — one contribution completing the structure.

### Typography and tokens

Use a rounded humanist Nunito Sans–style family across display, heading, body, and UI roles unless small-size testing identifies a readability problem. Bundle only the required font files and license.

Provide `assets/brand/tokens.css` with approved colors and semantic roles. Avoid duplicate JSON token formats until an actual consumer requires one.

### Guidelines

Create `docs/brand-guidelines.md` covering:

- logo variants and usage;
- clearspace and minimum sizes;
- incorrect treatments;
- palette values and accessible combinations;
- typography hierarchy;
- illustration and photography direction;
- splash and welcome-screen usage;
- SVG-to-PNG export instructions.

## Deferred

Store screenshots, Tauri manifests, social-media templates, and print collateral are outside this phase. They should be generated when their real platform or campaign requirements exist.

## Acceptance criteria

- The symbol remains identifiable at 16px and in monochrome.
- All masters are editable SVGs without external image dependencies.
- App-icon artwork remains unmasked and safe for platform cropping.
- Text/background recommendations meet WCAG AA for their documented use.
- Splash and welcome graphics adapt to portrait and landscape layouts.
- The kit is usable without requiring proprietary design software.
