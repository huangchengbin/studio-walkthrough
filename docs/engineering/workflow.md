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

- 远端：GitHub `https://github.com/huangchengbin/studio-walkthrough`（main 已接入，远端为 githubfast 代理，仓库级凭据助手已配）
- 每完成一个阶段推送并打 tag；重要节点额外本地导出一份 zip 存移动硬盘。

## 七、本地开发（web 前端，spec-001 起）

```bash
cd web
npm install            # 首次；国内可用 --registry=https://registry.npmmirror.com
npm run dev            # http://localhost:5173
npm run build          # tsc --noEmit + vite build
```

- 当前为**真实场景资产**：`web/public/assets/scene.glb` 由 V07 scene.gz 转换 + Blender 加工生成（见 spec-002 与 tools/），`catalog.json` 提供 6 件已摆放成果数据；前端加载路径 `/assets/scene.glb`。
- 重新生成资产（clone 后必做，生成物不入库）：`python3 tools/scene2glb.py` → `Blender -b -P tools/blender_process.py`（第二次导出覆盖为最终版）。
- 成果数据现为 `catalog.json`（6 条，含实景照片），spec-003 接入管理端与后端后改为接口数据。
- 交互口径：WASD/方向键移动、拖拽环视、滚轮推拉；成果目录点击 → 镜头飞行 + 打开浮层；热点编号与目录顺序一致。
