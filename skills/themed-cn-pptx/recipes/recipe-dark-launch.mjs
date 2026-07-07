/**
 * recipe-dark-launch.mjs — locked aesthetic recipe: 深底发布风.
 *
 * Second of the two locked recipes. Instantiates the `dark-tech-launch` style
 * from references/aesthetic-rules.md: deep background, large type, high
 * contrast, an image hero with a semi-transparent overlay, and a strong CTA /
 * QR closing slide. Built for keynote-style launches, demo days, final CTAs.
 *
 * What is locked (see design-contract.md):
 *   - palette: deep navy + bright accent + near-white text on dark (WCAG AA)
 *   - typography: oversized titles (44/40pt), generous tracking on Latin
 *   - every image sits behind a 40-55% overlay so text stays readable
 *   - closing slide reserves a white-framed QR slot
 *
 * Two ways to use it:
 *
 *   1. As a demo (see the locked look immediately):
 *        node examples/build_darklaunch_demo.mjs
 *      `build(pres)` emits a fixed 5-slide demo — it is NOT composable; it
 *      always writes its own demo text. Treat it as "show me what this recipe
 *      looks like", not as a parameterized generator.
 *
 *   2. As a library for YOUR deck (the intended way to ship real content):
 *        import { theme, overlay, FONT_CJK, FONT_LATIN } from
 *          "./skills/themed-cn-pptx/recipes/recipe-dark-launch.mjs";
 *        // overlay(pres, slide, { opacity: 45 }) over any background image
 *        // ... author your own slides with the locked theme + overlay().
 *        //     Do NOT call build().
 *
 * The dark-launch recipe keeps its repeated marks (topStripe, sectionTitle,
 * footer) as module-private helpers because the closing/QR layout is bespoke;
 * copy the slide-5 block from build() when you need a framed QR closing slide.
 *
 * No API keys required — image slots fall back to solid backgrounds + overlays.
 */

export const theme = {
  accent: "39C5BB",       // bright teal — the single saturated hue
  accentSoft: "9FE8E2",
  deepBg: "0B1B2B",       // deep navy, cover / closing
  deepBgAlt: "06121E",
  midBg: "13243A",        // content slides on dark
  white: "FFFFFF",
  textOnDark: "E8FFFD",
  mutedOnDark: "8FA6B4",
  pink: "FF77AA",         // small (~10%) secondary, callouts only
};

export const FONT_CJK = "Microsoft YaHei";
export const FONT_LATIN = "Arial";

const SW = 10;
const SH = 5.625;

/**
 * 40-55% dark overlay rectangle. Required over ANY background image that has
 * text on top. opacity here is the user-facing 40-50 integer (mapped to
 * PptxGenJS transparency internally, matching lib/ai-image.js addImageOverlay).
 */
export function overlay(pres, slide, { color = theme.deepBg, opacity = 45, x = 0, y = 0, w = SW, h = SH } = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color, transparency: opacity },
    line: { color, transparency: opacity, width: 0 },
  });
}

function topStripe(pres, slide) {
  // bright accent hairline top + thin pink tail — the deck's signature.
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: 0.06,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.06, w: SW, h: 0.02,
    fill: { color: theme.pink }, line: { color: theme.pink, width: 0 },
  });
}

function sectionTitle(slide, kicker, title) {
  slide.addText(kicker, {
    x: 0.6, y: 0.42, w: 6, h: 0.28,
    fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.accent, charSpacing: 4, margin: 0,
  });
  slide.addText(title, {
    x: 0.6, y: 0.7, w: 8.8, h: 0.7,
    fontSize: 28, fontFace: FONT_CJK, bold: true, color: theme.white, margin: 0,
  });
}

function footer(slide, n, total, label) {
  slide.addText(label || "Launch", {
    x: 0.6, y: SH - 0.34, w: 6, h: 0.24,
    fontSize: 9, fontFace: FONT_LATIN, color: theme.mutedOnDark, margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: SW - 1.1, y: SH - 0.34, w: 0.5, h: 0.24,
    fontSize: 9, fontFace: FONT_LATIN, color: theme.mutedOnDark, align: "right", margin: 0,
  });
}

