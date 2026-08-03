# pptx-web

[`pptx-generator`](https://github.com/CacinieP/ppt-skills/) skill 的本地可视化入口:在浏览器里填表单,本机用 PptxGenJS 按 skill 的设计系统生成真正的 `.pptx` 文件。

这是一个**本地工具**,不是在线服务。`npm run dev` 起服务,key 用自己的,全程不经过第三方。和 skill 本身一样,装得起就能用,不需要公网、不需要部署、不需要注册。

## 它做什么

```
主题 + 配置  →  LLM 生成结构化大纲  →  PptxGenJS 渲染  →  下载 .pptx
```

LLM 被约束成必须输出一份大纲,**每页只能是 5 种页面类型之一**——`cover` / `toc` / `section` / `content` / `summary`,并强制结构规则(首页必封面、末页必总结、布局不连续重复)。渲染器再把每种类型映射成具体的 PptxGenJS 布局,严格遵循 skill 的设计规范。

产出的是**二进制 `.pptx`**,可直接用 PowerPoint / Keynote / Google Slides 打开,不是 Markdown。

## 内置的设计系统(来自 skill)

| 维度 | 选项 |
|---|---|
| **5 种页面类型** | cover · toc · section · content · summary |
| **18 个调色板** | 每个 5 色 `{primary, secondary, accent, light, bg}` 主题 |
| **8 种字体配对** | Georgia/Calibri、Arial Black/Arial、… |
| **4 种风格** | Sharp · Soft · Rounded · Pill(控制圆角和间距) |
| **页码徽标** | 圆形或胶囊,除封面外每页必加(`x:9.3 y:5.1`) |

## 快速开始

```bash
npm install
cp .env.example .env.local   # 填入 OPENAI_API_KEY
npm run dev                  # 打开 http://localhost:3000
```

### 环境变量

只有 `OPENAI_API_KEY` 必填,任何 OpenAI 兼容的聊天补全服务都行。变量**仅在服务端**读取,不暴露给浏览器。

| 变量 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `OPENAI_API_KEY` | ✅ | — | 任意 OpenAI 兼容的 key |
| `OPENAI_BASE_URL` | ❌ | `https://open.bigmodel.cn/api/paas/v4` | 默认指向智谱 BigModel |
| `OPENAI_MODEL` | ❌ | `glm-4-plus` | 必须支持 `response_format: json_object` |

完整配置见 [`docs/ENV.md`](./docs/ENV.md)——含各家服务商(智谱/OpenAI/DeepSeek/Kimi/通义/Ollama)的填法、中国网络代理注意事项、报错排查表。

## 预览原理

`/api/generate` 的响应是二进制 `.pptx`,同时把大纲 JSON 放在 `X-Deck-Plan` 响应头里。客户端解码这个头部,在预览面板渲染出真实的页面大纲——不需要第二次调 LLM。

## 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PptxGenJS

## 项目结构

```
src/
├── app/
│   ├── api/generate/route.ts   # POST: LLM 出大纲 → PptxGenJS → 二进制 .pptx
│   ├── layout.tsx · globals.css
│   └── page.tsx                # 配置表单 + 预览 + 下载
├── lib/
│   ├── types.ts                # SlideType, Theme, DeckPlan, …
│   ├── palettes.ts             # 18 调色板 + 字体 + 风格 metrics
│   ├── prompt.ts               # 带 5 页面类型约束的 prompt + 大纲校验器
│   └── render.ts               # PptxGenJS 渲染器(5 类型分派 + 徽标)
└── components/
    ├── ConfigPanel.tsx · PalettePicker.tsx
    └── PreviewPanel.tsx · DownloadCard.tsx
```
