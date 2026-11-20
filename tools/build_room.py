import bpy, math, os

# 先清空场景，再建材质（否则材质引用失效）
bpy.ops.wm.read_factory_settings(use_empty=True)

SRC_ITEMS = "/Users/admin/Desktop/LaoMoSHi_show/web/public/assets/v07_scene.glb"  # V07 原始转换件（仅取其中成果实例）
DST = "/Users/admin/Desktop/LaoMoSHi_show/web/public/assets/scene_new.glb"
RENDER_TOP = "/tmp/room_top.png"
RENDER_IN = "/tmp/room_in.png"

H = 3.25          # 墙高
T = 0.18          # 墙厚

def mat(name, color, rough=0.75, metal=0.0, emit=None, emit_strength=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    return m

WALL = mat("wall_pure_white", (1.0, 1.0, 1.0), 0.82)
FLOOR = mat("floor_gray", (0.235, 0.245, 0.26), 0.7)
CEIL = mat("ceiling", (0.90, 0.895, 0.885), 0.95)
GREEN = mat("accent_green", (0.06, 0.33, 0.26), 0.5)
PLINTH = mat("plinth", (0.49, 0.49, 0.49), 0.5)
WOOD = mat("table_wood", (0.40, 0.29, 0.18), 0.5)
DARK = mat("rack_dark", (0.12, 0.14, 0.17), 0.45, 0.3)
SCREEN = mat("screen", (0.05, 0.1, 0.2), 0.3, 0.1, emit=(0.15, 0.35, 0.85), emit_strength=1.2)
LAMP = mat("ceiling_lamp", (1, 1, 1), 0.9, 0, emit=(1, 0.98, 0.92), emit_strength=3.0)
CHAIR = mat("chair", (0.30, 0.32, 0.35), 0.7)

def box(name, x0, x1, y0, y1, z0, z1, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0+x1)/2, (y0+y1)/2, (z0+z1)/2))
    o = bpy.context.object
    o.name = name
    o.scale = ((x1-x0) or 0.001, (y1-y0) or 0.001, (z1-z0) or 0.001)
    o.data.materials.append(material)
    return o

def cyl(name, cx, cy, z0, h, rx, ry, material, verts=40):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1, depth=1, location=(cx, cy, z0 + h/2))
    o = bpy.context.object
    o.name = name
    o.scale = (rx, ry, h)
    o.data.materials.append(material)
    return o

# ---------- 1) 导入旧资产，仅保留成果实例，删除全部环境网格 ----------
print("[ROOM] importing items from", SRC_ITEMS)
bpy.ops.import_scene.gltf(filepath=SRC_ITEMS)
removed = 0
for o in list(bpy.data.objects):
    if o.name.startswith("environment"):
        bpy.data.objects.remove(o, do_unlink=True)
        removed += 1
print(f"[ROOM] removed env objects: {removed}, remaining: {len(bpy.data.objects)}")

# ---------- 2) 地面 / 天花（L 形：主厅 + 东侧机房）----------
box("floor_main", 0, 7.5, 0, 8.4, -0.15, 0, FLOOR)
box("floor_annex", 7.5, 11.3, 0, 4.9, -0.15, 0, FLOOR)
box("ceil_main", 0, 7.5, 0, 8.4, H, H + 0.1, CEIL)
box("ceil_annex", 7.5, 11.3, 0, 4.9, H, H + 0.1, CEIL)

# ---------- 3) 外墙（按平面墙段，门洞天然留空）----------
walls = [
    ("A_WEST", -T, 0, 0, 5.05),
    ("E_WEST", -T, 0, 5.05, 8.4),
    ("NORTH_1", -T, 6.12, 8.4, 8.4 + T),
    ("NORTH_2", 7.12, 7.68, 8.4, 8.4 + T),
    ("EAST_UPPER", 7.5, 7.68, 4.9, 8.4 + T),
    ("ANNEX_NORTH", 7.5, 11.48, 4.9, 5.08),
    ("ANNEX_EAST", 11.3, 11.48, 0, 4.9),
    ("SOUTH_WEST", -T, 6.15, -T, 0),
    ("SOUTH_EAST", 7.35, 11.48, -T, 0),
    ("D_PARTITION", 7.5, 7.68, 1.02, 4.9),
    ("D_DOOR_STUB", 7.5, 7.68, 0, 0.18),
    ("C_RETURN", 4.7, 7.5, 4.72, 4.9),
]
for name, x0, x1, y0, y1 in walls:
    box("wall_" + name, x0, x1, y0, y1, 0, H, WALL)

# 门洞过梁
box("lintel_south", 6.15, 7.35, -T, 0, 2.1, H, WALL)
box("lintel_north", 6.12, 7.12, 8.4, 8.4 + T, 2.1, H, WALL)
box("lintel_server", 7.5, 7.68, 0.18, 1.02, 2.1, H, WALL)

# 踢脚线（简洁白）
for name, x0, x1, y0, y1 in walls:
    if name.startswith("C_") or name.startswith("D_"):
        continue
SKIRT = mat("skirting", (0.22, 0.235, 0.25), 0.7)
box("skirt_south", 0, 6.1, 0.01, 0.035, 0, 0.13, SKIRT)
box("skirt_north", 0, 6.1, 8.365, 8.39, 0, 0.13, SKIRT)
box("skirt_west", 0.01, 0.035, 0, 8.4, 0, 0.13, SKIRT)

