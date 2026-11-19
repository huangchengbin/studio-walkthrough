# LaoMoSHi_show

> 一句话定位：**劳模室 3D 线上展厅——给领导与嘉宾的浏览器漫游参观工具**（详见 `docs/product/overview.md`，产品定位只在那一份描述）。
> 当前阶段：**第 2 期 · 视觉规范与比稿（G、H 完成；I 样张已出，待选方向）**

## 开工顺序（不可跳步）

| 步骤 | 做什么 | 提示词 | 产出文件 | 状态 |
|---|---|---|---|---|
| 1 | 项目结构规范化 | A | 目录骨架 + `AGENTS.md` + `.qoder/rules` | ✅ 已完成 |
| 2 | 需求收敛 | B | —— | ✅ 已完成（见 `docs/product/overview.md`） |
| 3 | 用户角色 | C | `docs/product/users-and-stories.md`（角色段） | ✅ 已完成 |
| 4 | 用户故事 | D | 同上（故事段） | ✅ 已完成 |
| 5 | 优先级 + 界面 | E | 同上（P0/P1/P2）+ `information-architecture.md` | ✅ 已完成 |
| 6 | 数据模型 + 技术栈 | F | `data-model.md` + `tech-stack.md` | ✅ 已完成 |
| 7 | **停** | —— | —— | ✅ 已确认，进入第 2 期 |
| 8 | 视觉规范（第 2 期） | G | `design.md` | ✅ 已完成（5 分歧点已拍板） |
| 9 | 组件与参考站接入 | H | `design.md` 补充 + 引用清单 | ✅ 已完成 |
| 10 | 三方向比稿 | I | `design-lab/` | ✅ 已完成（选方向 C 指挥台框景，`design-lab/full/` 六屏已扩展） |
| 11 | 规范自检页 | J | `docs/design-preview.html` | ⬜ |
| 12 | SPEC 化后开发 | —— | `docs/specs/spec-001-*.md` | ⬜ |

## 目录

```
LaoMoSHi_show/
├── AGENTS.md              AI 必读的 6 条铁律（Qoder 原生识别）
├── .qoder/rules/          Qoder 项目规则（与 AGENTS.md 同内容，规则优先）
├── 豆包工作-项目规则.txt    粘到豆包工作「项目规则」输入框的短版
├── README.md              本文件：开工顺序与目录说明
├── docs/
│   ├── prompts.md         A-K 提示词卡（直接复制粘贴）
│   ├── product/           产品事实文档（每份只负责一个主题）
│   ├── engineering/       工程规划（git 流程、测试、发布）
│   ├── legacy/            既有原型 V07.0 的历史文档归档
│   └── specs/             需求规格说明书 + 模板
├── design-lab/            第 2 期风格样张（三方向比稿）
├── source/                既有原型 V07.0 的可构建源代码
├── dist/index.html        既有原型离线单文件版本（可直接双击运行）
├── LICENSES/              Three.js 与 fflate 的 MIT 许可证
├── SHA256SUMS / START_WINDOWS.bat   校验和与 Windows 启动脚本
└── src/                   新版源码（待 SPEC 化后开发）
```

## 已有原型（V07.0）

本仓库于 2026-11-19 合入了先前独立开发的**工作室三维漫游 V07.0**——离线运行的工作室三维漫游与成果展示软件：PBR 材质、IBL 环境光反射、柔和阴影、AO/后期、三档画质、成果库。运行方式见 `docs/legacy/README-v07.md`。

> **定位已拍板（2026-11-19）：V07 仅作视觉与性能参考，不作为新版的代码基础**。新版按本仓库文档流程（A→K）全新重写；V07 的画质分级、IBL、后期等实现可作 F 阶段技术选型时的参考依据。

## 怎么用（Qoder / 豆包工作）

### 用 Qoder
1. 打开 Qoder → **打开文件夹** → 选桌面上的 `LaoMoSHi_show`。
2. 不用额外配置：Qoder 会自动读取根目录的 `AGENTS.md`；`.qoder/rules/项目铁律.md` 若未自动生效，在 Qoder 设置 → Rules 里把它的类型设为 **Always Apply**。
3. 模型选你能用的最好的，思考强度拉最高。
4. 打开 Agent 面板，把 `docs/prompts.md` 的第一段贴进去。

### 用豆包工作
1. 新建/打开项目，把 `豆包工作-项目规则.txt` 的内容粘进「项目规则」。
2. 把 `AGENTS.md` 与 `docs/` 相关文档发给它，或直接说「先读 AGENTS.md 和 docs/product/overview.md」。
3. 然后按 `docs/prompts.md` 的顺序推进。

### 通用节奏
每个阶段结束，先看它给的文档，确认后再进下一步。**不要让它自动往下跑。**

## 核心原则

节奏由你引导，AI 只在你划定的范围内给建议；是否采纳由你判断。
