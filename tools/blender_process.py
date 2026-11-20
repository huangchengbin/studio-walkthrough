import bpy, os
SRC = "/Users/admin/Desktop/LaoMoSHi_show/web/public/assets/scene.glb"
DST = "/Users/admin/Desktop/LaoMoSHi_show/web/public/assets/scene_bl.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
mats = len(bpy.data.materials)
print(f"[BLENDER] meshes={len(meshes)} materials={mats}")
# 检查是否有非流形/空网格，做个健康统计
empty = [o.name for o in meshes if len(o.data.polygons) == 0]
print(f"[BLENDER] empty meshes: {len(empty)}")
# 统一材质双面标记按数据已有 side 处理（Blender 导入后 use_backface_culling 反映 doubleSided）
ds = sum(1 for m in bpy.data.materials if m.use_backface_culling is False)
print(f"[BLENDER] double-sided materials: {ds}/{len(bpy.data.materials)}")
kw = dict(filepath=DST, export_format='GLB', export_texcoords=True, export_normals=True,
          export_materials='EXPORT', export_cameras=False, export_lights=False, export_yup=True)
try:
    bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
except TypeError:
    bpy.ops.export_scene.gltf(**kw)
print("[BLENDER] exported", os.path.getsize(DST))
