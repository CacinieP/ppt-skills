/**
 * AI Image Generation Utility for PPT Skills
 *
 * Supports StepFun (阶跃星辰) and MiniMax text-to-image APIs in one
 * PPT-friendly helper. It selects image ratios from slide usage, saves the
 * generated image locally, and returns PptxGenJS-ready layout metadata.
 *
 * Environment Variables (read from process.env or a project-root .env file):
 *   PPT_IMAGE_PROVIDER  - Optional. "stepfun" or "minimax". Provider aliases
 *                         like "stepfun-global" and "minimax-cn" are supported.
 *                         Defaults to StepFun unless only MINIMAX_API_KEY exists.
 *   PPT_IMAGE_REGION    - Optional. "cn" or "global". Provider-specific env
 *                         vars STEPFUN_REGION / MINIMAX_REGION take precedence.
 *   STEPFUN_API_KEY     - StepFun API key from platform.stepfun.com/.ai
 *   STEPFUN_REGION      - Optional. "cn" -> api.stepfun.com, "global" -> api.stepfun.ai
 *   STEPFUN_API_MODE    - Optional. "platform" (default) or "step_plan".
 *   STEPFUN_BASE_URL    - Optional. Overrides region/mode base URL selection.
 *   MINIMAX_API_KEY     - MiniMax API key from platform.minimaxi.com/.io
 *   MINIMAX_REGION      - Optional. "cn" -> api.minimaxi.com, "global" -> api.minimax.io
 *   MINIMAX_BASE_URL    - Optional. Overrides region base URL selection.
 *
 * Usage in build_<theme>.js:
 *   import { generateSlideImage, addImageToSlide, addImageOverlay } from "./lib/ai-image.js";
 *
 *   const img = await generateSlideImage({
 *     provider: "stepfun", // optional: "stepfun" | "minimax" | "stepfun-global"
 *     prompt: "赛博朋克城市夜景，中文发布会封面背景",
 *     usage: "cover",
 *   });
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, join, isAbsolute } from "node:path";

// ---------------------------------------------------------------------------
// .env auto-loader (runs once on import, zero dependencies)
// ---------------------------------------------------------------------------
{
  const envPath = resolve(process.cwd(), ".env");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // process.env already set by shell, MCP, or CI takes precedence.
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env not found is fine. Rely on process.env from shell / MCP / CI.
  }
}

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------
export const IMAGE_PROVIDERS = {
  stepfun: {
    id: "stepfun",
    label: "StepFun 阶跃星辰",
    apiKeyEnv: "STEPFUN_API_KEY",
    baseUrlEnv: "STEPFUN_BASE_URL",
    regionEnv: "STEPFUN_REGION",
    modeEnv: "STEPFUN_API_MODE",
    defaultRegion: "cn",
    defaultMode: "platform",
    baseUrls: {
      cn: "https://api.stepfun.com/v1",
      global: "https://api.stepfun.ai/v1",
    },
    stepPlanBaseUrls: {
      cn: "https://api.stepfun.com/step_plan/v1",
      global: "https://api.stepfun.ai/step_plan/v1",
    },
    defaultModel: "step-image-edit-2",
    defaultSaveDir: "./assets/stepfun",
    maxN: 1,
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    apiKeyEnv: "MINIMAX_API_KEY",
    baseUrlEnv: "MINIMAX_BASE_URL",
    regionEnv: "MINIMAX_REGION",
    defaultRegion: "global",
    baseUrls: {
      cn: "https://api.minimaxi.com/v1",
      global: "https://api.minimax.io/v1",
    },
    defaultModel: "image-01",
    defaultSaveDir: "./assets/minimax",
    maxN: 9,
  },
};

export const SUPPORTED_IMAGE_PROVIDERS = Object.keys(IMAGE_PROVIDERS);
export const SUPPORTED_IMAGE_REGIONS = ["cn", "global"];

// ---------------------------------------------------------------------------
// Size mapping: PPT usage -> provider request shape + PptxGenJS layout
//
// PPT slide: 10" x 5.625" (16:9), so generated image aspect ratio matters.
// StepFun uses concrete pixel sizes. MiniMax prefers aspect_ratio and maps:
// 16:9 -> 1280x720, 4:3 -> 1152x864, 1:1 -> 1024x1024, etc.
// Keep top-level size/model as StepFun defaults for backward compatibility.
// ---------------------------------------------------------------------------
export const SIZE_MAP = {
  // --- Full-bleed backgrounds ---
  cover: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1360x768", model: "step-image-edit-2" },
      minimax: { aspectRatio: "16:9", model: "image-01" },
    },
    description: "封面全幅背景图，16:9 精确匹配幻灯片 (10x5.625 in)",
    pptxLayout: { w: 10, h: 5.625 },
  },
  coverOverlay: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1360x768", model: "step-image-edit-2" },
      minimax: { aspectRatio: "16:9", model: "image-01" },
    },
    description: "封面背景图，需半透明遮罩配文字",
    pptxLayout: { w: 10, h: 5.625 },
  },
  // --- Banners & hero ---
  hero: {
    size: "1360x768",
    aspectRatio: "16:9",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1360x768", model: "step-image-edit-2" },
      minimax: { aspectRatio: "16:9", model: "image-01" },
    },
    description: "Hero banner，页面上半区横幅，16:9 裁切为约 10x3 in",
    pptxLayout: { w: 10, h: 3.0 },
  },
  sideStrip: {
    size: "768x1360",
    aspectRatio: "9:16",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "768x1360", model: "step-image-edit-2" },
      minimax: { aspectRatio: "9:16", model: "image-01" },
    },
    description: "竖向侧栏装饰图，9:16 竖版，右侧约 2.5 in 宽",
    pptxLayout: { w: 2.5, h: 4.44 },
  },
  // --- Cards & inline images ---
  card: {
    size: "1024x1024",
    aspectRatio: "1:1",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1024x1024", model: "step-image-edit-2" },
      minimax: { aspectRatio: "1:1", model: "image-01" },
    },
    description: "卡片方形配图，适合内容页卡片内嵌",
    pptxLayout: { w: 2.5, h: 2.5 },
  },
  cardTall: {
    size: "896x1184",
    aspectRatio: "3:4",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "896x1184", model: "step-image-edit-2" },
      minimax: { aspectRatio: "3:4", model: "image-01" },
    },
    description: "卡片竖版配图，3:4 比例，适合侧栏或高卡片",
    pptxLayout: { w: 2.3, h: 3.04 },
  },
  cardWide: {
    size: "1184x896",
    aspectRatio: "4:3",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1184x896", model: "step-image-edit-2" },
      minimax: { aspectRatio: "4:3", model: "image-01" },
    },
    description: "卡片横版配图，4:3 比例，适合项目展示左图右文",
    pptxLayout: { w: 3.5, h: 2.65 },
  },
  // --- Showcase & mockup ---
  showcase: {
    size: "1184x896",
    aspectRatio: "4:3",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "1184x896", model: "step-image-edit-2" },
      minimax: { aspectRatio: "4:3", model: "image-01" },
    },
    description: "项目展示横版配图，4:3 比例，左图右文布局",
    pptxLayout: { w: 3.9, h: 2.95 },
  },
  phoneMockup: {
    size: "768x1360",
    aspectRatio: "9:16",
    model: "step-image-edit-2",
    providers: {
      stepfun: { size: "768x1360", model: "step-image-edit-2" },
      minimax: { aspectRatio: "9:16", model: "image-01" },
    },
    description: "手机竖屏 mockup，9:16 比例",
    pptxLayout: { w: 1.8, h: 3.2 },
  },
  // --- Small ---
  icon: {
    size: "512x512",
    aspectRatio: "1:1",
    model: "step-2x-large",
    providers: {
      stepfun: { size: "512x512", model: "step-2x-large" },
      minimax: { aspectRatio: "1:1", model: "image-01" },
    },
    description: "小图标/占位图，适合功能图标或头像",
    pptxLayout: { w: 1.5, h: 1.5 },
  },
};

// ---------------------------------------------------------------------------
// Supported models and output shapes
// ---------------------------------------------------------------------------
export const STEPFUN_MODEL_SIZES = {
  "step-image-edit-2": ["1024x1024", "768x1360", "896x1184", "1360x768", "1184x896"],
  "step-2x-large": ["256x256", "512x512", "768x768", "1024x1024", "1280x800", "800x1280"],
  "step-1x-medium": ["256x256", "512x512", "768x768", "1024x1024", "1280x800", "800x1280"],
};

export const MINIMAX_ASPECT_RATIO_SIZES = {
  "1:1": "1024x1024",
  "16:9": "1280x720",
  "4:3": "1152x864",
  "3:2": "1248x832",
  "2:3": "832x1248",
  "3:4": "864x1152",
  "9:16": "720x1280",
  "21:9": "1344x576",
};

const MINIMAX_ASPECT_RATIOS = Object.keys(MINIMAX_ASPECT_RATIO_SIZES);

export function getImageUsageConfig(usage = "card", providerInput = "stepfun") {
  const provider = resolveImageProvider(providerInput);
  const sizeConfig = SIZE_MAP[usage] || SIZE_MAP.card;
  const providerSpec = sizeConfig.providers[provider] || {};

  return {
    usage: SIZE_MAP[usage] ? usage : "card",
    provider,
    model: providerSpec.model || sizeConfig.model || IMAGE_PROVIDERS[provider].defaultModel,
    size: providerSpec.size || sizeConfig.size,
    aspectRatio: providerSpec.aspectRatio || sizeConfig.aspectRatio,
    pptxLayout: sizeConfig.pptxLayout,
    description: sizeConfig.description,
  };
}

export function listImageUsages(providerInput) {
  return Object.keys(SIZE_MAP).map((usage) => getImageUsageConfig(usage, providerInput));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Generate a slide image using StepFun or MiniMax.
 *
 * @param {Object} params
 * @param {string} params.prompt             - Image description, Chinese or English.
 * @param {string} [params.provider]         - "stepfun", "minimax", or aliases like "stepfun-global".
 * @param {string} [params.region]           - "cn" or "global"; overrides region env vars.
 * @param {string} [params.usage]            - One of SIZE_MAP keys. Defaults to "card".
 * @param {string} [params.model]            - Provider model override.
 * @param {string} [params.size]             - StepFun size override, e.g. "1360x768".
 * @param {string} [params.aspectRatio]      - MiniMax aspect_ratio override, e.g. "16:9".
 * @param {number} [params.width]            - MiniMax custom width, with height.
 * @param {number} [params.height]           - MiniMax custom height, with width.
 * @param {string} [params.saveDir]          - Directory for generated images.
 * @param {number} [params.seed]             - Random seed for reproducibility.
 * @param {number} [params.n]                - Number of images. StepFun max 4, MiniMax max 9.
 * @param {string} [params.apiMode]          - StepFun only: "platform" or "step_plan".
 * @param {number} [params.steps]            - StepFun generation steps.
 * @param {number} [params.cfgScale]         - StepFun cfg_scale.
 * @param {string} [params.negativePrompt]   - StepFun negative_prompt.
 * @param {boolean} [params.textMode]        - StepFun text_mode.
 * @param {boolean} [params.promptOptimizer] - MiniMax prompt_optimizer.
 * @param {boolean} [params.aigcWatermark]   - MiniMax aigc_watermark.
 * @param {Array} [params.subjectReference]  - MiniMax subject_reference.
 * @returns {Promise<Object|Object[]|null>} Image info, array for n > 1, or null if key missing.
 */
