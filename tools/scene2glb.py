#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V07 scene.gz -> glTF(GLB) + catalog.json，供新版前端使用。
坐标：position=(x, surfaceZ, -planY)，rotation.y=deg，scale=placement.scale*0.72（与 V07 一致）
"""
import gzip, json, base64, struct, array, pathlib

SRC = '/Users/admin/Desktop/LaoMoSHi_show/source/data/scene.gz'
OUT = pathlib.Path('/Users/admin/Desktop/LaoMoSHi_show/web/public/assets')
OUT.mkdir(parents=True, exist_ok=True)

d = json.loads(gzip.open(SRC, 'rb').read())
SURFACES = {
    'B1': 0.88, 'B2': 0.88, 'B3': 0.88, 'B4': 0.88,
    'C1': 0.88, 'D1': 0.88, 'D2': 0.88,
    'I_TABLE': 0.78, 'FLOOR': 0.0,
}
VISUAL_SCALE = 0.72

# ---------- glTF 构建 ----------
buf = bytearray()
buffer_views = []
accessors = []
materials = []
material_index = {}
images = []
textures = []
samplers = [{ 'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497 }]
gltf_nodes = []

COMP = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}

def add_buffer_view(data: bytes, target=None):
    while len(buf) % 4:
        buf.append(0)
    offset = len(buf)
    buf.extend(data)
    bv = { 'buffer': 0, 'byteOffset': offset, 'byteLength': len(data) }
    if target:
        bv['target'] = target
    buffer_views.append(bv)
    return len(buffer_views) - 1

def add_accessor(bv_index, component_type, count, type_, normalized=False, minmax=None):
    acc = {
        'bufferView': bv_index,
        'componentType': component_type,
        'count': count,
        'type': type_,
    }
    if normalized:
        acc['normalized'] = True
    if minmax:
        acc['min'], acc['max'] = minmax
    accessors.append(acc)
    return len(accessors) - 1

def b64bytes(s):
    return base64.b64decode(s)

def add_mesh(mesh, node_name, transform=None):
    positions = array.array('f'); positions.frombytes(b64bytes(mesh['positions']))
    n = mesh['vertexCount']
    has_color = bool(mesh.get('colors'))
    has_uv = bool(mesh.get('uvs')) and mesh.get('texture')
    xs = list(positions[0::3]); ys = list(positions[1::3]); zs = list(positions[2::3])
    attrs = {
        'POSITION': add_accessor(
            add_buffer_view(positions.tobytes(), 34962), 5126, n, 'VEC3',
            minmax=[[min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]],
        )
    }

    if mesh.get('normals'):
        raw = b64bytes(mesh['normals'])
        if mesh.get('normalType') == 'i16':
            attrs['NORMAL'] = add_accessor(add_buffer_view(raw, 34962), 5122, n, 'VEC3', normalized=True)
        else:
            attrs['NORMAL'] = add_accessor(add_buffer_view(raw, 34962), 5126, n, 'VEC3')

    if has_color:
        raw = b64bytes(mesh['colors'])
        comps = len(raw) // n
        typ = 'VEC4' if comps == 4 else 'VEC3'
        attrs['COLOR_0'] = add_accessor(add_buffer_view(raw, 34962), 5121, n, typ, normalized=True)

    if has_uv:
        uvs = array.array('f'); uvs.frombytes(b64bytes(mesh['uvs']))
        # 可见面为贴图背面 → 仅翻转 U 修正水平镜像
        for i in range(0, len(uvs), 2):
            uvs[i] = 1.0 - uvs[i]
        attrs['TEXCOORD_0'] = add_accessor(add_buffer_view(uvs.tobytes(), 34962), 5126, n, 'VEC2')

    idx_raw = b64bytes(mesh['indices'])
    ctype = 5125 if mesh.get('indexType') == 'u32' else 5123
    idx = add_accessor(add_buffer_view(idx_raw, 34963), ctype, len(idx_raw) // COMP[ctype], 'SCALAR')

    # 材质
    tex_name = mesh.get('texture')
    key = (tex_name, round(mesh.get('roughness', 0.8), 3), round(mesh.get('metalness', 0), 3),
           round(mesh.get('opacity', 1), 3), bool(mesh.get('glow')), mesh.get('side'))
    if key not in material_index:
        mat = {
            'pbrMetallicRoughness': {
                'baseColorFactor': [1, 1, 1, mesh.get('opacity', 1)],
                'metallicFactor': mesh.get('metalness', 0),
                'roughnessFactor': mesh.get('roughness', 0.8),
            },
            'doubleSided': mesh.get('side') == 'double',
        }
        if mesh.get('glow'):
            mat['emissiveFactor'] = [0.35, 0.45, 0.62]
        if tex_name and tex_name in d['textures']:
            uri = d['textures'][tex_name]
            mime = 'image/jpeg'
            b = base64.b64decode(uri.split(',', 1)[1])
            bv = add_buffer_view(b)
            images.append({ 'bufferView': bv, 'mimeType': mime })
            textures.append({ 'sampler': 0, 'source': len(images) - 1 })
            mat['pbrMetallicRoughness']['baseColorTexture'] = { 'index': len(textures) - 1 }
        material_index[key] = len(materials)
        materials.append(mat)

    prim = {
        'attributes': attrs,
        'indices': idx,
        'material': material_index[key],
        'mode': 4,
    }
    node = { 'name': node_name, 'mesh': None }
    # mesh 唯一
    node['mesh'] = add_mesh_prim(prim, node_name)
    if transform:
        node.update(transform)
    gltf_nodes.append(node)

meshes_gltf = []
def add_mesh_prim(prim, name):
    meshes_gltf.append({ 'name': name, 'primitives': [prim] })
    return len(meshes_gltf) - 1

# 环境网格（世界坐标）
root_nodes = []
for m in d['meshes']:
    add_mesh(m, m['id'])
    root_nodes.append(len(gltf_nodes) - 1)

# 成果实例（仅默认摆放的 6 件）
items = { it['id']: it for it in d['catalog']['items'] }
placed = []
for p in d['catalog']['defaultPlacements']:
    it = items.get(p['assetId'])
    if not it:
        continue
    zc = SURFACES.get(p['surfaceId'], 0.0)
    scale = p['scale'] * VISUAL_SCALE
    parent_children = []
    for j, im in enumerate(it['meshes']):
        add_mesh(im, f"{it['id']}-{j}")
        parent_children.append(len(gltf_nodes) - 1)
    node = {
        'name': f"place-{it['id']}",
        'translation': [p['x'], zc, -p['y']],
        'rotation': [0, __import__('math').sin(__import__('math').radians(p['rotation']) / 2), 0,
                     __import__('math').cos(__import__('math').radians(p['rotation']) / 2)],
        'scale': [scale, scale, scale],
        'children': parent_children,
    }
    gltf_nodes.append(node)
    root_nodes.append(len(gltf_nodes) - 1)
    placed.append({
        'assetId': it['id'],
        'uid': p['uid'],
        'name': it['name'],
        'code': it.get('code') or '',
        'category': it.get('category') or '',
        'summary': it.get('summary') or '',
        'photoRef': it.get('photoRef'),
        'thumbRef': it.get('thumbRef'),
        'world': [p['x'], zc, -p['y']],
        'top': zc + it['bounds']['max'][1] * scale,
        'rotation': p['rotation'],
        'scale': scale,
    })

# ---------- 组装 GLB ----------
bin_padded = bytes(buf) + b'\x00' * ((4 - len(buf) % 4) % 4)
gltf = {
    'asset': { 'version': '2.0', 'generator': 'v07-scene-converter' },
    'scene': 0,
    'scenes': [{ 'nodes': root_nodes }],
    'nodes': gltf_nodes,
    'meshes': meshes_gltf,
    'materials': materials,
    'accessors': accessors,
    'bufferViews': buffer_views,
    'buffers': [{ 'byteLength': len(bin_padded) }],
}
if images:
    gltf['images'] = images
    gltf['textures'] = textures
    gltf['samplers'] = samplers

js = json.dumps(gltf, separators=(',', ':')).encode()
js_padded = js + b' ' * ((4 - len(js) % 4) % 4)
total = 12 + 8 + len(js_padded) + 8 + len(bin_padded)
glb = bytearray()
glb += struct.pack('<III', 0x46546C67, 2, total)
glb += struct.pack('<II', len(js_padded), 0x4E4F534A) + js_padded
glb += struct.pack('<II', len(bin_padded), 0x004E4942) + bin_padded
(OUT / 'v07_scene.glb').write_bytes(glb)
print('v07_scene.glb', round(len(glb) / 1024 / 1024, 1), 'MB | nodes', len(gltf_nodes), '| meshes', len(meshes_gltf),
      '| materials', len(materials), '| images', len(images))

# ---------- catalog.json ----------
def data_uri(ref):
    v = d['images'].get(ref) if ref else None
    return v if isinstance(v, str) else None

cat = {
    'scene': {
        'name': '劳模创新工作室',
        'plan': { 'width': d['plan']['total_width'], 'depth': d['plan']['main_depth'], 'wallHeight': d['plan']['wall_height'] },
    },
    'items': [{
        'id': p['assetId'], 'uid': p['uid'], 'name': p['name'], 'code': p['code'],
        'category': p['category'], 'summary': p['summary'],
        'photo': data_uri(p['photoRef']), 'thumb': data_uri(p['thumbRef']),
        'world': p['world'], 'top': p['top'], 'rotation': p['rotation'], 'scale': p['scale'],
        'demo': False,
    } for p in placed],
}
(OUT / 'catalog.json').write_text(json.dumps(cat, ensure_ascii=False), encoding='utf-8')
print('catalog.json', round((OUT / 'catalog.json').stat().st_size / 1024, 0), 'KB | items', len(cat['items']))
for it in cat['items']:
    print(' ', it['code'], it['name'], 'world', [round(v, 2) for v in it['world']], 'top', round(it['top'], 2))
