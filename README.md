# PPT Skills

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

<p align="center">
  <b>EN</b> · Open-source skills for generating and <b>accepting</b> real, <b>editable, CJK-aware PPTX decks</b> built with PptxGenJS — verified by a deterministic QA gate, not just eyeballed.<br/>
  <b>中文</b> · 用 PptxGenJS 生成并<b>验收</b>真实、<b>可编辑、适配中文排版的 PPTX</b> 的开源技能合集 —— 由确定性 QA 门禁把关，而非肉眼。
</p>

---

## 🎬 Demo Gallery · 演示画廊

Three locked demo decks, all generated from this repo with **zero API keys** (solid-color / hairline fallbacks). Rendered here with LibreOffice at 150 DPI.

三套锁定 demo，全部本仓库生成，**无需任何 API key**（纯色/发丝线占位回退）。下图用 LibreOffice 150 DPI 渲染。

| Deck · 演示 | Slides · 页数 | Recipe · 配方 | Vibe · 风格 |
| --- | --- | --- | --- |
| **Miku** | 3 | `miku` (skill showcase) | Teal + pink, dark/light alternation · 青粉撞色，明暗交替 |
| **Editorial Grid** | 6 | `recipe-editorial-grid.mjs` | Nord neutrals, hairline report look · Nord 中性色，发丝线报告风 |
| **Dark Launch** | 5 | `recipe-dark-launch.mjs` | Deep navy, oversized type, framed QR close · 深底大字，白框二维码收尾 |

### Miku — skill showcase · 技能展示

<p align="center">
  <a href="docs/img/demos/miku/miku-slide-1.jpg"><img src="docs/img/demos/miku/miku-slide-1.jpg" width="280" alt="miku cover" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-2.jpg"><img src="docs/img/demos/miku/miku-slide-2.jpg" width="280" alt="miku content" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-3.jpg"><img src="docs/img/demos/miku/miku-slide-3.jpg" width="280" alt="miku summary" /></a>
</p>

### Editorial Grid — Nord report look · 编辑报告风

<p align="center">
  <a href="docs/img/demos/editorial/editorial-slide-1.jpg"><img src="docs/img/demos/editorial/editorial-slide-1.jpg" width="195" alt="editorial s1" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-2.jpg"><img src="docs/img/demos/editorial/editorial-slide-2.jpg" width="195" alt="editorial s2" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-3.jpg"><img src="docs/img/demos/editorial/editorial-slide-3.jpg" width="195" alt="editorial s3" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-4.jpg"><img src="docs/img/demos/editorial/editorial-slide-4.jpg" width="195" alt="editorial s4" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-5.jpg"><img src="docs/img/demos/editorial/editorial-slide-5.jpg" width="195" alt="editorial s5" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-6.jpg"><img src="docs/img/demos/editorial/editorial-slide-6.jpg" width="195" alt="editorial s6" /></a>
</p>

### Dark Launch — keynote close · 发布收尾风

<p align="center">
  <a href="docs/img/demos/darklaunch/darklaunch-slide-1.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-1.jpg" width="232" alt="darklaunch s1" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-2.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-2.jpg" width="232" alt="darklaunch s2" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-3.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-3.jpg" width="232" alt="darklaunch s3" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-4.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-4.jpg" width="232" alt="darklaunch s4" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-5.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-5.jpg" width="232" alt="darklaunch s5" /></a>
</p>

> The `.pptx` files themselves are committed at `examples/slides/output/` — open them in PowerPoint and edit directly.
>
> `.pptx` 源文件已提交在 `examples/slides/output/`，可直接用 PowerPoint 打开编辑。

---

## ✨ Highlights · 核心亮点

