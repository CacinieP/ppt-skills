---
name: themed-cn-pptx
description: Build or modify Chinese + IP/character-themed + QR-embeddable editable PPTX decks using PptxGenJS, with StepFun or MiniMax AI image generation
---

<aside>
📌

**Skill 名称**：`themed-cn-pptx`

**适用**：用 PptxGenJS 构建或修改中文 + IP/角色主题 + 嵌入二维码 的可编辑 PPTX 演示文稿

**依赖技能**：标准 `pptx` skill（本 skill 是它的增量补充）

**生图能力**：集成 StepFun 阶跃星辰和 MiniMax 文生图 API，API Key 从环境变量读取，不硬编码

</aside>

---

## 0. 两条使用路径

本 skill 按用户意图分为两条路径，先判断再执行：

### 路径 A：改 PPT

用户已有一份 `.pptx`（或 `.js` 构建脚本），需要做**局部修改**——换主题色、加配图、调排版、插页、替换内容。

**流程**：
1. 读取现有 `.pptx`（用 python-pptx 解析）或 `.js` 脚本
2. 确定修改范围——主题色？哪些页加图？哪些文字要改？
3. 修改 `build_<theme>.js` → 重新生成 `.pptx`
4. QA 循环（§8）

**典型说法**：
- "把这份 PPT 换成初音主题"
- "给第 3 页和第 6 页各加一张 AI 配图"
- "封面加个背景图，文字加半透明遮罩"
- "粉色再浅一点"

### 路径 B：从文稿到 PPT

用户给一份文稿/大纲/README/Notion 页，**从零生成**完整 PPTX。

**流程**：
1. 抓取内容源（粘贴文本 / GitHub README / URL）
2. 任务拆解（§1）
3. 构建色板（§2）+ 确定生图需求（§2.5）
4. 选择 Slide 布局（§5）→ 编写 `build_<theme>.js`
5. 生成配图（§2.5）→ 嵌入 PPTX
6. QA 循环（§8）

**典型说法**：
- "帮我把这个 README 做成 PPT，10 页，初音主题"
- "按这份大纲生成一份演讲稿 PPT"
- "从这篇文档出一份产品介绍 PPT，带配图"

---

## 1. 任务拆解（先做这一步）

在写代码前，从用户需求中先抽出：

- **IP / 主题** → 映射到 4 色身份（主色 + 副色 + 深底 + 浅底）
- **输出格式** → 确认 `.pptx`（可编辑）/ PDF Slides / Notion Slides / Presentation App，**不要假设**
- **语言** → 中文需要 CJK 字体 + 更紧的字号阶（全角字符在同 pt 下比 Latin 宽）
- **硬约束** → 页数上限、二维码目标 URL、需隐去的话题、品牌标识
- **内容源** → 用户粘贴的文本？GitHub README？现有 Notion 页？先抓取再写 slide
- **图像需求** → 哪些页需要 AI 配图？封面背景？卡片插图？项目展示？→ 参考 §2.5 确定用途和尺寸
- **视觉系统** → 对复杂/公开发布 deck，先读 `references/aesthetic-rules.md`，声明 `style_id`、布局族、密度和负面风格
- **生图约束** → 生成封面/hero/showcase 前先读 `references/image-constraints.md`，写出 image manifest 再调用 API

---

## 2. 构建角色 IP 调色板（模板）

角色 / IP 主题 deck 需要既像 IP 又不刺眼的配色。固定 6 个色槽：

| **色槽** | **作用** | **Miku 示例** |
| --- | --- | --- |
| Dominant 主色 | 承载 deck 身份的招牌色 | `#39C5BB` 初音青（官方） |
| Secondary 副色 | 一种反差强调色（仅用于 header/kicker/callout） | `#FF77AA` 双马尾粉 |
| Dark BG 深底 | 封面 / 分隔 / 收尾 | `#0B1B2B` 深夜空蓝 |
| Light BG 浅底 | 内容页 | `#F1FBFA` 青调米白 |
| Soft accent 柔和点缀 | chips / 浅卡背景 | `#E6F8F6` |
| Muted text 弱化文字 | 浅底正文 | `#6B8794` |

**权重规则**：

