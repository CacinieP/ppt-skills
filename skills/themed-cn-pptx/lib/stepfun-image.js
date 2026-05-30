/**
 * StepFun Image Generation Utility for PPT Skills
 *
 * Integrates StepFun (阶跃星辰) text-to-image API into PPTX generation workflow.
 * Automatically selects image size based on PPT slide usage context.
 *
 * Environment Variables:
 *   STEPFUN_API_KEY  — Required. API key from https://platform.stepfun.com
 *   STEPFUN_BASE_URL — Optional. API base URL, defaults to https://api.stepfun.com/v1
 *
 * Usage in build_<theme>.js:
 *   import { generateSlideImage, addImageToSlide, addImageOverlay, SIZE_MAP } from "./lib/stepfun-image.js";
 *
 *   const img = await generateSlideImage({ prompt: "赛博朋克城市夜景", usage: "cover" });
 *   if (img) {
 *     slide.addImage({ path: img.localPath, x: 0, y: 0, w: img.pptxLayout.w, h: img.pptxLayout.h });
 *   }
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Size mapping: PPT usage → StepFun image size + recommended model
//
// PPT slide: 10" × 5.625" (16:9), so image aspect ratio matters.
// 1360×768 ≈ 16:9  → perfect full-bleed cover
// 1184×896 ≈ 4:3   → good for showcase panels
// 896×1184 ≈ 3:4   → good for tall card images
// 1024×1024 = 1:1   → square, versatile for cards/icons
// 768×1360 ≈ 9:16   → tall portrait, for phone mockups / side strips
// 512×512  = 1:1   → small icons
// ---------------------------------------------------------------------------
export const SIZE_MAP = {
  // --- Full-bleed backgrounds ---
  cover: {
    size: "1360x768",
    model: "step-image-edit-2",
    description: "封面全幅背景图，16:9 精确匹配幻灯片 (10×5.625″)",
    pptxLayout: { w: 10, h: 5.625 },
  },
  coverOverlay: {
    size: "1360x768",
    model: "step-image-edit-2",
    description: "封面背景图（仅上半区），需半透明遮罩配文字",
    pptxLayout: { w: 10, h: 5.625 },
  },
  // --- Banners & hero ---
  hero: {
    size: "1360x768",
    model: "step-image-edit-2",
    description: "Hero Banner，页面上半区横幅，16:9 裁切为 ~10×3″",
    pptxLayout: { w: 10, h: 3.0 },
  },
  sideStrip: {
    size: "768x1360",
    model: "step-image-edit-2",
    description: "竖向侧栏装饰图，9:16 竖版，右侧 ~2.5″ 宽",
    pptxLayout: { w: 2.5, h: 4.44 },
  },
  // --- Cards & inline images ---
  card: {
    size: "1024x1024",
    model: "step-image-edit-2",
    description: "卡片方形配图，适合内容页卡片内嵌",
    pptxLayout: { w: 2.5, h: 2.5 },
  },
  cardTall: {
    size: "896x1184",
    model: "step-image-edit-2",
    description: "卡片竖版配图，3:4 比例，适合侧栏或高卡片",
    pptxLayout: { w: 2.3, h: 3.04 },
  },
  cardWide: {
    size: "1184x896",
    model: "step-image-edit-2",
    description: "卡片横版配图，4:3 比例，适合项目展示左图右文",
    pptxLayout: { w: 3.5, h: 2.65 },
  },
  // --- Showcase & mockup ---
  showcase: {
    size: "1184x896",
    model: "step-image-edit-2",
    description: "项目展示横版配图，4:3 比例，左图右文布局",
    pptxLayout: { w: 3.9, h: 2.95 },
  },
  phoneMockup: {
    size: "768x1360",
    model: "step-image-edit-2",
    description: "手机竖屏 mockup，9:16 比例",
    pptxLayout: { w: 1.8, h: 3.2 },
  },
  // --- Small ---
  icon: {
    size: "512x512",
    model: "step-2x-large",
    description: "小图标/占位图，适合功能图标或头像",
    pptxLayout: { w: 1.5, h: 1.5 },
  },
};

// ---------------------------------------------------------------------------
// Supported models and their available sizes
// ---------------------------------------------------------------------------
const MODEL_SIZES = {
  "step-image-edit-2": ["1024x1024", "768x1360", "896x1184", "1360x768", "1184x896"],
  "step-2x-large": ["1024x1024", "1280x800", "800x1280", "512x512"],
  "step-1x-medium": ["1024x1024", "1280x800", "800x1280", "512x512"],
};

// ---------------------------------------------------------------------------
// Internal: read API key from environment
// ---------------------------------------------------------------------------
function getApiKey() {
  const key = process.env.STEPFUN_API_KEY;
  if (!key) {
    return null;
  }
  return key;
}

function getBaseUrl() {
  return process.env.STEPFUN_BASE_URL || "https://api.stepfun.com/v1";
}

// ---------------------------------------------------------------------------
// Generate a slide image via StepFun API
// ---------------------------------------------------------------------------
/**
 * @param {Object} params
 * @param {string} params.prompt   — Image description, 10-300 chars, Chinese or English
 * @param {string} [params.usage]  — One of SIZE_MAP keys. Determines image size and model.
 *                                   Defaults to "card".
 * @param {string} [params.model]  — Override model (e.g. "step-2x-large").
 *                                   If omitted, uses SIZE_MAP[usage].model
 * @param {string} [params.size]   — Override size (e.g. "1280x800").
 *                                   If omitted, uses SIZE_MAP[usage].size
 * @param {string} [params.saveDir]— Directory to save images. Defaults to "./assets/stepfun"
 * @param {number} [params.seed]   — Random seed for reproducibility
 * @param {number} [params.n]      — Number of images (1-4), defaults to 1
 * @returns {Promise<Object|null>} Image info object, or null if API key missing
 *   { localPath, absolutePath, size, model, seed, pptxLayout, usage }
 */
