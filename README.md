# PPT Skills

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

Open-source PPT generation & modification skills — themed, CJK-aware, editable PPTX via PptxGenJS, with **AI image generation** powered by StepFun.

Each skill supports two workflows: **modify an existing PPT** or **generate from scratch from a manuscript**.

## What Makes These Skills Different

- **Editable output**: decks are generated as `.pptx`, not flat images
- **CJK-aware layout**: Chinese text, font fallback, and line breaking are first-class constraints
- **Theme recipes**: each skill defines palette, typography, layout, and QA steps
- **Production checklists**: skills include render verification instead of only code snippets
- **AI image generation**: integrated StepFun (阶跃星辰) text-to-image with automatic size-to-layout mapping — 16:9 cover backgrounds, 4:3 showcase images, 1:1 card illustrations, and more
- **Two workflows**: modify existing decks or build from a manuscript/outline

## Skills

| Skill | Description | Status |
|-------|-------------|--------|
| [themed-cn-pptx](skills/themed-cn-pptx/) | Build or modify Chinese + IP/character-themed + QR-embeddable editable PPTX decks | Released |

## Two Workflows

### A. Modify an existing PPT

Read an existing `.pptx` or `build_*.js` script, make targeted changes — swap theme colors, add AI images, adjust layout, insert slides.

1. Read the existing deck (python-pptx or the JS build script)
2. Identify what to change
3. Edit `build_<theme>.js` → regenerate `.pptx`
4. QA loop

### B. Generate from manuscript → PPT

Start from a manuscript/outline/README, build a complete deck from scratch.

1. Fetch content source
2. Task decomposition → palette → image needs
3. Choose slide layouts → write `build_<theme>.js`
4. Generate AI images → embed into PPTX
5. QA loop

## AI Image Generation (StepFun)

`stepfun-image.js` automatically loads `.env` on import — **no dotenv dependency, no boilerplate** in your build scripts. Just import and call.

### Three ways to provide your API key (pick one)

**1. `.env` file (recommended for local dev)**

Create `.env` in your project root (already gitignored):

```
STEPFUN_API_KEY=sk-xxx
STEPFUN_BASE_URL=https://api.stepfun.com/v1   # optional
```

That's it. `stepfun-image.js` reads it on import — your `build_*.js` needs zero env-handling code.

**2. Shell environment variable**

```bash
export STEPFUN_API_KEY=sk-xxx
export STEPFUN_BASE_URL=https://api.stepfun.com/v1   # optional
node build_miku.js
```

**3. Claude Code MCP config**

```bash
claude mcp add stepfun -s user -e STEPFUN_API_KEY=sk-xxx -- npx -y @stepfun/mcp-server
```

### Priority order

`process.env` (shell / MCP / CI) **>** `.env` file

If you set the key via `export` or MCP, the `.env` value is ignored — so CI/CD and Claude Code always win.

### What happens without a key

`generateSlideImage()` returns `null` and prints a warning. Your PPTX still generates — just without AI images (falls back to solid-color placeholders). No crash, no error throw.

### Size-to-Layout Mapping

| Usage | Image Size | Aspect | PPTX Layout |
|-------|-----------|--------|-------------|
| `cover` | 1360×768 | 16:9 | 10″×5.625″ full-bleed |
| `hero` | 1360×768 | 16:9 | 10″×3″ top banner |
| `sideStrip` | 768×1360 | 9:16 | 2.5″×4.44″ right strip |
| `card` | 1024×1024 | 1:1 | 2.5″×2.5″ square |
| `cardTall` | 896×1184 | 3:4 | 2.3″×3.04″ tall |
| `cardWide` | 1184×896 | 4:3 | 3.5″×2.65″ wide |
| `showcase` | 1184×896 | 4:3 | 3.9″×2.95″ project |
| `phoneMockup` | 768×1360 | 9:16 | 1.8″×3.2″ phone |
| `icon` | 512×512 | 1:1 | 1.5″×1.5″ small |