- 主色 60-70% 视觉权重，副色 ~20%，强调 ~10%
- 副色**绝不**用于正文，只用 header / kicker / callout
- IP 有官方色就用官方色，不要猜（先查）

可复用的 JS 常量块：

```jsx
const C = { miku:"39C5BB", mikuDeep:"1FA89E", pink:"FF77AA", pinkSoft:"FFC2DB",
  navy:"0B1B2B", navyDeep:"06121E", ink:"0F2233",
  paper:"F1FBFA", paperAlt:"E6F8F6", white:"FFFFFF",
  textOnDark:"E8FFFD", textOnLight:"0F2233", muted:"6B8794", line:"BFE7E2" };
```

换 IP 时只替换具名颜色，**色槽结构保持不变**。

---

## 2.1 色彩方案与 QA 规则

中文 PPT 的色彩 QA 不看“感觉”，先按 sRGB / RGB 色号计算。RGB 通道不是线性亮度；先把 `#RRGGBB` 的 R/G/B 从 0-255 归一化并做 sRGB gamma 线性化，再算相对亮度：

```text
L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

绿色通道对亮度贡献最大，蓝色最小，所以**不要用 RGB 数值差或“看起来颜色不一样”判断可读性**。正文对比度至少 4.5:1；大标题、粗体大字、UI 边框、图形对象至少 3:1。用 `scripts/color-qa.mjs` 快速检查：

```bash
node scripts/color-qa.mjs --fg 0F2233 --bg F1FBFA --role body
node scripts/color-qa.mjs --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body
```

### 色彩方案选择

| 方案 | 适用 | 规则 |
| --- | --- | --- |
| Neutral + Accent | 中文说明型、产品介绍、交付物 | 最稳。正文只用深墨色/近白，品牌色只做条纹、编号、图标、强调块 |
| Monochrome 单色系 | 严肃、科技、统一感强的 deck | 必须拉开明度阶，不要只改饱和度；正文仍用深/浅中性色 |
| Analogous 邻近色 | 柔和、情绪统一的角色主题 | 需要一个深底和一个浅底承载文字，否则容易“一片糊” |
| Complementary 互补色 | 封面、章节页、强冲突观点 | 一方做主色，另一方只做 5-10% 强调；不要互相做正文/背景 |
| Split-complementary 分裂互补 | IP 主题、活泼但可控 | 比纯互补更安全，适合“主色 + 两个小强调色” |
| Triadic / Tetradic | 流程图、矩阵、分类图 | 只用于图形编码；同页高饱和主色不超过 3 个 |
| Dark mode 深底 | 封面、收尾、章节分隔 | 用 `textOnDark` 近白，不用纯高饱和色写长正文；图片上文字必须加遮罩 |

### 颜色组合负面清单

这些组合默认判为风险，除非能证明对比度和场景都安全：

1. **正文对比度 < 4.5:1**：任何小字号中文、脚注、URL、表格正文都禁止。
2. **标题 / 图形 / UI 对比度 < 3:1**：大标题、标签、边框、图标、数据图例都禁止。
3. **副色当正文**：例如高饱和粉、青、黄直接写在浅底上，通常会失败；副色只做 kicker、短线、编号、callout。
4. **红 + 绿表达状态**：不要只靠红绿区分成功/失败；必须加文字、图标或形状。
5. **蓝字压红/橙底，或红/橙字压蓝底**：CJK 小字边缘容易震动，除非是大号短标题且对比度足够。
6. **两个高饱和色互为文字/背景**：如亮青压亮粉、亮黄压亮蓝；用中性色隔开。
7. **同色相低明度差**：同一 hue 只改一点点亮度/饱和度，容易看成一片；相邻层级必须拉开亮度。
8. **浅灰压浅底 / 深灰压深底**：灰度很容易“过关感知不过关”，用脚本先算。
9. **AI 图上裸放文字**：不允许直接在复杂图片上放正文；加 40-55% 深色遮罩或独立文字底板。
10. **一页超过 3 个高饱和主视觉色**：分类图例可以多色，普通内容页不行。
11. **全 deck 只有一个 hue 家族且没有中性深浅阶**：会变成单色糊；至少保留深底、浅底、正文色、弱化文字色。
12. **PptxGenJS 色号带 `#`**：代码里始终写 `"39C5BB"`，不要写 `"#39C5BB"`。

