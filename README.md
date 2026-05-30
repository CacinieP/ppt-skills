# PPT Skills

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

Open-source PPT generation and modification skills for **editable, themed, CJK-aware PPTX decks** built with PptxGenJS.

The first released skill, [`themed-cn-pptx`](skills/themed-cn-pptx/), focuses on Chinese presentation decks with character/IP-inspired visual systems, QR pages, render QA, and AI-generated imagery through **StepFun (recommended)** or **MiniMax**.

## Quick Start

Clone the repo, run the smoke test, then copy or reference the skill in your own PPT build workflow.

```bash
git clone https://github.com/CacinieP/ppt-skills.git
cd ppt-skills
npm test
```

For a new deck build script, copy the helper directory into your working folder:

```text
skills/themed-cn-pptx/lib/
```

Then import the provider-aware image helper:

```js
import { generateSlideImage } from "./lib/ai-image.js";
```

If no API key is configured, the helper returns `null` and your build can fall back to solid-color placeholders.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Smoke-test ESM imports, provider/region aliases, size mappings, and no-key fallback |
| `npm run smoke` | Same as `npm test` |
| `npm run color:qa -- --fg 0F2233 --bg F1FBFA --role body` | Check one foreground/background pair |
| `npm run color:qa -- --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body` | Check all pairs in a palette |

## Repository Layout

```text
ppt-skills/
  README.md
  package.json
  scripts/
    smoke-test.mjs
    color-qa.mjs
  skills/
    themed-cn-pptx/
      skill.md
      lib/
        ai-image.js
        stepfun-image.js
```

## Why This Exists

- **Editable PPTX output**: generate real `.pptx` files instead of flattened slide images.
- **CJK-aware layout**: handle Chinese font fallback, full-width punctuation, conservative font sizes, and render QA.
- **Theme recipes**: keep palette, typography, repeated visual marks, and layout choices consistent.
- **Two workflows**: modify an existing deck, or generate a full deck from a manuscript or outline.
- **Provider-aware AI images**: use StepFun (recommended) or MiniMax, with CN/global regions and PPT-friendly usage presets like `cover`, `card`, `showcase`, and `phoneMockup`.
- **Graceful degradation**: if no image API key is configured, builds continue and return `null` for generated images.

## Skills

| Skill | Description | Status |
| --- | --- | --- |
| [`themed-cn-pptx`](skills/themed-cn-pptx/) | Build or modify Chinese + IP/character-themed + QR-embeddable editable PPTX decks | Released |

## Workflows

### A. Modify an Existing PPT

Use this path when a user already has a `.pptx` or a `build_*.js` script and wants targeted changes.

1. Read the current deck or build script.
2. Identify the requested scope: colors, pages, images, copy, QR target, or layout fixes.
3. Edit `build_<theme>.js` and regenerate the `.pptx`.
4. Run PDF/JPG render QA and fix visible issues.

### B. Generate PPT from Manuscript

Use this path when a user provides a manuscript, outline, README, product brief, or Notion-style source.

1. Extract the source content.
2. Decompose it into slide-level messages.
3. Define the theme tokens and image needs.
4. Pick a small set of reusable slide layouts.
5. Generate AI images where useful, embed them into PPTX, then run render QA.

## AI Image Generation

Use [`skills/themed-cn-pptx/lib/ai-image.js`](skills/themed-cn-pptx/lib/ai-image.js) for new builds.

```js
import {
  generateSlideImage,
  addImageToSlide,
  addImageOverlay,
  SIZE_MAP,
} from "./lib/ai-image.js";

const cover = await generateSlideImage({
  provider: "stepfun-cn", // recommended; also supports "stepfun-global", "minimax-cn", "minimax-global"
  prompt: "中文科技发布会封面背景，青绿色主色，干净高级，留出标题区域",
  usage: "cover",
});

if (cover) {
  addImageToSlide(slide, cover, { x: 0, y: 0, w: 10, h: 5.625 });
  addImageOverlay(slide, pres, { color: "0B1B2B", opacity: 45 });
}
```

Existing scripts that import `./lib/stepfun-image.js` still work. That file now re-exports the provider-aware helper for backward compatibility.

### Provider Selection

Choose a provider per call:

```js
await generateSlideImage({ provider: "stepfun", prompt, usage: "card" });
await generateSlideImage({ provider: "minimax", prompt, usage: "card" });
await generateSlideImage({ provider: "stepfun-global", prompt, usage: "cover" });
await generateSlideImage({ provider: "minimax-cn", prompt, usage: "showcase" });
```

Or choose once through environment variables:

