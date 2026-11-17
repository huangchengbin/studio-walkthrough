# LaoMoSHi_show

> 一句话定位：**TODO —— 用 2-3 句话写清这个工具是什么、给谁用、解决什么问题。**
> 当前阶段：**第 1 期 · 产品地基（提示词 A→F 进行中）**

## 开工顺序（不可跳步）

| 步骤 | 做什么 | 提示词 | 产出文件 | 状态 |
|---|---|---|---|---|
| 1 | 项目结构规范化 | A | 目录骨架 + `AGENTS.md` + `.qoder/rules` | ✅ 已完成 |
| 2 | 需求收敛 | B | —— | ⬜ |
| 3 | 用户角色 | C | `docs/product/users-and-stories.md`（角色段） | ⬜ |
| 4 | 用户故事 | D | 同上（故事段） | ⬜ |
| 5 | 优先级 + 界面 | E | 同上（P0/P1/P2）+ `information-architecture.md` | ⬜ |
| 6 | 数据模型 + 技术栈 | F | `data-model.md` + `tech-stack.md` | ⬜ |
| 7 | **停** | —— | —— | ⬜ |
| 8 | 视觉规范（第 2 期） | G | `design.md` | ⬜ |
| 9 | 组件与参考站接入 | H | `design.md` 补充 + 引用清单 | ⬜ |
| 10 | 三方向比稿 | I | `design-lab/` | ⬜ |
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
│   └── specs/             需求规格说明书 + 模板
├── design-lab/            第 2 期风格样张（三方向比稿）
└── src/                   源码
```

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
