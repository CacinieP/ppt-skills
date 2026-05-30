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

---

# PPT 技能合集

[![License](https://img.shields.io/github/license/CacinieP/ppt-skills?style=flat-square)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square)](skills/)

开源 PPT 生成技能合集 — 基于 PptxGenJS，支持主题化、CJK 适配、可编辑 PPTX 输出。

每个技能都是一个自包含的配方，用于构建设计一致、CJK 渲染正确、品牌级视觉打磨的演示文稿。

## 有什么不同

- **可编辑输出**：生成的文件是 `.pptx`，不是扁平图片
- **CJK 适配布局**：中文文本、字体回退和换行是一等约束
- **主题配方**：每个技能定义色板、排版、布局和 QA 步骤
- **生产检查清单**：技能包含渲染验证，而非仅代码片段

## 技能列表

| 技能 | 描述 | 状态 |
|------|------|------|
| [themed-cn-pptx](skills/themed-cn-pptx/) | 构建中文 + IP/角色主题 + 可嵌入二维码的可编辑 PPTX | 已发布 |

## 使用方法

1. 从 `skills/` 目录选择一个技能
2. 阅读技能文档 — 涵盖任务分解、色板、布局和 QA
3. 按照技能模式编写 `build_<theme>.js` 脚本
4. 用 Node.js + PptxGenJS 运行生成 `.pptx`

## 贡献

有 PPT 技能配方？提交 PR：

```
skills/<skill-name>/skill.md
skills/<skill-name>/examples/     # 可选：示例构建脚本
```

## 许可

MIT
