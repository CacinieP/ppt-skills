/**
 * Backward-compatible entrypoint.
 *
 * New builds should import from ./ai-image.js so they can choose
 * provider: "openai" (GPT Image 2) or provider: "google" (Nano Banana Pro).
 * The StepFun/MiniMax provider layer was replaced by the SOTA models; this
 * module keeps the old import path working as a plain re-export.
 */

export * from "./ai-image.js";
