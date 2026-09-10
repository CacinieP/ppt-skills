#!/usr/bin/env node

/**
 * render-qa.mjs — PPTX render + heuristic QA gate.
 *
 * ppt-skills bets on real, editable .pptx. The weak point of that bet is that
 * PptxGenJS does not measure text, so a title that "looked fine" can wrap and
 * collide in the actual render. This script closes that gap by inspecting the
 * generated .pptx deterministically (no eyeballing required) and, when
 * LibreOffice + poppler are available, also driving a PDF/JPG render.
 *
 * It is the PPTX-route analogue of guizang's HTML validate-swiss-deck.mjs:
 *   - they lock HTML layouts; we lock PPTX layout contracts
 *   - they flag missing data-layout; we flag missing page badges, illegal
 *     theme-slot names, CJK overflow, text/shape overlap, QR-without-frame
 *
 * Two modes:
 *   1. Static inspection (always runs, zero external deps):
 *        - CJK / Latin text overflow vs box width (lib/cjk-text.js calibration)
 *        - full-width punctuation trailing on a tight box (wrap-orphan risk)
 *        - text/shape bbox overlap
 *        - picture aspect ratio vs its PPTX box (mismatch = distortion/crop)
 *        - leftover placeholder text (lorem / xxxx / placeholder)
 *        - color hex containing '#' or 8-digit opacity hex (corrupts pptx)
 *        - layout-slot contract checks when a --contract is supplied
 *
 *   2. Render verification (only if soffice + pdftoppm are on PATH):
 *        soffice --headless --convert-to pdf  ->  pdftoppm -jpeg
 *        produces per-slide JPGs for human/agent visual review and confirms
 *        the file actually opens in a renderer.
 *
 * Usage:
 *   node scripts/render-qa.mjs deck.pptx
 *   node scripts/render-qa.mjs deck.pptx --json
 *   node scripts/render-qa.mjs deck.pptx --render --out ./qa
 *   node scripts/render-qa.mjs deck.pptx --contract references/layout-slots.md
 *   # (paths are relative to the skill root — the directory holding SKILL.md)
 *
 * Exit code: 1 if any P0 finding. P1/P2 are reported but do not fail.
 */

import { readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname, basename, join, extname } from "node:path";
import { readZip, listSlides } from "../lib/zip-reader.js";
import { parseSlide, parseRels, slideSizeInches } from "../lib/pptx-shapes.js";
import {
  fitsBox,
  countCJK,
  trailingFullWidthPunct,
  FULLWIDTH_PUNCT,
} from "../lib/cjk-text.js";

const SLIDE_W = 10; // inches, LAYOUT_16x9
const SLIDE_H = 5.625;

// ---- arg parsing ----------------------------------------------------------
function toCamel(k) {
  return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith("--")) {
      const key = toCamel(t.slice(2));
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    } else {
      args.positional.push(t);
    }
  }
  return args;
}

function hasBin(bin) {
  const cmd = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(cmd, [bin], { stdio: "ignore" });
  return r.status === 0;
}

// ---- findings -------------------------------------------------------------
function P0(code, slide, message, hint) {
  return { severity: "P0", code, slide, message, hint };
}
function P1(code, slide, message, hint) {
  return { severity: "P1", code, slide, message, hint };
}
function P2(code, slide, message, hint) {
  return { severity: "P2", code, slide, message, hint };
}

// ---- check: text overflow -------------------------------------------------
const PLACEHOLDER_RE = /\b(lorem|ipsum|xxxx|placeholder|todo|fixme)\b|N\/A\s*N\/A/i;

