# NooBeehood Brand Guidelines

**Version:** 1.0  
**Primary tagline:** Your new neighborhood.

## Identity

NooBeehood is welcoming, useful, neighborly, energetic, grounded, and collaborative. The identity uses a simplified **Balanced Flight** bee: two rounded wings, a forward-tilted hexagonal body, and two bands. It is recognizable without becoming a cartoon mascot.

The primary wordmark uses outlined Nunito Sans letterforms:

- **NooBee:** Bold, Hive Charcoal
- **hood:** Medium, Honey Amber
- **Underline:** Bee Gold beneath `NooBee`

Use bee language as warmth around clear product language, never as a replacement for familiar actions.

## Logo files

Final masters are under `assets/brand/logos/final/`.

| Layout | Preferred use |
|---|---|
| `horizontal` | Website/app headers, wide placements |
| `stacked` | Welcome screens, centered layouts |
| `symbol` | Favicons, compact navigation, avatars |
| `wordmark` | Text-led placements where the symbol already appears |

Each layout has:

- **full-color:** preferred on Honeycomb Cream or Pollen White;
- **charcoal:** one-color use on light backgrounds;
- **reversed:** one-color use on dark or photographic backgrounds.

Final logo SVGs contain outlined text and require no installed font.

## Clearspace and minimum size

Keep clearspace equal to at least half the bee body width on every side. Do not place text, icons, borders, or image detail inside that area.

| Asset | Minimum digital size |
|---|---:|
| Horizontal logo | 180px wide |
| Stacked logo | 120px wide |
| Symbol | 24px wide |
| App icon | 16px square |

Use the horizontal or wordmark layout rather than shrinking a stacked logo below its minimum.

## Incorrect usage

Do not:

- rotate the mark beyond its built-in forward tilt;
- stretch, skew, redraw, or rearrange the parts;
- add a face, antennae, stinger, shadow, glow, or flight trail to the logo;
- recolor individual elements outside the approved variants;
- remove or extend the wordmark underline;
- separate the public name into “Noo Bee Hood”;
- place the full-color logo on busy photography without a quiet cream field.

## Color system

### Primary colors

| Name | Hex | RGB | Use |
|---|---:|---:|---|
| Bee Gold | `#F6B800` | 246, 184, 0 | Primary brand, key actions, underline |
| Hive Charcoal | `#241F17` | 36, 31, 23 | Primary text, structure, dark surfaces |

### Secondary colors

| Name | Hex | RGB | Use |
|---|---:|---:|---|
| Honey Amber | `#D97706` | 217, 119, 6 | `hood`, active accents, depth |
| Beeswax | `#FFF1B8` | 255, 241, 184 | Wings, selected surfaces, gentle emphasis |
| Meadow Green | `#3F6B45` | 63, 107, 69 | Success, growth, local-life accents |

### Neutral surfaces

| Name | Hex | RGB | Use |
|---|---:|---:|---|
| Honeycomb Cream | `#FFF9E8` | 255, 249, 232 | Main canvas |
| Pollen White | `#FFFEF8` | 255, 254, 248 | Raised surfaces and inverse text |

Semantic CSS variables are in `assets/brand/tokens.css`.

## Accessible combinations

| Foreground / background | Contrast | Guidance |
|---|---:|---|
| Charcoal / Gold | 9.17:1 | Body text and controls |
| Charcoal / Amber | 5.14:1 | Body text and controls |
| Pollen White / Charcoal | 16.19:1 | Inverse text |
| Charcoal / Cream | 15.56:1 | Primary reading combination |
| Charcoal / Beeswax | 14.44:1 | Selected cards and notices |
| Pollen White / Meadow Green | 6.11:1 | Success labels and controls |

Honey Amber on Cream is reserved for large logo lettering and decoration; its 3.03:1 contrast is not sufficient for ordinary small text. Never use color alone to communicate status.

## Typography

The kit includes open-licensed Nunito Sans Bold and Medium under `assets/brand/fonts/`, with the SIL Open Font License in `OFL.txt`.

- **Display and primary headings:** Nunito Sans Bold
- **Labels and wordmark support:** Nunito Sans Medium
- **Future body/UI text:** choose and bundle the needed Nunito Sans weight when application development begins
- **Fallback:** system sans-serif

Do not typeset a replacement wordmark; use the outlined SVG files.

## App icon

`assets/brand/icons/noobeehood-app-icon.svg` is the square, unmasked master. PNG exports from 16px through 1024px are provided beside it.

Do not add rounded corners. Apple, Android, macOS, Windows, and distribution stores apply their own masks. Keep the bee inside its existing safe area.

## Splash graphics

Light and dark portrait/landscape masters are under `assets/brand/graphics/splash/`.

- Center the symbol in the available safe area.
- Crop decorative corner cells before cropping the symbol.
- Do not stretch one orientation into the other.
- Keep platform loading text and progress indicators outside the mark.

## Welcome graphics

The three text-free SVGs under `assets/brand/graphics/welcome/` support localized application copy:

1. **Find your footing:** a path entering the hive.
2. **Find your people:** connected cells centered on a shared place.
3. **Build your hive:** one contribution joining the structure.

Copy belongs in the application layout, not inside the artwork. Maintain the SVG aspect ratio and provide meaningful accessibility labels in the application.

## Imagery

Use real people, businesses, food, homes, streets, coastline, gatherings, and daily life in Manta and Manabí. Favor warm natural light and truthful local context. Brand geometry may frame photography, but should not replace the place or its people.

Avoid generic tropical fantasy, stock-photo handshakes, excessive yellow filters, cartoon bee scenes, and wall-to-wall honeycomb patterns.

## Exporting

SVG is the source format. To produce a PNG with librsvg:

```bash
rsvg-convert --width 1024 input.svg --output output.png
```

Regenerate the final outlined logo family after an intentional source change:

```bash
uv run --with fonttools python scripts/build-final-logos.py
```

Validate the full kit:

```bash
python3 scripts/check-brand-assets.py
```