```bash
PPT_IMAGE_PROVIDER=stepfun   # stepfun | minimax
PPT_IMAGE_REGION=cn          # cn | global
```

Default behavior:

1. If `provider` is passed to `generateSlideImage()`, it wins.
2. Else `PPT_IMAGE_PROVIDER` or `AI_IMAGE_PROVIDER` is used.
3. Else MiniMax is selected only when `MINIMAX_API_KEY` exists and `STEPFUN_API_KEY` does not.
4. Else StepFun CN is the default and recommended path, preserving older scripts.

### Environment Variables

Create `.env` in your build directory, or export the same variables in your shell or CI.

```bash
# Recommended default
PPT_IMAGE_PROVIDER=stepfun        # stepfun | minimax
PPT_IMAGE_REGION=cn               # cn | global

# StepFun
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn                 # cn -> api.stepfun.com, global -> api.stepfun.ai
STEPFUN_API_MODE=platform         # platform | step_plan
# STEPFUN_BASE_URL=https://api.stepfun.com/v1  # optional override

# MiniMax
MINIMAX_API_KEY=sk-xxx
MINIMAX_REGION=global             # cn -> api.minimaxi.com, global -> api.minimax.io
# MINIMAX_BASE_URL=https://api.minimax.io/v1   # optional override
```

The helper loads `.env` automatically on import. Shell, MCP, or CI environment variables take priority over `.env`.

When no key is available for the selected provider, `generateSlideImage()` returns `null` and prints a warning. Your PPTX build should render a solid-color fallback or placeholder instead of failing.

### Provider Notes

| Provider | API Shape | Best Fit | Notes |
| --- | --- | --- | --- |
| StepFun | `/images/generations`, concrete `size` like `1360x768` | Precise PPT pixel presets | Recommended default; CN/global domains and Step Plan paths supported |
| MiniMax | `/image_generation`, `aspect_ratio` like `16:9` | Fast ratio-based deck imagery | CN/global domains supported; URL responses are downloaded immediately |

### CN / Global Endpoints

| Provider | Region | Platform | Default Base URL |
| --- | --- | --- | --- |
| StepFun | CN | `https://platform.stepfun.com` | `https://api.stepfun.com/v1` |
| StepFun | Global | `https://platform.stepfun.ai` | `https://api.stepfun.ai/v1` |
| StepFun Step Plan | CN | `https://platform.stepfun.com` | `https://api.stepfun.com/step_plan/v1` |
| StepFun Step Plan | Global | `https://platform.stepfun.ai` | `https://api.stepfun.ai/step_plan/v1` |
| MiniMax | CN | `https://platform.minimaxi.com` | `https://api.minimaxi.com/v1` |
| MiniMax | Global | `https://platform.minimax.io` | `https://api.minimax.io/v1` |

MiniMax also supports `promptOptimizer`, `seed`, `n`, and subject references through pass-through parameters:

```js
const img = await generateSlideImage({
  provider: "minimax",
  prompt,
  usage: "showcase",
  promptOptimizer: true,
  seed: 42,
});
```

StepFun supports `steps`, `cfgScale`, `negativePrompt`, `textMode`, `seed`, and `apiMode`:

```js
const img = await generateSlideImage({
  provider: "stepfun-cn",
  prompt,
  usage: "cover",
  steps: 8,
  cfgScale: 1.0,
  textMode: true,
});
```

## Open Platform Guide

StepFun is the recommended provider for this skill because its `step-image-edit-2` model exposes exact PPT-friendly pixel sizes such as `1360x768`, `1184x896`, and `768x1360`.

1. Choose region: use StepFun CN (`platform.stepfun.com`) for China accounts, or StepFun Global (`platform.stepfun.ai`) for international accounts.
2. Register or sign in, then open the API key page / user center.
3. Create an API key. Keep it local; never commit it.
4. For normal Open Platform image generation, set `STEPFUN_API_MODE=platform`. If you subscribed to Step Plan and need the dedicated path, set `STEPFUN_API_MODE=step_plan`.
5. Put the key and region in `.env`:

```bash
PPT_IMAGE_PROVIDER=stepfun
PPT_IMAGE_REGION=cn
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn
STEPFUN_API_MODE=platform
```

6. Run a no-key/config smoke test:

```bash
npm test
```

7. In a deck build script, call `generateSlideImage({ provider: "stepfun-cn", usage: "cover", prompt })`. If your account is global, switch to `provider: "stepfun-global"` or set `STEPFUN_REGION=global`.

Official references:

