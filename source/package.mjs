#!/usr/bin/env node
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const projectDir = dirname(sourceDir);
const releaseName = "studio_v070_release";
const releaseDir = join(projectDir, releaseName);
const releaseZip = join(projectDir, `${releaseName}.zip`);
const dryRun = process.argv.includes("--dry-run");
const dryRoot = dryRun ? mkdtempSync(join(tmpdir(), "studio-v070-package-")) : null;
const outputDir = dryRun ? join(dryRoot, releaseName) : releaseDir;
const outputZip = dryRun ? join(dryRoot, `${releaseName}.zip`) : releaseZip;

const readme = `# 工作室三维漫游 V07.0

## 简介

本项目是一个离线运行的工作室三维漫游与成果展示软件。模型、贴图、场景数据和程序均随项目提供，无需联网。

## 本版画质升级内容

- 均衡与精细画质使用基于物理的材质、室内环境光反射、柔和实时阴影、环境光遮蔽和色调分级。
- 精细画质在上述效果之外启用高光泛光。
- 流畅画质关闭阴影和后期处理，适合集成显卡或较旧电脑。
- 均衡画质会根据移动时的帧间隔自适应清晰度。

## 运行方式

双击 \`dist/index.html\`（Windows 也可双击 \`START_WINDOWS.bat\`），使用支持 WebGL 2 的 Chrome 或 Edge 打开。无需联网。

## 画质档说明

- **流畅**：关闭实时阴影与后期处理，优先保证响应速度。
- **均衡**：启用 PBR 材质、室内环境光反射、柔和实时阴影、环境光遮蔽与色调分级，并按移动时的帧间隔自适应清晰度。
- **精细**：在均衡画质基础上提高阴影清晰度，并额外启用高光泛光。

## 二次开发

在 \`source/\` 目录安装依赖并构建或启动开发监听：

\`\`\`sh
npm install && npm run build
npm run dev
\`\`\`

构建结果写入项目根目录的 \`dist/index.html\`；开发模式会持续监视源文件并重建。

## 目录结构

\`\`\`
dist/index.html       可直接离线打开的单文件版本
source/               可构建的项目源代码（不含 node_modules）
LICENSES/             Three.js 与 fflate 的 MIT 许可证文本
SHA256SUMS            dist/index.html 和 source/ 文件校验和
\`\`\`

## 主要模块说明

- \`source/src/main.js\`：场景初始化、漫游交互、画质档、成果库与离线导出。
- \`source/src/decode.js\`、\`source/src/worker.js\`：场景数据解码与后台载入。
- \`source/src/visual/materials.js\`：环境表面分类、PBR 材质与目录模型材质。
- \`source/src/visual/ibl.js\`：生成室内图像式照明（IBL）反射环境。
- \`source/src/visual/lighting.js\`：实时光源与阴影配置。
- \`source/src/visual/post.js\`：环境光遮蔽、精细档泛光与色调分级后期处理。
- \`source/template.html\`、\`source/css/app.css\`：单文件页面模板与界面样式。
- \`source/data/scene.gz\`：压缩的工作室场景数据。
`;

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function checksum(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) return result;
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result;
}

function createZip() {
  const parent = dirname(outputDir);
  if (existsSync(outputZip)) rmSync(outputZip, { force: true });
  const zipResult = spawnSync("zip", ["-r", basename(outputZip), basename(outputDir)], {
    cwd: parent,
    encoding: "utf8",
  });
  if (zipResult.error?.code === "ENOENT") {
    run("python3", [
      "-c",
      "import os,sys,zipfile; root=sys.argv[1]; out=sys.argv[2]; base=os.path.basename(root); z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED); [z.write(os.path.join(dp,f),os.path.relpath(os.path.join(dp,f),os.path.dirname(root))) for dp,_,fs in os.walk(root) for f in fs]; z.close()",
      outputDir,
      outputZip,
    ]);
  } else if (zipResult.status !== 0) {
    throw new Error(`zip failed (${zipResult.status}): ${zipResult.stderr || zipResult.stdout}`);
  }
}

function verifyZip() {
  const result = spawnSync("unzip", ["-t", outputZip], { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    run("python3", [
      "-c",
      "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); bad=z.testzip(); sys.exit(1 if bad else 0)",
      outputZip,
    ]);
  } else if (result.status !== 0) {
    throw new Error(`zip verification failed: ${result.stderr || result.stdout}`);
  }
}

try {
  if (!existsSync(join(projectDir, "dist", "index.html"))) {
    throw new Error("dist/index.html is missing; run npm run build first");
  }

  if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(projectDir, "dist", "index.html"), join(outputDir, "dist", "index.html"));
  cpSync(sourceDir, join(outputDir, "source"), {
    recursive: true,
    filter: (path) => !path.split(sep).includes("node_modules"),
  });

  mkdirSync(join(outputDir, "LICENSES"), { recursive: true });
  copyFileSync(join(sourceDir, "node_modules", "three", "LICENSE"), join(outputDir, "LICENSES", "THREE.js-MIT.txt"));
  copyFileSync(join(sourceDir, "node_modules", "fflate", "LICENSE"), join(outputDir, "LICENSES", "fflate-MIT.txt"));
  writeFileSync(join(outputDir, "README.md"), readme);
  writeFileSync(join(outputDir, "START_WINDOWS.bat"), '@echo off\r\nstart "" "%~dp0dist\\index.html"\r\n');

  const checksumFiles = [
    join(outputDir, "dist", "index.html"),
    ...collectFiles(join(outputDir, "source")),
  ].sort((a, b) => relative(outputDir, a).localeCompare(relative(outputDir, b)));
  const sums = checksumFiles
    .map((path) => `${checksum(path)}  ${relative(outputDir, path).split(sep).join("/")}`)
    .join("\n");
  writeFileSync(join(outputDir, "SHA256SUMS"), `${sums}\n`);

  createZip();
  if (dryRun) {
    const entries = readFileSync(join(outputDir, "SHA256SUMS"), "utf8").trim().split("\n");
    for (const line of entries) {
      const [expected, path] = line.split(/\s+/, 2);
      if (checksum(join(outputDir, path)) !== expected) throw new Error(`checksum mismatch: ${path}`);
    }
    verifyZip();
    console.log(
      `dry run passed: ${entries.length} checksums, README, licenses, and zip (${(readFileSync(outputZip).length / 1024 / 1024).toFixed(2)} MB)`,
    );
  } else {
    console.log(`packaged ${outputDir} and ${outputZip}`);
  }
} finally {
  if (dryRoot) rmSync(dryRoot, { recursive: true, force: true });
}