QA 时列出实际使用的 `fg/bg` 对，至少检查：正文 on 浅底、正文 on 深底、标题 on 封面图遮罩、表格文字 on header、QR URL、footer、图例文字。

---

## 2.5 AI 生图 — 尺寸适配（StepFun / MiniMax）

通过 `lib/ai-image.js` 生成配图，自动适配 PPT 排版。**StepFun 是默认和重点推荐 provider**；MiniMax 作为可选补充。两者都支持国内版 / 国际版。**不硬编码 API Key**，从环境变量或 `.env` 读取。新脚本优先导入 `ai-image.js`；旧脚本继续导入 `stepfun-image.js` 也能运行（兼容 re-export）。

### 引入方式

```jsx
import { generateSlideImage, addImageToSlide, addImageOverlay, SIZE_MAP } from "./lib/ai-image.js";

// 用法：按用途自动选比例/尺寸
const img = await generateSlideImage({
  provider: "stepfun-cn", // 推荐；也支持 stepfun-global / minimax-cn / minimax-global
  prompt: "赛博朋克城市夜景，中文发布会封面背景，留出标题区域",
  usage: "cover",
});

if (img) {
  slide.addImage({ path: img.localPath, x: 0, y: 0, w: img.pptxLayout.w, h: img.pptxLayout.h });
}
```

### Provider 选择

优先级：

1. `generateSlideImage({ provider: "stepfun" | "minimax" })`
2. 环境变量 `PPT_IMAGE_PROVIDER` 或 `AI_IMAGE_PROVIDER`
3. 如果只有 `MINIMAX_API_KEY`，自动选择 `minimax`
4. 默认 `stepfun-cn`，保证旧脚本行为不变，并优先走 StepFun 国内开放平台

可直接使用 region alias：

```jsx
await generateSlideImage({ provider: "stepfun-cn", prompt, usage: "cover" });
await generateSlideImage({ provider: "stepfun-global", prompt, usage: "cover" });
await generateSlideImage({ provider: "minimax-cn", prompt, usage: "card" });
await generateSlideImage({ provider: "minimax-global", prompt, usage: "card" });
```

### 用途 → 尺寸映射

| **用途** | **PPT 场景** | **StepFun 尺寸** | **MiniMax 比例** | **PPTX (英寸)** |
| --- | --- | --- | --- | --- |
| `cover` | 封面全幅背景 | 1360×768 | 16:9 | `{ w:10, h:5.625 }` |
| `coverOverlay` | 带文字遮罩的封面背景 | 1360×768 | 16:9 | `{ w:10, h:5.625 }` |
| `hero` | 上半区横幅 | 1360×768 | 16:9 | `{ w:10, h:3 }` |
| `bannerWide` | 超宽横幅 | 1360×768 + 裁切 | 21:9 | `{ w:10, h:2.45 }` |
| `ultraWideHero` | 超宽首页/章节视觉 | 1360×768 + 裁切 | 21:9 | `{ w:10, h:2.8 }` |
| `sideStrip` | 右侧竖版装饰条 | 768×1360 | 9:16 | `{ w:2.5, h:4.44 }` |
| `card` | 方形卡片配图 | 1024×1024 | 1:1 | `{ w:2.5, h:2.5 }` |
| `cardTall` | 竖版卡片配图 | 896×1184 | 3:4 | `{ w:2.3, h:3.04 }` |
| `cardWide` | 横版卡片配图 | 1184×896 | 4:3 | `{ w:3.5, h:2.65 }` |
| `showcase` | 产品/项目展示 | 1184×896 | 4:3 | `{ w:3.9, h:2.95 }` |
| `phoneMockup` | 手机竖屏 mockup | 768×1360 | 9:16 | `{ w:1.8, h:3.2 }` |
| `icon` | 小图标/占位图 | 512×512 | 1:1 | `{ w:1.5, h:1.5 }` |

适配规则：

