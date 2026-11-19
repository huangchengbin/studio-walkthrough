# 数据模型

> 本文件只负责：数据表、字段、表关系。界面行为去 information-architecture.md。
> **状态：已填（提示词 F，2026-11-19）**

## 设计原则

- 只设计 **P0** 需要的表；P1/P2 只预留字段，不建表。
- 字段命名统一风格：全项目 `snake_case`（数据库）+ `camelCase`（接口层，由后端映射）。
- 每张表必须能追溯到至少一条 P0 用户故事。
- 类型用通用名（`uuid` / `string` / `text` / `int` / `float` / `bool` / `datetime`），落地实现见 tech-stack.md。

## 表 1 · admin_user（管理员账号）

对应故事：US-08（账号登录）
用途：唯一的布展人凭据，单条记录，凭据变更走线下重置。

| 字段 | 类型 | 必填 | 含义 | 备注 |
|---|---|---|---|---|
| id | uuid | 是 | 主键 | |
| username | string | 是 | 登录名 | 唯一索引 |
| password_hash | string | 是 | 密码散列 | 只存散列，用慢哈希（bcrypt/argon2，实现见 SPEC） |
| created_at | datetime | 是 | 创建时间 | |
| last_login_at | datetime | 否 | 最近登录 | 防爆破延时参考 |

索引：`username` 唯一索引。

## 表 2 · scene（场景/劳模室）

对应故事：US-01、US-02（进入并漫游按 CAD 尺寸还原的劳模室）
用途：一个"劳模室"= 一条场景记录。V1 固定只有一条；房间本体结构（基础设施、陈设）属于场景资产，不进成果管理，随部署流程提供。

| 字段 | 类型 | 必填 | 含义 | 备注 |
|---|---|---|---|---|
| id | uuid | 是 | 主键 | |
| name | string | 是 | 场景名称 | 加载页展示用 |
| description | text | 否 | 一句话介绍 | 加载页展示用 |
| model_url | string | 是 | 房间本体资产地址 | 含基建与陈设的整场景资产 |
| created_at | datetime | 是 | 创建时间 | |
| updated_at | datetime | 是 | 更新时间 | |

索引：无特殊要求（单行表）。

## 表 3 · achievement（成果）

对应故事：US-03（介绍）、US-04（功能动画）、US-10（上传/替换模型与资料）
用途：一件可布放的成果（实物装置 / 荣誉表彰 / 影像资料 / 软件系统四类）。3D 模型以"模型包"上传（glTF/GLB 自带贴图），不做贴图级拆分管理。

| 字段 | 类型 | 必填 | 含义 | 备注 |
|---|---|---|---|---|
| id | uuid | 是 | 主键 | |
| name | string | 是 | 成果名称 | 介绍浮层标题 |
| category | string | 是 | 类别 | 枚举：`device` 实物装置 / `honor` 荣誉表彰 / `media` 影像资料 / `software` 软件系统 |
| model_url | string | 是 | 3D 模型包地址 | glTF/GLB，贴图内嵌 |
| intro | text | 否 | 图文介绍 | 富文本（格式在 SPEC 定） |
| demo_url | string | 否 | 功能演示动画地址 | US-04；为空则介绍浮层不出现"播放功能演示"按钮 |
| status | string | 是 | 状态 | 枚举 `active`；P1 预留 `hidden`（US-12 撤展不删数据） |
| created_at | datetime | 是 | 创建时间 | |
| updated_at | datetime | 是 | 更新时间 | 替换模型/资料即更新 |

索引：`category` 普通索引（成果库按类筛选）。

## 表 4 · achievement_media（成果影像）

对应故事：US-03（介绍浮层影像页签）、US-10（上传影像资料）
用途：成果的影像附件，一件成果可挂多个，按 sort 排序展示。

| 字段 | 类型 | 必填 | 含义 | 备注 |
|---|---|---|---|---|
| id | uuid | 是 | 主键 | |
| achievement_id | uuid | 是 | 所属成果 | 外键 → achievement.id，级联删除 |
| kind | string | 是 | 类型 | 枚举：`image` / `video` |
| url | string | 是 | 文件地址 | |
| title | string | 否 | 标题 | |
| sort | int | 是 | 排序 | 默认 0 |

索引：`(achievement_id, sort)` 复合索引。

## 表 5 · placement（布放记录）

对应故事：US-09（拖拽布放/调整位姿）、US-11（保存即生效）
用途：成果在场景中的摆放实例。一条记录=场景里的一件摆设；同一成果可布放多个实例（如多座同款奖杯）。"撤展"（US-12，P1）= 删除布放记录，成果本体不动——天然满足"不删数据"。

| 字段 | 类型 | 必填 | 含义 | 备注 |
|---|---|---|---|---|
| id | uuid | 是 | 主键 | |
| scene_id | uuid | 是 | 所属场景 | 外键 → scene.id |
| achievement_id | uuid | 是 | 成果 | 外键 → achievement.id |
| position_x | float | 是 | X 坐标 | 场景坐标系（米，随 CAD 图纸） |
| position_y | float | 是 | Y（高度） | 成果落点离地高度 |
| position_z | float | 是 | Z 坐标 | |
| rotation_y | float | 是 | 水平朝向 | 弧度 |
| rotation_x / rotation_z | float | 否 | 俯仰/翻滚 | 预留，V1 平面摆放用不到 |
| scale | float | 否 | 缩放 | 默认 1.0 |
| updated_at | datetime | 是 | 更新时间 | 保存布放即更新 |

索引：`scene_id` 普通索引（进入场景时一次拉全量布放）。

## 表关系

```
admin_user（独立）

scene 1 ──N placement N──1 achievement 1──N achievement_media
（劳模室）  （布放实例）    （成果）          （影像附件）
```

## 预留字段（P1/P2，暂不建表）

| 字段 | 属于 | 为哪条 P1/P2 故事预留 |
|---|---|---|
| status = `hidden` | achievement.status | US-12（P1）撤展不删数据 |
| placement_status 标记位 | 成果库查询逻辑（不建字段） | US-13（P1）库里即未布放，第一版用"有无 placement"判断 |
| demo_interactive 配置 | 未来 achievement 扩展字段 | V2 可交互仿真（overview 功能分期） |
| demo_data_source 配置 | 未来 achievement 扩展字段 | V3 真实数据联动仿真 |

## P0 之外明确不建的表（防 AI 加戏）

- 浏览统计/埋点表：没有任何故事需要。
- 多场景管理表：V1 单场景，scene 表已够。
- 访问口令/权限表：链接公开是定案；保密需求出现时再设计。
- 贴图独立管理表：模型包自带贴图，见 表 3 说明。
