#!/usr/bin/env node

/**
 * color-qa-presets.mjs
 *
 * Run color QA on all preset palettes in examples/color-qa.presets.json.
 * Exits with code 1 if any P0 (contrast) failures are found.
 * Used by `npm test` as a CI gate.
 *
 * Usage:
 *   node scripts/color-qa-presets.mjs
 *   node scripts/color-qa-presets.mjs --json   (machine-readable output)
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// ── Contrast math (duplicated from color-qa.mjs for zero-import independence) ──

function normalizeHex(value) {
  const hex = String(value || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) return hex.split("").map((c) => c + c).join("").toUpperCase();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Invalid hex color: ${value}`);
  return hex.toUpperCase();
}

function hexToRgb(value) {
  const hex = normalizeHex(value);
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  const { r, g, b } = typeof color === "string" ? hexToRgb(color) : color;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const ROLE_THRESHOLDS = { body: 4.5, title: 3, large: 3, graphic: 3, ui: 3 };

// ── Main ──

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");

const presetsPath = resolve(rootDir, "examples/color-qa.presets.json");
const input = JSON.parse(readFileSync(presetsPath, "utf-8"));

const results = [];
let p0Count = 0;
let p1Count = 0;
let passCount = 0;

for (const preset of input.presets) {
  for (const pair of preset.pairs) {
    if (pair.skipContrastCheck) continue;

    const fg = normalizeHex(pair.fg);
    const bg = normalizeHex(pair.bg);
    const role = pair.role || "body";
    const threshold = ROLE_THRESHOLDS[role] || ROLE_THRESHOLDS.body;
    const ratio = contrastRatio(fg, bg);
    const name = `${preset.name}: ${pair.name}`;

    const pass = ratio >= threshold;
    const severity = pass ? "PASS" : "P0";

    if (pass) passCount++;
    else p0Count++;

    results.push({ name, fg: `#${fg}`, bg: `#${bg}`, role, ratio: Number(ratio.toFixed(2)), threshold, pass, severity });
  }
}

const total = results.length;

if (jsonOutput) {
  console.log(JSON.stringify({ summary: { pass: p0Count === 0, total, p0: p0Count, p1: p1Count, passCount }, results }, null, 2));
} else {
  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    console.log(`${icon} ${r.name}: ${r.ratio}:1 (≥${r.threshold} ${r.role})`);
  }
  console.log("");
  console.log(`Total: ${total} | Pass: ${passCount} | P0: ${p0Count}`);

  if (p0Count === 0) {
    console.log("All preset palette contrast checks PASS ✅");
  } else {
    console.log(`FAIL: ${p0Count} pair(s) below contrast threshold ❌`);
  }
}

process.exit(p0Count > 0 ? 1 : 0);