export async function generateSlideImage(params = {}) {
  const provider = resolveImageProvider(params.provider);
  const region = resolveImageRegion(provider, params.region, params.provider);
  const providerConfig = IMAGE_PROVIDERS[provider];
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    warnMissingApiKey(provider, region);
    return null;
  }

  const prompt = String(params.prompt || "").trim();
  if (!prompt) {
    throw new Error("[ai-image] prompt is required when an API key is configured");
  }

  const usage = params.usage || "card";
  const sizeConfig = SIZE_MAP[usage] || SIZE_MAP.card;
  if (!SIZE_MAP[usage]) {
    console.warn(
      `[ai-image] 未知 usage "${usage}"，可选: ${Object.keys(SIZE_MAP).join(", ")}，回退到 "card"`
    );
  }

  const n = clampImageCount(params.n || 1, providerConfig.maxN, provider);
  const saveDir = normalizeSaveDir(params.saveDir || providerConfig.defaultSaveDir);

  if (provider === "minimax") {
    return generateMiniMaxImage({ ...params, prompt, n, usage, sizeConfig, saveDir, apiKey, region });
  }

  return generateStepFunImage({ ...params, prompt, n, usage, sizeConfig, saveDir, apiKey, region });
}

export function resolveImageProvider(provider) {
  const explicit = parseProviderAlias(provider).provider || normalizeProvider(provider);
  if (explicit) return explicit;

  const envProvider =
    parseProviderAlias(process.env.PPT_IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER).provider ||
    normalizeProvider(process.env.PPT_IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER);
  if (envProvider) return envProvider;

  if (process.env.MINIMAX_API_KEY && !process.env.STEPFUN_API_KEY) {
    return "minimax";
  }

  return "stepfun";
}

