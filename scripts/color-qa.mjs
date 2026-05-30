#!/usr/bin/env node

const ROLE_THRESHOLDS = {
  body: 4.5,
  title: 3,
  large: 3,
  graphic: 3,
  ui: 3,
};

function normalizeHex(value) {
  const hex = String(value || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return hex.split("").map((char) => char + char).join("").toUpperCase();
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color: ${value}`);
  }
  return hex.toUpperCase();
}

function hexToRgb(value) {
  const hex = normalizeHex(value);
  return {
    hex,
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  const { r, g, b } = typeof color === "string" ? hexToRgb(color) : color;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl(color) {
  const { r, g, b } = typeof color === "string" ? hexToRgb(color) : color;
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function isHueInRange(hue, start, end) {
  if (start <= end) return hue >= start && hue <= end;
  return hue >= start || hue <= end;
}

function pairWarnings(foreground, background, role = "body") {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const fgHsl = rgbToHsl(fg);
  const bgHsl = rgbToHsl(bg);
  const ratio = contrastRatio(fg, bg);
  const threshold = ROLE_THRESHOLDS[role] || ROLE_THRESHOLDS.body;
  const warnings = [];

  if (ratio < threshold) {
    warnings.push(`FAIL_CONTRAST: ${ratio.toFixed(2)}:1 < ${threshold}:1 for ${role}`);
  }

  if (fgHsl.s > 0.65 && bgHsl.s > 0.65 && ratio < 7) {
    warnings.push("HIGH_SATURATION_PAIR: two saturated colors need extra contrast or a neutral buffer");
  }

  const fgIsRed = isHueInRange(fgHsl.h, 345, 20);
  const bgIsRed = isHueInRange(bgHsl.h, 345, 20);
  const fgIsGreen = isHueInRange(fgHsl.h, 85, 155);
  const bgIsGreen = isHueInRange(bgHsl.h, 85, 155);
  if ((fgIsRed && bgIsGreen) || (fgIsGreen && bgIsRed)) {
    warnings.push("RED_GREEN_PAIR: unsafe for status-only meaning and color-vision deficiencies");
  }

  const fgIsBlue = isHueInRange(fgHsl.h, 210, 270);
  const bgIsOrangeRed = isHueInRange(bgHsl.h, 0, 45);
  const fgIsOrangeRed = isHueInRange(fgHsl.h, 0, 45);
  const bgIsBlue = isHueInRange(bgHsl.h, 210, 270);
  if ((fgIsBlue && bgIsOrangeRed) || (fgIsOrangeRed && bgIsBlue)) {
    warnings.push("BLUE_ON_ORANGE_RED: prone to edge vibration in dense CJK text");
  }

  if (hueDistance(fgHsl.h, bgHsl.h) < 18 && Math.abs(fgHsl.l - bgHsl.l) < 0.28 && ratio < 4.5) {
    warnings.push("SAME_HUE_LOW_LUMINANCE_DELTA: too close in both hue and brightness");
  }

  if (fgHsl.s > 0.8 && bgHsl.l > 0.86 && ratio < 4.5) {
    warnings.push("NEON_ON_LIGHT: bright saturated text on light background often looks thin");
  }

  return {
    foreground: `#${fg.hex}`,
    background: `#${bg.hex}`,
    role,
    ratio: Number(ratio.toFixed(2)),
    pass: warnings.length === 0,
    warnings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const role = args.role || "body";

  if (args.palette) {
    const colors = args.palette.split(",").map((color) => color.trim()).filter(Boolean);
    const results = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        results.push(pairWarnings(colors[i], colors[j], role));
      }
    }
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (!args.fg || !args.bg) {
    console.error("Usage: node scripts/color-qa.mjs --fg 0F2233 --bg F1FBFA --role body");
    console.error("   or: node scripts/color-qa.mjs --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body");
    process.exit(2);
  }

  console.log(JSON.stringify(pairWarnings(args.fg, args.bg, role), null, 2));
}

main();
