# PPT Skills

**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="docs/img/hero-demos.png" alt="ppt-skills demo decks — miku, editorial-grid, dark-launch" width="820" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square" alt="License" /></a>
  <a href="https://github.com/CacinieP/ppt-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CacinieP/ppt-skills/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <img src="https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square" alt="Skills" />
  <img src="https://img.shields.io/badge/output-editable%20.pptx-0A7CFF?style=flat-square" alt="PPTX" />
  <img src="https://img.shields.io/badge/node-%E2%89%A5%2020-339933?style=flat-square" alt="Node" />
</p>

Open-source skills for generating and **accepting** real, **editable, CJK-aware PPTX decks** built with PptxGenJS — verified by a deterministic QA gate, not just eyeballed.

The first released skill, [`themed-cn-pptx`](skills/themed-cn-pptx/), ships two **locked aesthetic recipes** (editorial-grid, dark-launch), a provider-aware AI image layer (StepFun / MiniMax), and three QA tools (render QA, CJK overflow, editable-text check).

---

## 🎬 Demo Gallery

Three locked demo decks, all generated from this repo with **zero API keys** (solid-color / hairline fallbacks). Rendered here with LibreOffice at 150 DPI.

| Deck | Slides | Recipe | Vibe |
| --- | --- | --- | --- |
| **Miku** | 3 | `miku` (skill showcase) | Teal + pink, dark/light alternation |
| **Editorial Grid** | 6 | `recipe-editorial-grid.mjs` | Nord neutrals, hairline report look |
| **Dark Launch** | 5 | `recipe-dark-launch.mjs` | Deep navy, oversized type, framed QR close |

### Miku — skill showcase

<p align="center">
  <a href="docs/img/demos/miku/miku-slide-1.jpg"><img src="docs/img/demos/miku/miku-slide-1.jpg" width="280" alt="miku cover" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-2.jpg"><img src="docs/img/demos/miku/miku-slide-2.jpg" width="280" alt="miku content" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-3.jpg"><img src="docs/img/demos/miku/miku-slide-3.jpg" width="280" alt="miku summary" /></a>
</p>

### Editorial Grid — Nord report look

<p align="center">
  <a href="docs/img/demos/editorial/editorial-slide-1.jpg"><img src="docs/img/demos/editorial/editorial-slide-1.jpg" width="195" alt="editorial s1" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-2.jpg"><img src="docs/img/demos/editorial/editorial-slide-2.jpg" width="195" alt="editorial s2" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-3.jpg"><img src="docs/img/demos/editorial/editorial-slide-3.jpg" width="195" alt="editorial s3" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-4.jpg"><img src="docs/img/demos/editorial/editorial-slide-4.jpg" width="195" alt="editorial s4" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-5.jpg"><img src="docs/img/demos/editorial/editorial-slide-5.jpg" width="195" alt="editorial s5" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-6.jpg"><img src="docs/img/demos/editorial/editorial-slide-6.jpg" width="195" alt="editorial s6" /></a>
</p>

### Dark Launch — keynote close

<p align="center">
  <a href="docs/img/demos/darklaunch/darklaunch-slide-1.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-1.jpg" width="232" alt="darklaunch s1" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-2.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-2.jpg" width="232" alt="darklaunch s2" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-3.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-3.jpg" width="232" alt="darklaunch s3" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-4.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-4.jpg" width="232" alt="darklaunch s4" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-5.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-5.jpg" width="232" alt="darklaunch s5" /></a>
</p>

> The `.pptx` files themselves are committed at `examples/slides/output/` — open them in PowerPoint and edit directly.

---

## ✨ Highlights

- **Editable PPTX** — real `.pptx`, not flattened slide images; verified by `pptx-editable-check.py`.
- **CJK-first layout** — font fallback, full-width punctuation, conservative sizes; overflow predicted *before* render.
- **Render QA gate** — `render-qa.mjs` catches overflow, overlap, off-canvas, bad image ratios, missing page badges.
- **Locked recipes** — two locked aesthetic recipes (editorial-grid, dark-launch) so you stop re-deciding every detail.
- **Provider-aware AI images** — StepFun (recommended) / MiniMax, CN + global regions, PPT-friendly size presets.
- **WCAG color QA** — sRGB luminance contrast, not eyeballing; CI gate fails on P0.
- **Graceful degradation** — no API key? builds continue with solid-color placeholders, never crash.

---

## 🚀 Quick Start

```bash
git clone https://github.com/CacinieP/ppt-skills.git
cd ppt-skills
npm ci          # install locked deps
npm test        # skill manifest + smoke + preset palette contrast QA
npm run demos   # build all three demo PPTX (no API key needed)
```

Then hand a prompt to an Agent with shell access:

```text
Make this README into an editable Chinese PPTX, ~8 slides, editorial-grid recipe.
```

**Or install the skill directly:**

