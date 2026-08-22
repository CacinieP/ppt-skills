import {
  SIZE_MAP,
  adaptAspectRatioForGemini,
  adaptSizeForGptImage,
  generateSlideImage,
  getImageBaseUrl,
  getImageUsageConfig,
  listImageModels,
  listImageUsages,
  resolveImageProvider,
} from "../skills/themed-cn-pptx/lib/ai-image.js";

const originalEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  GOOGLE_BASE_URL: process.env.GOOGLE_BASE_URL,
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
  GOOGLE_IMAGE_MODEL: process.env.GOOGLE_IMAGE_MODEL,
  PPT_IMAGE_PROVIDER: process.env.PPT_IMAGE_PROVIDER,
  AI_IMAGE_PROVIDER: process.env.AI_IMAGE_PROVIDER,
};
const originalWarn = console.warn;

for (const key of Object.keys(originalEnv)) {
  delete process.env[key];
}

process.env.PPT_IMAGE_PROVIDER = "google";

if (resolveImageProvider() !== "google") {
  throw new Error("PPT_IMAGE_PROVIDER=google did not resolve to google");
}

if (resolveImageProvider("nano-banana-pro") !== "google") {
  throw new Error("nano-banana-pro alias did not resolve to google");
}
if (resolveImageProvider("gpt-image") !== "openai") {
  throw new Error("gpt-image alias did not resolve to openai");
}
if (resolveImageProvider("gemini") !== "google") {
  throw new Error("gemini alias did not resolve to google");
}
if (getImageBaseUrl("openai") !== "https://api.openai.com/v1") {
  throw new Error("OpenAI base URL mismatch");
}
if (getImageBaseUrl("google") !== "https://generativelanguage.googleapis.com/v1beta") {
  throw new Error("Google base URL mismatch");
}

// SIZE_MAP contract is unchanged: same sizes, ratios, and PPTX layouts.
if (SIZE_MAP.cover.size !== "1360x768" || SIZE_MAP.cover.aspectRatio !== "16:9") {
  throw new Error("cover size contract changed");
}
if (SIZE_MAP.icon.size !== "512x512" || SIZE_MAP.cardTall.size !== "896x1184") {
  throw new Error("icon/cardTall size contract changed");
}
if (SIZE_MAP.cover.pptxLayout.w !== 10 || SIZE_MAP.cover.pptxLayout.h !== 5.625) {
  throw new Error("cover pptx layout contract changed");
}

// Provider size adaptation.
if (getImageUsageConfig("cover", "openai").size !== "1360x768") {
  throw new Error("gpt-image-2 cover size should pass through unchanged");
}
if (getImageUsageConfig("cover", "google").aspectRatio !== "16:9") {
  throw new Error("Nano Banana Pro cover aspect ratio mismatch");
}
if (getImageUsageConfig("cover", "google").imageSize !== "2K") {
  throw new Error("Nano Banana Pro cover should default to 2K");
}
if (getImageUsageConfig("icon", "openai").size !== "1024x1024") {
  throw new Error("icon should snap from 512x512 up to 1024x1024 for gpt-image-2");
}
if (getImageUsageConfig("icon", "google").imageSize !== "1K") {
  throw new Error("Nano Banana Pro icon should use 1K");
}
if (getImageUsageConfig("ultraWideHero", "openai").size !== "1344x576") {
  throw new Error("ultraWideHero should generate native 21:9 at 1344x576 on OpenAI");
}
if (getImageUsageConfig("ultraWideHero", "google").aspectRatio !== "21:9") {
  throw new Error("Nano Banana Pro ultraWideHero should map to 21:9");
}
if (getImageUsageConfig("bannerWide", "openai").cropPolicy !== "fit") {
  throw new Error("native 21:9 banners should not carry a crop policy");
}
if (!listImageUsages("google").some((usage) => usage.usage === "phoneMockup" && usage.aspectRatio === "9:16")) {
  throw new Error("Nano Banana Pro phoneMockup usage mapping missing");
}

// Constraint adapters.
if (adaptSizeForGptImage("512x512") === "512x512") {
  throw new Error("512x512 is below the gpt-image-2 minimum pixel count and must be adapted");
}
if (adaptSizeForGptImage("1360x768") !== "1360x768") {
  throw new Error("1360x768 satisfies gpt-image-2 constraints and must pass through");
}
if (adaptSizeForGptImage("1000x1000") !== "1008x1008") {
  throw new Error("edges must snap to multiples of 16");
}
if (adaptSizeForGptImage("7680x4320") !== "3840x2160") {
  throw new Error("long edge must clamp to 3840");
}
if (adaptAspectRatioForGemini("16:10") !== "3:2") {
  // 16:10 = 1.60 is numerically closer to 3:2 (1.50) than 16:9 (1.78).
  throw new Error("unsupported ratios should snap to the numerically nearest ratio");
}
if (adaptAspectRatioForGemini("4:3") !== "4:3") {
  throw new Error("supported ratios must pass through");
}

let skipped;
try {
  console.warn = () => {};
  skipped = await generateSlideImage({
    prompt: "smoke test image",
    usage: "cover",
  });
} finally {
  console.warn = originalWarn;
}

if (skipped !== null) {
  throw new Error("generateSlideImage should return null when provider API key is missing");
}

try {
  console.warn = () => {};
  skipped = await generateSlideImage({
    provider: "openai",
    prompt: "smoke test image",
    usage: "card",
  });
} finally {
  console.warn = originalWarn;
}

if (skipped !== null) {
  throw new Error("OpenAI no-key fallback should return null");
}

const models = listImageModels();
if (!models.some((model) => model.provider === "openai" && model.id === "gpt-image-2")) {
  throw new Error("gpt-image-2 missing from listImageModels()");
}
if (!models.some((model) => model.provider === "google" && model.id === "gemini-3-pro-image")) {
  throw new Error("gemini-3-pro-image missing from listImageModels()");
}

for (const [key, value] of Object.entries(originalEnv)) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

console.log("smoke-test ok");
