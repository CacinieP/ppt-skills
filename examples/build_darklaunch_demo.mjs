#!/usr/bin/env node

/**
 * build_darklaunch_demo.mjs
 *
 * Demo runner for the locked "dark-launch" recipe.
 * No API key required — image slots fall back to solid backgrounds + overlays.
 *
 * Run:  npm run demo:darklaunch
 * Output: examples/slides/output/darklaunch-demo.pptx
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recipePath = resolve(__dirname, "..", "skills", "themed-cn-pptx", "recipes", "recipe-dark-launch.mjs");

// Dynamic import() needs a file:// URL on Windows, not a bare absolute path.
const { default: pptxgen } = await import("pptxgenjs");
const { build } = await import(pathToFileURL(recipePath).href);

const pres = new pptxgen();
build(pres, { deckLabel: "Dark Launch · ppt-skills" });

const outDir = resolve(__dirname, "slides", "output");
await mkdir(outDir, { recursive: true });
const out = resolve(outDir, "darklaunch-demo.pptx");
await pres.writeFile({ fileName: out });

console.log(`Dark-launch demo PPTX generated: ${out}`);
console.log("Run QA:  node scripts/render-qa.mjs " + out);
