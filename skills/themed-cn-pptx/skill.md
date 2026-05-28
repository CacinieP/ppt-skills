---
name: themed-cn-pptx
description: Build Chinese + IP/character-themed + QR-embeddable editable PPTX decks using PptxGenJS
---

<aside>
📌

**Skill 名称**：`themed-cn-pptx`

**适用**：用 PptxGenJS 构建中文 + IP/角色主题 + 嵌入二维码 的可编辑 PPTX 演示文稿

**依赖技能**：标准 `pptx` skill（本 skill 是它的增量补充）

</aside>

本文档是一次成功构建的提炼——10 页《语言 × 编程 训练场》初音主题演示稿，封面/收尾深底、内容浅底，第 10 页带可扫描的 GitHub 二维码。

---

## 1. 任务拆解（先做这一步）

在写代码前，从用户需求中先抽出：

- **IP / 主题** → 映射到 4 色身份（主色 + 副色 + 深底 + 浅底）
- **输出格式** → 确认 `.pptx`（可编辑）/ PDF Slides / Notion Slides / Presentation App，**不要假设**
- **语言** → 中文需要 CJK 字体 + 更紧的字号阶（全角字符在同 pt 下比 Latin 宽）
- **硬约束** → 页数上限、二维码目标 URL、需隐去的话题、品牌标识
- **内容源** → 用户粘贴的文本？GitHub README？现有 Notion 页？先抓取再写 slide

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

不要每页重新发明 layout。从这 9 种里挑：

| **#** | **类型** | **何时用** | **核心元素** |
| --- | --- | --- | --- |
| 1 | 封面（深底） | 第 1 页 | 角落半透明大椭圆 + kicker 胶囊 + 多行堆叠主标题 + 强调 bar + 作者块 |
| 2 | 引言 + 三支柱 | 定位 / 定义 | 带副色左 bar 的大引用卡 + 下方 3 个图标圆 mini-card |
| 3 | 双卡 + verdict | 两股对比力量 | 上 2 张白卡 + 下方一个深底 callout 写「所以呢」 |
| 4 | 条纹表格 | 3–5 行对比 | 主色 header bar + 交替白 / paperAlt 行 + 副色编号圆圈 |
| 5 | 矩阵 | 映射 / 同构 | N 列 × 主/副/白 横向色带网格 |
| 6 | 项目展示 | 突出某个项目 | 左侧深色卡 + 巨型数字 stat + 右侧 2×3 特性网格 |
| 7 | 双栏映射 | A ↔ B 等价 | 两侧 header bar + 交替行 + 中间副色三角箭头 |
| 8 | 问题堆叠 | 讨论提问 | Q1/Q2/Q3 卡堆叠 + 彩色字母圆 + 左侧色 bar |
| 9 | 收尾 + QR（深底） | 最终 CTA | 双色大标题 + 左侧联系列表 + 右侧 QR 卡（带框） |

用 8–10 张。**一个 deck 不要超过 5 种 layout**，否则视觉碎片化。

---

## 6. 无网络生成二维码

沙箱默认无网络——`pip install qrcode` 会失败。用 reportlab 内藏的 QR 编码器（预装）+ PIL 自己栅格化：

```python
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel, QR8bitByte
from PIL import Image

data = "https://github.com/CacinieP"
for v in range(1, 20):                              # 找能装下的最小版本
    try:
        qr = QRCode(v, QRErrorCorrectLevel.H)       # H = 最高纠错
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
- [ ]  页脚压内容了吗？
- [ ]  CJK 渲染成豆腐块了吗？

**只重渲染问题页**：

```bash
pdftoppm -jpeg -r 100 -f N -l N deck.pdf slide-fix
```

**至少完成一轮「修复 → 复查 → 无新问题」**才算完工。

---

## 9. 默认文件布局

```
/data/
  build_<theme>.js     # PptxGenJS 脚本
  qr.png               # 收尾页二维码
  <output>.pptx        # 最终交付
  <output>.pdf         # QA 渲染
  slide-*.jpg          # QA 视觉
```

把 `.js` 和 `.pptx` 一起留着，用户后续要微调（「粉色再浅一点」「在 7 页前插一页」）时可以局部改，不用从零重来。

---

## 10. 完工前一行清单

- [ ]  调色板只有一个主色，不互相竞争
- [ ]  每页都有 stripe + sectionTitle + footer（封面/收尾除外）
- [ ]  封面主标题不溢出
- [ ]  二维码能扫（带边框 + 高纠错 + 框在白底里）
- [ ]  页数上限遵守
- [ ]  用户要求隐去的话题确实隐去
- [ ]  完整 PDF → JPG QA 至少一轮且问题已修
- [ ]  `.pptx` 可编辑（无奇怪嵌入、无图片化的文字）