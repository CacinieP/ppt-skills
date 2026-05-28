# PPT Skills

Open-source collection of PPT generation skills — themed, CJK-aware, editable PPTX via PptxGenJS.

Each skill is a self-contained recipe for building presentation decks with consistent design, correct CJK rendering, and brand-level visual polish.

## Skills

| Skill | Description | Status |
|-------|-------------|--------|
| [themed-cn-pptx](skills/themed-cn-pptx/) | Build Chinese + IP/character-themed + QR-embeddable editable PPTX decks | Released |

## How to Use

1. Pick a skill from the `skills/` directory
2. Read the skill document — it walks you through task decomposition, palette, layout, and QA
3. Write your `build_<theme>.js` script following the skill's patterns
4. Run with Node.js + PptxGenJS to generate `.pptx`

## Contribute

Got a PPT skill recipe? PR it in:

```
skills/<skill-name>/skill.md
skills/<skill-name>/examples/     # optional: example build scripts
```

## License

MIT