```bash
npx skills add https://github.com/CacinieP/ppt-skills --skill themed-cn-pptx
```

---

## 📋 Commands

### Generation

| Command | Purpose |
| --- | --- |
| `npm run demo` | 3-slide **Miku** demo (no API key) |
| `npm run demo:editorial` | 6-slide **editorial-grid** recipe demo |
| `npm run demo:darklaunch` | 5-slide **dark-launch** recipe demo |
| `npm run demos` | Build all three |

### QA gates

| Command | Purpose |
| --- | --- |
| `npm test` | Skill manifest **+** smoke (imports/provider/size) **+** preset palette contrast QA |
| `npm run qa:render -- deck.pptx` | **PPTX render + heuristic QA** — overflow, overlap, bounds, image aspect, page badge. P0 exits 1 |
| `npm run qa:render -- deck.pptx --render --out ./qa` | Above **+** drive `soffice → pdf → jpg` when LibreOffice + poppler installed |
| `npm run qa:cjk -- --text "标题" --font-size 44 --box-width 9` | **Render-free CJK overflow estimator**, use before generating |
| `npm run qa:editable -- deck.pptx` | **Editable / CJK-font / macro / theme check** (Python; zip-fallback) |
| `npm run color:qa -- --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body` | WCAG contrast for a palette |
| `npm run color:qa:presets` | All preset palettes (CI gate, exits 1 on P0) |

---

## 🛠️ Workflows

**A. Modify an existing deck** — read the deck / `build_*.js`, scope the change (colors, pages, images, copy, QR, layout), edit + regenerate, then run render QA and fix until clean.

**B. Generate from manuscript** — extract source → decompose into slide-level messages → define theme tokens + image needs → pick reusable layouts → generate AI images, embed, run render QA.

---

## 🎨 AI Image Generation

Use [`skills/themed-cn-pptx/lib/ai-image.js`](skills/themed-cn-pptx/lib/ai-image.js). No key → returns `null`, build falls back to placeholders.

```js
import { generateSlideImage, addImageToSlide, addImageOverlay } from "./lib/ai-image.js";

const cover = await generateSlideImage({
  provider: "stepfun-cn",        // recommended; also: stepfun-global, minimax-cn, minimax-global
  prompt: "teal tech cover background, clean whitespace, room for a title",
  usage: "cover",                // -> 1360x768 on StepFun, 16:9 on MiniMax
});

if (cover) {
  addImageToSlide(slide, cover, { x: 0, y: 0, w: 10, h: 5.625 });
  addImageOverlay(slide, pres, { color: "0B1B2B", opacity: 45 }); // 40-55% over any image with text
}
```

### Provider priority

1. `provider` arg to `generateSlideImage()`
2. `PPT_IMAGE_PROVIDER` / `AI_IMAGE_PROVIDER` env
3. MiniMax only if `MINIMAX_API_KEY` set and no `STEPFUN_API_KEY`
4. Default: StepFun CN

### Environment variables

```bash
PPT_IMAGE_PROVIDER=stepfun       # stepfun | minimax    (stepfun recommended)
PPT_IMAGE_REGION=cn              # cn | global
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn                # cn -> api.stepfun.com | global -> api.stepfun.ai
STEPFUN_API_MODE=platform        # platform | step_plan
MINIMAX_API_KEY=sk-xxx
MINIMAX_REGION=global            # cn -> api.minimaxi.com | global -> api.minimax.io
```

The helper auto-loads `.env` on import; shell/CI vars take priority. Create `.env` locally — it's gitignored, never commit keys.

### Size → layout mapping

| Usage | StepFun size | MiniMax ratio | PPTX layout |
| --- | --- | --- | --- |
| `cover` / `coverOverlay` | `1360x768` | `16:9` | `10 × 5.625 in` |
| `hero` / `bannerWide` | `1360x768` (+crop) | `16:9` / `21:9` | `10 × 3 in` / `10 × 2.45 in` |
| `sideStrip` / `phoneMockup` | `768x1360` | `9:16` | `2.5 × 4.44 in` / `1.8 × 3.2 in` |
| `card` | `1024x1024` | `1:1` | `2.5 × 2.5 in` |
| `cardWide` / `showcase` | `1184x896` | `4:3` | `3.5 × 2.65 in` / `3.9 × 2.95 in` |
| `cardTall` | `896x1184` | `3:4` | `2.3 × 3.04 in` |
| `icon` | `512x512` | `1:1` | `1.5 × 1.5 in` |

Rules: use `getImageUsageConfig(usage, provider)` or `SIZE_MAP`; never hand-mix StepFun concrete sizes with MiniMax ratios. StepFun `step-image-edit-2` exposes exact PPT-friendly pixel sizes — that's why it's recommended.

### CN / Global endpoints