- StepFun `step-image-edit-2` 使用官方 `size` 字符串：`1024x1024`、`768x1360`、`896x1184`、`1360x768`、`1184x896`。文档标注该字符串是 `height x width`，但在本 skill 中按**视觉用途**映射到 PPT：`cover/hero` 固定用 `1360x768`，`showcase/cardWide` 固定用 `1184x896`，`phoneMockup/sideStrip` 固定用 `768x1360`。
- StepFun 当前单次文生图按 1 张处理；如需要多张候选图，循环调用，不依赖 `n > 1`。
- MiniMax 优先使用 `aspect_ratio` 而不是 `width/height`：`16:9`、`4:3`、`1:1`、`3:4`、`9:16`。只有确实需要自定义像素时才传 `width/height`，并保证 512-2048 且能被 8 整除。
- `cover`、`hero`、`bannerWide`、`ultraWideHero`、`showcase`、`phoneMockup` 不手写尺寸，统一从 `SIZE_MAP` 或 `getImageUsageConfig()` 取，避免把 MiniMax ratio 和 StepFun size 混用。
- `bannerWide` / `ultraWideHero`：MiniMax 原生 `21:9`；StepFun 用 `1360x768` 生成，再按 `cropPolicy` 和 `safeZone` 放入 PPT。
- 返回 URL 一律立即下载到 `assets/<provider>/`，PPTX 只引用本地文件，避免 StepFun/MiniMax 临时链接过期。

### 环境变量配置

```bash
# 可选：默认生图供应商
export PPT_IMAGE_PROVIDER=stepfun   # stepfun | minimax
export PPT_IMAGE_REGION=cn          # cn | global

# StepFun（国内 https://platform.stepfun.com；国际 https://platform.stepfun.ai）
export STEPFUN_API_KEY=sk-xxx
export STEPFUN_REGION=cn            # cn -> api.stepfun.com；global -> api.stepfun.ai
export STEPFUN_API_MODE=platform    # platform | step_plan
# export STEPFUN_BASE_URL=https://api.stepfun.com/v1  # 可选强制覆盖

# MiniMax（国内 https://platform.minimaxi.com；国际 https://platform.minimax.io）
export MINIMAX_API_KEY=sk-xxx
export MINIMAX_REGION=global        # cn -> api.minimaxi.com；global -> api.minimax.io
# export MINIMAX_BASE_URL=https://api.minimax.io/v1   # 可选强制覆盖
```

`ai-image.js` 会自动加载项目根目录 `.env`，但 shell / MCP / CI 中已有的 `process.env` 优先。

### Provider 参数

- StepFun：使用 `/images/generations`，按具体 `size` 生成，适合精确 PPT 预设。
- MiniMax：使用 `/image_generation`，按 `aspect_ratio` 生成；返回 URL 时工具会立即下载到本地，避免 URL 过期影响 PPT。
- StepFun 国内开放平台默认 Base URL：`https://api.stepfun.com/v1`
- StepFun 国际开放平台默认 Base URL：`https://api.stepfun.ai/v1`
- StepFun Step Plan 国内 / 国际专属路径：`https://api.stepfun.com/step_plan/v1` / `https://api.stepfun.ai/step_plan/v1`
- MiniMax 国内 / 国际默认 Base URL：`https://api.minimaxi.com/v1` / `https://api.minimax.io/v1`
- MiniMax 可传 `promptOptimizer`、`seed`、`n`、`subjectReference`：

```jsx
const img = await generateSlideImage({
  provider: "minimax",
  prompt,
  usage: "showcase",
  promptOptimizer: true,
  seed: 42,
});
```

StepFun 可传 `steps`、`cfgScale`、`negativePrompt`、`textMode`、`seed`、`apiMode`：

```jsx
const img = await generateSlideImage({
  provider: "stepfun-cn",
  prompt,
  usage: "cover",
  steps: 8,
  cfgScale: 1.0,
  textMode: true,
});
```

### 开放平台申请与使用指南（StepFun 推荐）

1. 选择版本：国内账号用 `https://platform.stepfun.com`，国际账号用 `https://platform.stepfun.ai`。
2. 注册 / 登录后进入用户中心或 API Key 页面。
3. 创建 API Key。只放在本地 `.env`、系统环境变量或 CI Secret，不写进源码。
4. 普通开放平台调用用 `STEPFUN_API_MODE=platform`；如已订阅 Step Plan 且要走专属路径，用 `STEPFUN_API_MODE=step_plan`。
5. 在构建目录创建 `.env`：

