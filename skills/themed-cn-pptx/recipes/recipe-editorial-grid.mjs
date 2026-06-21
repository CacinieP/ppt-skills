/**
 * recipe-editorial-grid.mjs — locked aesthetic recipe: 中文编辑设计风.
 *
 * This is one of two "locked recipes" shipped with the skill. It instantiates
 * the `cjk-swiss-accent` style from references/aesthetic-rules.md as runnable
 * code: a restrained, left-aligned, hairline-driven editorial look for serious
 * Chinese delivery decks (reports, proposals, academic, product briefs).
 *
 * What is locked (see design-contract.md for the full list):
 *   - palette: Nord-derived neutral ladder + ONE accent (no second saturated hue)
 *   - typography ladder: 44/28/16/11pt, CJK-safe, charSpacing only on Latin kickers
 *   - repeated marks: top hairline + dual-segment underline + footer + page badge
 *   - no shadows, no gradients, no rounded rectangles for cards (hairline only)
 *
 * Two ways to use it:
 *
 *   1. As a demo (see the locked look immediately):
 *        node examples/build_editorial_demo.mjs
 *      `build(pres)` emits a fixed 6-slide demo — it is NOT composable; it
 *      always writes its own demo text. Treat it as "show me what this recipe
 *      looks like", not as a parameterized generator.
 *
 *   2. As a library for YOUR deck (the intended way to ship real content):
 *        import { theme, marks, hairlineCard, FONT_CJK, FONT_LATIN } from
 *          "./skills/themed-cn-pptx/recipes/recipe-editorial-grid.mjs";
 *        const m = marks(pres, theme);   // { hairline, sectionTitle, footer }
 *        // ... call m.hairline(slide), m.sectionTitle(slide, kicker, title),
 *        //     m.footer(slide, n, total, label), and hairlineCard(pres, slide, {x,y,w,h})
 *        //     on slides YOU author with YOUR text. Do NOT call build().
 *
 * `marks.footer(slide, n, total, label)` renders the padded page number `n`
 * only (the `total` arg is accepted for symmetry but not drawn, to keep the
 * badge minimal). Cover and closing slides are exempt — just don't call footer()
 * on them.
 *
 * No API keys required — image slots fall back to solid hairline cards.
 */

export const theme = {
  // Locked neutral ladder (Nord Polar Night + Snow Storm) + Frost accent.
  accent: "88C0D0",      // Frost — the ONE saturated color, used sparingly
  accentDeep: "5E81AC",  // darker Frost, for the underline tail segment
  ink: "2E3440",         // darkest neutral, titles
  body: "3B4252",        // body text
  muted: "4C566A",       // captions, footer
  paper: "ECEFF4",       // light slide background
  paperAlt: "E5E9F0",    // zebra row / soft card
  white: "FFFFFF",
  line: "D8DEE9",        // hairline
};

export const FONT_CJK = "Microsoft YaHei";
export const FONT_LATIN = "Arial";

const SW = 10;
const SH = 5.625;

/**
 * Repeated brand marks — call on every content slide.
 * @param {object} pres  PptxGenJS presentation
 * @param {object} theme theme object (this recipe's export)
 */
export function marks(pres, theme) {
  function hairline(slide) {
    // 1pt top hairline in the accent, full width — the deck's heartbeat.
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: SW, h: 0.014,
      fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: SH - 0.014, w: SW, h: 0.014,
      fill: { color: theme.line }, line: { color: theme.line, width: 0 },
    });
  }

  // Section title: kicker + dual-segment underline (long accent + short deep).
  function sectionTitle(slide, kicker, title) {
    slide.addText(kicker, {
      x: 0.6, y: 0.4, w: 6, h: 0.28,
      fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.accent,
      charSpacing: 4, margin: 0,
    });
    slide.addText(title, {
      x: 0.6, y: 0.66, w: 8.8, h: 0.7,
      fontSize: 28, fontFace: FONT_CJK, bold: true, color: theme.ink, margin: 0,
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.4, w: 0.9, h: 0.03,
      fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.54, y: 1.4, w: 0.28, h: 0.03,
      fill: { color: theme.accentDeep }, line: { color: theme.accentDeep, width: 0 },
    });
  }

  // Footer + page badge (badge uses a hairline pill, no fill, per the contract).
  function footer(slide, n, total, deckLabel) {
    slide.addText(deckLabel || "Deck", {
      x: 0.6, y: SH - 0.34, w: 6, h: 0.24,
      fontSize: 9, fontFace: FONT_LATIN, color: theme.muted, margin: 0,
    });
    slide.addText(`${String(n).padStart(2, "0")}`, {
      x: SW - 1.1, y: SH - 0.34, w: 0.5, h: 0.24,
      fontSize: 9, fontFace: FONT_LATIN, color: theme.muted, align: "right", margin: 0,
    });
  }

  return { hairline, sectionTitle, footer };
}

