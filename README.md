# PPT Skills

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

Open-source collection of PPT generation skills — themed, CJK-aware, editable PPTX via PptxGenJS.

Each skill is a self-contained recipe for building presentation decks with consistent design, correct CJK rendering, and brand-level visual polish.

## What Makes These Skills Different

- **Editable output**: decks are generated as `.pptx`, not flat images
- **CJK-aware layout**: Chinese text, font fallback, and line breaking are first-class constraints
- **Theme recipes**: each skill defines palette, typography, layout, and QA steps
- **Production checklists**: skills include render verification instead of only code snippets

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