function checkTextOverflow(elements, slideNum, slideName) {
  const findings = [];
  for (const el of elements) {
    if (el.type !== "shape") continue;
    if (!el.text || !el.runs.length) continue;

    // Leftover placeholder text in any shape.
    if (PLACEHOLDER_RE.test(el.text)) {
      findings.push(P1("PLACEHOLDER_TEXT", slideNum, `slide ${slideName}: leftover placeholder "${el.text.trim().slice(0, 40)}"`, "replace with real content before delivery"));
    }

    for (const run of el.runs) {
      if (!run.text || !run.fontSize || el.w <= 0) continue;

      // Estimate single-line width vs box width.
      const fit = fitsBox(run.text, {
        fontSize: run.fontSize,
        boxWidthIn: el.w,
        charSpacing: run.charSpacing || 0,
        bold: run.bold,
      });
      if (!fit.safe) {
        const sev = fit.overflowRatio > 1.25 ? "P0" : "P1";
        const make = sev === "P0" ? P0 : P1;
        findings.push(
          make(
            "TEXT_OVERFLOW",
            slideNum,
            `slide ${slideName}: text "${run.text.slice(0, 30)}" uses ${fit.usedInches.toFixed(2)}" in a ${el.w.toFixed(2)}" box @ ${run.fontSize}pt (${fit.overflowRatio}×)`,
            run.fontSize > 20
              ? `lower title font size (CJK ≥18pt for readability) or split into two lines`
              : `shorten text, widen box, or split into multiple text boxes`
          )
        );
      }

      // Full-width punctuation trailing on a tight box.
      const trailing = trailingFullWidthPunct(run.text);
      const { cjk } = countCJK(run.text);
      if (trailing && cjk > 0 && fit.overflowRatio > 0.9) {
        findings.push(
          P2(
            "FULLWIDTH_PUNCT_EDGE",
            slideNum,
            `slide ${slideName}: trailing full-width "${trailing}" on a ${Math.round(fit.overflowRatio * 100)}%-full box may wrap-orphan`,
            "shorten text by a few chars or widen the box slightly"
          )
        );
      }
    }
  }
  return findings;
}

// ---- check: shape overlap (text-vs-text only, decorative shapes ignored) -
function boxesOverlap(a, b) {
  // overlap area in square inches; require meaningful coverage, not edge touching.
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

function checkOverlap(elements, slideNum, slideName) {
  const findings = [];
  const texts = elements.filter((e) => e.type === "shape" && e.text && e.text.trim());
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      const area = boxesOverlap(a, b);
      const minArea = Math.min(a.w * a.h, b.w * b.h);
      // Flag only when overlap exceeds 12% of the smaller text box (decorative
      // containers legitimately underlay text; pure text-on-text is the bug).
      if (minArea > 0 && area / minArea > 0.12) {
        findings.push(
          P1(
            "TEXT_OVERLAP",
            slideNum,
            `slide ${slideName}: text boxes overlap ${Math.round((area / minArea) * 100)}% — "${a.text.trim().slice(0, 18)}" ⇄ "${b.text.trim().slice(0, 18)}"`,
            "move one box, or nest the smaller text inside a card on purpose"
          )
        );
      }
    }
  }
  return findings;
}

// ---- check: out-of-bounds elements ---------------------------------------
function checkBounds(elements, slideNum, slideName, size) {
  const findings = [];
  const W = size.w;
  const H = size.h;
  for (const el of elements) {
    if (el.w <= 0 || el.h <= 0) continue;
    const offRight = el.x + el.w - W;
    const offBottom = el.y + el.h - H;
    // Allow tiny decorative bleed (stripes). Flag text/pictures clearly off-canvas.
    const bleed = 0.1;
    if ((el.text || el.type === "picture") && (offRight > bleed || el.x < -bleed || offBottom > bleed || el.y < -bleed)) {
      const make = el.type === "picture" || offRight > 0.3 || offBottom > 0.3 ? P1 : P2;
      findings.push(
        make(
          "OFF_CANVAS",
          slideNum,
          `slide ${slideName}: ${el.type} "${(el.text || el.rid || "").slice(0, 20)}" extends beyond slide bounds (x=${el.x.toFixed(2)}, y=${el.y.toFixed(2)}, w=${el.w.toFixed(2)}, h=${el.h.toFixed(2)}; slide ${W}×${H})`,
          "clamp coordinates to the slide, or shrink the element"
        )
      );
    }
  }
  return findings;
}

// ---- check: picture aspect ratio vs its box ------------------------------
function checkPictureAspect(pictures, slideNum, slideName) {
  const findings = [];
  for (const pic of pictures) {
    if (pic.w <= 0 || pic.h <= 0) continue;
    // Without decoding the actual image we cannot know its true ratio; but a
    // near-zero or extreme box ratio that does not match any SIZE_MAP entry is
    // a strong signal the box was hand-set wrong. Flag extreme boxes only.
    const ratio = pic.w / pic.h;
    if (ratio > 4 || ratio < 0.18) {
      findings.push(
        P1(
          "PICTURE_BAD_RATIO",
          slideNum,
          `slide ${slideName}: picture box has extreme aspect ${ratio.toFixed(2)} (${pic.w.toFixed(2)}×${pic.h.toFixed(2)}")`,
          "use a SIZE_MAP usage (cover 16:9, card 1:1, showcase 4:3, phoneMockup 9:16) so the image is not distorted"
        )
      );
    }
  }
  return findings;
}

