# 工作室三维漫游 V07.0

## 简介

本项目是一个离线运行的工作室三维漫游与成果展示软件。模型、贴图、场景数据和程序均随项目提供，无需联网。

## 本版画质升级内容

- 均衡与精细画质使用基于物理的材质、室内环境光反射、柔和实时阴影、环境光遮蔽和色调分级。
- 精细画质在上述效果之外启用高光泛光。
- 流畅画质关闭阴影和后期处理，适合集成显卡或较旧电脑。
- 均衡画质会根据移动时的帧间隔自适应清晰度。

## 运行方式

双击 `dist/index.html`（Windows 也可双击 `START_WINDOWS.bat`），使用支持 WebGL 2 的 Chrome 或 Edge 打开。无需联网。

## 画质档说明

- **流畅**：关闭实时阴影与后期处理，优先保证响应速度。
- **均衡**：启用 PBR 材质、室内环境光反射、柔和实时阴影、环境光遮蔽与色调分级，并按移动时的帧间隔自适应清晰度。
- **精细**：在均衡画质基础上提高阴影清晰度，并额外启用高光泛光。

## 二次开发

在 `source/` 目录安装依赖并构建或启动开发监听：

```sh
npm install && npm run build
npm run dev
```

构建结果写入项目根目录的 `dist/index.html`；开发模式会持续监视源文件并重建。

## 目录结构

```
dist/index.html       可直接离线打开的单文件版本
source/               可构建的项目源代码（不含 node_modules）
LICENSES/             Three.js 与 fflate 的 MIT 许可证文本
SHA256SUMS            dist/index.html 和 source/ 文件校验和
```

## 主要模块说明

- `source/src/main.js`：场景初始化、漫游交互、画质档、成果库与离线导出。
- `source/src/decode.js`、`source/src/worker.js`：场景数据解码与后台载入。
- `source/src/visual/materials.js`：环境表面分类、PBR 材质与目录模型材质。
- `source/src/visual/ibl.js`：生成室内图像式照明（IBL）反射环境。
- `source/src/visual/lighting.js`：实时光源与阴影配置。
- `source/src/visual/post.js`：环境光遮蔽、精细档泛光与色调分级后期处理。
- `source/template.html`、`source/css/app.css`：单文件页面模板与界面样式。
- `source/data/scene.gz`：压缩的工作室场景数据。