- StepFun CN image API: https://platform.stepfun.com/docs/zh/api-reference/images/image
- StepFun Global image API: https://platform.stepfun.ai/docs/en/api-reference/images/image
- StepFun Step Plan image integration: https://platform.stepfun.com/docs/zh/step-plan/integrations/image-api
- MiniMax CN image API: https://platform.minimaxi.com/docs/api-reference/image-generation-i2i
- MiniMax CN/global base URL note: https://platform.minimax.io/docs/token-plan/cursor

### Size-to-Layout Mapping

| Usage | PPT Role | StepFun Size | MiniMax Ratio | PPTX Layout |
| --- | --- | --- | --- | --- |
| `cover` | Full-bleed cover background | `1360x768` | `16:9` | `10 x 5.625 in` |
| `coverOverlay` | Cover background with text overlay | `1360x768` | `16:9` | `10 x 5.625 in` |
| `hero` | Top banner | `1360x768` | `16:9` | `10 x 3 in` |
| `sideStrip` | Vertical side decoration | `768x1360` | `9:16` | `2.5 x 4.44 in` |
| `card` | Square card image | `1024x1024` | `1:1` | `2.5 x 2.5 in` |
| `cardTall` | Tall card image | `896x1184` | `3:4` | `2.3 x 3.04 in` |
| `cardWide` | Wide card image | `1184x896` | `4:3` | `3.5 x 2.65 in` |
| `showcase` | Product/project panel | `1184x896` | `4:3` | `3.9 x 2.95 in` |
| `phoneMockup` | Mobile mockup | `768x1360` | `9:16` | `1.8 x 3.2 in` |
| `icon` | Small icon or avatar | `512x512` | `1:1` | `1.5 x 1.5 in` |

Image adaptation rules:

- StepFun `step-image-edit-2` uses official `size` strings. Keep the PPT usage mapping fixed: `cover/hero -> 1360x768`, `showcase/cardWide -> 1184x896`, `phoneMockup/sideStrip -> 768x1360`.
- StepFun text-to-image is treated as one image per request; call repeatedly for multiple candidates.
- MiniMax should normally use `aspect_ratio`; only pass `width/height` for custom sizes, and keep both in `[512, 2048]` and divisible by 8.
- Use `getImageUsageConfig(usage, provider)` or `SIZE_MAP`; do not hand-mix StepFun concrete sizes with MiniMax ratios.

Generated image metadata includes:

```js
{
  provider,
  region,
  localPath,
  absolutePath,
  size,
  aspectRatio,
  model,
  seed,
  usage,
  pptxLayout
}
```

## Color QA

Use sRGB relative luminance, not raw RGB distance, to judge text/background safety. The helper follows the WCAG contrast formula:

```bash
node scripts/color-qa.mjs --fg 0F2233 --bg F1FBFA --role body
node scripts/color-qa.mjs --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body
```

Rules:

- Body text must be at least `4.5:1`.
- Large titles, UI borders, icons, and graphical objects must be at least `3:1`.
- Do not use saturated accent colors as body text on light backgrounds.
- Do not rely on red/green alone for status.
- Avoid saturated blue on orange/red, two saturated colors as foreground/background, gray-on-gray, and text directly over busy AI images without a 40-55% overlay.

## QA Expectations

After generating or modifying a deck, render and inspect it:

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

Check for CJK overflow, cropped full-width punctuation, unreadable text on images, QR contrast, footer collisions, and AI image aspect mismatches. Fix and re-render until the slide images are clean.

## Development Smoke Test

The smoke test verifies imports, provider resolution, size mapping, model listing, and no-key fallback without calling real image APIs.

```bash
node scripts/smoke-test.mjs
```

## IP and Character Theme Note

For character/IP-themed decks, prefer color systems, abstract visual motifs, and user-provided licensed assets. Do not imply official endorsement, and do not generate trademarked character art unless the user has rights or explicitly asks for a legally safe, inspired-by visual direction.

## Contribute

Got a PPT skill recipe? Submit a PR:

```text
skills/<skill-name>/skill.md
skills/<skill-name>/lib/          # optional utility code
skills/<skill-name>/examples/     # optional build scripts
```

## License

MIT

---

# PPT 技能合集

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

这是一个开源 PPT 生成与修改技能合集，目标是用 PptxGenJS 生成**可编辑、主题化、适配中文排版的 PPTX**。

首个技能 [`themed-cn-pptx`](skills/themed-cn-pptx/) 面向中文演示文稿：角色/IP 风格视觉系统、二维码页、渲染 QA，以及通过 **StepFun（重点推荐）或 MiniMax** 生成适配 PPT 比例的 AI 配图。

## 快速开始

```bash
git clone https://github.com/CacinieP/ppt-skills.git
cd ppt-skills
npm test
```