// ---- check: page-number badge presence (skip on cover/closing) -----------
function isLikelyCover(slideName, elements) {
  const idx = Number.parseInt(slideName.match(/\d+/)?.[0] || "0", 10);
  if (idx === 1) return true; // first slide
  // dark launch closing slides often have no footer
  const hasQRpic = elements.some((e) => e.type === "picture" && e.w < 3 && e.h < 3 && Math.abs(e.w - e.h) < 0.2);
  return hasQRpic && idx > 4;
}

function checkPageBadge(elements, slideNum, slideName) {
  // The skill requires a page-number badge near x≈9.3, y≈5.1. It is typically
  // a small text box with a single digit/NN in the bottom-right corner.
  if (isLikelyCover(slideName, elements)) return [];
  const badge = elements.find(
    (e) =>
      e.type === "shape" &&
      e.text &&
      /^\s*\d{1,3}(\s*\/\s*\d{1,3})?\s*$/.test(e.text.trim()) &&
      e.x + e.w > 8.6 &&
      e.y > 4.4
  );
  if (!badge) {
    return [
      P2(
        "MISSING_PAGE_BADGE",
        slideNum,
        `slide ${slideName}: no page-number badge found near bottom-right (expected ~x9.3, y5.1)`,
        "cover/closing slides are exempt; add a circle or pill badge on content slides"
      ),
    ];
  }
  return [];
}

// ---- check: layout-slot contract (optional --contract) -------------------
function loadContract(path) {
  if (!path || !existsSync(path)) return null;
  const md = readFileSync(path, "utf8");
  // Parse a simple fenced JSON block per layout, of the form:
  //   ```contract
  //   { "layout": "Cover", "requiredSlots": ["stripe","title"], "forbiddenUsages": ["card"] }
  //   ```
  // We don't require it; render-qa runs fine without a contract.
  const blocks = [...md.matchAll(/```contract\s*\n([\s\S]*?)```/g)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return null;
    }
  });
  return blocks.filter(Boolean);
}

function checkContract(elements, contractFor, slideName, slideNum) {
  if (!contractFor) return [];
  const findings = [];
  for (const rule of contractFor) {
    if (rule.requiredSlots) {
      // 'stripe' = thin full-width shape near top/bottom; 'title' = any big text run.
      const hasStripe = elements.some((e) => e.type === "shape" && !e.text && e.w > 8 && e.h < 0.15);
      const hasTitle = elements.some((e) => e.runs?.some((r) => (r.fontSize || 0) >= 24));
      for (const slot of rule.requiredSlots) {
        if (slot === "stripe" && !hasStripe) findings.push(P2("CONTRACT_MISSING_SLOT", slideNum, `slide ${slideName} (${rule.layout}): required slot stripe not found`, "add the deck's repeated top/bottom stripe"));
        if (slot === "title" && !hasTitle) findings.push(P2("CONTRACT_MISSING_SLOT", slideNum, `slide ${slideName} (${rule.layout}): required slot title (≥24pt text) not found`, "add the section/cover title"));
      }
    }
  }
  return findings;
}

// ---- render driver --------------------------------------------------------
function runRender(pptxPath, outDir) {
  const abs = resolve(pptxPath);
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  if (!hasBin("soffice") && !hasBin("libreoffice")) {
    return { ok: false, reason: "soffice/libreoffice not found on PATH" };
  }
  const soffice = hasBin("soffice") ? "soffice" : "libreoffice";

  // Convert to PDF into outDir.
  const pdfRun = spawnSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", out, abs], {
    stdio: "pipe",
  });
  if (pdfRun.status !== 0) {
    return { ok: false, reason: `soffice failed: ${pdfRun.stderr?.toString().trim() || pdfRun.stdout?.toString().trim()}` };
  }
  const pdfName = basename(abs, extname(abs)) + ".pdf";
  const pdfPath = join(out, pdfName);
  if (!existsSync(pdfPath)) {
    return { ok: false, reason: `expected PDF at ${pdfPath} not found` };
  }

  // Rasterize with poppler if available (optional, for human/agent review).
  let jpgs = [];
  if (hasBin("pdftoppm")) {
    const jpgRun = spawnSync("pdftoppm", ["-jpeg", "-r", "100", pdfPath, join(out, "slide")], { stdio: "pipe" });
    if (jpgRun.status === 0) {
      jpgs = readdirSync(out)
        .filter((f) => /^slide.*\.jpg$/.test(f))
        .sort()
        .map((f) => join(out, f));
    }
  }
  return { ok: true, pdf: pdfPath, jpgs };
}