| Provider | Region | Default Base URL |
| --- | --- | --- |
| StepFun | CN | `https://api.stepfun.com/v1` |
| StepFun | Global | `https://api.stepfun.ai/v1` |
| StepFun Step Plan | CN | `https://api.stepfun.com/step_plan/v1` |
| StepFun Step Plan | Global | `https://api.stepfun.ai/step_plan/v1` |
| MiniMax | CN | `https://api.minimaxi.com/v1` |
| MiniMax | Global | `https://api.minimax.io/v1` |

Official docs: [StepFun CN](https://platform.stepfun.com/docs/zh/api-reference/images/image) · [StepFun Global](https://platform.stepfun.ai/docs/en/api-reference/images/image) · [StepFun Step Plan](https://platform.stepfun.com/docs/zh/step-plan/integrations/image-api) · [MiniMax CN](https://platform.minimaxi.com/docs/api-reference/image-generation-i2i)

---

## 🧪 QA Expectations

Before delivering a real deck, render and inspect:

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

Watch for: CJK overflow, cropped full-width punctuation, unreadable text on images, QR contrast, footer collisions, AI image aspect mismatches. `render-qa.mjs` automates the deterministic checks.

### Color QA rules

- Body text / URLs / footnotes: **≥ 4.5:1**
- Large titles / icons / borders / UI: **≥ 3:1**
- Never use a saturated accent as body text
- Never rely on red/green alone for status
- Text over AI images needs a 40–55% overlay

---

## 🧭 Where this sits vs. `guizang-ppt-skill`

`guizang-ppt-skill` is a mature **single-file HTML horizontal-slide deck** skill — browser-first, strong aesthetic templates. This repo is a **different route, not a competitor**.

| Dimension | `guizang-ppt-skill` | `ppt-skills` (this repo) |
| --- | --- | --- |
| **Output** | single-file HTML, browser | real editable `.pptx`, PowerPoint |
| **Best for** | offline talks, demo days, personal keynotes | decks delivered as `.pptx`, edited later, stable Chinese type |
| **Aesthetic system** | two fixed templates (magazine, Swiss) | two locked recipes + extensible theme system |
| **QA approach** | HTML layout validator (`data-layout`) | PPTX render + heuristic QA, CJK overflow, editable-text, color contrast |
| **Image** | Codex/GPT-Image into HTML | provider layer (StepFun/MiniMax) returning PPTX layout metadata |

**Two routes, complementary.** Browser talks → HTML; deliverable `.pptx` → this repo.

---

## 📦 Platform Support

| Platform | Status | Notes |
| --- | --- | --- |
| Claude Code / Codex / ZCode | ✅ supported | native skill workflow |
| Cursor / local Agents | ✅ usable | needs file read/write + shell |
| CI (GitHub Actions) | ✅ tested | Node 20/22 matrix, npm ci, smoke + color QA + demo builds + render QA |
| Plain chatbot | ⚠️ not recommended | without a filesystem + shell, stable PPTX + QA is hard |

---

## 📁 Repository Layout

```text
ppt-skills/
  README.md            README.zh-CN.md      docs/                 # rendered demo images (committed)
  package.json         design-principles.md
  .github/workflows/ci.yml
  examples/
    build_miku_demo.mjs  build_editorial_demo.mjs  build_darklaunch_demo.mjs
    color-qa.sample.json  color-qa.presets.json  cjk-overflow.sample.json  render-qa.sample.json
    slides/output/        # the committed .pptx demos — open & edit in PowerPoint
      miku-demo.pptx  editorial-demo.pptx  darklaunch-demo.pptx
  scripts/
    smoke-test.mjs  color-qa.mjs  color-qa-presets.mjs
    render-qa.mjs   cjk-overflow-check.mjs   pptx-editable-check.py
  skills/themed-cn-pptx/
    SKILL.md
    references/   aesthetic-rules.md  image-constraints.md  layout-slots.md
    recipes/      recipe-editorial-grid.mjs  recipe-dark-launch.mjs  design-contract*.md
    lib/          ai-image.js  stepfun-image.js  cjk-text.js  pptx-shapes.js  zip-reader.js
```

---

## 🤝 Suitable / not suitable

**✅ Suitable** — needs a `.pptx` deliverable / later editing in PowerPoint / stable Chinese typography / QR closing slide / verifiable CI-gated build.

**❌ Not suitable** — only need a browser presentation (use an HTML deck skill) / large animated data dashboards / decks that must never touch PowerPoint.

## 🖋️ IP & Character Theme Note

For character/IP-themed decks, prefer color systems, abstract visual motifs, and user-provided licensed assets. Do not imply official endorsement; do not generate trademarked character art unless the user has rights or explicitly asks for a legally-safe, inspired-by direction.

## 🤝 Contribute

Got a PPT skill recipe? Submit a PR under:

```text
skills/<skill-name>/SKILL.md
skills/<skill-name>/lib/          # optional utility code
skills/<skill-name>/examples/     # optional build scripts
```

## License

[MIT](LICENSE)
