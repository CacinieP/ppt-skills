#!/usr/bin/env node

/**
 * build_editorial_demo.mjs
 *
 * Demo runner for the locked "editorial-grid" recipe.
 * No API key required — image slots fall back to hairline cards.
 *
 * Run:  npm run demo:editorial
 * Output: examples/slides/output/editorial-demo.pptx
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recipePath = resolve(__dirname, "..", "skills", "themed-cn-pptx", "recipes", "recipe-editorial-grid.mjs");

// Dynamic import() needs a file:// URL on Windows, not a bare absolute path.
const { default: pptxgen } = await import("pptxgenjs");
const { build } = await import(pathToFileURL(recipePath).href);

const pres = new pptxgen();
build(pres, { deckLabel: "Editorial Grid · ppt-skills" });

const outDir = resolve(__dirname, "slides", "output");
await mkdir(outDir, { recursive: true });
const out = resolve(outDir, "editorial-demo.pptx");
await pres.writeFile({ fileName: out });

console.log(`Editorial demo PPTX generated: ${out}`);
console.log("Run QA:  node skills/themed-cn-pptx/scripts/render-qa.mjs " + out);