/**
 * Hairline card — no shadow, no rounded corner, just a 1px outline.
 * Used instead of shadowed rounded cards to honor the editorial discipline.
 */
export function hairlineCard(pres, slide, { x, y, w, h }) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: theme.white },
    line: { color: theme.line, width: 1 },
  });
}

/**
 * Build a 6-slide demo deck into the given presentation.
 * Each slide demonstrates one locked layout from references/layout-slots.md.
 */
export function build(pres, opts = {}) {
  pres.layout = "LAYOUT_16x9";
  const m = marks(pres, theme);
  const label = opts.deckLabel || "Editorial Grid · ppt-skills";

  // Slide 1 — Cover (Cover contract: stripe + title, no badge)
  const cover = pres.addSlide();
  cover.background = { fill: theme.paper };
  m.hairline(cover);
  cover.addText("REPORT · 2026", {
    x: 0.6, y: 1.5, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.accent, charSpacing: 4, margin: 0,
  });
  cover.addText("可编辑中文 PPT 的\n生成与验收", {
    x: 0.6, y: 1.95, w: 8.8, h: 1.8,
    fontSize: 40, fontFace: FONT_CJK, bold: true, color: theme.ink,
    lineSpacingMultiple: 1.15, margin: 0,
  });
  cover.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.95, w: 1.2, h: 0.04,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
  });
  cover.addShape(pres.shapes.RECTANGLE, {
    x: 1.84, y: 3.95, w: 0.32, h: 0.04,
    fill: { color: theme.accentDeep }, line: { color: theme.accentDeep, width: 0 },
  });
  cover.addText("ppt-skills · github.com/CacinieP/ppt-skills", {
    x: 0.6, y: 4.6, w: 8, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, color: theme.muted, margin: 0,
  });

  // Slide 2 — Section + 3 hairline cards (TwoCard-style, 3 columns)
  const s2 = pres.addSlide();
  s2.background = { fill: theme.paper };
  m.hairline(s2);
  m.sectionTitle(s2, "CORE", "核心能力");
  const cards = [
    { t: "可编辑交付", d: "真实 .pptx，文字可改" },
    { t: "中文排版优先", d: "全角标点与字号阶" },
    { t: "渲染验收", d: "溢出与遮挡自动检查" },
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 3.0;
    hairlineCard(pres, s2, { x, y: 1.75, w: 2.8, h: 2.6 });
    s2.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.3, y: 1.95, w: 1, h: 0.35,
      fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.accent, margin: 0,
    });
    s2.addText(c.t, {
      x: x + 0.3, y: 2.35, w: 2.3, h: 0.5,
      fontSize: 16, fontFace: FONT_CJK, bold: true, color: theme.ink, margin: 0,
    });
    s2.addText(c.d, {
      x: x + 0.3, y: 2.9, w: 2.3, h: 1.3,
      fontSize: 11, fontFace: FONT_CJK, color: theme.body, lineSpacingMultiple: 1.35, margin: 0,
    });
  });
  m.footer(s2, 2, 6, label);

  // Slide 3 — Striped table (StripedTable contract)
  const s3 = pres.addSlide();
  s3.background = { fill: theme.paper };
  m.hairline(s3);
  m.sectionTitle(s3, "CONTRAST", "两条路线对比");
  const rows = [
    ["维度", "HTML 演讲 deck", "可编辑 PPTX"],
    ["输出物", "单文件 HTML", "真实 .pptx"],
    ["可二次编辑", "需改 HTML", "PowerPoint 直接改"],
    ["中文排版", "依赖 CSS", "字号 + 字体约束"],
    ["验收方式", "版式校验器", "渲染 + 启发式 QA"],
  ];
  const tableX = 0.6, tableY = 1.75, colW = [1.6, 3.6, 4.0], rowH = 0.5;
  rows.forEach((row, ri) => {
    const y = tableY + ri * rowH;
    const isHeader = ri === 0;
    if (!isHeader && ri % 2 === 1) {
      s3.addShape(pres.shapes.RECTANGLE, {
        x: tableX, y, w: colW.reduce((a, b) => a + b, 0), h: rowH,
        fill: { color: theme.paperAlt }, line: { color: theme.paperAlt, width: 0 },
      });
    }
    let cx = tableX;
    row.forEach((cell, ci) => {
      s3.addText(cell, {
        x: cx + 0.15, y, w: colW[ci] - 0.2, h: rowH,
        fontSize: isHeader ? 11 : 12,
        fontFace: FONT_CJK,
        bold: isHeader || ci === 0,
        color: isHeader ? theme.accent : theme.body,
        valign: "middle", margin: 0,
      });
      cx += colW[ci];
    });
    // hairline under each row
    s3.addShape(pres.shapes.RECTANGLE, {
      x: tableX, y: y + rowH - 0.005, w: colW.reduce((a, b) => a + b, 0), h: 0.005,
      fill: { color: theme.line }, line: { color: theme.line, width: 0 },
    });
  });
  m.footer(s3, 3, 6, label);

  // Slide 4 — Statement / big quote (no image, accent only)
  const s4 = pres.addSlide();
  s4.background = { fill: theme.white };
  m.hairline(s4);
  m.sectionTitle(s4, "PRINCIPLE", "设计原则");
  s4.addText("克制的留白和一致的字号阶，\n比任何装饰都更能让中文 deck 显得专业。", {
    x: 0.6, y: 1.95, w: 8.8, h: 1.6,
    fontSize: 22, fontFace: FONT_CJK, color: theme.ink, lineSpacingMultiple: 1.4, margin: 0,
  });
  s4.addText("— ppt-skills editorial recipe", {
    x: 0.6, y: 3.7, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: FONT_LATIN, color: theme.muted, margin: 0,
  });
  m.footer(s4, 4, 6, label);

  // Slide 5 — Big-number stats (Matrix-ish, 3 stats)
  const s5 = pres.addSlide();
  s5.background = { fill: theme.paper };
  m.hairline(s5);
  m.sectionTitle(s5, "QA COVERAGE", "验收覆盖");
  const stats = [
    { n: "3", l: "QA 工具", s: "渲染 · CJK · 可编辑性" },
    { n: "P0", l: "强制门禁", s: "溢出 / 扁平化 / 宏" },
    { n: "WCAG", l: "色彩对比", s: "AA 4.5:1 / 3:1" },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.0;
    hairlineCard(pres, s5, { x, y: 1.85, w: 2.8, h: 2.4 });
    s5.addText(st.n, {
      x: x + 0.3, y: 2.05, w: 2.4, h: 1.0,
      fontSize: 54, fontFace: FONT_LATIN, bold: true, color: theme.accent, margin: 0,
    });
    s5.addText(st.l, {
      x: x + 0.3, y: 3.15, w: 2.4, h: 0.4,
      fontSize: 16, fontFace: FONT_CJK, bold: true, color: theme.ink, margin: 0,
    });
    s5.addText(st.s, {
      x: x + 0.3, y: 3.6, w: 2.4, h: 0.5,
      fontSize: 11, fontFace: FONT_CJK, color: theme.muted, margin: 0,
    });
  });
  m.footer(s5, 5, 6, label);

  // Slide 6 — Closing (ClosingQR contract: stripe + title + image-slot placeholder)
  const s6 = pres.addSlide();
  s6.background = { fill: theme.ink };
  // top hairline variant on dark
  s6.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: 0.014,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
  });
  s6.addText("START USING IT", {
    x: 0.6, y: 1.3, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.accent, charSpacing: 4, margin: 0,
  });
  s6.addText("把这套 recipe\n用在你自己的 deck", {
    x: 0.6, y: 1.75, w: 8.8, h: 1.6,
    fontSize: 36, fontFace: FONT_CJK, bold: true, color: theme.white, lineSpacingMultiple: 1.15, margin: 0,
  });
  s6.addText("npx skills add https://github.com/CacinieP/ppt-skills --skill themed-cn-pptx", {
    x: 0.6, y: 4.1, w: 8.8, h: 0.4,
    fontSize: 12, fontFace: "Consolas", color: theme.accent, margin: 0,
  });
  s6.addText("github.com/CacinieP/ppt-skills", {
    x: 0.6, y: 4.6, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, color: theme.line, margin: 0,
  });

  return pres;
}

// ---- demo runner ---------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: pptxgen } = await import("pptxgenjs");
  const { resolve } = await import("node:path");
  const { mkdir } = await import("node:fs/promises");
  const pres = new pptxgen();
  build(pres);
  const outDir = resolve(process.cwd(), "examples/slides/output");
  await mkdir(outDir, { recursive: true });
  const out = resolve(outDir, "editorial-demo.pptx");
  await pres.writeFile({ fileName: out });
  console.log(`Editorial demo PPTX generated: ${out}`);
  console.log("6 slides: cover, 3 hairline cards, striped table, statement, stats, closing");
}
