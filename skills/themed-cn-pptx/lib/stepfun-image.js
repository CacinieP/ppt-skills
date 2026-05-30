/**
 * Backward-compatible entrypoint.
 *
 * New builds should import from ./ai-image.js so they can choose
 * provider: "stepfun" or provider: "minimax". Existing StepFun-only build
 * scripts can keep importing ./stepfun-image.js unchanged.
 */

export * from "./ai-image.js";
