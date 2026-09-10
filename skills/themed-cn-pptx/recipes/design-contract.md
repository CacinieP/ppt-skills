# Design Contract: Editorial Grid (`recipe-editorial-grid.mjs`)

A **locked recipe** = a fully runnable build (theme + marks + layouts) that
instantiates one style family from `references/aesthetic-rules.md`. It is not a
blank template; it deliberately removes degrees of freedom so a deck comes out
consistent without you having to re-decide every spacing and color.

Use this recipe for: reports, proposals, academic talks, product briefs,
research summaries — anything where the message is serious and decoration
should stay out of the way.

## What is locked (do not change without re-running QA)

### Palette — neutral ladder + ONE accent

| Slot | Hex | Role |
| --- | --- | --- |
| `accent` | `88C0D0` | the single saturated color; kicker, underline, stats |
| `accentDeep` | `5E81AC` | underline tail segment, hover/secondary accent |
| `ink` | `2E3440` | darkest neutral, slide + section titles |
| `body` | `3B4252` | body text on light |
| `muted` | `4C566A` | captions, footer, page badge |
| `paper` | `ECEFF4` | light slide background |
| `paperAlt` | `E5E9F0` | zebra rows, soft cards |
| `white` | `FFFFFF` | card surface |
| `line` | `D8DEE9` | 1pt hairlines (the only border style allowed) |

There is **no second saturated hue**. Do not add pink/orange/green. If you need
emphasis, use weight, size, or the accent — never a new color.

### Typography ladder (CJK-safe, 16:9 / 10×5.625")

| Use | Size | Face |
| --- | --- | --- |
| Cover title | 40pt bold | Microsoft YaHei |
| Section title | 28pt bold | Microsoft YaHei |
| Card title | 16pt bold | Microsoft YaHei |
| Body | 11–12pt | Microsoft YaHei |
| Big stat (Latin/digits) | 54pt bold | Arial |
| Kicker (Latin uppercase) | 11pt bold + charSpacing 4 | Arial |

`charSpacing` only on Latin kickers — never on CJK (it looks broken on Chinese).

### Repeated marks — call on every content slide

- **Top hairline** (1.4% slide-height accent bar) + thin bottom neutral hairline
- **Section title** = kicker + 28pt title + dual-segment underline (long accent + short deep)
- **Footer** = deck label (bottom-left) + `NN` page number (bottom-right)
- **Page badge** on content slides (exempt on cover/closing)

### Forbidden in this recipe

- Shadows (any `shadow` option) — hairlines are the only separator
- Rounded rectangles for cards — use `hairlineCard()` (rectangle + 1pt line)
- Gradients, 3D, bevels
- A second saturated color anywhere
- Full-bleed background images without a light card behind the text

## What you MAY change

- Text content (obviously)
- Number of cards / rows / stats within a layout (keep 2–4)
- Swapping the accent to a different single hue (then re-run `color-qa-presets`)
- Adding a `phoneMockup` or `showcase` image to the showcase layout

## How to QA this recipe

```bash
# Run from the ppt-skills clone root (npm aliases qa:render / color:qa / qa:editable are equivalent).
# 1. Static checks (always)
node skills/themed-cn-pptx/scripts/render-qa.mjs examples/slides/output/editorial-demo.pptx --fix-hints \
  --contract skills/themed-cn-pptx/references/layout-slots.md

# 2. Contrast gate (palette must hold)
node skills/themed-cn-pptx/scripts/color-qa.mjs --palette 2E3440,3B4252,4C566A,ECEFF4,E5E9F0,88C0D0,5E81AC --role body

# 3. Editable contract
python3 skills/themed-cn-pptx/scripts/pptx-editable-check.py examples/slides/output/editorial-demo.pptx
```

All three must report zero P0. If you changed the palette, `color-qa` must pass
before the deck is considered done.

## Extending into a new recipe

Copy this file and the `.mjs`, rename, change the `theme` export and the locked
list. The discipline (locked palette ladder, typography table, repeated marks,
forbidden list, QA commands) is what makes it a recipe rather than a template.
