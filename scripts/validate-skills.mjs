#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsDir = join(rootDir, "skills");

async function findSkillManifests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const manifests = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      manifests.push(...(await findSkillManifests(path)));
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      manifests.push(path);
    }
  }

  return manifests;
}

function readFrontmatter(source, path) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`${path}: missing YAML frontmatter at the start of the file`);
  }
  return match[1];
}

const manifests = await findSkillManifests(skillsDir);
if (manifests.length === 0) {
  throw new Error("No canonical SKILL.md manifests found under skills/");
}

for (const manifest of manifests) {
  const displayPath = relative(rootDir, manifest);
  const frontmatter = readFrontmatter(await readFile(manifest, "utf8"), displayPath);
  const document = parseDocument(frontmatter, { prettyErrors: true, strict: true });

  if (document.errors.length > 0) {
    throw new Error(`${displayPath}: invalid YAML frontmatter\n${document.errors.join("\n")}`);
  }

  const metadata = document.toJS();
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${displayPath}: frontmatter must be a YAML mapping`);
  }

  for (const field of ["name", "description"]) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      throw new Error(`${displayPath}: ${field} must be a non-empty string`);
    }
  }

  console.log(`Validated ${displayPath} (${metadata.name})`);
}
