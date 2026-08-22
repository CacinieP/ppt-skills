#!/usr/bin/env node

/**
 * cjk-overflow-check.mjs
 *
 * Render-free estimator: will this Chinese / mixed text overflow its PPTX box?
 * Turns the CJK rules scattered across SKILL.md §3 and §7 into an executable
 * check you can run BEFORE generating a slide, so you never wait for a
 * LibreOffice render just to discover a title wrapped to a third line.
 *
 * It uses lib/cjk-text.js calibration:
 *   CJK glyph  ≈ fontSize × 0.95pt
 *   Latin glyph ≈ fontSize × 0.55pt
 *
 * Usage:
 *   # One-shot pair
 *   node scripts/cjk-overflow-check.mjs \
 *     --text "训练场：从零到一的智能体" --font-size 44 --box-width 9
 *
 *   # Batch from JSON (build scripts can emit this)
 *   node scripts/cjk-overflow-check.mjs --json examples/cjk-overflow.sample.json
 *
 *   # Read a JSON manifest of text boxes and recommend font sizes
 *   node scripts/cjk-overflow-check.mjs --json manifest.json --recommend
 *
 * Exit code: 1 if any text box overflows (so CI / pre-commit can gate on it).
 */

import { readFileSync } from "node:fs";
import {
  estimateTextWidth,
  fitsBox,
  recommendFontSize,
  pointsToInches,
  countCJK,
  trailingFullWidthPunct,
  FULLWIDTH_PUNCT,
} from "../skills/themed-cn-pptx/lib/cjk-text.js";

function toCamel(key) {
  // accept both --font-size and --fontSize
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = toCamel(token.slice(2));
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function assessOne({ text, fontSize, boxWidth, charSpacing = 0, bold = false, name }) {
  const boxIn = Number(boxWidth);
  const pt = Number(fontSize);
  const fit = fitsBox(text, { fontSize: pt, boxWidthIn: boxIn, charSpacing: Number(charSpacing), bold });
  const counts = countCJK(text);
  const trailing = trailingFullWidthPunct(text);

  // Severity:
  //   P0 = overflows by >10%  (will definitely wrap / collide)
  //   P1 = overflows by 0-10% (tight, risks a one-glyph wrap depending on font)
  //   P2 = trailing full-width punct on a tight (>90%) box (wrap-orphan risk)
  //   PASS
  let severity = "PASS";
  if (!fit.safe && fit.overflowRatio > 1.1) severity = "P0";
  else if (!fit.safe) severity = "P1";
  else if (trailing && fit.overflowRatio > 0.9) severity = "P2";

  let recommendedPt = null;
  if (!fit.safe) {
    recommendedPt = recommendFontSize(text, {
      boxWidthIn: boxIn,
      charSpacing: Number(charSpacing),
      bold,
      maxPt: pt,
    });
  }

  return {
    name: name || text.slice(0, 24),
    text,
    fontSize: pt,
    boxWidthIn: boxIn,
    usedInches: Number(fit.usedInches.toFixed(3)),
    overflowRatio: Number(fit.overflowRatio.toFixed(2)),
    cjkGlyphs: counts.cjk,
    fullWidthPunct: counts.fullPunct,
    trailingFullWidthPunct: trailing,
    severity,
    recommendedFontSize: recommendedPt,
  };
}

function summarize(results) {
  const bySev = { P0: 0, P1: 0, P2: 0, PASS: 0 };
  for (const r of results) bySev[r.severity] = (bySev[r.severity] || 0) + 1;
  return {
    pass: bySev.P0 === 0 && bySev.P1 === 0,
    total: results.length,
    ...bySev,
  };
}

function printHuman(results) {
  const icon = { P0: "❌", P1: "⚠️", P2: "·", PASS: "✅" };
  for (const r of results) {
    const tag = `${r.severity}`;
    const line = `${icon[r.severity] || "?"} [${tag}] ${r.name}: used ${r.usedInches}" / box ${r.boxWidthIn}" (${r.overflowRatio}×) @ ${r.fontSize}pt`;
    console.log(line);
    if (r.severity !== "PASS") {
      const hints = [];
      if (r.recommendedFontSize) hints.push(`recommend fontSize ≤ ${r.recommendedFontSize}pt`);
      if (r.trailingFullWidthPunct) hints.push(`trailing full-width "${r.trailingFullWidthPunct}" may wrap-orphan — shorten text or widen box`);
      if (r.overflowRatio > 1.1) hints.push("will wrap; consider splitting into two lines explicitly");
      console.log(`        → ${hints.join("; ")}`);
    }
  }
  const s = summarize(results);
  console.log("");
  console.log(`Total: ${s.total} | PASS: ${s.PASS} | P2: ${s.P2} | P1: ${s.P1} | P0: ${s.P0}`);
  if (s.pass) console.log("All text boxes fit their PPTX boxes ✅");
  else console.log(`FAIL: ${s.P0 + s.P1} box(es) overflow ❌`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.json) {
    const input = JSON.parse(readFileSync(args.json, "utf-8"));
    const boxes = Array.isArray(input) ? input : input.boxes || input.items || [];
    const results = boxes.map((b) => assessOne(b));
    const out = { summary: summarize(results), results };
    if (args.recommend) {
      for (const r of results) {
        if (r.severity !== "PASS" && !r.recommendedFontSize) {
          r.recommendedFontSize = recommendFontSize(r.text, { boxWidthIn: r.boxWidthIn, maxPt: r.fontSize });
        }
      }
    }
    console.log(JSON.stringify(out, null, 2));
    process.exit(out.summary.pass ? 0 : 1);
  }

  if (!args.text || args.fontSize === undefined || args.boxWidth === undefined) {
    console.error("Usage: node scripts/cjk-overflow-check.mjs --text \"标题\" --font-size 44 --box-width 9");
    console.error("   or: node scripts/cjk-overflow-check.mjs --json manifest.json [--recommend]");
    console.error("");
    console.error("JSON shape: [{ \"name\": \"cover title\", \"text\": \"...\", \"fontSize\": 44, \"boxWidth\": 9, \"charSpacing\": 0, \"bold\": false }, ...]");
    console.error(`Recognized full-width punctuation: ${[...FULLWIDTH_PUNCT].join(" ")}`);
    process.exit(2);
  }

  const r = assessOne({
    text: args.text,
    fontSize: Number(args.fontSize),
    boxWidth: Number(args.boxWidth),
    charSpacing: Number(args.charSpacing || 0),
    bold: Boolean(args.bold),
  });
  const out = { summary: summarize([r]), results: [r] };
  printHuman([r]);
  process.exit(out.summary.pass ? 0 : 1);
}

main();
