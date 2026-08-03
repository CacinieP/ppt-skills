import type { DeckPlan, FontPair, SlidePlan, StyleMetrics, Theme } from "./types";

/**
 * Render a DeckPlan into a PptxGenJS Node Buffer (.pptx binary) entirely in
 * memory — never touches disk. Implements the 5-page-type discipline from the
 * pptx-generator skill's slide-types.md.
 *
 * Hard constraints enforced (from pitfalls.md):
 *  - colors are 6-char hex WITHOUT '#'
 *  - no gradients / no animations (solid fills only)
 *  - body text never bold (bold reserved for titles)
 *  - option objects created fresh per call (PptxGenJS mutates them)
 *  - createSlide logic is synchronous
 *  - every non-cover slide has a page-number badge at x:9.3 y:5.1
 *  - dimensions fixed at 10" x 5.625" (LAYOUT_16x9)
 */
// pptxgenjs has no bundled types in some setups; we declare the surface we use.
type AnyPptx = any;

export async function renderPptx(plan: DeckPlan, ctx: {
  theme: Theme;
  fonts: FontPair;
  style: StyleMetrics;
  language: "zh-CN" | "en-US";
}): Promise<Buffer> {
  // pptxgenjs is CommonJS; import dynamically on the server only.
  const mod: any = await import("pptxgenjs");
  const PptxGenJS = mod.default ?? mod;
  const pres: AnyPptx = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "pptx-web";
  pres.title = plan.title;

  const { theme, fonts, style } = ctx;

  plan.slides.forEach((slide, idx) => {
    renderSlide(pres, slide, idx, { theme, fonts, style });
  });

  // In-memory buffer output (no disk write).
  const result = await pres.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(result) ? result : Buffer.from(result as ArrayBuffer);
}

interface RenderCtx { theme: Theme; fonts: FontPair; style: StyleMetrics; }

/** Dispatch a single slide to its type renderer. */
function renderSlide(pres: AnyPptx, slide: SlidePlan, idx: number, ctx: RenderCtx): void {
  const pageNum = idx + 1;
  const s: AnyPptx = pres.addSlide();
  s.background = { color: ctx.theme.bg };

  switch (slide.type) {
    case "cover":
      renderCover(pres, s, slide, ctx);
      break; // no badge on cover
    case "toc":
      renderToc(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;
    case "section":
      renderSection(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;
    case "content":
      renderContent(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;
    case "summary":
      renderSummary(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;
  }
}

// ---- Per-type renderers -------------------------------------------------

function renderCover(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;
  const left = m + 0.6;

  // Left accent bar.
  s.addShape(pres.shapes.RECTANGLE, { x: m, y: 1.7, w: 0.12, h: 1.6, fill: { color: theme.accent } });

  // Big title.
  s.addText(slide.title, {
    x: left, y: 1.7, w: 10 - left - m, h: 1.6,
    fontSize: 54, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "left", valign: "middle", lineSpacingMultiple: 1.0,
  });

  // Subtitle (bullets[0]) + meta (rest).
  const subtitle = slide.bullets[0];
  if (subtitle) {
    s.addText(subtitle, {
      x: left, y: 3.35, w: 10 - left - m, h: 0.6,
      fontSize: 22, fontFace: fonts.body, color: theme.secondary,
      align: "left", valign: "top",
    });
  }
  const meta = slide.bullets.slice(1).join("  ·  ");
  if (meta) {
    s.addText(meta, {
      x: left, y: 4.5, w: 10 - left - m, h: 0.4,
      fontSize: 13, fontFace: fonts.body, color: theme.accent,
      align: "left", valign: "top", charSpacing: 1,
    });
  }
}

function renderToc(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;
  const items = slide.bullets.slice(0, 6);

  s.addText(slide.title || "Contents", {
    x: m, y: m, w: 10 - 2 * m, h: 0.9,
    fontSize: 34, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "left", valign: "middle",
  });

  const listTop = m + 1.1;
  const rowH = Math.min(0.7, (5.625 - listTop - m) / Math.max(items.length, 1));
  items.forEach((text, i) => {
    const y = listTop + i * rowH;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: m, y, w: 0.7, h: rowH,
      fontSize: 22, fontFace: fonts.header, color: theme.accent,
      bold: true, align: "left", valign: "middle",
    });
    s.addText(text, {
      x: m + 0.8, y, w: 10 - 2 * m - 0.8, h: rowH,
      fontSize: 18, fontFace: fonts.body, color: theme.secondary,
      align: "left", valign: "middle",
    });
  });
}

function renderSection(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.35, h: 5.625, fill: { color: theme.accent } });

  const num = slide.title.match(/^\d+/)?.[0] ?? slide.title;
  s.addText(num, {
    x: m + 0.4, y: 1.0, w: 9 - m, h: 2.2,
    fontSize: 96, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "left", valign: "middle",
  });

  const intro = slide.bullets.join("  ");
  if (intro) {
    s.addText(intro, {
      x: m + 0.4, y: 3.4, w: 9 - m, h: 1.2,
      fontSize: 18, fontFace: fonts.body, color: theme.secondary,
      align: "left", valign: "top", lineSpacingMultiple: 1.2,
    });
  }
}

function renderContent(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;

  s.addText(slide.title, {
    x: m, y: m, w: 10 - 2 * m, h: 0.9,
    fontSize: 30, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "left", valign: "middle",
  });

  // Accent underline.
  s.addShape(pres.shapes.LINE, { x: m, y: m + 0.95, w: 1.2, h: 0, line: { color: theme.accent, width: 2 } });

  const bodyTop = m + 1.25;
  const bodyH = 5.625 - bodyTop - m;
  const n = Math.max(slide.bullets.length, 1);
  // Each bullet gets its own fresh option object (PptxGenJS mutates them).
  slide.bullets.slice(0, 6).forEach((b, i) => {
    s.addText(b, {
      x: m, y: bodyTop + (i * bodyH) / n, w: 10 - 2 * m, h: bodyH / n,
      fontSize: 16, fontFace: fonts.body, color: theme.secondary,
      align: "left", valign: "top", bullet: true, lineSpacingMultiple: 1.15,
    });
  });
}

function renderSummary(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;

  s.addText(slide.title || "Thank You", {
    x: m, y: 1.4, w: 10 - 2 * m, h: 1.4,
    fontSize: 48, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "center", valign: "middle",
  });

  slide.bullets.slice(0, 4).forEach((b, i) => {
    s.addText(b, {
      x: 1.5, y: 3.0 + i * 0.5, w: 7, h: 0.45,
      fontSize: 16, fontFace: fonts.body, color: theme.secondary,
      align: "center", valign: "middle", bullet: { code: "2713" },
    });
  });
}

// ---- Badge ---------------------------------------------------------------

function addBadge(pres: AnyPptx, s: AnyPptx, pageNum: number, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  if (style.badge === "pill") {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 9.1, y: 5.15, w: 0.6, h: 0.35,
      fill: { color: theme.accent }, rectRadius: 0.15,
    });
    s.addText(String(pageNum).padStart(2, "0"), {
      x: 9.1, y: 5.15, w: 0.6, h: 0.35,
      fontSize: 11, fontFace: fonts.body, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  } else {
    s.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
    s.addText(String(pageNum), {
      x: 9.3, y: 5.1, w: 0.4, h: 0.4,
      fontSize: 12, fontFace: fonts.body, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  }
}