export async function generateSlideImage(params) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(
      "[stepfun-image] STEPFUN_API_KEY 未设置，跳过 AI 生图。\n" +
      "  获取 API Key: https://platform.stepfun.com\n" +
      "  设置方式: export STEPFUN_API_KEY=sk-xxx"
    );
    return null;
  }

  const usage = params.usage || "card";
  const sizeConfig = SIZE_MAP[usage] || SIZE_MAP.card;
  if (!SIZE_MAP[usage]) {
    console.warn(`[stepfun-image] 未知 usage "${usage}"，可选: ${Object.keys(SIZE_MAP).join(", ")}，回退到 "card"`);
  }

  const model = params.model || sizeConfig.model;
  let size = params.size || sizeConfig.size;
  const n = params.n || 1;
  const saveDir = resolve(process.cwd(), params.saveDir || "./assets/stepfun");

  // Validate size against model
  const allowedSizes = MODEL_SIZES[model];
  if (allowedSizes && !allowedSizes.includes(size)) {
    console.warn(
      `[stepfun-image] 模型 "${model}" 不支持尺寸 "${size}"，可用: ${allowedSizes.join(", ")}，回退到默认 1024x1024`
    );
    size = "1024x1024";
  }

  // Build request body
  const body = {
    model,
    prompt: params.prompt,
    size,
    n,
    response_format: "url",
  };
  if (params.seed !== undefined) {
    body.seed = params.seed;
  }

  // Call StepFun API
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`StepFun API ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Save images to disk
  await mkdir(saveDir, { recursive: true });

  const results = [];
  for (const item of data.data) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) {
      throw new Error(`下载图片失败: HTTP ${imgRes.status}`);
    }

    const buf = Buffer.from(await imgRes.arrayBuffer());
    const date = new Date().toISOString().slice(0, 10);
    const suffix = randomBytes(3).toString("hex");
    const filename = `${date}-${suffix}.png`;
    const absPath = join(saveDir, filename);

    await writeFile(absPath, buf);

    const relDir = (params.saveDir || "./assets/stepfun").replace(/^\.\//, "");
    const relPath = "./" + relDir + "/" + filename;

    results.push({
      localPath: relPath,
      absolutePath: absPath,
      size,
      model,
      seed: item.seed,
      pptxLayout: sizeConfig.pptxLayout,
      usage,
    });
  }

  // Return first image for single-n, array info for multi-n
  return n === 1 ? results[0] : results;
}

// ---------------------------------------------------------------------------
// List available image models and sizes
// ---------------------------------------------------------------------------
export function listImageModels() {
  return Object.entries(MODEL_SIZES).map(([id, sizes]) => ({
    id,
    sizes,
    recommended:
      id === "step-image-edit-2"
        ? "默认推荐：新一代图像模型，效果最好"
        : id === "step-2x-large"
        ? "上一代高质量，适合 Banner/Hero 图"
        : "性价比，速度快，适合占位图/草图",
  }));
}

// ---------------------------------------------------------------------------
// Helper: add image to slide with proper sizing and padding
// ---------------------------------------------------------------------------
/**
 * Add a generated image to a PptxGenJS slide with recommended layout.
 *
 * @param {Object} slide      — PptxGenJS slide object
 * @param {Object} imageInfo  — Return value from generateSlideImage()
 * @param {Object} [overrides]— Override positioning: { x, y, w, h, rounding, transparency }
 * @returns {void}
 */
export function addImageToSlide(slide, imageInfo, overrides = {}) {
  if (!imageInfo) return;

  const layout = imageInfo.pptxLayout || {};
  slide.addImage({
    path: imageInfo.absolutePath || imageInfo.localPath,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    w: overrides.w ?? layout.w ?? 2.5,
    h: overrides.h ?? layout.h ?? 2.5,
    rounding: overrides.rounding ?? false,
    transparency: overrides.transparency ?? 0,
  });
}

// ---------------------------------------------------------------------------
// Helper: add semi-transparent overlay on top of a background image
// Used when placing text over a cover/hero image to ensure readability
// ---------------------------------------------------------------------------
/**
 * Add a dark overlay rectangle on a slide for text readability over images.
 *
 * @param {Object} slide  — PptxGenJS slide object
 * @param {Object} pres   — PptxGenJS presentation object (for shapes)
 * @param {Object} [opts] — { x, y, w, h, color, opacity }
 * @param {string} [opts.color]      — Overlay color (no #), default "0B1B2B"
 * @param {number} [opts.opacity]    — 0-100, default 40
 */
export function addImageOverlay(slide, pres, opts = {}) {
  const SW = 10;
  const SH = 5.625;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    w: opts.w ?? SW,
    h: opts.h ?? SH,
    fill: { color: opts.color ?? "0B1B2B", transparency: opts.opacity ?? 40 },
    line: { color: opts.color ?? "0B1B2B", transparency: opts.opacity ?? 40 },
  });
}