export function resolveImageRegion(provider, region, providerAlias) {
  const aliasRegion = parseProviderAlias(providerAlias).region;
  if (aliasRegion) return aliasRegion;

  const explicitRegion = normalizeRegion(region);
  if (explicitRegion) return explicitRegion;

  const config = IMAGE_PROVIDERS[provider] || IMAGE_PROVIDERS.stepfun;
  const providerRegion = normalizeRegion(process.env[config.regionEnv]);
  if (providerRegion) return providerRegion;

  const globalRegion = normalizeRegion(process.env.PPT_IMAGE_REGION || process.env.AI_IMAGE_REGION);
  if (globalRegion) return globalRegion;

  return config.defaultRegion;
}

export function getImageBaseUrl(providerInput, regionInput, apiModeInput) {
  const provider = resolveImageProvider(providerInput);
  const region = resolveImageRegion(provider, regionInput, providerInput);
  return getBaseUrl(provider, region, apiModeInput);
}

export function listImageModels(provider) {
  const normalized = parseProviderAlias(provider).provider || normalizeProvider(provider);

  const stepfun = Object.entries(STEPFUN_MODEL_SIZES).map(([id, sizes]) => ({
    provider: "stepfun",
    id,
    sizes,
    recommended:
      id === "step-image-edit-2"
        ? "默认推荐：新一代图像模型，适合封面、卡片、展示图"
        : id === "step-2x-large"
        ? "上一代高质量模型，适合方图、横幅、图标"
        : "速度快，适合占位图或草图",
  }));

  const minimax = [
    {
      provider: "minimax",
      id: "image-01",
      aspectRatios: MINIMAX_ASPECT_RATIOS,
      sizes: Object.entries(MINIMAX_ASPECT_RATIO_SIZES).map(([ratio, size]) => `${ratio} (${size})`),
      recommended: "MiniMax 文生图模型，适合按 aspect_ratio 快速匹配 PPT 版式",
    },
  ];

  if (normalized === "stepfun") return stepfun;
  if (normalized === "minimax") return minimax;
  return [...stepfun, ...minimax];
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------
async function generateStepFunImage(ctx) {
  const provider = "stepfun";
  const providerSpec = ctx.sizeConfig.providers.stepfun || {};
  const model = ctx.model || providerSpec.model || ctx.sizeConfig.model || IMAGE_PROVIDERS.stepfun.defaultModel;
  let size = ctx.size || providerSpec.size || ctx.sizeConfig.size || "1024x1024";

  const allowedSizes = STEPFUN_MODEL_SIZES[model];
  if (allowedSizes && !allowedSizes.includes(size)) {
    console.warn(
      `[ai-image] StepFun 模型 "${model}" 不支持尺寸 "${size}"，可用: ${allowedSizes.join(", ")}，回退到 1024x1024`
    );
    size = "1024x1024";
  }

  const body = {
    model,
    prompt: ctx.prompt,
    size,
    n: ctx.n,
    response_format: ctx.responseFormat || ctx.response_format || "url",
  };
  if (ctx.seed !== undefined) body.seed = ctx.seed;
  if (ctx.steps !== undefined) body.steps = ctx.steps;

  const cfgScale = ctx.cfgScale ?? ctx.cfg_scale;
  if (cfgScale !== undefined) body.cfg_scale = cfgScale;

  const negativePrompt = ctx.negativePrompt ?? ctx.negative_prompt;
  if (negativePrompt !== undefined) body.negative_prompt = negativePrompt;

  const textMode = ctx.textMode ?? ctx.text_mode;
  if (textMode !== undefined) body.text_mode = Boolean(textMode);

  const data = await postJson(`${getBaseUrl(provider, ctx.region, ctx.apiMode)}/images/generations`, {
    provider,
    apiKey: ctx.apiKey,
    body,
  });

  const items = Array.isArray(data.data) ? data.data : [];
  const urls = items.map((item) => item.url || item.image_url).filter(Boolean);
  const base64Images = items.map((item) => item.b64_json || item.image_base64).filter(Boolean);

  if (urls.length > 0) {
    return saveUrlImages(urls, ctx, {
      provider,
      region: ctx.region,
      model,
      size,
      aspectRatio: ctx.sizeConfig.aspectRatio,
      pixelAspectRatio: sizeToAspectRatio(size),
      seeds: items.map((item) => item.seed),
    });
  }

  if (base64Images.length > 0) {
    return saveBase64Images(base64Images, ctx, {
      provider,
      region: ctx.region,
      model,
      size,
      aspectRatio: ctx.sizeConfig.aspectRatio,
      pixelAspectRatio: sizeToAspectRatio(size),
      seeds: items.map((item) => item.seed),
      defaultExt: ".png",
    });
  }

  throw new Error("[ai-image] StepFun API response did not include image URLs");
}

async function generateMiniMaxImage(ctx) {
  const provider = "minimax";
  const providerSpec = ctx.sizeConfig.providers.minimax || {};
  const model = ctx.model || providerSpec.model || IMAGE_PROVIDERS.minimax.defaultModel;

  const customSize = ctx.width && ctx.height ? `${ctx.width}x${ctx.height}` : null;
  const customAspectRatio = customSize ? sizeToAspectRatio(customSize) : null;
  let aspectRatio =
    ctx.aspectRatio ||
    ctx.aspect_ratio ||
    providerSpec.aspectRatio ||
    ctx.sizeConfig.aspectRatio ||
    "1:1";

  const body = {
    model,
    prompt: ctx.prompt,
    n: ctx.n,
    response_format: ctx.responseFormat || ctx.response_format || "url",
  };

  if (customSize && !ctx.aspectRatio && !ctx.aspect_ratio) {
    validateMiniMaxDimension(ctx.width, "width");
    validateMiniMaxDimension(ctx.height, "height");
    body.width = ctx.width;
    body.height = ctx.height;
  } else {
    if (!MINIMAX_ASPECT_RATIOS.includes(aspectRatio)) {
      console.warn(
        `[ai-image] MiniMax 不支持 aspect_ratio "${aspectRatio}"，可选: ${MINIMAX_ASPECT_RATIOS.join(", ")}，回退到 1:1`
      );
      aspectRatio = "1:1";
    }
    body.aspect_ratio = aspectRatio;
  }

  const promptOptimizer = ctx.promptOptimizer ?? ctx.prompt_optimizer;
  if (promptOptimizer !== undefined) body.prompt_optimizer = Boolean(promptOptimizer);

  const aigcWatermark = ctx.aigcWatermark ?? ctx.aigc_watermark;
  if (aigcWatermark !== undefined) body.aigc_watermark = Boolean(aigcWatermark);

  if (ctx.seed !== undefined) body.seed = ctx.seed;

  const subjectReference = ctx.subjectReference ?? ctx.subject_reference;
  if (subjectReference) body.subject_reference = subjectReference;

  const data = await postJson(`${getBaseUrl(provider, ctx.region)}/image_generation`, {
    provider,
    apiKey: ctx.apiKey,
    body,
  });

  const statusCode = data.base_resp?.status_code;
  if (statusCode !== undefined && statusCode !== 0) {
    throw new Error(`MiniMax API error ${statusCode}: ${data.base_resp?.status_msg || "unknown error"}`);
  }

  const urls = Array.isArray(data.data?.image_urls) ? data.data.image_urls : [];
  const base64Images = Array.isArray(data.data?.image_base64) ? data.data.image_base64 : [];
  const size = customSize || MINIMAX_ASPECT_RATIO_SIZES[aspectRatio] || ctx.sizeConfig.size;
  const outputAspectRatio = customAspectRatio || aspectRatio;

  if (urls.length > 0) {
    return saveUrlImages(urls, ctx, { provider, region: ctx.region, model, size, aspectRatio: outputAspectRatio });
  }

  if (base64Images.length > 0) {
    return saveBase64Images(base64Images, ctx, {
      provider,
      region: ctx.region,
      model,
      size,
      aspectRatio: outputAspectRatio,
      defaultExt: ".jpg",
    });
  }

  throw new Error("[ai-image] MiniMax API response did not include image URLs or base64 data");
}

// ---------------------------------------------------------------------------
// Helpers: network, saving, metadata
// ---------------------------------------------------------------------------
async function postJson(url, { provider, apiKey, body }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${IMAGE_PROVIDERS[provider].label} API ${res.status}: ${errText}`);
  }

  return res.json();
}

async function saveUrlImages(urls, ctx, meta) {
  await mkdir(ctx.saveDir.absolute, { recursive: true });

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const imgRes = await fetch(urls[i]);
    if (!imgRes.ok) {
      throw new Error(`[ai-image] 下载图片失败: HTTP ${imgRes.status}`);
    }

    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ext = extensionFromContentType(imgRes.headers.get("content-type")) || ".png";
    const file = await writeImageBuffer(buf, ctx.saveDir, ext);

    results.push(buildImageInfo(ctx, meta, file, {
      sourceUrl: urls[i],
      seed: meta.seeds?.[i],
    }));
  }

  return ctx.n === 1 ? results[0] : results;
}

async function saveBase64Images(images, ctx, meta) {
  await mkdir(ctx.saveDir.absolute, { recursive: true });

  const results = [];
  for (let i = 0; i < images.length; i++) {
    const decoded = decodeBase64Image(images[i], meta.defaultExt || ".png");
    const file = await writeImageBuffer(decoded.buffer, ctx.saveDir, decoded.ext);

    results.push(buildImageInfo(ctx, meta, file, {
      seed: meta.seeds?.[i],
    }));
  }

  return ctx.n === 1 ? results[0] : results;
}

async function writeImageBuffer(buffer, saveDir, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = randomBytes(3).toString("hex");
  const filename = `${date}-${suffix}${ext}`;
  const absolutePath = join(saveDir.absolute, filename);

  await writeFile(absolutePath, buffer);

  const localPath = saveDir.isAbsolute
    ? absolutePath
    : `./${saveDir.relative.replace(/\/$/, "")}/${filename}`;

  return { absolutePath, localPath };
}

function buildImageInfo(ctx, meta, file, extra = {}) {
  return {
    provider: meta.provider,
    region: meta.region,
    localPath: file.localPath,
    absolutePath: file.absolutePath,
    size: meta.size,
    aspectRatio: meta.aspectRatio,
    pixelAspectRatio: meta.pixelAspectRatio,
    model: meta.model,
    seed: extra.seed,
    pptxLayout: ctx.sizeConfig.pptxLayout,
    usage: ctx.usage,
    sourceUrl: extra.sourceUrl,
  };
}

// ---------------------------------------------------------------------------
// Helpers: config, validation, normalization
// ---------------------------------------------------------------------------
function normalizeProvider(provider) {
  if (!provider) return null;
  const normalized = String(provider).trim().toLowerCase();
  if (normalized === "step" || normalized === "stepfun") return "stepfun";
  if (normalized === "minimax" || normalized === "mini-max") return "minimax";
  if (normalized.includes("stepfun") || normalized.startsWith("step-")) return "stepfun";
  if (normalized.includes("minimax") || normalized.includes("mini-max")) return "minimax";
  console.warn(
    `[ai-image] 未知 provider "${provider}"，可选: ${SUPPORTED_IMAGE_PROVIDERS.join(", ")}，或 stepfun-cn/stepfun-global/minimax-cn/minimax-global`
  );
  return null;
}

function parseProviderAlias(value) {
  if (!value) return {};
  const normalized = String(value).trim().toLowerCase();
  const provider = normalizeProviderForAlias(normalized);
  const region = normalizeRegion(normalized);
  return { provider, region };
}

function normalizeProviderForAlias(value) {
  if (!value) return null;
  if (value === "step" || value === "stepfun" || value.startsWith("stepfun-") || value.startsWith("stepfun:")) {
    return "stepfun";
  }
  if (
    value === "minimax" ||
    value === "mini-max" ||
    value.startsWith("minimax-") ||
    value.startsWith("minimax:") ||
    value.startsWith("mini-max-")
  ) {
    return "minimax";
  }
  return null;
}

function normalizeRegion(region) {
  if (!region) return null;
  const normalized = String(region).trim().toLowerCase();
  if (["cn", "china", "zh", "zh-cn", "domestic", "mainland", "mainland-china", "china-mainland"].includes(normalized)) {
    return "cn";
  }
  if (["global", "intl", "international", "overseas", "abroad", "en", "us"].includes(normalized)) {
    return "global";
  }

  const tokens = normalized.split(/[\s:_-]+/).filter(Boolean);
  if (tokens.some((token) => ["cn", "china", "domestic", "mainland"].includes(token))) return "cn";
  if (tokens.some((token) => ["global", "intl", "international", "overseas", "abroad"].includes(token))) {
    return "global";
  }
  return null;
}

function getApiKey(provider) {
  return process.env[IMAGE_PROVIDERS[provider].apiKeyEnv] || null;
}

function getBaseUrl(provider, region, apiModeInput) {
  const config = IMAGE_PROVIDERS[provider];
  const override = process.env[config.baseUrlEnv];
  if (override) return override.replace(/\/+$/, "");

  const normalizedRegion = normalizeRegion(region) || config.defaultRegion;

  let raw;
  if (provider === "stepfun") {
    const apiMode = normalizeStepFunApiMode(apiModeInput || process.env[config.modeEnv] || process.env.PPT_IMAGE_API_MODE);
    raw = apiMode === "step_plan" ? config.stepPlanBaseUrls[normalizedRegion] : config.baseUrls[normalizedRegion];
  } else {
    raw = config.baseUrls[normalizedRegion];
  }

  return raw.replace(/\/+$/, "");
}

function normalizeStepFunApiMode(mode) {
  if (!mode) return "platform";
  const normalized = String(mode).trim().toLowerCase();
  if (["step_plan", "step-plan", "plan", "token_plan", "token-plan"].includes(normalized)) return "step_plan";
  return "platform";
}

function validateMiniMaxDimension(value, name) {
  const number = Number.parseInt(value, 10);
  if (number < 512 || number > 2048 || number % 8 !== 0) {
    throw new Error(`[ai-image] MiniMax ${name} must be in [512, 2048] and divisible by 8; got ${value}`);
  }
}

function warnMissingApiKey(provider, region) {
  const config = IMAGE_PROVIDERS[provider];
  const lines = [
    `[ai-image] ${config.apiKeyEnv} 未设置，跳过 ${config.label} ${region} AI 生图。`,
    "  PPTX 会继续生成，请用纯色或占位图降级。",
    "  设置方式：",
    `    1. .env: PPT_IMAGE_PROVIDER=${provider}、PPT_IMAGE_REGION=${region}、${config.apiKeyEnv}=sk-xxx`,
    `    2. Shell: export PPT_IMAGE_PROVIDER=${provider}; export PPT_IMAGE_REGION=${region}; export ${config.apiKeyEnv}=sk-xxx`,
  ];

  if (provider === "stepfun") {
    lines.push(region === "global" ? "  获取 API Key: https://platform.stepfun.ai" : "  获取 API Key: https://platform.stepfun.com");
  } else {
    lines.push(region === "cn" ? "  获取 API Key: https://platform.minimaxi.com" : "  获取 API Key: https://platform.minimax.io");
  }

  console.warn(lines.join("\n"));
}

function clampImageCount(value, max, provider) {
  let n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) n = 1;
  if (n > max) {
    console.warn(`[ai-image] ${IMAGE_PROVIDERS[provider].label} 单次最多生成 ${max} 张，已将 n=${n} 调整为 ${max}`);
    n = max;
  }
  return n;
}

function normalizeSaveDir(saveDir) {
  const absolute = resolve(process.cwd(), saveDir);
  const isAbs = isAbsolute(saveDir);
  const relative = saveDir
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");

  return {
    absolute,
    relative,
    isAbsolute: isAbs,
  };
}

function decodeBase64Image(value, defaultExt) {
  const match = String(value).match(/^data:image\/([^;]+);base64,(.+)$/);
  if (match) {
    return {
      buffer: Buffer.from(match[2], "base64"),
      ext: extensionFromSubtype(match[1]) || defaultExt,
    };
  }

  return {
    buffer: Buffer.from(String(value), "base64"),
    ext: defaultExt,
  };
}

function extensionFromContentType(contentType) {
  if (!contentType) return null;
  const normalized = contentType.toLowerCase();
  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) return ".jpg";
  if (normalized.includes("image/png")) return ".png";
  if (normalized.includes("image/webp")) return ".webp";
  return null;
}

function extensionFromSubtype(subtype) {
  const normalized = subtype.toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg") return ".jpg";
  if (normalized === "png") return ".png";
  if (normalized === "webp") return ".webp";
  return null;
}

function sizeToAspectRatio(size) {
  const match = String(size || "").match(/^(\d+)x(\d+)$/);
  if (!match) return null;

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Helper: add image to slide with proper sizing and padding
// ---------------------------------------------------------------------------
/**
 * Add a generated image to a PptxGenJS slide with recommended layout.
 *
 * @param {Object} slide       - PptxGenJS slide object.
 * @param {Object} imageInfo   - Return value from generateSlideImage().
 * @param {Object} [overrides] - Override positioning: { x, y, w, h, rounding, transparency }.
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
// ---------------------------------------------------------------------------
/**
 * Add a dark overlay rectangle on a slide for text readability over images.
 *
 * @param {Object} slide  - PptxGenJS slide object.
 * @param {Object} pres   - PptxGenJS presentation object.
 * @param {Object} [opts] - { x, y, w, h, color, opacity }.
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
