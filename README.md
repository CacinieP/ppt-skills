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

To enable AI-generated images in your decks, set the `STEPFUN_API_KEY` environment variable:

```bash
# Required: Get your key from https://platform.stepfun.com
export STEPFUN_API_KEY=sk-xxx

# Optional: Override API base URL (defaults to https://api.stepfun.com/v1)
export STEPFUN_BASE_URL=https://api.stepfun.com/v1
```

**Claude Code users** can configure via MCP:

```bash
claude mcp add stepfun -s user -e STEPFUN_API_KEY=sk-xxx -- npx -y @stepfun/mcp-server
```

When `STEPFUN_API_KEY` is set, `generateSlideImage()` will call the StepFun API to create illustrations; when not set, it gracefully degrades to solid-color placeholders without errors.

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

启用 AI 配图需要设置环境变量 `STEPFUN_API_KEY`：

```bash
# 必填：从 https://platform.stepfun.com 获取 API Key
export STEPFUN_API_KEY=sk-xxx

# 可选：覆盖 API 地址（默认 https://api.stepfun.com/v1）
export STEPFUN_BASE_URL=https://api.stepfun.com/v1
```

**Claude Code 用户**可通过 MCP 配置：

```bash
claude mcp add stepfun -s user -e STEPFUN_API_KEY=sk-xxx -- npx -y @stepfun/mcp-server
```

设置 `STEPFUN_API_KEY` 后，`generateSlideImage()` 会调用 StepFun API 生成配图；未设置时自动降级为纯色占位，不会报错。

## 贡献

有 PPT 技能配方？提交 PR：

```
skills/<skill-name>/skill.md
skills/<skill-name>/lib/          # 可选：工具代码
skills/<skill-name>/examples/     # 可选：示例构建脚本
```

## 许可

MIT