```bash
PPT_IMAGE_PROVIDER=stepfun
PPT_IMAGE_REGION=cn
STEPFUN_API_KEY=sk-xxx
STEPFUN_REGION=cn
STEPFUN_API_MODE=platform
```

6. 先跑 `npm test` 验证导入、provider/region 解析、无 key 降级。
7. 构建 PPT 时优先使用 `provider: "stepfun-cn"`；国际版账号改为 `provider: "stepfun-global"` 或设置 `STEPFUN_REGION=global`。

### 图片排版规范

- **深底图片上放文字** → 必须加半透明遮罩（`addImageOverlay`），透明度 40-50%
- **卡片内图片** → 上下留 0.15″ padding，用 `rounding: true` 圆角
- **封面背景图** → 叠加深色半透明矩形 + 文字层，确保文字可读
- **图片不贴文字** → 左右至少 0.2″ 间距
- **无 API Key 时** → 自动跳过生图，console.warn 提示，不阻断 PPT 生成

### 模型尺寸对照

| Provider | 模型 | 支持尺寸 / 比例 |
| --- | --- | --- |
| StepFun | `step-image-edit-2`（默认） | 1024×1024, 768×1360, 896×1184, 1360×768, 1184×896 |
| StepFun | `step-2x-large` | 256×256, 512×512, 768×768, 1024×1024, 1280×800, 800×1280 |
| StepFun | `step-1x-medium` | 256×256, 512×512, 768×768, 1024×1024, 1280×800, 800×1280 |
| MiniMax | `image-01` | 1:1, 16:9, 4:3, 3:2, 2:3, 3:4, 9:16, 21:9 |

---

## 3. 中文字体默认

- **标题 & 正文字体**：`Microsoft YaHei`（LibreOffice 和 PowerPoint 渲染都 OK，CJK + Latin 都支持）
- **等宽**：`Consolas`（URL / 代码 / 框架名）
- **CJK 安全字号**（16:9，10×5.625″）：

| **用途** | **字号** | **说明** |
| --- | --- | --- |
| 封面主标题（CJK + 括号） | **44pt** | 56pt 会溢出——「」是全角，占位多 |
| 章节标题 | 28pt | 9″ 宽下一行中文够用 |
| 卡片 / 引擎标题 | 16pt bold |  |
| 正文 | 11–12pt | 中文 11pt 仍很清晰 |
| 大数字 stat | 60–80pt | Latin / 数字，放心放大 |
| Kicker（英文大写） | 11–12pt + `charSpacing: 4–6` | 竖线序号下的拉丁字母 letter-spacing |

**CJK 坑**：

- 大量「」括号的标题，比纯 CJK 标题字号要再小 ~25%
- 估算：CJK 字符宽度 ≈ fontSize × 0.95pt
- `charSpacing` 对中文很丑，**只在英文 kicker 上加**

---

## 4. 重复装饰 = 品牌一致性

把三个 helper 函数提出来，**每页都调用**：

```jsx
// 1. 顶部 + 底部条纹 —— deck 的心跳
function mikuStripe(slide) {
  slide.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:SW, h:0.08, fill:{color:C.miku}, line:{color:C.miku} });
  slide.addShape(pres.shapes.RECTANGLE, { x:0, y:0.08, w:SW, h:0.025, fill:{color:C.pink}, line:{color:C.pink} });
  slide.addShape(pres.shapes.RECTANGLE, { x:0, y:SH-0.04, w:SW, h:0.04, fill:{color:C.miku}, line:{color:C.miku} });
}

// 2. 章节标题 —— 副色 kicker 方块 + 主/副色双段下划线
function sectionTitle(slide, kicker, title) {
  slide.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.45, w:0.18, h:0.18, fill:{color:C.pink}, line:{color:C.pink} });
  slide.addText(kicker, { x:0.75, y:0.38, w:6, h:0.3, fontSize:12, bold:true, color:C.miku, charSpacing:4, margin:0 });
  slide.addText(title, { x:0.5, y:0.68, w:9, h:0.7, fontSize:28, bold:true, color:C.ink, margin:0 });
  slide.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.42, w:0.9, h:0.05, fill:{color:C.miku}, line:{color:C.miku} });
  slide.addShape(pres.shapes.RECTANGLE, { x:1.42, y:1.42, w:0.3, h:0.05, fill:{color:C.pink}, line:{color:C.pink} });
}

// 3. 页脚：品牌行 + N/total
function footer(slide, n, total) {
  slide.addText("Brand · Subtitle", { x:0.5, y:SH-0.35, w:6, h:0.25, fontSize:9, color:C.muted, margin:0 });
  slide.addText(`${n} / ${total}`, { x:SW-1.2, y:SH-0.35, w:0.7, h:0.25, fontSize:9, color:C.muted, align:"right", margin:0 });
}
```