| EN | 中文 |
| --- | --- |
| **Editable PPTX** — real `.pptx`, not flattened slide images; verified by `pptx-editable-check.py` | **可编辑 PPTX** —— 输出真实 `.pptx`，非整页图片；由 `pptx-editable-check.py` 验证 |
| **CJK-first layout** — font fallback, full-width punctuation, conservative sizes; overflow predicted *before* render | **中文排版优先** —— 字体回退、全角符号、保守字号；溢出在渲染前预测 |
| **Render QA gate** — `render-qa.mjs` catches overflow, overlap, off-canvas, bad image ratios, missing page badges | **渲染 QA 门禁** —— `render-qa.mjs` 捕捉溢出、遮挡、越界、比例错误、缺页码 badge |
| **Locked recipes** — two locked aesthetic recipes (editorial-grid, dark-launch) so you stop re-deciding every detail | **锁定配方** —— 两套锁定 recipe（editorial-grid、dark-launch），不用每次重新决定 |
| **Provider-aware AI images** — StepFun (recommended) / MiniMax, CN + global regions, PPT-friendly size presets | **供应商感知 AI 配图** —— StepFun（推荐）/ MiniMax，国内/国际版，PPT 友好尺寸预设 |
| **WCAG color QA** — sRGB luminance contrast, not eyeballing; CI gate fails on P0 | **WCAG 色彩 QA** —— sRGB 亮度对比，非肉眼；CI 门禁遇 P0 即失败 |
| **Graceful degradation** — no API key? builds continue with solid-color placeholders, never crash | **优雅降级** —— 没有 API key？纯色占位继续生成，绝不崩溃 |

---

## 🚀 Quick Start · 快速开始

```bash
git clone https://github.com/CacinieP/ppt-skills.git
cd ppt-skills
npm ci          # install locked deps
npm test        # smoke + preset palette contrast QA
npm run demos   # build all three demo PPTX (no API key needed)
```

Then hand a prompt to an Agent with shell access · 然后把下面这段发给有 shell 的 Agent:

```text
帮我把这份 README 做成可编辑中文 PPTX，约 8 页，editorial-grid 配方。
/ Make this README into an editable Chinese PPTX, ~8 slides, editorial-grid recipe.
```

**Or install the skill directly · 或直接安装技能:**

```bash
npx skills add https://github.com/CacinieP/ppt-skills --skill themed-cn-pptx
```

---

## 📋 Commands · 命令

### Generation · 生成

| Command | Purpose · 作用 |
| --- | --- |
| `npm run demo` | 3-slide **Miku** demo (no API key) · 3 页 Miku demo（无需 key） |
| `npm run demo:editorial` | 6-slide **editorial-grid** recipe demo · 6 页编辑报告风 |
| `npm run demo:darklaunch` | 5-slide **dark-launch** recipe demo · 5 页发布收尾风 |
| `npm run demos` | Build all three · 一次构建全部三套 |

### QA gates · QA 门禁

| Command | Purpose · 作用 |
| --- | --- |
| `npm test` | Smoke (imports/provider/size) **+ preset palette contrast QA** · 导入/供应商/尺寸 **+ 预置色板对比度** |
| `npm run qa:render -- deck.pptx` | **PPTX render + heuristic QA** — overflow, overlap, bounds, image aspect, page badge. P0 exits 1 · 渲染 + 启发式 QA |
| `npm run qa:render -- deck.pptx --render --out ./qa` | Above **+** drive `soffice → pdf → jpg` when LibreOffice + poppler installed · 额外驱动渲染 |
| `npm run qa:cjk -- --text "标题" --font-size 44 --box-width 9` | **Render-free CJK overflow estimator**, use before generating · 免渲染 CJK 溢出估算 |
| `npm run qa:editable -- deck.pptx` | **Editable / CJK-font / macro / theme check** (Python; zip-fallback) · 可编辑性/CJK 字体/宏/主题检查 |
| `npm run color:qa -- --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body` | WCAG contrast for a palette · 调色板 WCAG 对比 |
| `npm run color:qa:presets` | All preset palettes (CI gate, exits 1 on P0) · 全部预置色板（CI 门禁） |

---

## 🛠️ Workflows · 工作流

**A. Modify an existing deck · 改已有 PPT** — read the deck / `build_*.js`, scope the change (colors, pages, images, copy, QR, layout), edit + regenerate, then run render QA and fix until clean.

**B. Generate from manuscript · 从文稿生成** — extract source → decompose into slide-level messages → define theme tokens + image needs → pick reusable layouts → generate AI images, embed, run render QA.

---

## 🎨 AI Image Generation · AI 配图

