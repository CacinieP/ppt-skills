/**
 * CJK-aware text width estimation for PPTX layout.
 *
 * PptxGenJS does not measure rendered text, so a long Chinese title that fits
 * on a 9" box at 44pt in the author's head can wrap to a third line in the
 * actual render and collide with a subtitle. This module turns the heuristics
 * already written in SKILL.md §3 and §7 into executable, render-free math.
 *
 * Calibration used across this skill:
 *   - CJK ideograph advance width ≈ fontSize × 0.95pt  (full-width blocks)
 *   - Full-width punctuation (「」『』、。，：；！？（）…) ≈ same as a CJK glyph
 *   - Latin glyph advance width ≈ fontSize × 0.55pt   (average over a-z/0-9)
 *   - charSpacing (PptxGenJS points) adds per-character tracking on TOP of this
 *
 * These are deliberately conservative (over-estimate slightly) so that "safe"
 * really is safe. The exact rendered width still depends on the installed
 * font and on bold/italic, which we fold into a weightFactor.
 *
 * No network, no dependencies. Pure functions so render-qa.mjs,
 * cjk-overflow-check.mjs and build scripts can all reuse it.
 */

// U+3000-U+303F (CJK symbols/punctuation), U+FF00-U+FFEF (full-width forms),
// U+3400-U+4DBF (ext A), U+4E00-U+9FFF (CJK unified), U+F900-U+FAFF (compat),
// U+3040-U+30FF (hiragana/katakana), U+AC00-U+D7AF (hangul).
const CJK_RANGES = [
  [0x3000, 0x303f],
  [0x3040, 0x30ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xac00, 0xd7af],
  [0xf900, 0xfaff],
  [0xff00, 0xffef],
];

// Characters that must never be orphaned at a line start/end. If one sits at
// the right edge of a tight box, a renderer may push it down and break layout.
export const FULLWIDTH_PUNCT = new Set(
  "「」『』（）［］｛｝、。，：；！？·…—～《》〈〉\"\"''".split("")
);

export function isCJK(code) {
  for (const [start, end] of CJK_RANGES) {
    if (code >= start && code <= end) return true;
  }
  return false;
}

/**
 * Estimate the rendered width (in points) of a string at a given font size.
 *
 * @param {string} text
 * @param {Object} opts
 * @param {number} opts.fontSize      - in points (PPTX pt)
 * @param {number} [opts.charSpacing] - PptxGenJS charSpacing in points (0 default)
 * @param {boolean} [opts.bold]       - bold glyphs run ~4% wider
 * @returns {number} width in points
 */
export function estimateTextWidth(text, opts) {
  const { fontSize = 12, charSpacing = 0, bold = false } = opts || {};
  const cjkAdvance = 0.95;
  const latinAdvance = 0.55;
  const weightFactor = bold ? 1.04 : 1.0;

  let width = 0;
  let glyphCount = 0;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0);
    const advance = isCJK(code) || FULLWIDTH_PUNCT.has(ch) ? cjkAdvance : latinAdvance;
    width += advance * fontSize * weightFactor;
    glyphCount += 1;
  }
  width += Math.max(0, glyphCount - 1) * charSpacing;
  return width;
}

/**
 * Points to inches helper. PPTX coordinates in this skill are inches (10x5.625).
 */
export function pointsToInches(pt) {
  return pt / 72;
}

export function inchesToPoints(inches) {
  return inches * 72;
}

/**
 * Decide whether a single-line text will fit inside a box of given width.
 *
 * @returns {{ safe: boolean, usedInches: number, boxInches: number, overflowRatio: number }}
 */
export function fitsBox(text, opts) {
  const { fontSize, boxWidthIn, charSpacing = 0, bold = false } = opts;
  const widthPt = estimateTextWidth(text, { fontSize, charSpacing, bold });
  const usedIn = pointsToInches(widthPt);
  const boxIn = boxWidthIn;
  const overflowRatio = usedIn / boxIn;
  return {
    safe: overflowRatio <= 1.0,
    usedInches: usedIn,
    boxInches: boxIn,
    overflowRatio,
  };
}

/**
 * Recommend the largest standard font size (pt) that keeps text on one line
 * inside the box. Standard ladder mirrors SKILL.md §3 CJK table.
 *
 * @returns {number|null} recommended pt, or null if text cannot fit at the
 *   smallest rung even with a very small size (text far too long for the box).
 */
export function recommendFontSize(text, opts) {
  const { boxWidthIn, charSpacing = 0, bold = false, maxPt = 48 } = opts;
  const ladder = [maxPt, 44, 40, 36, 32, 28, 24, 22, 20, 18, 16, 14, 12];
  for (const pt of ladder) {
    if (pt > maxPt) continue;
    const r = fitsBox(text, { fontSize: pt, boxWidthIn, charSpacing, bold });
    if (r.safe) return pt;
  }
  return null;
}

/**
 * Count CJK glyphs and full-width punctuation in a string.
 */
export function countCJK(text) {
  let cjk = 0;
  let fullPunct = 0;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0);
    if (isCJK(code)) cjk += 1;
    if (FULLWIDTH_PUNCT.has(ch)) fullPunct += 1;
  }
  return { cjk, fullPunct, total: cjk + fullPunct };
}

/**
 * Heuristic: is the last visible character a full-width punctuation mark that
 * risks being cropped/wrapped if the box is tight? Returns the char or null.
 */
export function trailingFullWidthPunct(text) {
  const t = String(text).trimEnd();
  if (!t) return null;
  const last = t[t.length - 1];
  return FULLWIDTH_PUNCT.has(last) ? last : null;
}
