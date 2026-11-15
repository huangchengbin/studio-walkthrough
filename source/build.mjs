#!/usr/bin/env node
// Build the self-contained studio walkthrough HTML.
// Usage: node build.mjs [--watch]
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "..", "dist");
mkdirSync(outDir, { recursive: true });

const template = readFileSync(join(root, "template.html"), "utf8");
const css = readFileSync(join(root, "css", "app.css"), "utf8");
const sceneGz = readFileSync(join(root, "data", "scene.gz"));
const dataB64 = sceneGz.toString("base64");
async function bundleWorker() {
  const result = await build({
    entryPoints: [join(root, "src", "worker.js")],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    write: false,
    legalComments: "none",
  });
  return result.outputFiles[0].text.trim();
}

async function bundleApp() {
  const result = await build({
    entryPoints: [join(root, "src", "main.js")],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    write: false,
    legalComments: "none",
  });
  return result.outputFiles[0].text;
}

async function emit() {
  const app = await bundleApp();
  const workerSrc = await bundleWorker();
  const html = template
    .replace("/*__CSS__*/", () => css)
    .replace("/*__DATA__*/", () => dataB64)
    .replace("/*__WORKER__*/", () => workerSrc)
    .replace("/*__APP__*/", () => app);
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`built dist/index.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
}

if (process.argv.includes("--watch")) {
  const ctx = await build({
    entryPoints: [join(root, "src", "main.js")],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    write: false,
    legalComments: "none",
    watch: {
      onRebuild: async () => {
        try {
          await emit();
        } catch (e) {
          console.error(e);
        }
      },
    },
  });
  await emit();
  console.log("watching…");
} else {
  await emit();
}