## Contribute

Got a PPT skill recipe? PR it in:

```
skills/<skill-name>/skill.md
skills/<skill-name>/lib/          # optional: utility code
skills/<skill-name>/examples/     # optional: example build scripts
```

## License

MIT

---

# PPT 技能合集

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

开源 PPT 生成与修改技能合集 — 基于 PptxGenJS，支持主题化、CJK 适配、可编辑 PPTX 输出，集成**阶跃星辰 StepFun AI 生图**。

每个技能支持两种工作流：**修改已有 PPT** 或 **从文稿/大纲从零生成**。

## 有什么不同

- **可编辑输出**：生成的文件是 `.pptx`，不是扁平图片
- **CJK 适配布局**：中文文本、字体回退和换行是一等约束
- **主题配方**：每个技能定义色板、排版、布局和 QA 步骤
- **生产检查清单**：技能包含渲染验证，而非仅代码片段
- **AI 生图**：集成阶跃星辰 StepFun 文生图能力，自动适配 PPT 排版尺寸 — 16:9 封面背景、4:3 项目展示、1:1 卡片配图等
- **双工作流**：改已有 PPT 或从文稿/大纲从零生成

## 技能列表

| 技能 | 描述 | 状态 |
|------|------|------|
| [themed-cn-pptx](skills/themed-cn-pptx/) | 构建或修改中文 + IP/角色主题 + 可嵌入二维码的可编辑 PPTX | 已发布 |

## 两种工作流

### A. 改已有 PPT

读取现有 `.pptx` 或 `build_*.js` 脚本，做局部修改——换主题色、加 AI 配图、调排版、插页。

1. 读取现有 PPTX（python-pptx 解析）或 JS 构建脚本
2. 确定修改范围
3. 修改 `build_<theme>.js` → 重新生成 `.pptx`
4. QA 循环

### B. 从文稿/大纲生成 PPT

从文稿/大纲/README/Notion 页从零生成完整 PPTX。

1. 抓取内容源
2. 任务拆解 → 色板 → 生图需求
3. 选择 Slide 布局 → 编写 `build_<theme>.js`
4. 生成 AI 配图 → 嵌入 PPTX
5. QA 循环

## AI 生图（阶跃星辰 StepFun）

`stepfun-image.js` 在 import 时自动加载 `.env` —— **零依赖、零样板代码**。只需 import 然后调用。

### 三种方式填入 API Key（任选其一）

**1. `.env` 文件（本地开发推荐）**

在项目根目录创建 `.env`（已被 gitignore 忽略）：

```
STEPFUN_API_KEY=sk-xxx
STEPFUN_BASE_URL=https://api.stepfun.com/v1   # 可选
```

就这样。`stepfun-image.js` import 时自动读取，你的 `build_*.js` 不需要任何 env 处理代码。

**2. Shell 环境变量**

```bash
export STEPFUN_API_KEY=sk-xxx
export STEPFUN_BASE_URL=https://api.stepfun.com/v1   # 可选
node build_miku.js
```

**3. Claude Code MCP 配置**

```bash
claude mcp add stepfun -s user -e STEPFUN_API_KEY=sk-xxx -- npx -y @stepfun/mcp-server
```

### 优先级

`process.env`（Shell / MCP / CI）**>** `.env` 文件

如果通过 `export` 或 MCP 设置了 key，`.env` 中的值会被跳过——CI/CD 和 Claude Code 配置始终优先。

### 没有 Key 时会怎样

`generateSlideImage()` 返回 `null` 并打印警告。PPTX 照常生成——只是没有 AI 配图（降级为纯色占位）。不会崩溃，不会抛错。

## 贡献

有 PPT 技能配方？提交 PR：

```
skills/<skill-name>/skill.md
skills/<skill-name>/lib/          # 可选：工具代码
skills/<skill-name>/examples/     # 可选：示例构建脚本
```

## 许可

MIT