在自己的 PPT 构建目录中复制或引用：

```text
skills/themed-cn-pptx/lib/
```

新脚本导入：

```js
import { generateSlideImage } from "./lib/ai-image.js";
```

没有 API key 时，生图函数返回 `null`，构建脚本应继续用纯色块或占位图生成 PPTX。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm test` | 检查 ESM 导入、provider/region 别名、尺寸映射、无 key 降级 |
| `npm run smoke` | 同 `npm test` |
| `npm run color:qa -- --fg 0F2233 --bg F1FBFA --role body` | 检查一组前景/背景色 |
| `npm run color:qa -- --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body` | 检查调色板两两组合 |

## 核心能力

- **可编辑 PPTX**：输出真实 `.pptx`，不是整页图片。
- **中文排版优先**：处理 CJK 字体、全角符号、字号、换行和渲染检查。
- **主题配方**：用固定色槽、重复装饰、版式菜单保证整套 deck 统一。
- **双工作流**：既能改已有 PPT，也能从文稿/大纲生成完整 PPT。
- **双生图供应商**：统一支持 StepFun（重点推荐）和 MiniMax，覆盖国内版/国际版，按 `cover`、`card`、`showcase` 等用途自动匹配比例。
- **优雅降级**：没配置 API key 时返回 `null`，PPT 构建不崩。

## 快速生图用法

新脚本推荐导入：

```js
import { generateSlideImage, addImageToSlide, addImageOverlay } from "./lib/ai-image.js";

const img = await generateSlideImage({
  provider: "stepfun-cn", // 推荐；也支持 stepfun-global / minimax-cn / minimax-global
  prompt: "青绿色科技主题封面背景，干净，留白，适合中文标题",
  usage: "cover",
});

if (img) {
  addImageToSlide(slide, img);
}
```

旧脚本继续导入 `./lib/stepfun-image.js` 也能运行，它现在只是兼容入口。

## 环境变量

```bash
PPT_IMAGE_PROVIDER=stepfun       # 推荐：stepfun；也可用 minimax
PPT_IMAGE_REGION=cn              # cn | global

STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn                # cn -> api.stepfun.com；global -> api.stepfun.ai
STEPFUN_API_MODE=platform        # platform | step_plan
# STEPFUN_BASE_URL=https://api.stepfun.com/v1  # 可选强制覆盖

MINIMAX_API_KEY=sk-xxx
MINIMAX_REGION=global            # cn -> api.minimaxi.com；global -> api.minimax.io
# MINIMAX_BASE_URL=https://api.minimax.io/v1   # 可选强制覆盖
```

优先级：函数参数 `provider` > `PPT_IMAGE_PROVIDER` / `AI_IMAGE_PROVIDER` > 自动判断 > StepFun 国内版默认。

如果没有对应 key，`generateSlideImage()` 会返回 `null` 并打印提示。构建脚本应该用纯色块或占位图继续生成 PPTX。

## 国内版 / 国际版

| 供应商 | 版本 | 平台入口 | 默认 Base URL |
| --- | --- | --- | --- |
| StepFun | 国内版 | `https://platform.stepfun.com` | `https://api.stepfun.com/v1` |
| StepFun | 国际版 | `https://platform.stepfun.ai` | `https://api.stepfun.ai/v1` |
| StepFun Step Plan | 国内版 | `https://platform.stepfun.com` | `https://api.stepfun.com/step_plan/v1` |
| StepFun Step Plan | 国际版 | `https://platform.stepfun.ai` | `https://api.stepfun.ai/step_plan/v1` |
| MiniMax | 国内版 | `https://platform.minimaxi.com` | `https://api.minimaxi.com/v1` |
| MiniMax | 国际版 | `https://platform.minimax.io` | `https://api.minimax.io/v1` |

可直接用别名指定：

```js
await generateSlideImage({ provider: "stepfun-cn", prompt, usage: "cover" });
await generateSlideImage({ provider: "stepfun-global", prompt, usage: "cover" });
await generateSlideImage({ provider: "minimax-cn", prompt, usage: "card" });
await generateSlideImage({ provider: "minimax-global", prompt, usage: "card" });
```

## 开放平台申请和使用指南

**优先推荐 StepFun**：`step-image-edit-2` 支持 `1360x768`、`1184x896`、`768x1360` 等 PPT 友好的精确尺寸，封面、展示图、竖向侧栏都更容易不裁切。