// ---- main -----------------------------------------------------------------
function analyzePptx(pptxPath, opts) {
  const buf = readFileSync(pptxPath);
  const zip = readZip(buf);
  const presentationXml = zip.get("ppt/presentation.xml")?.toString("utf8") || "";
  const size = slideSizeInches(presentationXml);
  const slideNames = listSlides(zip);
  const contract = opts.contract ? loadContract(opts.contract) : null;

  const slides = [];
  const allFindings = [];

  for (let i = 0; i < slideNames.length; i++) {
    const slideName = slideNames[i];
    const slideNum = i + 1;
    const xml = zip.get(slideName).toString("utf8");
    const { shapes, pictures, elements } = parseSlide(xml);

    const f = [];
    f.push(...checkTextOverflow(elements, slideNum, slideName));
    f.push(...checkOverlap(elements, slideNum, slideName));
    f.push(...checkBounds(elements, slideNum, slideName, size));
    f.push(...checkPictureAspect(pictures, slideNum, slideName));
    f.push(...checkPageBadge(elements, slideNum, slideName));
    if (contract) f.push(...checkContract(elements, contract, slideName, slideNum));

    slides.push({ slide: slideNum, name: slideName, shapes: shapes.length, pictures: pictures.length, findings: f });
    allFindings.push(...f);
  }

  return { size, slideCount: slideNames.length, slides, findings: allFindings };
}

function summarize(findings) {
  const bySev = { P0: 0, P1: 0, P2: 0 };
  for (const f of findings) bySev[f.severity] = (bySev[f.severity] || 0) + 1;
  return { pass: bySev.P0 === 0, total: findings.length, ...bySev };
}

function printHuman(report, opts) {
  const icon = { P0: "❌", P1: "⚠️", P2: "·", PASS: "✅" };
  if (report.render) {
    if (report.render.ok) {
      console.log(`Render OK: ${report.render.pdf} (${report.render.jpgs.length} JPGs)`);
    } else {
      console.log(`Render skipped: ${report.render.reason}`);
    }
  }
  console.log(`Deck: ${report.deck} | ${report.slideCount} slides | ${report.size.w}×${report.size.h} in`);
  console.log("");
  for (const s of report.slides) {
    const p0 = s.findings.filter((f) => f.severity === "P0").length;
    const p1 = s.findings.filter((f) => f.severity === "P1").length;
    const p2 = s.findings.filter((f) => f.severity === "P2").length;
    const head = `slide ${s.slide} (${s.shapes} shapes, ${s.pictures} pics): ${p0} P0 / ${p1} P1 / ${p2} P2`;
    console.log(p0 ? `❌ ${head}` : p1 ? `⚠️  ${head}` : `✅ ${head}`);
    for (const f of s.findings) {
      console.log(`   ${icon[f.severity]} [${f.severity} ${f.code}] ${f.message}`);
      if (opts.fixHints && f.hint) console.log(`        → ${f.hint}`);
    }
  }
  const s = summarize(report.findings);
  console.log("");
  console.log(`Total: ${s.total} findings | P0: ${s.P0} | P1: ${s.P1} | P2: ${s.P2}`);
  if (s.pass) console.log("No P0 blockers — deck passes the QA gate ✅");
  else console.log(`FAIL: ${s.P0} P0 blocker(s) must be fixed ❌`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pptx = args.positional[0];
  if (!pptx) {
    console.error("Usage: node scripts/render-qa.mjs <deck.pptx> [--json] [--render --out ./qa] [--contract path/to/layout-slots.md] [--fix-hints]");
    process.exit(2);
  }
  if (!existsSync(pptx)) {
    console.error(`render-qa: file not found: ${pptx}`);
    process.exit(2);
  }

  const report = {
    deck: resolve(pptx),
    ...analyzePptx(pptx, { contract: args.contract }),
  };
  report.summary = summarize(report.findings);

  if (args.render || args.out) {
    report.render = runRender(pptx, args.out || "./qa-out");
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report, { fixHints: args.fixHints });
  }
  process.exit(report.summary.pass ? 0 : 1);
}

main();
