/**
 * Dependency-free OOXML slide parser for QA.
 *
 * Extracts, from each slide XML in a .pptx, the information render-qa needs:
 *   - shapes (rect / oval / etc) with their geometry (EMU)
 *   - text runs with font size (pt, from sz attribute which is in 100ths of pt),
 *     bold, charSpacing (spc, in 100ths of a pt), text content, and fill color
 *   - picture references (rId -> target, with geometry)
 *
 * EMU (English Metric Units): 914400 per inch, 12700 per point.
 * Slide is 10in x 5.625in = 9144000 x 5143500 EMU (LAYOUT_16x9).
 *
 * No full XML parser — we read with a tolerant regex/tag scanner so a slightly
 * malformed slide still yields partial results instead of throwing. QA should
 * be robust to what pptxgenjs and hand-edits actually emit.
 */

const EMU_PER_INCH = 914400;
const EMU_PER_PT = 12700;

export function emuToInch(emu) {
  return emu / EMU_PER_INCH;
}
export function emuToPt(emu) {
  return emu / EMU_PER_PT;
}

/**
 * Extract <a:t> text content from a <p:txBody> block, concatenating runs.
 * Only the visible text, no formatting.
 */
function extractText(txBody) {
  const runs = [...txBody.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)];
  return runs.map((m) => decodeXmlEntities(m[1])).join("");
}

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * Parse a shape element (<p:sp>) into a geometry + text descriptor.
 */
function parseShape(spXml) {
  const offMatch = spXml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
  const extMatch = spXml.match(/<a:ext\s+cx="(-?\d+)"\s+cy="(-?\d+)"/);
  const xEmu = offMatch ? Number(offMatch[1]) : 0;
  const yEmu = offMatch ? Number(offMatch[2]) : 0;
  const cxEmu = extMatch ? Number(extMatch[1]) : 0;
  const cyEmu = extMatch ? Number(extMatch[2]) : 0;

  const fillMatch = spXml.match(/<a:solidFill>\s*<a:srgbClr\s+val="([0-9A-Fa-f]{6,8})"/);
  const fill = fillMatch ? fillMatch[1].slice(0, 6).toUpperCase() : null;

  // Text body (may be absent for pure decoration shapes).
  const txBodyMatch = spXml.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
  let text = "";
  const runs = [];
  if (txBodyMatch) {
    text = extractText(txBodyMatch[1]);
    // Per-run properties: sz is in 100ths of a pt; spc (charSpacing) in 100ths of a pt.
    const runMatches = [...txBodyMatch[1].matchAll(/<a:rPr([^/>]*)\/?>([\s\S]*?)<\/a:rPr>\s*<a:t>([\s\S]*?)<\/a:t>|<a:rPr([^/>]*)\/>\s*<a:t>([\s\S]*?)<\/a:t>/g)];
    for (const rm of runMatches) {
      const attrs = (rm[1] || rm[4] || "");
      const runText = decodeXmlEntities(rm[3] || rm[5] || "");
      const szMatch = attrs.match(/\bsz="(\d+)"/);
      const bMatch = attrs.match(/\bb="1"/);
      const spcMatch = attrs.match(/\bspc="(-?\d+)"/);
      runs.push({
        text: runText,
        fontSize: szMatch ? Number(szMatch[1]) / 100 : null,
        bold: !!bMatch,
        charSpacing: spcMatch ? Number(spcMatch[1]) / 100 : 0,
      });
    }
    // Fallback: <a:r> without rPr attributes (pptxgenjs sometimes emits sz on defRPr).
    if (runs.length === 0 && text) {
      const defRpr = txBodyMatch[1].match(/<a:defRPr[^>]*\bsz="(\d+)"/);
      runs.push({
        text,
        fontSize: defRpr ? Number(defRpr[1]) / 100 : null,
        bold: false,
        charSpacing: 0,
      });
    }
  }

  return {
    type: "shape",
    x: emuToInch(xEmu),
    y: emuToInch(yEmu),
    w: emuToInch(cxEmu),
    h: emuToInch(cyEmu),
    fill,
    text,
    runs,
  };
}

/**
 * Parse a picture element (<p:pic>) into a geometry + image descriptor.
 * The actual target filename is resolved later from the slide rels.
 */
function parsePicture(picXml) {
  const offMatch = picXml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
  const extMatch = picXml.match(/<a:ext\s+cx="(-?\d+)"\s+cy="(-?\d+)"/);
  const xEmu = offMatch ? Number(offMatch[1]) : 0;
  const yEmu = offMatch ? Number(offMatch[2]) : 0;
  const cxEmu = extMatch ? Number(extMatch[1]) : 0;
  const cyEmu = extMatch ? Number(extMatch[2]) : 0;
  const embedMatch = picXml.match(/r:embed="([^"]+)"/);

  return {
    type: "picture",
    rid: embedMatch ? embedMatch[1] : null,
    x: emuToInch(xEmu),
    y: emuToInch(yEmu),
    w: emuToInch(cxEmu),
    h: emuToInch(cyEmu),
  };
}

/**
 * Parse one slide's XML into a list of elements (shapes + pictures) in z-order
 * (document order in OOXML is the paint order, bottom first).
 *
 * @param {string} xml
 * @returns {{shapes: Array, pictures: Array, elements: Array}}
 */
export function parseSlide(xml) {
  const shapes = [];
  const pictures = [];

  // Match top-level <p:sp> and <p:pic> blocks. Use a tolerant scanner that
  // tracks nesting depth of the wrapper element so self-closing inner tags
  // do not confuse us.
  const blockRe = /<p:(sp|pic)\b[\s\S]*?<\/p:\1>/g;
  let m;
  while ((m = blockRe.exec(xml)) !== null) {
    const tag = m[1];
    const block = m[0];
    if (tag === "sp") {
      shapes.push(parseShape(block));
    } else {
      pictures.push(parsePicture(block));
    }
  }

  const elements = [...shapes, ...pictures].sort((a, b) => 0);
  return { shapes, pictures, elements };
}

/**
 * Parse a .rels file content into a Map<rid, target>.
 * Targets like "../media/image1.png" are returned as-is.
 */
export function parseRels(relsXml) {
  const out = new Map();
  const re = /<Relationship\s+Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let m;
  while ((m = re.exec(relsXml)) !== null) {
    out.set(m[1], m[2]);
  }
  return out;
}

/**
 * Slide dimensions in EMU, from ppt/presentation.xml or the slideLayout.
 * Falls back to 10x5.625in (9144000 x 5143500) for LAYOUT_16x9.
 */
export function slideSizeInches(presentationXml) {
  const match = (presentationXml || "").match(/<p:sldSz\s+cx="(\d+)"\s+cy="(\d+)"/);
  if (!match) return { w: 10, h: 5.625 };
  return { w: emuToInch(Number(match[1])), h: emuToInch(Number(match[2])) };
}