# ---------- 4) 展面处理 ----------
# B 面（南墙）：国网绿展墙
box("b_green", 0.05, 6.1, 0.02, 0.06, 0.1, H - 0.05, GREEN)
# F 面（北墙）：白色简介板 + 细框
box("f_board", 0.35, 5.85, 8.33, 8.36, 0.25, 2.95, mat("board_white", (0.90, 0.915, 0.93), 0.6))
box("f_frame_top", 0.3, 5.9, 8.32, 8.35, 2.95, 3.0, GREEN)
box("f_frame_bottom", 0.3, 5.9, 8.32, 8.35, 0.2, 0.25, GREEN)
# E 面（主厅东墙）：3×3 拼接屏
for i in range(3):
    for j in range(3):
        box(f"e_screen_{i}{j}", 7.46, 7.48, 5.75 + j * 0.72, 5.75 + j * 0.72 + 0.66,
            0.85 + i * 0.55, 0.85 + i * 0.55 + 0.5, SCREEN)

# ---------- 5) 展台 / 家具 ----------
plinth_h = 0.88
for pid, x0, y0, x1, y1 in [
    ("B1", 0.22, 0.08, 1.52, 0.82), ("B2", 1.73, 0.08, 3.03, 0.82),
    ("B3", 3.24, 0.08, 4.54, 0.82), ("B4", 4.75, 0.08, 6.05, 0.82),
    ("C1", 4.92, 3.98, 6.66, 4.67),
    ("D1", 6.76, 3.42, 7.45, 4.62), ("D2", 6.76, 2.1, 7.45, 3.3),
]:
    box("plinth_" + pid, x0, x1, y0, y1, 0, plinth_h, PLINTH)

# 椭圆桌（主厅）
cyl("table_oval", 3.3, 3.5, 0, 0.78, 0.82, 1.25, WOOD)
cyl("table_leg", 3.3, 3.5, 0, 0.78, 0.25, 0.25, DARK)
for i, (x0, y0, x1, y1) in enumerate([
    (1.9, 2.32, 2.58, 3.0), (1.9, 3.16, 2.58, 3.84), (1.9, 4.0, 2.58, 4.68),
    (4.02, 2.32, 4.7, 3.0), (4.02, 3.16, 4.7, 3.84), (4.02, 4.0, 4.7, 4.68),
]):
    box(f"chair_{i}", x0, x1, y0, y1, 0, 0.46, CHAIR)

# H 面自助查询屏（kiosk）
box("kiosk_body", 5.29, 6.91, 5.28, 6.02, 0, 1.05, PLINTH)
box("kiosk_screen", 5.4, 6.8, 5.3, 5.32, 1.1, 1.75, SCREEN)

# 机房：机柜 / 配电柜 / 椭圆桌 / 椅
box("rack_1", 7.98, 8.75, 3.67, 4.86, 0, 2.0, DARK)
box("rack_2", 8.85, 9.57, 3.67, 4.86, 0, 2.0, DARK)
box("cabinet", 9.92, 10.42, 4.56, 4.88, 0, 1.6, DARK)
cyl("server_table", 9.65, 2.4, 0, 0.78, 0.72, 1.22, WOOD)
for i, (cx, cy) in enumerate([(8.6, 1.7), (8.6, 2.75), (10.7, 1.5), (10.7, 2.4), (10.7, 3.3), (10.6, 0.55)]):
    cyl(f"srv_chair_{i}", cx, cy, 0, 0.46, 0.26, 0.26, CHAIR)

# ---------- 6) 天花灯带 ----------
for i in range(3):
    for j in range(2):
        box(f"lamp_{i}{j}", 1.0 + i * 2.0, 2.6 + i * 2.0, 1.4 + j * 3.6, 1.7 + j * 3.6, H - 0.04, H - 0.01, LAMP)
box("lamp_annex_1", 8.4, 10.4, 1.6, 1.9, H - 0.04, H - 0.01, LAMP)
box("lamp_annex_2", 8.4, 10.4, 3.0, 3.3, H - 0.04, H - 0.01, LAMP)

# ---------- 7) 渲染检查 ----------
world = bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.95, 0.96, 0.98, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
bpy.context.scene.world = world

for pos, energy, size in [((3.5, 3.0, 3.0), 800, 6), ((9.5, 2.5, 3.0), 400, 4)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.data.energy = energy
    light.data.size = size

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1280
scene.render.resolution_y = 900
scene.render.film_transparent = False

# 顶视图（临时隐藏天花）
for n in ("ceil_main", "ceil_annex"):
    bpy.data.objects[n].hide_render = True
bpy.ops.object.camera_add(location=(5.65, 4.2, 14), rotation=(0, 0, 0))
cam_top = bpy.context.object
cam_top.data.type = 'ORTHO'
cam_top.data.ortho_scale = 15
scene.camera = cam_top
scene.render.filepath = RENDER_TOP
bpy.ops.render.render(write_still=True)

for n in ("ceil_main", "ceil_annex"):
    bpy.data.objects[n].hide_render = False

# 室内视角（站在主厅中央，朝北）
bpy.ops.object.camera_add(location=(3.3, 5.45, 1.66), rotation=(math.radians(90), 0, math.radians(180)))
cam_in = bpy.context.object
cam_in.data.lens = 16
scene.camera = cam_in
scene.render.filepath = RENDER_IN
bpy.ops.render.render(write_still=True)

# ---------- 8) 导出 GLB ----------
kw = dict(filepath=DST, export_format='GLB', export_texcoords=True, export_normals=True,
          export_materials='EXPORT', export_cameras=False, export_lights=False, export_yup=True)
try:
    bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
except TypeError:
    bpy.ops.export_scene.gltf(**kw)
print("[ROOM] exported", DST, os.path.getsize(DST))
