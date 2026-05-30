import {
  SIZE_MAP,
  generateSlideImage,
  getImageBaseUrl,
  getImageUsageConfig,
  listImageModels,
  listImageUsages,
  resolveImageProvider,
  resolveImageRegion,
} from "../skills/themed-cn-pptx/lib/ai-image.js";

const originalEnv = {
  STEPFUN_API_KEY: process.env.STEPFUN_API_KEY,
  MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
  PPT_IMAGE_PROVIDER: process.env.PPT_IMAGE_PROVIDER,
  AI_IMAGE_PROVIDER: process.env.AI_IMAGE_PROVIDER,
  PPT_IMAGE_REGION: process.env.PPT_IMAGE_REGION,
  AI_IMAGE_REGION: process.env.AI_IMAGE_REGION,
  STEPFUN_REGION: process.env.STEPFUN_REGION,
  MINIMAX_REGION: process.env.MINIMAX_REGION,
  STEPFUN_BASE_URL: process.env.STEPFUN_BASE_URL,
  MINIMAX_BASE_URL: process.env.MINIMAX_BASE_URL,
  STEPFUN_API_MODE: process.env.STEPFUN_API_MODE,
  PPT_IMAGE_API_MODE: process.env.PPT_IMAGE_API_MODE,
};
const originalWarn = console.warn;

for (const key of Object.keys(originalEnv)) {
  delete process.env[key];
}

process.env.PPT_IMAGE_PROVIDER = "minimax";

if (resolveImageProvider() !== "minimax") {
  throw new Error("PPT_IMAGE_PROVIDER=minimax did not resolve to minimax");
}

if (resolveImageProvider("stepfun-global") !== "stepfun") {
  throw new Error("stepfun-global alias did not resolve to stepfun");
}
if (resolveImageRegion("stepfun", undefined, "stepfun-global") !== "global") {
  throw new Error("stepfun-global alias did not resolve to global region");
}
if (getImageBaseUrl("stepfun-cn") !== "https://api.stepfun.com/v1") {
  throw new Error("StepFun CN base URL mismatch");
}
if (getImageBaseUrl("stepfun-global") !== "https://api.stepfun.ai/v1") {
  throw new Error("StepFun global base URL mismatch");
}
if (getImageBaseUrl("stepfun-cn", undefined, "step_plan") !== "https://api.stepfun.com/step_plan/v1") {
  throw new Error("StepFun CN Step Plan base URL mismatch");
}
if (getImageBaseUrl("minimax-cn") !== "https://api.minimaxi.com/v1") {
  throw new Error("MiniMax CN base URL mismatch");
}
if (getImageBaseUrl("minimax-global") !== "https://api.minimax.io/v1") {
  throw new Error("MiniMax global base URL mismatch");
}
if (getImageUsageConfig("cover", "stepfun-cn").size !== "1360x768") {
  throw new Error("StepFun cover size mismatch");
}
if (getImageUsageConfig("cover", "minimax-global").aspectRatio !== "16:9") {
  throw new Error("MiniMax cover aspect ratio mismatch");
}
if (!listImageUsages("minimax-cn").some((usage) => usage.usage === "phoneMockup" && usage.aspectRatio === "9:16")) {
  throw new Error("MiniMax phoneMockup usage mapping missing");
}
if (getImageUsageConfig("ultraWideHero", "minimax-global").aspectRatio !== "21:9") {
  throw new Error("MiniMax ultraWideHero should map to 21:9");
}
if (getImageUsageConfig("ultraWideHero", "stepfun-cn").cropPolicy !== "crop-from-16:9-title-safe-left") {
  throw new Error("StepFun ultraWideHero should expose crop policy");
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
    provider: "stepfun",
    prompt: "smoke test image",
    usage: "card",
  });
} finally {
  console.warn = originalWarn;
}

if (skipped !== null) {
  throw new Error("StepFun no-key fallback should return null");
}

if (SIZE_MAP.cover.aspectRatio !== "16:9") {
  throw new Error("cover usage should map to 16:9");
}

const models = listImageModels();
if (!models.some((model) => model.provider === "stepfun")) {
  throw new Error("StepFun models missing from listImageModels()");
}
if (!models.some((model) => model.provider === "minimax" && model.id === "image-01")) {
  throw new Error("MiniMax image-01 missing from listImageModels()");
}

for (const [key, value] of Object.entries(originalEnv)) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

console.log("smoke-test ok");
