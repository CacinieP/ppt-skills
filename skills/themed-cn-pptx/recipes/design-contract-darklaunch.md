# Design Contract: Dark Launch (`recipe-dark-launch.mjs`)

A **locked recipe** instantiating the `dark-tech-launch` style from
`references/aesthetic-rules.md`. Deep background, oversized type, high
contrast, image heroes behind overlays, and a framed QR closing slide.

Use this recipe for: product launches, demo days, keynote moments, final CTAs,
any deck projected in a dim room.

## What is locked

### Palette — deep navy + bright accent + near-white on dark

| Slot | Hex | Role |
| --- | --- | --- |
| `accent` | `39C5BB` | bright teal — the single saturated hero color |
| `accentSoft` | `9FE8E2` | soft variant for secondary use |
| `deepBg` | `0B1B2B` | deep navy — cover, statement, closing |
| `deepBgAlt` | `06121E` | even deeper, for quote slides |
| `midBg` | `13243A` | content slides on dark |
| `white` | `FFFFFF` | titles on dark |
| `textOnDark` | `E8FFFD` | body text on dark (WCAG AA vs deepBg) |
| `mutedOnDark` | `8FA6B4` | footer, captions |
| `pink` | `FF77AA` | small (~10%) secondary, callouts/kicker only |

Contrast is pre-verified: white on `#0B1B2B` ≈ 15:1, `textOnDark` on deepBg ≈ 13:1.
The pink is **never** used for body text — only kickers and the dual-stripe tail.

### Typography ladder

| Use | Size | Face |
| --- | --- | --- |
| Cover title | 44pt bold | Microsoft YaHei |
| Statement / quote | 30pt bold | Microsoft YaHei |
| Section title | 28pt bold | Microsoft YaHei |
| Card title | 18pt bold | Microsoft YaHei |
| Body on dark | 11–12pt | Microsoft YaHei |
| Hero stat (Latin/digits) | 120pt bold | Arial |

### Repeated marks

- **Top stripe** = bright accent hairline (0.06") + thin pink tail (0.02") — on every slide
- **Section title** = accent kicker + 28pt white title
- **Footer** = deck label + `NN` page number in muted-on-dark

### Image discipline (the dark-launch signature)

- A background image **always** sits behind a 40–55% dark overlay
  (`overlay(pres, slide, { opacity: 45 })`). Text on a bare AI image is a P1.
- Use image `usage: "cover"` (16:9) for full-bleed heroes — never `card` or
  `sideStrip` on a cover.
- Showcase/mockup images sit in a dark card with an accent hairline, not floating.

### Closing slide (ClosingQR contract)

- Deep background + top stripe + big CTA title
- **White QR card** framed by an accent border, with an accent top strip reading
  `SCAN · 扫码访问`, and the URL in mono below the code. A bare QR on dark is a P1.

## Forbidden in this recipe

- Light backgrounds (this is the *dark* recipe)
- Pink as body text or large fills (≤10% area only)
- Background images without an overlay
- A second bright accent (teal is the hero; pink is the 10% tail)
- Rounded QR card (sharp corners only in this recipe)

## What you MAY change

- Text content
- Swapping teal for a different single bright accent (re-run color QA)
- Number of pillars/stats (2–4)
- Replacing the solid hero fallback with a real `generateSlideImage({ usage: "cover" })`

## How to QA this recipe

```bash
# Run from the ppt-skills clone root (npm aliases qa:render / color:qa / qa:editable are equivalent).
node skills/themed-cn-pptx/scripts/render-qa.mjs examples/slides/output/darklaunch-demo.pptx --fix-hints \
  --contract skills/themed-cn-pptx/references/layout-slots.md
node skills/themed-cn-pptx/scripts/color-qa.mjs --palette 0B1B2B,06121E,13243A,FFFFFF,E8FFFD,8FA6B4,39C5BB,FF77AA --role body
python3 skills/themed-cn-pptx/scripts/pptx-editable-check.py examples/slides/output/darklaunch-demo.pptx
```

The render-qa `MISSING_PAGE_BADGE` check correctly exempts the closing/QR slide
(see `layout-slots.md` ClosingQR contract).