这三件套，能把 10 页临时排版瞬间变成一套有设计的 deck。

<aside>
💡

**"长主色 + 短副色" 双段下划线是性价比最高的品牌符号**。不需要任何图片素材，立刻有「设计过」的观感。

</aside>

---

## 5. Slide 类型菜单

不要每页重新发明 layout。从这些里挑：

### 基础布局（无图）

| **#** | **类型** | **何时用** | **核心元素** |
| --- | --- | --- | --- |
| 1 | 封面（深底） | 第 1 页 | 角落半透明大椭圆 + kicker 胶囊 + 多行堆叠主标题 + 强调 bar + 作者块 |
| 2 | 引言 + 三支柱 | 定位 / 定义 | 带副色左 bar 的大引用卡 + 下方 3 个图标圆 mini-card |
| 3 | 双卡 + verdict | 两股对比力量 | 上 2 张白卡 + 下方一个深底 callout 写「所以呢」 |
| 4 | 条纹表格 | 3–5 行对比 | 主色 header bar + 交替白 / paperAlt 行 + 副色编号圆圈 |
| 5 | 矩阵 | 映射 / 同构 | N 列 × 主/副/白 横向色带网格 |
| 6 | 项目展示 | 突出某个项目 | 左侧深色卡 + 巨型数字 stat + 右侧 2×3 特性网格 |
| 7 | 双栏映射 | A ↔ B 等价 | 两侧 header bar + 交替行 + 中间箭头线 |
| 8 | 问题堆叠 | 讨论提问 | Q1/Q2/Q3 卡堆叠 + 彩色字母圆 + 左侧色 bar |
| 9 | 收尾 + QR（深底） | 最终 CTA | 双色大标题 + 左侧联系列表 + 右侧 QR 卡（带框） |

### 带图布局（AI 生图增强）

| **#** | **类型** | **何时用** | **核心元素 + 生图** |
| --- | --- | --- | --- |
| 1a | 封面（深底+背景图） | 需要视觉冲击 | `cover` 1360×768 全幅背景 + 深色遮罩 + 文字层 |
| 3a | 双卡 + 配图 + verdict | 对比 + 视觉辅助 | 每张白卡嵌 `card` 1024×1024 方形图 |
| 3b | 双卡 + 竖版配图 + verdict | 对比 + 竖版展示 | 白卡嵌 `cardTall` 896×1184 竖版图 |
| 6a | 项目展示 + 配图 | 产品/界面展示 | 左侧 `cardWide`/`showcase` 1184×896 图 + 右侧特性网格 |
| 6b | 项目展示 + 竖版 mockup | 手机 App 展示 | 左侧 `phoneMockup` 768×1360 + 右侧特性 |
| 7a | 双栏映射 + 侧栏图 | 映射 + 装饰 | 右侧 `sideStrip` 768×1360 竖版装饰条 |

用 8–10 张。**一个 deck 不要超过 5 种 layout**，否则视觉碎片化。

### 带图布局示例代码

#### 1a. 封面（深底+背景图）

```jsx
const coverImg = await generateSlideImage({
  prompt: "抽象科技流动线条，深蓝色调，初音未来风格",
  usage: "cover",
});

const slide = pres.addSlide();
if (coverImg) {
  slide.addImage({ path: coverImg.localPath, x: 0, y: 0, w: 10, h: 5.625 });
  addImageOverlay(slide, pres, { color: C.navy, opacity: 45 });
} else {
  slide.background = { fill: C.navy };
}

// 文字层（不受背景图影响）
slide.addText(kicker, { ... });
slide.addText(mainTitle, { ... });
mikuStripe(slide);
```