1. 选择版本：国内账号用 `platform.stepfun.com`，国际账号用 `platform.stepfun.ai`。
2. 注册/登录后进入用户中心或 API Key 页面。
3. 创建 API Key，并只放在本地 `.env` 或 CI 密钥里，不要提交到 Git。
4. 普通开放平台调用使用 `STEPFUN_API_MODE=platform`；如果你订阅的是 Step Plan 并需要专属路径，使用 `STEPFUN_API_MODE=step_plan`。
5. 在构建目录写入 `.env`：

```bash
PPT_IMAGE_PROVIDER=stepfun
PPT_IMAGE_REGION=cn
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn
STEPFUN_API_MODE=platform
```

6. 先跑配置 smoke test：

```bash
npm test
```

7. 在 PPT 构建脚本中调用：

```js
const cover = await generateSlideImage({
  provider: "stepfun-cn",
  prompt: "适合中文标题的青绿色科技封面背景，干净留白",
  usage: "cover",
  steps: 8,
  cfgScale: 1.0,
  textMode: true,
});
```

国际版账号把 `provider` 改为 `stepfun-global`，或设置 `STEPFUN_REGION=global`。

官方参考：

- StepFun 国内图片 API：https://platform.stepfun.com/docs/zh/api-reference/images/image
- StepFun 国际图片 API：https://platform.stepfun.ai/docs/en/api-reference/images/image
- StepFun Step Plan 图片接入：https://platform.stepfun.com/docs/zh/step-plan/integrations/image-api
- MiniMax 国内图片 API：https://platform.minimaxi.com/docs/api-reference/image-generation-i2i
- MiniMax 国内/国际 Base URL 说明：https://platform.minimax.io/docs/token-plan/cursor

## 尺寸映射

| 用途 | PPT 场景 | StepFun 尺寸 | MiniMax 比例 | PPTX 布局 |
| --- | --- | --- | --- | --- |
| `cover` | 全幅封面背景 | `1360x768` | `16:9` | `10 x 5.625 in` |
| `hero` | 顶部横幅 | `1360x768` | `16:9` | `10 x 3 in` |
| `sideStrip` | 竖向侧栏 | `768x1360` | `9:16` | `2.5 x 4.44 in` |
| `card` | 方形卡片图 | `1024x1024` | `1:1` | `2.5 x 2.5 in` |
| `cardTall` | 竖版卡片图 | `896x1184` | `3:4` | `2.3 x 3.04 in` |
| `cardWide` | 横版卡片图 | `1184x896` | `4:3` | `3.5 x 2.65 in` |
| `showcase` | 产品/项目展示 | `1184x896` | `4:3` | `3.9 x 2.95 in` |
| `phoneMockup` | 手机竖屏 | `768x1360` | `9:16` | `1.8 x 3.2 in` |
| `icon` | 小图标/头像 | `512x512` | `1:1` | `1.5 x 1.5 in` |

图片尺寸适配规则：

- StepFun `step-image-edit-2` 使用官方 `size` 字符串；PPT 用途固定映射：`cover/hero -> 1360x768`，`showcase/cardWide -> 1184x896`，`phoneMockup/sideStrip -> 768x1360`。
- StepFun 文生图按单次 1 张处理；需要多张候选图时循环调用。
- MiniMax 默认用 `aspect_ratio`；只有自定义尺寸时才传 `width/height`，并保证 512-2048 且可被 8 整除。
- 用 `getImageUsageConfig(usage, provider)` 或 `SIZE_MAP` 取配置，不手写混用 StepFun 尺寸和 MiniMax 比例。

## 色彩 QA

色彩 QA 按 sRGB 相对亮度算，不按 RGB 数值差或肉眼感觉判断。脚本实现了 WCAG 对比度公式：

```bash
node scripts/color-qa.mjs --fg 0F2233 --bg F1FBFA --role body
node scripts/color-qa.mjs --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body
```

规则：

- 正文、小字号中文、URL、脚注至少 `4.5:1`。
- 大标题、图标、边框、图例、UI 组件至少 `3:1`。
- 不用高饱和副色当正文。
- 不只靠红/绿表达状态。
- 避免蓝字压橙红底、两个高饱和色互为文字/背景、浅灰压浅底、深灰压深底。
- AI 图上放文字必须加 40-55% 遮罩或文字底板。

## 验证

```bash
node scripts/smoke-test.mjs
```

真实 PPT 交付前仍要做 PDF/JPG 渲染检查：

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

重点检查：中文溢出、全角符号挤压、图片上文字可读性、二维码对比度、页脚压内容、AI 配图比例是否匹配。

## 版权与 IP 提醒

角色/IP 主题优先使用色彩系统、抽象符号和用户授权素材。不要默认生成官方角色图，也不要暗示官方背书；需要时用 legally safe 的 inspired-by 视觉方向。

## 许可

MIT