Use [`skills/themed-cn-pptx/lib/ai-image.js`](skills/themed-cn-pptx/lib/ai-image.js). No key → returns `null`, build falls back to placeholders.

```js
import { generateSlideImage, addImageToSlide, addImageOverlay } from "./lib/ai-image.js";

const cover = await generateSlideImage({
  provider: "stepfun-cn",        // recommended; also: stepfun-global, minimax-cn, minimax-global
  prompt: "青绿色科技封面背景，干净留白，留出标题区域",
  usage: "cover",                // -> 1360x768 on StepFun, 16:9 on MiniMax
});

if (cover) {
  addImageToSlide(slide, cover, { x: 0, y: 0, w: 10, h: 5.625 });
  addImageOverlay(slide, pres, { color: "0B1B2B", opacity: 45 }); // 40-55% over any image with text
}
```

### Provider priority · 供应商优先级

1. `provider` arg to `generateSlideImage()` · 函数参数
2. `PPT_IMAGE_PROVIDER` / `AI_IMAGE_PROVIDER` env · 环境变量
3. MiniMax only if `MINIMAX_API_KEY` set and no `STEPFUN_API_KEY` · 仅当 MiniMax key 存在且无 StepFun key
4. Default: StepFun CN · 默认 StepFun 国内版

### Environment variables · 环境变量

```bash
PPT_IMAGE_PROVIDER=stepfun       # stepfun | minimax    推荐 stepfun
PPT_IMAGE_REGION=cn              # cn | global
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn                # cn -> api.stepfun.com | global -> api.stepfun.ai
STEPFUN_API_MODE=platform        # platform | step_plan
MINIMAX_API_KEY=sk-xxx
MINIMAX_REGION=global            # cn -> api.minimaxi.com | global -> api.minimax.io
```

The helper auto-loads `.env` on import; shell/CI vars take priority. Create `.env` locally — it's gitignored, never commit keys.

助手在导入时自动读取 `.env`；shell/CI 变量优先级更高。`.env` 只放本地（已 gitignore），切勿提交。

### Size → layout mapping · 尺寸映射

| Usage · 用途 | StepFun size | MiniMax ratio | PPTX layout · PPTX 布局 |
| --- | --- | --- | --- |
| `cover` / `coverOverlay` | `1360x768` | `16:9` | `10 × 5.625 in` |
| `hero` / `bannerWide` | `1360x768` (+crop) | `16:9` / `21:9` | `10 × 3 in` / `10 × 2.45 in` |
| `sideStrip` / `phoneMockup` | `768x1360` | `9:16` | `2.5 × 4.44 in` / `1.8 × 3.2 in` |
| `card` | `1024x1024` | `1:1` | `2.5 × 2.5 in` |
| `cardWide` / `showcase` | `1184x896` | `4:3` | `3.5 × 2.65 in` / `3.9 × 2.95 in` |
| `cardTall` | `896x1184` | `3:4` | `2.3 × 3.04 in` |
| `icon` | `512x512` | `1:1` | `1.5 × 1.5 in` |

Rules · 规则: use `getImageUsageConfig(usage, provider)` or `SIZE_MAP`; never hand-mix StepFun concrete sizes with MiniMax ratios. StepFun `step-image-edit-2` exposes exact PPT-friendly pixel sizes — that's why it's recommended.

### CN / Global endpoints · 国内/国际版端点

| Provider | Region | Default Base URL |
| --- | --- | --- |
| StepFun | CN | `https://api.stepfun.com/v1` |
| StepFun | Global | `https://api.stepfun.ai/v1` |
| StepFun Step Plan | CN | `https://api.stepfun.com/step_plan/v1` |
| StepFun Step Plan | Global | `https://api.stepfun.ai/step_plan/v1` |
| MiniMax | CN | `https://api.minimaxi.com/v1` |
| MiniMax | Global | `https://api.minimax.io/v1` |

