# Layout Slot Contracts

This reference turns the `Slide 类型菜单` in `skill.md §5` from prose into a
**machine-checkable contract**. Each layout declares which slots it requires
and which image usages it allows. `scripts/render-qa.mjs --contract <this-file>`
reads the fenced `contract` blocks and verifies a generated `.pptx` against
them — the PPTX analogue of guizang's `validate-swiss-deck.mjs` checking
`data-layout` on HTML.

> Why this exists: a deck that "looks themed" can still drift (a content slide
> missing its page badge, a cover that forgot its stripe, a card layout that
> grabbed a `cover` image). Locking the slot contract makes that drift a P2
> finding instead of a silent regression.

## How render-qa reads this file

Each layout has one fenced block tagged `contract`:

```contract
{ "layout": "Cover", "requiredSlots": ["stripe", "title"], "forbiddenUsages": ["card"] }
```

- `layout` — the layout family name (matches skill.md §5).
- `requiredSlots` — slots that MUST be present on every slide using this layout.
  Recognized slots today: `stripe` (thin full-width shape near top or bottom),
  `title` (any text run ≥ 24pt), `footer` (small text in the bottom band),
  `pageBadge` (handled separately by render-qa), `image` (at least one picture).
- `forbiddenUsages` — image usages that do not belong on this layout (mapped
  from `lib/ai-image.js` `SIZE_MAP`). render-qa cannot read the original
  `usage` back from a `.pptx`, so this is enforced upstream by the recipe; the
  contract is the source of truth that humans/agents check against.
- `notes` — free text, ignored by the tool.

You do not have to use `--contract`. render-qa's built-in checks (overflow,
overlap, bounds, aspect, badge) run with or without it.

---

## Basic layouts (no image)

### Cover (deep background)

First slide of the deck. Establishes the brand identity.

```contract
{ "layout": "Cover", "requiredSlots": ["stripe", "title"], "forbiddenUsages": ["card", "icon"], "notes": "no page badge; optional kicker capsule + accent bar + author line" }
```

Slots: full-width stripe · optional decorative ellipse · kicker capsule ·
multi-line stacked title (≥ 36pt) · accent bar · author line.

### Section Divider

```contract
{ "layout": "SectionDivider", "requiredSlots": ["stripe", "title", "footer", "pageBadge"], "forbiddenUsages": [] }
```

Slots: section-title block (kicker square + title + dual-segment underline) ·
footer · page badge.

### Two-card + verdict

```contract
{ "layout": "TwoCard", "requiredSlots": ["stripe", "title", "footer", "pageBadge"], "forbiddenUsages": ["cover"] }
```

### Striped table (3–5 rows)

```contract
{ "layout": "StripedTable", "requiredSlots": ["stripe", "title", "footer", "pageBadge"], "forbiddenUsages": [] }
```

### Matrix (mapping / isomorphism)

```contract
{ "layout": "Matrix", "requiredSlots": ["stripe", "title", "footer", "pageBadge"], "forbiddenUsages": [] }
```

### Problem stack (Q1/Q2/Q3)

```contract
{ "layout": "ProblemStack", "requiredSlots": ["stripe", "title", "footer", "pageBadge"], "forbiddenUsages": [] }
```

### Closing + QR (deep background)

Last slide. Exempt from the page badge rule.

```contract
{ "layout": "ClosingQR", "requiredSlots": ["stripe", "title", "image"], "forbiddenUsages": ["hero", "bannerWide"], "notes": "the QR image is the required 'image' slot; frame it in a white card" }
```

---

## Image layouts (AI image enhanced)

Image usages come from `lib/ai-image.js` `SIZE_MAP`. Each layout below pins
which usage its picture slot expects, so the generated image ratio matches the
PPTX box and the picture is not distorted or cropped wrong.

### Cover + background image (1a)

```contract
{ "layout": "CoverBackground", "requiredSlots": ["stripe", "title", "image"], "forbiddenUsages": ["card", "icon", "sideStrip"], "notes": "image usage must be 'cover' (1360x768 / 16:9); add 40-55% overlay for title readability" }
```

### Two-card + image (3a / 3b)

```contract
{ "layout": "TwoCardImage", "requiredSlots": ["stripe", "title", "footer", "pageBadge", "image"], "forbiddenUsages": ["cover", "hero", "bannerWide"], "notes": "image usage 'card' (1:1) for 3a or 'cardTall' (3:4) for 3b" }
```

### Project showcase + image (6a)

```contract
{ "layout": "ShowcaseImage", "requiredSlots": ["stripe", "title", "footer", "pageBadge", "image"], "forbiddenUsages": ["cover", "sideStrip"], "notes": "image usage 'cardWide' or 'showcase' (4:3)" }
```

### Project showcase + phone mockup (6b)

```contract
{ "layout": "PhoneMockup", "requiredSlots": ["stripe", "title", "footer", "pageBadge", "image"], "forbiddenUsages": ["cover", "hero"], "notes": "image usage 'phoneMockup' (9:16)" }
```

### Two-column mapping + side strip (7a)

```contract
{ "layout": "MappingSideStrip", "requiredSlots": ["stripe", "title", "footer", "pageBadge", "image"], "forbiddenUsages": ["cover", "card"], "notes": "image usage 'sideStrip' (9:16) on the right" }
```

---

## Slot detection rules (what render-qa looks for)

| Slot | Detection heuristic |
| --- | --- |
| `stripe` | a non-text shape with width ≥ 8" and height < 0.15", near top or bottom |
| `title` | any text run with `fontSize ≥ 24pt` |
| `footer` | a text box with `fontSize ≤ 10pt` in the bottom 0.5" band |
| `pageBadge` | a small text box matching `^\d{1,3}(/\d{1,3})?$` near x>8.6, y>4.4 |
| `image` | at least one `<p:pic>` element |

These are intentionally heuristic. A deliberately minimal deck can violate a
contract on purpose; in that case, either edit the contract or accept the P2
finding. The point is to make drift **visible**, not to forbid judgment calls.
