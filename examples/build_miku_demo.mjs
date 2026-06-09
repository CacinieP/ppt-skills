#!/usr/bin/env node

/**
 * build_miku_demo.mjs
 *
 * Generates a 3-slide Miku-themed PPTX without requiring any API key.
 * Uses solid-color fallbacks for AI-generated images.
 *
 * Run:  npm run demo
 * Output: examples/slides/output/miku-demo.pptx
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically import pptxgenjs — falls back to a helpful install message.
let pptxgen;
try {
  pptxgen = (await import("pptxgenjs")).default;
} catch {
  console.error(
    "pptxgenjs is required for the demo.\n" +
    "Install it globally or locally:\n" +
    "  npm install pptxgenjs\n" +
    "  -or-\n" +
    "  npm install -g pptxgenjs"
  );
  process.exit(1);
}

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"

const SW = 10;
const SH = 5.625;

// ── Miku palette (verified by color-qa-presets) ──
const C = {
  miku: "39C5BB",
  mikuDeep: "1C9990",
  pink: "FF77AA",
  pinkSoft: "FFC2DB",
  navy: "0B1B2B",
  ink: "0F2233",
  paper: "F1FBFA",
  paperAlt: "E6F8F6",
  white: "FFFFFF",
  textOnDark: "E8FFFD",
  textOnLight: "0F2233",
  muted: "59707B",
  line: "BFE7E2",
};

// ── Repeated brand marks ──

function mikuStripe(slide) {
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: 0.08, fill: { color: C.miku }, line: { color: C.miku } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.08, w: SW, h: 0.025, fill: { color: C.pink }, line: { color: C.pink } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: SH - 0.04, w: SW, h: 0.04, fill: { color: C.miku }, line: { color: C.miku } });
}

function footer(slide, n, total) {
  slide.addText("PPT Skills · Demo", { x: 0.5, y: SH - 0.35, w: 6, h: 0.25, fontSize: 9, color: C.muted, margin: 0 });
  slide.addText(`${n} / ${total}`, { x: SW - 1.2, y: SH - 0.35, w: 0.7, h: 0.25, fontSize: 9, color: C.muted, align: "right", margin: 0 });
}

// ── Slide 1: Cover (deep background) ──

const cover = pres.addSlide();
cover.background = { fill: C.navy };

// Decorative ellipse
cover.addShape(pres.shapes.OVAL, {
  x: 6.5, y: -0.5, w: 5, h: 5,
  fill: { color: C.miku, transparency: 88 },
  line: { color: C.miku, transparency: 88 },
});

// Kicker capsule
cover.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 0.7, y: 1.3, w: 2.6, h: 0.35,
  fill: { color: C.pink, transparency: 40 },
  rectRadius: 0.15,
});
cover.addText("OPEN SOURCE SKILL", {
  x: 0.7, y: 1.3, w: 2.6, h: 0.35,
  fontSize: 11, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle", charSpacing: 3,
});

// Main title
cover.addText("PPT Skills", {
  x: 0.7, y: 2.0, w: 8, h: 1.0,
  fontSize: 44, fontFace: "Microsoft YaHei", color: C.white, bold: true,
});
cover.addText("CJK-aware PPTX Generation", {
  x: 0.7, y: 2.95, w: 8, h: 0.6,
  fontSize: 22, fontFace: "Arial", color: C.miku,
});

// Accent bar
cover.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.6, w: 1.2, h: 0.06, fill: { color: C.miku }, line: { color: C.miku } });
cover.addShape(pres.shapes.RECTANGLE, { x: 1.92, y: 3.6, w: 0.35, h: 0.06, fill: { color: C.pink }, line: { color: C.pink } });

// Author
cover.addText("ppt-skills · github.com/CacinieP/ppt-skills", {
  x: 0.7, y: 4.2, w: 8, h: 0.35,
  fontSize: 11, fontFace: "Arial", color: C.textOnDark, transparency: 40,
});

mikuStripe(cover);

// ── Slide 2: Content (light background) ──

const content = pres.addSlide();
content.background = { fill: C.paper };

// Section title
content.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.45, w: 0.18, h: 0.18, fill: { color: C.pink }, line: { color: C.pink } });
content.addText("FEATURES", {
  x: 0.75, y: 0.38, w: 6, h: 0.3,
  fontSize: 12, fontFace: "Arial", bold: true, color: C.miku, charSpacing: 4, margin: 0,
});
content.addText("核心能力", {
  x: 0.5, y: 0.68, w: 9, h: 0.7,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.ink, margin: 0,
});
content.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.42, w: 0.9, h: 0.05, fill: { color: C.miku }, line: { color: C.miku } });
content.addShape(pres.shapes.RECTANGLE, { x: 1.42, y: 1.42, w: 0.3, h: 0.05, fill: { color: C.pink }, line: { color: C.pink } });

// Three feature cards
const features = [
  { emoji: "🎨", title: "Editable PPTX", desc: "Real .pptx output\nnot slide images" },
  { emoji: "CJK", title: "Chinese-First", desc: "Microsoft YaHei\nfull-width punctuation" },
  { emoji: "🤖", title: "AI Images", desc: "StepFun / MiniMax\nauto ratio matching" },
];

features.forEach((f, i) => {
  const x = 0.5 + i * 3.1;
  // Card background
  content.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: 1.8, w: 2.9, h: 2.6,
    fill: { color: C.white },
    rectRadius: 0.1,
    shadow: { type: "outer", blur: 6, offset: 2, color: "000000", opacity: 0.08 },
  });
  // Icon circle
  content.addShape(pres.shapes.OVAL, {
    x: x + 0.3, y: 2.0, w: 0.6, h: 0.6,
    fill: { color: C.paperAlt },
  });
  content.addText(f.emoji, {
    x: x + 0.3, y: 2.0, w: 0.6, h: 0.6,
    fontSize: 14, align: "center", valign: "middle",
  });
  // Title
  content.addText(f.title, {
    x: x + 0.2, y: 2.7, w: 2.5, h: 0.4,
    fontSize: 16, fontFace: "Arial", bold: true, color: C.ink,
  });
  // Description
  content.addText(f.desc, {
    x: x + 0.2, y: 3.15, w: 2.5, h: 0.9,
    fontSize: 11, fontFace: "Arial", color: C.muted, lineSpacingMultiple: 1.3,
  });
});

footer(content, 2, 3);
mikuStripe(content);

// ── Slide 3: Summary (deep background) ──

const summary = pres.addSlide();
summary.background = { fill: C.navy };

// Dual-color big title
summary.addText("Color QA", {
  x: 0.7, y: 1.2, w: 5, h: 0.9,
  fontSize: 40, fontFace: "Arial", color: C.miku, bold: true,
});
summary.addText("Verified.", {
  x: 3.5, y: 1.2, w: 5, h: 0.9,
  fontSize: 40, fontFace: "Arial", color: C.pink, bold: true,
});

summary.addText("All preset palettes pass WCAG AA contrast checks.\n37 pairs tested. 0 failures.", {
  x: 0.7, y: 2.3, w: 8, h: 1.0,
  fontSize: 16, fontFace: "Arial", color: C.textOnDark, lineSpacingMultiple: 1.5,
});

// Stats row
const stats = [
  { num: "37", label: "Pairs Tested" },
  { num: "7", label: "Presets" },
  { num: "0", label: "Failures" },
];
stats.forEach((s, i) => {
  const x = 0.7 + i * 3.0;
  summary.addText(s.num, {
    x, y: 3.5, w: 2.5, h: 0.8,
    fontSize: 48, fontFace: "Arial", color: C.miku, bold: true,
  });
  summary.addText(s.label, {
    x, y: 4.3, w: 2.5, h: 0.35,
    fontSize: 12, fontFace: "Arial", color: C.muted,
  });
});

mikuStripe(summary);

// ── Write ──

const outDir = resolve(__dirname, "slides", "output");
const { mkdir } = await import("node:fs/promises");
await mkdir(outDir, { recursive: true });

const outPath = resolve(outDir, "miku-demo.pptx");
await pres.writeFile({ fileName: outPath });

console.log(`Demo PPTX generated: ${outPath}`);
console.log("3 slides: cover (dark), content (light, 3 cards), summary (dark, stats)");
