# Aesthetic Rules for CJK PPTX Decks

Use this reference when deciding visual direction before writing a PptxGenJS build script. Keep the deck inside one visual system instead of mixing attractive fragments.

## Visual System Contract

Every deck should declare these fields before implementation:

```json
{
  "style_id": "cjk-swiss-accent",
  "palette_contract": "neutral-body + one dominant + one accent",
  "layout_family": "grid, editorial, product-showcase, dark-launch",
  "image_style": "abstract tech, no embedded text, title-safe negative space",
  "density_level": "low | medium | high",
  "forbidden_styles": ["3d mascots", "purple-blue gradient SaaS default", "busy stock photo"]
}
```

## Recommended Style Families

| Style | Use For | Rules |
| --- | --- | --- |
| `cjk-swiss-accent` | technical/product decks, research summaries | grid-first, restrained typography, one strong accent, no decoration that does not align to grid |
| `cjk-editorial-ip` | character/IP-inspired decks | color and motifs carry the IP; do not generate official character art by default |
| `dark-tech-launch` | launch, keynote, final CTA | deep background, strong contrast, large type, image overlay required |
| `soft-product-brief` | product/business introduction | neutral surfaces, quiet cards, simple diagrams, low saturation |
| `matrix-analysis` | comparisons and frameworks | table/matrix layouts, high label clarity, avoid excessive illustration |

## Aesthetic Negative List

Treat these as design failures unless the user explicitly requests them and QA still passes:

1. One deck uses a different visual language on every slide.
2. More than five layout types in an 8-10 slide deck.
3. Cards inside cards, nested framed sections, or decorative panels that do not carry information.
4. Purple/blue SaaS gradient as the default answer for every topic.
5. Beige/brown/espresso, dark slate, or single-hue palettes with no neutral contrast ladder.
6. 3D mascots, cartoon stickers, or stock-photo smiles in serious operational decks.
7. Full-bleed AI background competes with title text.
8. AI images contain fake UI chrome, fake logos, fake QR codes, watermarks, page numbers, or long text.
9. IP/character theme implies official endorsement or uses unlicensed official character art by default.
10. Chinese titles are oversized and collide with subtitles or all-width punctuation.
11. Accent color is used as body text.
12. Chart/table colors require color alone to decode meaning.

## Layout Discipline

- Pick one layout family first, then vary only within that family.
- Use repeated elements: top stripe, section heading, footer, or corner mark. Do not invent a new signature on every slide.
- Keep title-safe areas consistent: cover/hero images should not place focal subjects or high-contrast detail under title text.
- Dense business slides should feel like tools: restrained spacing, clear hierarchy, aligned grids, readable labels.
- Expressive decks can be more visual, but text must remain editable PPTX text.

## QA Severity

| Severity | Aesthetic Issue |
| --- | --- |
| P0 | unreadable text, image/text collision, QR not scannable, layout breaks, API key leak |
| P1 | visual system inconsistency, wrong image ratio, unsafe color pair, missing image overlay |
| P2 | inconsistent spacing, repeated element drift, weak hierarchy, slightly busy background |
| P3 | polish: shadows, small alignment differences, icon style mismatch |
