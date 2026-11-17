# 工程规划 · workflow

> 本文件只负责：开发流程、git 规范、测试与发布。**状态：已建立，随项目演进补充**

## 一、分支模型

```
main ───────────────────────────●────────────●──►  永远可运行，随时可发布
        \                      /            /
         ●──●──●  feature/xxx  /            /
                         ●──●  feature/yyy /
```

- 每次开发：`git checkout main && git pull && git checkout -b feature/<短名>`
- 分支内可多次提交，提交信息用**中文一句话说清做了什么**。
- 禁止在 main 上直接提交业务代码。

## 二、测试与合并

1. 本地自测通过（启动无报错、目标流程走通）
2. 按 SPEC 的验收标准逐条核对，逐项打勾
3. 合并回 main：`git checkout main && git merge --no-ff feature/<短名>`
4. 推送：`git push origin main`
5. 打 tag（阶段节点）：`git tag stage-x-xxx && git push --tags`

## 三、提交信息规范

```
<类型>: <一句话说明>

类型：feat / fix / docs / refactor / chore
例：feat: 作品列表页支持按标签筛选
```

## 四、SPEC 与开发的关系

```
规划对话 ──► docs/specs/spec-00X-xxx.md ──► 开发（按 SPEC 执行）
                                        └──► 测试（按 SPEC 验收）
```

没有 SPEC 的功能不做；SPEC 之外发现的需求，先补 SPEC。

## 五、文档同步

任何一次开发影响以下文档时，**同一个提交里一并更新**：
- `overview.md`（定位/边界变了才改）
- `information-architecture.md`（界面或信息层级变了）
- `data-model.md`（字段变了）
- `design.md`（视觉规则变了）

## 六、备份

- 远端：GitHub 私有仓库（TODO：填仓库地址）
- 每完成一个阶段推送并打 tag；重要节点额外本地导出一份 zip 存移动硬盘。