Official docs · 官方文档: [StepFun CN](https://platform.stepfun.com/docs/zh/api-reference/images/image) · [StepFun Global](https://platform.stepfun.ai/docs/en/api-reference/images/image) · [StepFun Step Plan](https://platform.stepfun.com/docs/zh/step-plan/integrations/image-api) · [MiniMax CN](https://platform.minimaxi.com/docs/api-reference/image-generation-i2i)

---

## 🧪 QA Expectations · QA 预期

Before delivering a real deck, render and inspect · 真实交付前先渲染检查:

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

Watch for · 重点检查: CJK overflow, cropped full-width punctuation, unreadable text on images, QR contrast, footer collisions, AI image aspect mismatches. `render-qa.mjs` automates the deterministic checks.

### Color QA rules · 色彩 QA 规则

- Body text / URLs / footnotes: **≥ 4.5:1** · 正文/URL/脚注
- Large titles / icons / borders / UI: **≥ 3:1** · 大标题/图标/边框/UI
- Never use a saturated accent as body text · 不用高饱和副色当正文
- Never rely on red/green alone for status · 不只靠红/绿表达状态
- Text over AI images needs a 40–55% overlay · AI 图上文字需 40–55% 遮罩

---

## 🧭 Where this sits vs. `guizang-ppt-skill` · 与 guizang-ppt-skill 的关系

`guizang-ppt-skill` is a mature **single-file HTML horizontal-slide deck** skill — browser-first, strong aesthetic templates. This repo is a **different route, not a competitor**.

| Dimension · 维度 | `guizang-ppt-skill` | `ppt-skills` (this repo · 本仓库) |
| --- | --- | --- |
| **Output · 输出物** | single-file HTML, browser | real editable `.pptx`, PowerPoint |
| **Best for · 适合** | offline talks, demo days, personal keynotes | decks delivered as `.pptx`, edited later, stable Chinese type |
| **Aesthetic system · 审美系统** | two fixed templates (magazine, Swiss) | two locked recipes + extensible theme system |
| **QA approach · QA 方式** | HTML layout validator (`data-layout`) | PPTX render + heuristic QA, CJK overflow, editable-text, color contrast |
| **Image · 配图** | Codex/GPT-Image into HTML | provider layer (StepFun/MiniMax) returning PPTX layout metadata |

**Two routes, complementary · 两条路线，互补.** Browser talks → HTML; deliverable `.pptx` → this repo.

---

## 📦 Platform Support · 平台支持

| Platform · 平台 | Status | Notes · 说明 |
| --- | --- | --- |
| Claude Code / Codex / ZCode | ✅ supported | native skill workflow |
| Cursor / local Agents | ✅ usable | needs file read/write + shell |
| CI (GitHub Actions) | ✅ tested | Node 20/22 matrix, npm ci, smoke + color QA + demo builds + render QA |
| Plain chatbot | ⚠️ not recommended | without a filesystem + shell, stable PPTX + QA is hard |

---

## 📁 Repository Layout · 仓库结构

```text
ppt-skills/
  README.md            docs/                 # rendered demo images (committed)
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
    skill.md
    references/   aesthetic-rules.md  image-constraints.md  layout-slots.md
    recipes/      recipe-editorial-grid.mjs  recipe-dark-launch.mjs  design-contract*.md
    lib/          ai-image.js  stepfun-image.js  cjk-text.js  pptx-shapes.js  zip-reader.js
```

---

## 🤝 Suitable / not suitable · 适合 / 不适合

**✅ Suitable · 适合** — needs a `.pptx` deliverable / later editing in PowerPoint / stable Chinese typography / QR closing slide / verifiable CI-gated build.

**❌ Not suitable · 不适合** — only need a browser presentation (use an HTML deck skill) / large animated data dashboards / decks that must never touch PowerPoint.

## 🖋️ IP & Character Theme Note · 版权与 IP 提醒

For character/IP-themed decks, prefer color systems, abstract visual motifs, and user-provided licensed assets. Do not imply official endorsement; do not generate trademarked character art unless the user has rights or explicitly asks for a legally-safe, inspired-by direction.

角色/IP 主题优先使用色彩系统、抽象符号和用户授权素材。不要默认生成官方角色图，也不要暗示官方背书。

## 🤝 Contribute · 贡献

Got a PPT skill recipe? Submit a PR under:

```text
skills/<skill-name>/skill.md
skills/<skill-name>/lib/          # optional utility code
skills/<skill-name>/examples/     # optional build scripts
```

## License · 许可

[MIT](LICENSE)