#### 3a. 双卡 + 配图 + verdict

```jsx
const cardImg1 = await generateSlideImage({ prompt: "自然语言文本界面", usage: "card" });
const cardImg2 = await generateSlideImage({ prompt: "编程代码界面", usage: "card" });

const slide = pres.addSlide();
sectionTitle(slide, "CONTRAST", "语言 vs 编程");

// 左卡片
slide.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.7, w:4.4, h:2.0, fill:{color:C.white}, shadow:... });
if (cardImg1) {
  slide.addImage({ path: cardImg1.localPath, x: 0.7, y: 2.2, w: 1.5, h: 1.5, rounding: true });
}
slide.addText("标题", { x:2.3, y:2.25, w:2.4, h:0.45, fontSize:16, bold:true, color:C.ink });
```

#### 6a. 项目展示 + 配图

```jsx
const showcaseImg = await generateSlideImage({ prompt: "现代化仪表盘界面", usage: "showcase" });

const slide = pres.addSlide();
sectionTitle(slide, "SHOWCASE", "核心产品");

if (showcaseImg) {
  slide.addImage({ path: showcaseImg.localPath, x: 0.5, y: 1.75, w: 3.9, h: 2.95, rounding: true });
} else {
  slide.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.75, w:3.9, h:2.95, fill:{color:C.navy} });
}
// 右侧特性网格 ...
```

---

## 6. 无网络生成二维码

沙箱默认无网络——`pip install qrcode` 会失败。用 reportlab 内藏的 QR 编码器（预装）+ PIL 自己栅格化：

```python
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel, QR8bitByte
from PIL import Image

data = "https://github.com/CacinieP"
for v in range(1, 20):
    try:
        qr = QRCode(v, QRErrorCorrectLevel.H)
        qr.addData(QR8bitByte(data))
        qr.make()
        modules = qr.modules
        break
    except Exception:
        continue

n, scale, border = len(modules), 16, 4
size = (n + border*2) * scale
img = Image.new("RGB", (size, size), (255,255,255))
px = img.load()
for r in range(n):
    for c in range(n):
        if modules[r][c]:
            for dy in range(scale):
                for dx in range(scale):
                    px[(c+border)*scale+dx, (r+border)*scale+dy] = (0,0,0)
img.save("/data/qr.png")
```

然后在 PptxGenJS 中嵌入：

```jsx
slide.addImage({ path: "/data/qr.png", x: 6.95, y: 2.15, w: 2.4, h: 2.4 });
```

**给 QR 加框**：白色圆角卡 + 主色边 + 主色顶 strip 写 `SCAN · 扫码访问`，URL 用等宽字体放在码下方。**深底上裸放 QR 像故障**。

---

## 7. 踩过的坑

1. **CJK 主标题溢出** — 封面 56pt + 全角「」导致「训练场」换到第三行撞副标题。修：44pt 一行，或拆成有意识的多行 + 间距
2. **超窄文本框被裁** — 0.1″ 宽的竖向标签会渲染成断行碎片。**别用低于 0.4″ 的文本容器**；要竖排就用 rotate，不用窄盒
3. **`reportlab.renderPM` 在沙箱里坏的**（缺 `rlPyCairo`）。不要用 `renderPM.drawToFile`，手动 PIL 栅格化
4. **`pip install` 没用**。先看预装列表，不要为没装的库设计架构
5. **LibreOffice CJK 字体 fallback**：找不到 `Microsoft YaHei` 会落到 Noto Sans CJK SC，也 OK。**别用渲染管线没有的冷门中文字体**
6. **`shadow` 对象复用会污染第二个形状**。一定写成 `() => ({...})` 工厂函数，每次形状调用
7. **颜色不要带 `#`**：永远 `"39C5BB"` 不是 `"#39C5BB"`。透明度也**不要**编进 8 位 hex，用 `opacity: 0.18`
8. **PptxGenJS 没有 `TRIANGLE` 形状** → 用 `LINE` 替代箭头指示
9. **封面背景图比例** — 必须用 1360×768（16:9）精确匹配幻灯片，其他比例会裁切或留白