/**
 * Build a 5-slide dark-launch demo.
 * Image slots use solid fallbacks; swap addImage calls in for real builds.
 */
export function build(pres, opts = {}) {
  pres.layout = "LAYOUT_16x9";
  const label = opts.deckLabel || "Dark Launch · ppt-skills";

  // Slide 1 — Cover with hero image slot (CoverBackground contract)
  const cover = pres.addSlide();
  cover.background = { fill: theme.deepBg };
  topStripe(pres, cover);
  // Hero image slot — in a real build:
  //   const img = await generateSlideImage({ usage: "cover", prompt });
  //   if (img) cover.addImage({ path: img.localPath, x:0, y:0, w:10, h:5.625 });
  // Solid fallback so the demo runs with no API key:
  cover.addShape(pres.shapes.OVAL, {
    x: 6.2, y: -0.6, w: 5.4, h: 5.4,
    fill: { color: theme.accent, transparency: 86 },
    line: { color: theme.accent, transparency: 86, width: 0 },
  });
  overlay(pres, cover, { opacity: 40 });
  cover.addText("LAUNCH · 2026", {
    x: 0.6, y: 1.4, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.pink, charSpacing: 4, margin: 0,
  });
  cover.addText("深底发布风", {
    x: 0.6, y: 1.85, w: 8.8, h: 1.1,
    fontSize: 44, fontFace: FONT_CJK, bold: true, color: theme.white, margin: 0,
  });
  cover.addText("Editable, CJK-aware PPTX for keynote moments", {
    x: 0.6, y: 3.0, w: 8.8, h: 0.5,
    fontSize: 18, fontFace: FONT_LATIN, color: theme.accent, margin: 0,
  });
  cover.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.65, w: 1.2, h: 0.06,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
  });
  cover.addShape(pres.shapes.RECTANGLE, {
    x: 1.84, y: 3.65, w: 0.32, h: 0.06,
    fill: { color: theme.pink }, line: { color: theme.pink, width: 0 },
  });

  // Slide 2 — Three pillars (ThreeForces-style on dark)
  const s2 = pres.addSlide();
  s2.background = { fill: theme.midBg };
  topStripe(pres, s2);
  sectionTitle(s2, "PILLARS", "三个支柱");
  const pillars = [
    { n: "01", t: "可编辑 PPTX", d: "文字可改，字体保留" },
    { n: "02", t: "中文优先", d: "全角标点与字号阶" },
    { n: "03", t: "自动验收", d: "溢出与遮挡检查" },
  ];
  pillars.forEach((p, i) => {
    const x = 0.6 + i * 3.0;
    s2.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.8, w: 2.8, h: 2.7,
      fill: { color: theme.deepBg }, line: { color: theme.accent, width: 1 },
    });
    s2.addText(p.n, {
      x: x + 0.3, y: 2.0, w: 1, h: 0.4,
      fontSize: 14, fontFace: FONT_LATIN, bold: true, color: theme.accent, margin: 0,
    });
    s2.addText(p.t, {
      x: x + 0.3, y: 2.45, w: 2.3, h: 0.5,
      fontSize: 18, fontFace: FONT_CJK, bold: true, color: theme.white, margin: 0,
    });
    s2.addText(p.d, {
      x: x + 0.3, y: 3.05, w: 2.3, h: 1.3,
      fontSize: 11, fontFace: FONT_CJK, color: theme.textOnDark, lineSpacingMultiple: 1.35, margin: 0,
    });
  });
  footer(s2, 2, 5, label);

  // Slide 3 — Hero stat band (KPI tower on dark)
  const s3 = pres.addSlide();
  s3.background = { fill: theme.deepBg };
  topStripe(pres, s3);
  sectionTitle(s3, "IMPACT", "一个核心数字");
  s3.addText("100%", {
    x: 0.6, y: 1.9, w: 6, h: 2.0,
    fontSize: 120, fontFace: FONT_LATIN, bold: true, color: theme.accent, margin: 0,
  });
  s3.addText("预设色板通过 WCAG AA 对比度门禁", {
    x: 0.6, y: 3.9, w: 8.8, h: 0.5,
    fontSize: 16, fontFace: FONT_CJK, color: theme.textOnDark, margin: 0,
  });
  footer(s3, 3, 5, label);

  // Slide 4 — Statement (big quote on dark)
  const s4 = pres.addSlide();
  s4.background = { fill: theme.deepBgAlt };
  topStripe(pres, s4);
  s4.addText("不做 HTML 演讲 deck 的竞品，\n做中文可编辑 PPTX 的工程底座。", {
    x: 0.6, y: 1.9, w: 8.8, h: 1.8,
    fontSize: 30, fontFace: FONT_CJK, bold: true, color: theme.white, lineSpacingMultiple: 1.3, margin: 0,
  });
  s4.addText("— ppt-skills 定位", {
    x: 0.6, y: 3.9, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: FONT_LATIN, color: theme.accent, margin: 0,
  });
  footer(s4, 4, 5, label);

  // Slide 5 — Closing + QR slot (ClosingQR contract: stripe + title + image slot)
  const s5 = pres.addSlide();
  s5.background = { fill: theme.deepBg };
  topStripe(pres, s5);
  s5.addText("GET STARTED", {
    x: 0.6, y: 1.2, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT_LATIN, bold: true, color: theme.pink, charSpacing: 4, margin: 0,
  });
  s5.addText("扫码 / Clone\n开始用", {
    x: 0.6, y: 1.65, w: 6, h: 1.6,
    fontSize: 40, fontFace: FONT_CJK, bold: true, color: theme.white, lineSpacingMultiple: 1.15, margin: 0,
  });
  s5.addText("github.com/CacinieP/ppt-skills", {
    x: 0.6, y: 3.4, w: 6, h: 0.35,
    fontSize: 12, fontFace: "Consolas", color: theme.accent, margin: 0,
  });
  // QR slot — white card frame on the right (in a real build, embed qr.png).
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 7.1, y: 1.8, w: 2.4, h: 2.7,
    fill: { color: theme.white }, line: { color: theme.accent, width: 2 },
  });
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 7.1, y: 1.8, w: 2.4, h: 0.35,
    fill: { color: theme.accent }, line: { color: theme.accent, width: 0 },
  });
  s5.addText("SCAN · 扫码访问", {
    x: 7.1, y: 1.8, w: 2.4, h: 0.35,
    fontSize: 10, fontFace: FONT_CJK, bold: true, color: theme.white, align: "center", valign: "middle", margin: 0,
  });
  // placeholder where a real qr.png would go
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 2.4, w: 1.6, h: 1.6,
    fill: { color: theme.deepBgAlt }, line: { color: theme.deepBgAlt, width: 0 },
  });
  s5.addText("QR", {
    x: 7.5, y: 2.4, w: 1.6, h: 1.6,
    fontSize: 20, fontFace: FONT_LATIN, bold: true, color: theme.mutedOnDark,
    align: "center", valign: "middle", margin: 0,
  });
  s5.addText("github.com/CacinieP/ppt-skills", {
    x: 7.1, y: 4.05, w: 2.4, h: 0.3,
    fontSize: 8, fontFace: "Consolas", color: theme.mutedOnDark, align: "center", margin: 0,
  });

  return pres;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: pptxgen } = await import("pptxgenjs");
  const { resolve } = await import("node:path");
  const { mkdir } = await import("node:fs/promises");
  const pres = new pptxgen();
  build(pres);
  const outDir = resolve(process.cwd(), "examples/slides/output");
  await mkdir(outDir, { recursive: true });
  const out = resolve(outDir, "darklaunch-demo.pptx");
  await pres.writeFile({ fileName: out });
  console.log(`Dark-launch demo PPTX generated: ${out}`);
  console.log("5 slides: cover(hero), 3 pillars, big stat, statement, closing+QR");
}
