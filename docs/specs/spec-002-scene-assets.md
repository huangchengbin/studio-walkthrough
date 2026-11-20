# SPEC-002 · 场景资产生产（真实劳模室）

> 编号顺序：spec-001 观众漫游（开发中） / **spec-002 场景资产（本期）** / spec-003 管理端
> 状态：执行中（2026-11-20，已产出第一版可运行资产）

## 背景

- 用户提供两批素材：`环境信息.zip`（A–H 各面照片、整体草图、机房、补充 1109/1110 照片）与 `成果照片.zip`（18 项成果、50 张实物/界面照片，含清单 md）。
- 用户明确要求：**房间布局与设备放置与 V07 漫游软件几乎一致**。
- V07 的 `scene.gz` 即是按其环境素材建好的完整世界几何（32 组环境网格 + 22 项成果模型 + 平面/展位/摆放数据），版本 6.0.5，source 标注“V02 + 环境信息补充1110-1”。
- 结论：以 **V07 场景数据为几何与布局权威来源**，经转换 + Blender 加工产出 glTF，供新版前端加载；不重新目测建模，避免布局漂移。

## 范围

1. **场景转换**（`tools/scene2glb.py`）：解析 `scene.gz` → glTF(GLB)。
   - 世界坐标沿用 V07：`position=(x, 台面高, -planY)`，旋转为度数，成果缩放 = placement.scale × 0.72（与 V07 视觉比例一致）。
   - 顶点色（u8）、法线（i16 normalized）、索引（u16/u32）、贴图（mural/photoE–H）全量保留。
   - 贴图 UV：**仅翻转 U**（实测可见面为贴图背面，抵消水平镜像；仅翻 V 会倒置，U+V 会再次镜像）。
2. **Blender 加工**（`tools/blender_process.py`，Blender 4.5.16 LTS 无头执行）：导入 → 网格/材质健康检查（54 网格、20 材质、0 空网格）→ 重导出 GLB（保留顶点色与贴图）。
3. **产物**：`web/public/assets/scene.glb`（约 13MB）+ `catalog.json`（6 件已摆放成果的名称/编号/类别/简介/实景照片/世界坐标/顶高）。
4. **前端接入**：替换白模场景；热点与成果目录读取 catalog；起点为 V07“房间中央”视点（3.3, 1.66, -5.45）。

## 明确不做

- 不按照片重新“捏”房间几何：布局以 V07 数据为准，避免与既有成果差一截。
- 本期不做：未摆放的 12 项成果的布展（属 spec-003 管理端/布放功能）、成果功能动画、照片级重贴图与烘焙。
- 不做移动端专项适配、多场景。

## 验收标准

- [x] 场景在浏览器渲染：白墙、木地板、绿墙、吊顶灯带与 V07 一致；国家电网标识与“创新工作室简介”文字可正常阅读（无镜像/倒置）。
- [x] 成果目录 6 项与场景摆放一一对应（B 面 4 台 + 机房桌面 2 台），缩略图为真实照片。
- [x] 起点位于房间中央视点，视线朝向工作室简介墙（与 V07 一致）。
- [x] 热点点位在成果正上方（编号与目录顺序一致）。
- [ ] 与 V07 同机位逐屏比对（待有 GPU 环境复核；无头软渲染已比对墙面文字方向与整体构图）。
- [ ] 资产加载时长与首屏 3 秒指标复核（当前 13MB，待压缩/裁剪优化）。

## 涉及文档

- [x] tech-stack.md：资产生产管线（已含 Blender 段）
- [x] workflow.md：本地启动与占位场景说明（需更新为真实资产）
- [ ] data-model.md：暂不需要（scene.model_url 语义不变）

## 备注

- 12 项成果（terminal2m、videoConnector、cableSleeve、fiberOrganizer、rackCableOrganizer、digitalTwin、towerTerminal、soldierTerminal、uavFusionModule、accessManager、air5g、airMesh、hdManager、beidouModule、switchModule、edgeInspection 等）已在 scene.gz 的 catalog 内、模型齐备，待 spec-003 提供“拖入场景布放”后即可上展。
- `studio_3D_1110_v03.zip` 文件损坏（无中央目录），未使用；不影响（scene.gz 更新于 1110-1 批次）。