---

## 8. 强制 QA 循环

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

然后**把每张 slide 图加载到 transcript**，用挑刺的眼光看：

- [ ]  标题换行？和下方副标题撞了吗？
- [ ]  章节下划线对齐到（可能换行的）标题了吗？
- [ ]  卡内正文溢出底边了吗？
- [ ]  主色 on 浅主色、副色 on 副色——文字看不见？
- [ ]  `scripts/color-qa.mjs` 检查过正文/标题/图形的所有前景-背景组合？
- [ ]  正文对比度 ≥ 4.5:1，大标题/图形/边框 ≥ 3:1？
- [ ]  是否出现红绿状态只靠颜色区分、双高饱和文字/背景、浅灰压浅底？
- [ ]  页脚压内容了吗？
- [ ]  CJK 渲染成豆腐块了吗？
- [ ]  AI 配图比例是否与 PPT 布局匹配？
- [ ]  背景图上文字是否可读（遮罩够深）？
- [ ]  图片与文字间距 ≥ 0.15″？

**只重渲染问题页**：

```bash
pdftoppm -jpeg -r 100 -f N -l N deck.pdf slide-fix
```

**至少完成一轮「修复 → 复查 → 无新问题」**才算完工。

---

## 9. 默认文件布局

```
skills/themed-cn-pptx/
  skill.md                     # 本文档
  references/
    aesthetic-rules.md         # 视觉系统与美学负面清单
    image-constraints.md       # 生图 manifest、尺寸、负面 prompt
  lib/
    ai-image.js                # StepFun / MiniMax 通用生图工具库
    stepfun-image.js           # 旧脚本兼容入口，re-export ai-image.js
  examples/
    build_<theme>.js           # 可选：示例构建脚本
```

项目构建目录：

```
/data/
  build_<theme>.js             # PptxGenJS 脚本
  lib/
    ai-image.js                # 生图工具库副本
    stepfun-image.js           # 兼容旧脚本时才需要
  assets/
    stepfun/                   # StepFun 生成的图片
      YYYY-MM-DD-xxxx.png
    minimax/                   # MiniMax 生成的图片
      YYYY-MM-DD-xxxx.png
  qr.png                       # 收尾页二维码
  <output>.pptx                # 最终交付
  <output>.pdf                 # QA 渲染
  slide-*.jpg                  # QA 视觉
```

把 `.js` 和 `.pptx` 一起留着，用户后续要微调时可以局部改，不用从零重来。

---

## 10. 完工前清单

### 通用

- [ ]  调色板只有一个主色，不互相竞争
- [ ]  每页都有 stripe + sectionTitle + footer（封面/收尾除外）
- [ ]  封面主标题不溢出
- [ ]  二维码能扫（带边框 + 高纠错 + 框在白底里）
- [ ]  页数上限遵守
- [ ]  用户要求隐去的话题确实隐去
- [ ]  完整 PDF → JPG QA 至少一轮且问题已修
- [ ]  `.pptx` 可编辑（无奇怪嵌入、无图片化的文字）

### AI 生图

- [ ]  背景图用 1360×768（16:9）匹配幻灯片，不裁切不留白
- [ ]  MiniMax 背景图用 `16:9`，StepFun 背景图用 1360×768，均匹配幻灯片
- [ ]  卡片配图比例与 PPT 布局一致（1:1 → card, 4:3 → cardWide/showcase, 3:4 → cardTall）
- [ ]  背景图上有文字时，叠加半透明遮罩确保可读
- [ ]  卡片内图片与文字间距 ≥ 0.15″，不贴死
- [ ]  所选 provider 的 API key 未设置时不报错，优雅降级为纯色/占位

### 改 PPT 路径额外检查

- [ ]  原有未修改页的内容和排版保持不变
- [ ]  修改后的色板在所有页（含未改页）上一致
- [ ]  新增配图与已有视觉风格协调

### 从文稿到 PPT 路径额外检查

- [ ]  文稿核心信息全部覆盖，无遗漏
- [ ]  页面逻辑顺序（定位→背景→理论→展示→讨论→收尾）合理
- [ ]  每页信息密度适中，不堆砌
