# AGENTS.md · 项目规则总纲

> 任何 AI（Qoder / 豆包工作 / Claude Code / WorkBuddy / 其他 agent）进入本仓库，先读这一份，再动手。
> 这 6 条是硬约束，优先级高于临时指令。
> Qoder 会自动读取本文件；`.qoder/rules/项目铁律.md` 是同一份内容的规则版，两者冲突时以规则版为准。

## 1. 单一事实来源（Single Source of Truth）

同一个产品设定只允许在**一个**文档里描述。
- 禁止在两个文档里重复描述同一件事，也禁止写"近似但不完全一致"的两份内容。
- 任何修改前，先检索 `docs/` 下全部文档，确认这件事现在写在哪。
- 改完必须同步所有受影响位置，绝不能只改一处。
- 发现两份文档冲突时：停下来，先报告冲突，由人决定以哪一份为准，再合并。

## 2. 文档分层（一个文档只负责一个主题）

```
docs/product/overview.md                产品定位、一句话描述、做什么 / 明确不做什么
docs/product/users-and-stories.md       用户角色、用户故事、P0/P1/P2 优先级
docs/product/information-architecture.md 界面清单、每屏信息层级、主操作
docs/product/data-model.md              数据表、字段、表关系
docs/product/tech-stack.md              技术选型与理由
docs/product/design.md                  视觉规范（第 2 期：组件 / 风格 / 布局）
docs/engineering/workflow.md            开发流程：git、测试、合并、发布
docs/specs/spec-xxx.md                  单轮开发的需求规格说明书
```

禁止往 `src/` 里放产品文档；禁止新建 `docs/` 之外的产品说明文件（不要出现"再来一份说明.md"）。

## 3. SPEC 驱动

- 任何功能开发**之前**，先产出 `docs/specs/spec-<三位编号>-<短名>.md`。
- SPEC 必含四块：背景、范围、验收标准、明确不做什么。
- 开发严格按 SPEC 执行；验收严格按 SPEC 核对，逐条打勾。
- SPEC 之外的需求，先补 SPEC 再动工，不许"顺手做了"。

## 4. Git 流程

- 每次开发都从 `main` 拉出 `feature/<短名>` 分支。
- 只在分支上提交业务代码，**禁止直接在 main 上开发**。
- 自测 / 测试通过后，才合并回 `main`；main 永远保持可运行。
- 合并后用 `git log` 或简短说明汇报：这次改了什么、影响哪些文档。

## 5. 远端备份

- `main` 必须推送到 GitHub 远端。
- 每次合并进 main 后推送；每完成一个阶段额外打一个 tag（如 `stage-1-product-foundation`）。
- 换电脑或本机损坏时， clone 回来即可继续。

## 6. 阶段汇报

每完成一个阶段，输出一段变更说明：
- 改了哪些文档（路径 + 一句话原因）
- 是否有文档冲突需要人拍板
- 下一步建议（只给一个推荐方案，不要罗列一堆）

---

## 当前阶段

见 `README.md` 的"开工顺序"。未完成第 1 期（A→F）之前，不允许写业务代码。
