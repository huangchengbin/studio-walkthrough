# 技术栈

> 本文件只负责：技术选型与理由。**状态：已填（提示词 F，2026-11-19）**

## 选型原则

成熟稳定 > 部署简单 > 以后自己能维护。
不是选最强的，是选半年后你还能自己改得动的。
另有定案约束（见 overview.md / README.md）：V07 原型**仅作视觉与性能参考**，不作为代码基础。

## 选型表

| 层 | 选择 | 理由（一句话） | 替代方案与被放弃的原因 |
|---|---|---|---|
| 前端框架 | React 18 + TypeScript | 生态最大、3D 集成方案最成熟，类型系统降低自维护出错率 | Vue 3 + TresJS（较新，成熟度不足）；无框架裸写 three.js（UI 状态要自建，正是 V07 的局限） |
| 3D 引擎 | Three.js（React Three Fiber + drei 管理） | Web 3D 事实标准；V07 已在本机验证能跑出目标画质；R3F 把场景对象生命周期管起来，布放编辑器的 TransformControls 有现成实现 | Babylon.js（同样优秀，但 V07 经验与素材积累在 three 这边） |
| 样式方案 | Tailwind CSS | 约束统一、写 6 屏界面快，视觉规范（design.md）落地有刻度可循 | 手写 CSS（V07 方式，规模化后难维护）；CSS-in-JS（运行时开销，没必要） |
| 组件库 | Ant Design | 成熟、中文文档、表单/上传/弹层齐全，直接覆盖 UI-04~06 的表单需求 | MUI（风格偏 Material 定制贵）；Element Plus（Vue 生态） |
| 3D 资产格式 | glTF 2.0（.glb）+ Draco 压缩 + KTX2 纹理压缩 | Web 3D 事实标准：贴图、动画内嵌一个文件，正好支撑"模型包上传"和 US-04 功能动画 | FBX（闭源，需转换）；OBJ（无动画无材质） |
| 后端 | NestJS（Node.js + TypeScript） | 与前端同语言，自维护成本最低；强结构约束，接口随 V2/V3 仿真扩展增长时不容易欠债 | Express（够轻但结构靠自律）；FastAPI（多一门语言维护）；Go（部署简单但你不熟） |
| 数据库 | PostgreSQL | 成熟稳定免费，关系型布放数据 + JSON 字段都吃得下 | MySQL（同级，PG 的类型系统与现代生态略优） |
| 文件存储 | 服务器本地磁盘 + 数据库存 URL | V1 成果文件总量 MB 级（V07 整场景才 ~10MB），本地盘最简单直接 | MinIO/对象存储（V2 文件量上来再迁，存储路径集中在代码一处，迁移成本低） |
| 部署 | 国内云服务器单台 + Docker Compose（nginx + node + postgres） + HTTPS | 领导嘉宾在国内，国内云访问快且稳；Compose 一键起全套 | 境外托管/Serverless（国内访问不稳，一票否决线是"点开链接 3 秒进入"） |

## 渲染性能工程（参考 V07 实测经验，逐项进 SPEC）

- **三档画质分级**（流畅/均衡/精细）：V07 验证过的手段——流畅档关阴影与后期保帧率，精细档加泛光。
- 自适应清晰度：均衡档按移动时帧间隔动态调整渲染分辨率（V07 已验证可行）。
- IBL 环境光反射 + 柔和阴影 + AO/色调后期：目标画质的"精细化、美观"来源，V07 的实现思路可参考、代码不搬运。
- 场景数据按需加载与后台解码（Web Worker），保住"3 秒进入"的硬指标。

## 3D 场景资产生产管线（2026-11-19 拍板：Blender 脚本建模）

真实劳模室不是 AI 生成的占位场景，必须按真实素材建模。管线固定为：

```
CAD 平面图（尺寸依据） ┐
实景照片/视频（外观依据） ├→ Blender 脚本化建模 → glTF 导出（Draco+KTX2） → 部署至 scene.model_url
已有 3D 模型（能复用则复用） ┘
```

- **工具**：Blender（Python 脚本参数化建模：墙体/门窗/展柜/展台按 CAD 尺寸生成，材质从照片采样），导出 glTF 2.0。
- **交付验收三条线**：① 尺寸与 CAD 一致；② 外观与实景照片比对"一眼认得出"；③ 浏览器首屏加载在"3 秒进入"指标内。
- **所需物料**：CAD 平面图；照片拍摄清单（房间四角全景、展柜/展台正面特写、重点材质近拍、天花灯位）；已有 3D 模型源文件（如有）。
- **立项**：`docs/specs/spec-002-scene-assets.md`（待物料到位后起草，排在漫游 MVP 开发之前或并行）。

## 本地开发

```bash
# 数据库
docker compose up -d postgres

# 后端（/server）
npm install && npm run start:dev

# 前端（/web）
npm install && npm run dev   # Vite 开发服
```

## 部署流程

```bash
# 服务器上（首次：配置 .env + docker compose up）
git pull && docker compose build && docker compose up -d
# 前端构建产物由 nginx 托管，后端 API 反代，HTTPS 由 nginx 终结
```

## 版本与依赖约束

- 关键依赖固定大版本，升级前先看 CHANGELOG。
- Node 固定 LTS 版本（package.json `engines` 钉死）；three.js 固定 minor 版本（其 minor 常有破坏性变更）。
- three / R3F / drei 三者版本必须配套升级，禁止单独升。
- PostgreSQL 固定主版本；Draco/KTX2 编码器版本与 three 的解码器版本配套。
