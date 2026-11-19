import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gunzipSync } from "fflate";
import { decodeScene } from "./decode.js";
import { createMeshFactory } from "./visual/materials.js";
import { createStudioEnvironment } from "./visual/ibl.js";
import { createLights, LIGHTING } from "./visual/lighting.js";
import { createPostPipeline } from "./visual/post.js";

const QUALITY = {
  fast: { ratio: 1, shadows: false, post: false, shadowMapSize: 0 },
  balanced: { ratio: 1.35, shadows: true, post: true, shadowMapSize: 1024 },
  detail: { ratio: 1.5, shadows: true, post: true, shadowMapSize: 2048 },
};

var VIEWPOINTS = {
    center: {
      name: "房间中央",
      x: 3.3,
      y: 5.45,
      yaw: 0,
      pitch: 0,
      zone: "中央视点",
    },
    A: {
      name: "A 面 \xB7 能源演示",
      x: 1.45,
      y: 3.22,
      yaw: Math.PI / 2,
      pitch: 0,
      zone: "西侧能源演示区",
    },
    B: {
      name: "B 面 \xB7 创新成果",
      x: 5.55,
      y: 3.1,
      yaw: 2.5,
      pitch: 0.02,
      zone: "南侧创新成果区",
    },
    C: {
      name: "C 面 \xB7 荣誉展示",
      x: 5.55,
      y: 3.05,
      yaw: 0,
      pitch: 0.02,
      zone: "C 面荣誉展示区",
    },
    D: {
      name: "D 面 \xB7 荣誉展示",
      x: 5.55,
      y: 2.2,
      yaw: -Math.PI / 2,
      pitch: 0.02,
      zone: "东侧荣誉展示区",
    },
    E: {
      name: "E 面 \xB7 拼接大屏",
      x: 3,
      y: 6.32,
      yaw: Math.PI / 2,
      pitch: 0,
      zone: "西北侧拼接大屏",
    },
    F: {
      name: "F 面 \xB7 工作室介绍",
      x: 3.65,
      y: 5.35,
      yaw: 0,
      pitch: 0,
      fov: 80,
      zone: "北侧工作室介绍",
    },
    G: {
      name: "G 面 \xB7 产学研用",
      x: 5,
      y: 6.65,
      yaw: -Math.PI / 2,
      pitch: 0,
      zone: "东北侧文化墙",
    },
    H: {
      name: "H 面 \xB7 标识与查询",
      x: 6.1,
      y: 7.6,
      yaw: Math.PI,
      pitch: 0,
      zone: "C 面背侧标识墙",
    },
    I: {
      name: "I 面 \xB7 机房设备",
      x: 7.97,
      y: 1.05,
      yaw: -0.28,
      pitch: 0,
      fov: 78,
      zone: "机房西侧通道",
    },
    server: {
      name: "机房桌面",
      x: 9.24,
      y: 0.62,
      yaw: 0,
      pitch: -0.18,
      zone: "机房工作桌",
    },
  },
  STATIC_BLOCKERS = [
    {
      b: [4.7, 4.72, 7.5, 4.9],
      kind: "wall",
    },
    {
      b: [7.5, 1.02, 7.68, 4.9],
      kind: "wall",
    },
    {
      b: [7.5, 0, 7.68, 0.18],
      kind: "wall",
    },
    {
      b: [7.47, 0.14, 8.31, 0.26],
      kind: "door",
    },
    ...[
      [0.22, 0.08, 1.52, 0.82],
      [1.73, 0.08, 3.03, 0.82],
      [3.24, 0.08, 4.54, 0.82],
      [4.75, 0.08, 6.05, 0.82],
      [4.92, 3.98, 6.66, 4.67],
      [6.76, 3.42, 7.45, 4.62],
      [6.76, 2.1, 7.45, 3.3],
      [2.48, 2.25, 4.12, 4.75],
      [5.29, 5.28, 6.91, 6.02],
      [0, 4.5, 0.33, 5.27],
      [0.21, 0.91, 1, 1.7],
      [0.21, 3.53, 1, 4.32],
      [8.925, 1.175, 10.375, 3.625],
      [7.98, 3.67, 9.57, 4.86],
      [9.92, 4.56, 10.42, 4.88],
    ].map((i) => ({
      b: i,
      kind: "furniture",
    })),
    ...[-1, 1].flatMap((i) =>
      [2.66, 3.5, 4.34].map((t) => ({
        b: [3.3 + i * 1.06 - 0.34, t - 0.34, 3.3 + i * 1.06 + 0.34, t + 0.34],
        kind: "chair",
      })),
    ),
    ...[
      [8.34, 1.4, 8.94, 2],
      [8.34, 2.45, 8.94, 3.05],
      [10.4, 1.2, 11, 1.8],
      [10.4, 2.1, 11, 2.7],
      [10.4, 3, 11, 3.6],
      [10.32, 0.25, 10.92, 0.85],
    ].map((i) => ({
      b: i,
      kind: "chair",
    })),
  ],
  OBJECT_BLOCKERS = [
    [0.25, 1.98, 1.37, 2.82],
    [0.2, 4.48, 1.22, 5.29],
    [1.09, 0.85, 1.89, 1.91],
    [6.549, 1.146, 7.371, 1.787],
    [7.75, 4.19, 8.06, 4.6],
    [10.21, 3.79, 10.66, 4.12],
  ];
function insideRect(i, t, e, n = 0.16) {
  return i > e[0] - n && i < e[2] + n && t > e[1] - n && t < e[3] + n;
}
function isWalkable(i, t, e = true, n = []) {
  return !Number.isFinite(i) ||
    !Number.isFinite(t) ||
    i < 0.18 ||
    i > 11.12 ||
    t < 0.19 ||
    t > 8.2 ||
    (i > 7.3 && t > 4.72) ||
    STATIC_BLOCKERS.some((s) => insideRect(i, t, s.b)) ||
    n.some((s) => insideRect(i, t, s))
    ? false
    : !(e && OBJECT_BLOCKERS.some((s) => insideRect(i, t, s)));
}
function moveWithCollision(i, t, e, n = true, s = []) {
  let r = i.x,
    a = i.y,
    o = Math.max(1, Math.ceil(Math.hypot(t, e) / 0.045));
  for (let l = 0; l < o; l++)
    (isWalkable(r + t / o, a, n, s) && (r += t / o), isWalkable(r, a + e / o, n, s) && (a += e / o));
  return {
    x: r,
    y: a,
  };
}
function wrapAngle(i) {
  return Math.atan2(Math.sin(i), Math.cos(i));
}
var SURFACES = [
    {
      id: "B1",
      name: "B 面 \xB7 一号展台",
      rect: [0.22, 0.08, 1.52, 0.82],
      z: 0.88,
      rotation: 180,
    },
    {
      id: "B2",
      name: "B 面 \xB7 二号展台",
      rect: [1.73, 0.08, 3.03, 0.82],
      z: 0.88,
      rotation: 180,
    },
    {
      id: "B3",
      name: "B 面 \xB7 三号展台",
      rect: [3.24, 0.08, 4.54, 0.82],
      z: 0.88,
      rotation: 180,
    },
    {
      id: "B4",
      name: "B 面 \xB7 四号展台",
      rect: [4.75, 0.08, 6.05, 0.82],
      z: 0.88,
      rotation: 180,
    },
    {
      id: "C1",
      name: "C 面 \xB7 展台",
      rect: [4.92, 3.98, 6.66, 4.67],
      z: 0.88,
      rotation: 0,
    },
    {
      id: "D1",
      name: "D 面 \xB7 北侧展台",
      rect: [6.76, 3.42, 7.45, 4.62],
      z: 0.88,
      rotation: 90,
    },
    {
      id: "D2",
      name: "D 面 \xB7 南侧展台",
      rect: [6.76, 2.1, 7.45, 3.3],
      z: 0.88,
      rotation: 90,
    },
    {
      id: "I_TABLE",
      name: "机房 \xB7 椭圆桌",
      rect: [8.925, 1.175, 10.375, 3.625],
      z: 0.78,
      rotation: 90,
      round: 0.7,
    },
    {
      id: "FLOOR",
      name: "室内 \xB7 空地",
      z: 0,
      rotation: 180,
    },
  ],
  getSurface = (i) => SURFACES.find((t) => t.id === i);
function placementFootprint(i, t) {
  let e = (t.rotation * Math.PI) / 180,
    n = Math.cos(e),
    s = Math.sin(e),
    r = {
      min: i.bounds.min.map((v) => v * (window.STUDIO_VISUAL_SCALE || 0.72)),
      max: i.bounds.max.map((v) => v * (window.STUDIO_VISUAL_SCALE || 0.72)),
    },
    a = [];
  for (let o of [r.min[0], r.max[0]])
    for (let l of [r.min[2], r.max[2]]) a.push([t.x + (n * o + s * l) * t.scale, t.y + (s * o - n * l) * t.scale]);
  return [
    Math.min(...a.map((o) => o[0])),
    Math.min(...a.map((o) => o[1])),
    Math.max(...a.map((o) => o[0])),
    Math.max(...a.map((o) => o[1])),
  ];
}
function rectsOverlap(i, t, e = 0.015) {
  return i[0] < t[2] + e && i[2] > t[0] - e && i[1] < t[3] + e && i[3] > t[1] - e;
}
function fitsOnSurface(i, t) {
  let [e, n, s, r] = t.rect,
    a = t.round || 0,
    o = 0.012;
  for (let l of [i[0], i[2]])
    for (let c of [i[1], i[3]]) {
      if (l < e + o || l > s - o || c < n + o || c > r - o) return false;
      if (a) {
        let h = Math.max(e + a - l, 0, l - (s - a)),
          u = Math.max(n + a - c, 0, c - (r - a));
        if (h * h + u * u > (a - o) ** 2) return false;
      }
    }
  return true;
}
function validatePlacement(i, t, e = []) {
  if (!i || typeof i != "object") return "成果数据不完整";
  let n = t.find((a) => a.id === i.assetId),
    s = getSurface(i.surfaceId);
  if (!n || !s) return "成果或摆放位置不存在";
  if (typeof i.uid != "string" || !/^[-a-zA-Z0-9_]{1,80}$/.test(i.uid)) return "成果编号无效";
  if (!["x", "y", "rotation", "scale"].every((a) => typeof i[a] == "number" && Number.isFinite(i[a])))
    return "布置包含无效数值";
  if (i.scale < 0.2 || i.scale > 2 || Math.abs(i.rotation) > 36e3)
    return "缩放或旋转超出允许范围";
  let r = placementFootprint(n, i);
  if (s.rect) {
    if (!fitsOnSurface(r, s))
      return "成果超出桌面边缘，请缩小或调整位置";
  } else {
    if (r[0] < 0.19 || r[1] < 0.2 || r[2] > 11.1 || r[3] > 8.18 || (r[2] > 7.29 && r[3] > 4.71))
      return "成果不能超出房间或穿过外墙";
    if (STATIC_BLOCKERS.some((a) => rectsOverlap(r, a.b, 0.04)))
      return "此处与墙体或基础设施重叠";
  }
  if (s.z + n.bounds.max[1] * i.scale > 3.16)
    return "成果超过室内净空，请缩小";
  for (let a of e) {
    if (a.uid === i.uid) continue;
    let o = t.find((c) => c.id === a.assetId),
      l = getSurface(a.surfaceId);
    if (o && l && Math.abs(s.z - l.z) < 0.08 && rectsOverlap(r, placementFootprint(o, a)))
      return "此处已放有其他成果，请换位置";
  }
  return null;
}
function findFreeSpot(i, t, e, n = [], s = "new-item") {
  let r = getSurface(t);
  if (!r) return null;
  let a = [];
  if (r.rect) {
    let [o, l, c, h] = r.rect;
    a.push([(o + c) / 2, (l + h) / 2]);
    for (let u = l + 0.12; u < h - 0.1; u += 0.16) for (let d = o + 0.12; d < c - 0.1; d += 0.16) a.push([d, u]);
  } else {
    a = [
      [3.35, 5.4],
      [3.6, 6.8],
      [5.55, 3],
      [9.6, 0.65],
      [8.08, 2.8],
    ];
    for (let o = 0.5; o < 8; o += 0.32) for (let l = 0.5; l < 11; l += 0.32) a.push([l, o]);
  }
  for (let o of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2])
    for (let [l, c] of a) {
      let h = {
        uid: s,
        assetId: i.id,
        surfaceId: t,
        x: l,
        y: c,
        rotation: r.rotation,
        scale: o,
      };
      if (!validatePlacement(h, e, n)) return h;
    }
  return null;
}
function serializeLayout(i) {
  return {
    format: "studio-layout",
    schemaVersion: 1,
    sceneVersion: "3.0.0-1110-1",
    title: "我的工作室布置",
    placements: i.map((t) => ({
      ...t,
    })),
  };
}
function parseLayout(i, t) {
  let e = typeof i == "string" ? JSON.parse(i) : i;
  if (
    !e ||
    e.format !== "studio-layout" ||
    e.schemaVersion !== 1 ||
    e.sceneVersion !== "3.0.0-1110-1" ||
    !Array.isArray(e.placements)
  )
    throw new Error("请选择本版本导出的布置方案 JSON");
  if (e.placements.length > 36)
    throw new Error("单个方案最多放置 36 件成果");
  let n = [],
    s = /* @__PURE__ */ new Set();
  for (let r of e.placements) {
    let a = {};
    for (let l of ["uid", "assetId", "surfaceId", "x", "y", "rotation", "scale"]) a[l] = r?.[l];
    if (s.has(a.uid)) throw new Error("布置中有重复编号");
    let o = validatePlacement(a, t, n);
    if (o) throw new Error(o);
    (s.add(a.uid), n.push(a));
  }
  return n;
}
function floorBlocks(i, t) {
  return i
    .filter((e) => e.surfaceId === "FLOOR")
    .map((e) =>
      placementFootprint(
        t.find((n) => n.id === e.assetId),
        e,
      ),
    );
}
function createPlacementLayer(i, t, e) {
  let n = /* @__PURE__ */ new Map(),
    s = new Map(t.map((r) => [r.id, r]));
  return {
    groups: n,
    sync(r) {
      let a = new Set(r.map((o) => o.uid));
      for (let [o, l] of n) a.has(o) || (l.children.forEach((c) => e.release(c)), i.remove(l), n.delete(o));
      for (let o of r) {
        let l = n.get(o.uid);
        (l &&
          l.userData.assetId !== o.assetId &&
          (l.children.forEach((h) => e.release(h)), i.remove(l), n.delete(o.uid), (l = null)),
          l ||
            ((l = new Group()),
            (l.userData = {
              uid: o.uid,
              assetId: o.assetId,
            }),
            s.get(o.assetId).meshes.forEach((h) => l.add(e.make(h))),
            i.add(l),
            n.set(o.uid, l)));
        let c = [o.x, o.y, o.surfaceId, o.rotation, o.scale].join(",");
        l.userData.signature !== c &&
          (l.position.set(o.x, getSurface(o.surfaceId).z, -o.y),
          (l.rotation.y = (o.rotation * Math.PI) / 180),
          l.scale.setScalar(o.scale * (window.STUDIO_VISUAL_SCALE || 0.72)),
          (l.matrixAutoUpdate = false),
          l.updateMatrix(),
          l.updateMatrixWorld(true),
          (l.userData.signature = c));
      }
    },
  };
}
var byId = (i) => document.getElementById(i);
function createEl(i, t, e) {
  let n = document.createElement(i);
  return (t && (n.className = t), e !== void 0 && (n.textContent = e), n);
}
function downloadFile(i, t, e = "application/json") {
  let n = URL.createObjectURL(
      new Blob([t], {
        type: e,
      }),
    ),
    s = document.createElement("a");
  ((s.href = n), (s.download = i), s.click(), setTimeout(() => URL.revokeObjectURL(n), 3e3));
}
function createCatalog({
  data: i,
  scene: t,
  factory: e,
  renderer: n,
  toast: s,
  invalidate: r,
  onChange: a,
  onMode: o,
  onPickFloor: l,
  onFocus: c,
  onPreviewStart: h,
  onPreviewEnd: u,
  onPreviewFrame: d,
  exportHTML: m,
  environment: env,
}) {
  let _ = i.catalog.items,
    y = new Map(_.map((nt) => [nt.id, nt])),
    p = new Group(),
    f = new Group(),
    S = /* @__PURE__ */ new Map();
  t.add(p, f);
  let A = createPlacementLayer(p, _, e),
    w = createPlacementLayer(f, _, e);
  A.sync(i.catalog.defaultPlacements);
  let E = [],
    T = null,
    g = _[0].id,
    M = [],
    N = [],
    I = "stocked",
    D = [],
    z,
    W,
    C,
    H,
    q = true,
    k,
    tt = "",
    V = "studio-1110-layout-v1" + (i.storageId ? ":" + i.storageId : ""),
    j;
  try {
    j = localStorage.getItem(V);
  } catch {}
  for (let nt of [j, i.savedLayout])
    if (nt)
      try {
        E = parseLayout(nt, _);
        break;
      } catch (ct) {
        tt = "未加载旧布置：" + ct.message;
      }
  let Q = new BoxHelper(new Object3D(), 13275979);
  ((Q.material.depthTest = false), (Q.renderOrder = 50), (Q.visible = false), t.add(Q));
  function Mt() {
    ((q = true), r());
  }
  function Nt() {
    try {
      (localStorage.setItem(V, JSON.stringify(serializeLayout(E))),
        (byId("save-status").textContent = "已自动保存在本浏览器"));
    } catch {
      byId("save-status").textContent =
        "浏览器未允许保存，请导出方案";
    }
    k = null;
  }
  function Y() {
    (clearTimeout(k), (k = setTimeout(Nt, 250)), (byId("save-status").textContent = "正在保存…"));
  }
  function rt(nt = true) {
    (w.sync(E),
      (p.visible = I === "stocked"),
      (f.visible = I === "custom"),
      nt && (D = floorBlocks(E, _)),
      (byId("layout-panel").hidden = I !== "custom"),
      (byId("layout-count").textContent = E.length + " / 36"));
    let ct = byId("placed-list");
    if ((ct.replaceChildren(), !E.length)) {
      let Lt = createEl("option", "", "尚未摆放成果");
      ((Lt.value = ""), ct.append(Lt));
    }
    for (let Lt of E) {
      let Kt = createEl("option", "", y.get(Lt.assetId).name + " \xB7 " + getSurface(Lt.surfaceId).name);
      ((Kt.value = Lt.uid), ct.append(Kt));
    }
    (E.some((Lt) => Lt.uid === T) || (T = E.at(-1)?.uid || null), (ct.value = T || ""));
    let Pt = E.find((Lt) => Lt.uid === T);
    (document.querySelectorAll("[data-needs-item]").forEach((Lt) => (Lt.disabled = !Pt)),
      (byId("scale-value").textContent = Pt ? Math.round(Pt.scale * 100) + "%" : "—"),
      (byId("model-scale").value = Pt ? Pt.scale : 1),
      (byId("rotation-value").textContent = Pt ? Math.round(Pt.rotation % 360) + "\xB0" : "—"),
      (byId("layout-undo").disabled = !M.length),
      (byId("layout-redo").disabled = !N.length),
      (Q.visible = !!Pt && I === "custom"),
      Pt && Q.setFromObject(w.groups.get(Pt.uid)),
      a(nt),
      r());
  }
  function vt(nt, ct = T) {
    (M.push(JSON.stringify(E)), M.length > 25 && M.shift(), (N = []), (E = nt), (T = ct), rt(), Y());
  }
  function Rt(nt) {
    let ct = E.find((Kt) => Kt.uid === T);
    if (!ct) return;
    let Pt = {
        ...ct,
        ...nt,
      },
      Lt = validatePlacement(Pt, _, E);
    if (Lt) {
      (s(Lt), rt(false));
      return;
    }
    vt(E.map((Kt) => (Kt.uid === ct.uid ? Pt : Kt)));
  }
  function mt(nt) {
    ((I = nt), rt(true));
  }
  function zt() {
    if (E.length >= 36) {
      s("当前方案已放满 36 件成果");
      return;
    }
    let nt = y.get(g),
      ct = "item-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      Pt = findFreeSpot(nt, byId("place-surface").value, _, E, ct);
    if (!Pt) {
      s("这个位置已放满，请更换展台或选择空地");
      return;
    }
    (vt([...E, Pt], ct),
      byId("catalog-dialog").close(),
      o("custom"),
      c(Pt),
      s("已放入“我的布置”，可继续调整位置"));
  }
  function me() {
    if (z) return;
    ((z = new Scene()),
      (z.background = new Color("#e9eee6")),
      (z.environment = env),
      (z.environmentIntensity = 0.62),
      (W = new PerspectiveCamera(38, 1, 0.01, 30)),
      z.add(new HemisphereLight(16777215, 7176572, 2.5), new AmbientLight(16777215, 0.5)));
    ((n.outputColorSpace = SRGBColorSpace),
      (n.toneMapping = ACESFilmicToneMapping),
      (n.toneMappingExposure = 0.92));
    let nt = new DirectionalLight(16773596, 2.7);
    (nt.position.set(-2, 4, 3), z.add(nt));
    let ct = new DirectionalLight(14808063, 1.1);
    (ct.position.set(3, 2, -2),
      z.add(ct),
      (C = new OrbitControls(W, n.domElement)),
      (C.enableDamping = false),
      (C.enablePan = false),
      (C.minDistance = 0.25),
      (C.maxDistance = 8),
      (C.enabled = false),
      C.addEventListener("change", Mt));
  }
  function Dt(nt) {
    g = nt;
    let ct = y.get(nt);
    if (
      (document.querySelectorAll(".asset-card").forEach((Pt) => {
        (Pt.classList.toggle("active", Pt.dataset.asset === nt),
          Pt.setAttribute("aria-pressed", String(Pt.dataset.asset === nt)));
      }),
      (byId("asset-code").textContent = ct.code + " / " + ct.category),
      (byId("asset-name").textContent = ct.name),
      (byId("asset-summary").textContent = ct.summary),
      (byId("asset-description").textContent = ct.description),
      (byId("asset-notes").textContent = ct.modelNotes),
      byId("asset-features").replaceChildren(...ct.features.map((Pt) => createEl("li", "", Pt))),
      (byId("asset-photo").src = i.images[ct.thumbRef]),
      (byId("asset-photo").alt = ct.name + " 原始参考"),
      (byId("asset-source").textContent = "资料来源及建模方式见完整简介与模型说明。"),
      (byId("asset-aliases").textContent = ct.aliases.length ? "也称：" + ct.aliases.join("、") : ""),
      z)
    ) {
      if ((H && z.remove(H), !S.has(nt))) {
        let Kt = new Group();
        (ct.meshes.forEach((ie) => Kt.add(e.make(ie))), S.set(nt, Kt));
      }
      ((H = S.get(nt)), z.add(H));
      let Pt = ct.bounds.max[1],
        Lt = Math.max(ct.bounds.max[0] - ct.bounds.min[0], Pt, ct.bounds.max[2] - ct.bounds.min[2]);
      (C.target.set(0, Pt * 0.45, 0),
        W.position.set(Lt * 1.15, Pt * 0.55 + Lt * 0.85, Lt * 1.9),
        C.update(),
        ne(),
        Mt());
    }
  }
  function jt() {
    let nt = byId("catalog-search").value.trim().toLowerCase(),
      ct = byId("catalog-filter").value,
      Pt = byId("asset-list");
    Pt.replaceChildren();
    let Lt = 0;
    for (let Kt of _) {
      if (
        (ct && ct !== Kt.category) ||
        (nt && ![Kt.name, Kt.summary, ...Kt.aliases].join(" ").toLowerCase().includes(nt))
      )
        continue;
      Lt++;
      let ie = createEl("button", "asset-card"),
        ye = createEl("img"),
        We = createEl("span", "asset-card-copy");
      ((ie.dataset.asset = Kt.id),
        (ye.src = i.images[Kt.thumbRef]),
        (ye.alt = ""),
        (ye.loading = "lazy"),
        We.append(createEl("small", "", Kt.code + " \xB7 " + Kt.category), createEl("strong", "", Kt.name)),
        ie.append(ye, We),
        ie.classList.toggle("active", Kt.id === g),
        (ie.onclick = () => Dt(Kt.id)),
        Pt.append(ie));
    }
    Lt || Pt.append(createEl("p", "no-results", "没有找到匹配的成果"));
  }
  function ne() {
    if (!z || !byId("catalog-dialog").open) return;
    let nt = byId("model-preview").getBoundingClientRect();
    nt.width < 1 ||
      nt.height < 1 ||
      (n.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)),
      n.setSize(nt.width, nt.height),
      (W.aspect = nt.width / nt.height),
      W.updateProjectionMatrix(),
      Mt());
  }
  function qt() {
    (l(false),
      byId("catalog-dialog").showModal(),
      h(byId("model-preview")),
      me(),
      (C.enabled = true),
      jt(),
      Dt(g),
      r());
  }
  (byId("catalog-dialog").addEventListener("close", () => {
    (C && (C.enabled = false), u());
  }),
    byId("reference-dialog").addEventListener("close", () => {
      (byId("reference-image").removeAttribute("src"), Mt());
    }));
  for (let nt of [...new Set(_.map((ct) => ct.category))]) {
    let ct = createEl("option", "", nt);
    ((ct.value = nt), byId("catalog-filter").append(ct));
  }
  for (let nt of SURFACES) {
    let ct = createEl("option", "", nt.name);
    ((ct.value = nt.id), byId("place-surface").append(ct));
  }
  return (
    (byId("catalog-total").textContent = _.length + " 项成果"),
    (byId("catalog-button").onclick = qt),
    (byId("catalog-add-more").onclick = qt),
    (byId("catalog-search").oninput = jt),
    (byId("catalog-filter").onchange = jt),
    (byId("add-asset").onclick = zt),
    (byId("asset-placard").onclick = () => {
      ((byId("reference-image").src = i.images[y.get(g).placardRef]),
        (byId("reference-title").textContent = "原始简介牌"),
        byId("reference-dialog").showModal());
    }),
    (byId("asset-photo").onclick = () => {
      ((byId("reference-image").src = i.images[y.get(g).photoRef]),
        (byId("reference-title").textContent = "原始实物参考"),
        byId("reference-dialog").showModal());
    }),
    (byId("placed-list").onchange = (nt) => {
      ((T = nt.target.value), rt(false));
    }),
    (byId("rotate-left").onclick = () => {
      let nt = E.find((ct) => ct.uid === T);
      nt &&
        Rt({
          rotation: nt.rotation - 15,
        });
    }),
    (byId("rotate-right").onclick = () => {
      let nt = E.find((ct) => ct.uid === T);
      nt &&
        Rt({
          rotation: nt.rotation + 15,
        });
    }),
    (byId("model-scale").onchange = (nt) =>
      Rt({
        scale: Math.round(+nt.target.value * 100) / 100,
      })),
    document.querySelectorAll("[data-nudge]").forEach(
      (nt) =>
        (nt.onclick = () => {
          let ct = E.find((Pt) => Pt.uid === T);
          if (ct) {
            let [Pt, Lt] = nt.dataset.nudge.split(",").map(Number);
            Rt({
              x: ct.x + Pt,
              y: ct.y + Lt,
            });
          }
        }),
    ),
    (byId("remove-asset").onclick = () => {
      (vt(E.filter((nt) => nt.uid !== T)), s("已移除，可用撤销恢复"));
    }),
    (byId("relocate-asset").onclick = () => {
      (l(true), s("请点击平面图空地，成果将落在地面"));
    }),
    (byId("layout-undo").onclick = () => {
      M.length && (N.push(JSON.stringify(E)), (E = JSON.parse(M.pop())), rt(), Y());
    }),
    (byId("layout-redo").onclick = () => {
      N.length && (M.push(JSON.stringify(E)), (E = JSON.parse(N.pop())), rt(), Y());
    }),
    (byId("layout-export").onclick = () =>
      downloadFile("studio-layout-1110.json", JSON.stringify(serializeLayout(E), null, 2))),
    (byId("layout-import").onclick = () => byId("layout-file").click()),
    (byId("layout-file").onchange = async (nt) => {
      let ct = nt.target.files[0];
      if (((nt.target.value = ""), !!ct))
        try {
          if (ct.size > 262144)
            throw new Error("方案文件过大，请选择导出的 JSON");
          (vt(parseLayout(await ct.text(), _)), o("custom"), s("已载入布置方案"));
        } catch (Pt) {
          s(Pt.message || "方案格式无法识别");
        }
    }),
    (byId("layout-copy").onclick = async () => {
      let nt = byId("layout-copy");
      nt.disabled = true;
      try {
        (await m(serializeLayout(E)),
          s("已导出含当前布置的离线软件副本"));
      } catch {
        s("导出失败，请先保存 JSON 布置方案");
      } finally {
        nt.disabled = false;
      }
    }),
    (byId("layout-seed").onclick = () => {
      (vt(
        i.catalog.defaultPlacements.map((nt) => ({
          ...nt,
          uid: "copy-" + nt.uid,
        })),
      ),
        o("custom"),
        s("已将 6 件预载成果复制到“我的布置”"));
    }),
    new ResizeObserver(ne).observe(byId("model-preview")),
    window.addEventListener("beforeunload", () => {
      k && Nt();
    }),
    rt(),
    tt && setTimeout(() => s(tt), 1500),
    {
      applyPreset(records) {
        vt(parseLayout(serializeLayout(records), _));
      },
      showVersion: mt,
      open: qt,
      hasEmbedded: !!i.savedLayout,
      mark: Mt,
      resize: ne,
      setBlocked(nt) {
        C && (C.enabled = byId("catalog-dialog").open && !nt);
      },
      render() {
        z && q && byId("catalog-dialog").open && !byId("reference-dialog").open && (n.render(z, W), (q = false), d());
      },
      get placements() {
        return E;
      },
      get selected() {
        return T;
      },
      get blocks() {
        return D;
      },
      get instances() {
        return w;
      },
      placeOnFloor(nt, ct) {
        let Pt = E.find((ie) => ie.uid === T);
        if (!Pt) return false;
        let Lt = {
            ...Pt,
            surfaceId: "FLOOR",
            x: nt,
            y: ct,
          },
          Kt = validatePlacement(Lt, _, E);
        return Kt ? (s(Kt), false) : (vt(E.map((ie) => (ie.uid === Pt.uid ? Lt : ie))), true);
      },
      pick(nt, ct, Pt) {
        let Lt = Pt.getBoundingClientRect(),
          Kt = new Raycaster();
        Kt.setFromCamera(
          new Vector2(((nt.clientX - Lt.left) / Lt.width) * 2 - 1, (-(nt.clientY - Lt.top) / Lt.height) * 2 + 1),
          ct,
        );
        let ie = Kt.intersectObjects(f.children, true)[0];
        if (ie) {
          let ye = ie.object;
          for (; ye.parent && ye.parent !== f;) ye = ye.parent;
          return ((T = ye.userData.uid), rt(false), true);
        }
        return false;
      },
    }
  );
}
function createRenderLoop({
  requestFrame: i,
  cancelFrame: t,
  render: e,
  isActive: n = () => false,
  isHidden: s = () => false,
}) {
  let r = null,
    a = false,
    o = null,
    l = false,
    c = () => {
      r === null && !l && !s() && (r = i(h));
    };
  function h(u) {
    if (((r = null), l || s())) return;
    if (!a && !n()) {
      o = null;
      return;
    }
    let d = o === null ? 0 : Math.min(0.045, (u - o) / 1e3);
    ((o = u), (a = false), e(u, d), a || n() ? c() : (o = null));
  }
  return {
    invalidate() {
      ((a = true), c());
    },
    pause() {
      (r !== null && t(r), (r = null), (o = null));
    },
    resume() {
      ((o = null), (a = true), c());
    },
    dispose() {
      ((l = true), r !== null && t(r), (r = null));
    },
    get pending() {
      return r !== null;
    },
  };
}
var nextTask = () => new Promise((i) => setTimeout(i, 0));
async function loadSceneData(i = () => {}) {
  let t = document.getElementById("studio-data").textContent.trim(),
    e,
    n = false;
  try {
    ((e = await new Promise((r, a) => {
      let o = URL.createObjectURL(
          new Blob([document.getElementById("studio-worker").textContent], {
            type: "text/javascript",
          }),
        ),
        l,
        c,
        h = (u, d) => {
          (clearTimeout(c), l?.terminate(), URL.revokeObjectURL(o), u(d));
        };
      try {
        ((l = new Worker(o)),
          (c = setTimeout(() => h(a, new Error("Worker timeout")), 3e4)),
          (l.onmessage = (u) => {
            u.data.type === "ready"
              ? h(r, u.data)
              : u.data.type === "error"
                ? h(a, new Error(u.data.message))
                : u.data.type === "progress" &&
                  i("正在解码模型 " + u.data.done + " / " + u.data.total);
          }),
          (l.onerror = (u) => {
            (u.preventDefault(), h(a, new Error("Worker unavailable")));
          }),
          l.postMessage(t));
      } catch (u) {
        h(a, u);
      }
    })),
      (n = true));
  } catch {
    (i("正在分步载入模型…"),
      await nextTask(),
      (e = await decodeScene(t, {
        yieldTask: nextTask,
        progress: (r, a) => i("正在解码模型 " + r + " / " + a),
      })));
  }
  let s = document.getElementById("studio-layout").textContent.trim();
  if (s && s !== "null") {
    let r = JSON.parse(s);
    ((e.data.savedLayout = r.layout), (e.data.storageId = r.storageId));
  }
  return {
    data: e.data,
    timing: e.timing,
    usedWorker: n,
  };
}
var dom = (i) => document.getElementById(i),
  pressedKeys = /* @__PURE__ */ new Set(),
  roomMeshes = [],
  wallMaterialClones = new WeakMap(),
  wallVisibilityMaterials = new WeakSet(),
  textures = {},
  dialogs = [...document.querySelectorAll("dialog")],
  state = {
    mode: "walk",
    version: "stocked",
    withObjects: true,
    auto: false,
    x: VIEWPOINTS.center.x,
    y: VIEWPOINTS.center.y,
    yaw: 0,
    pitch: 0,
    fov: 78,
    view: "center",
    quality: "balanced",
  },
  sceneData,
  assetById,
  renderer,
  scene,
  camera,
  orbit,
  keyLight,
  meshFactory,
  catalog,
  renderLoop,
  postPipeline,
  iblTexture,
  ready = false,
  pickingFloor = false,
  modalCount = 0,
  destination = "room",
  headingDirty = true,
  mapDirty = true,
  lastMapDraw = -1 / 0,
  lastHeading = "",
  lastNeedle = null,
  dragPointer = null,
  joystick = {
    x: 0,
    y: 0,
  },
  toastTimer,
  minimapCanvas = dom("minimap"),
  mapCtx = minimapCanvas.getContext("2d"),
  perf = {
    mainFrames: 0,
    previewFrames: 0,
    mainCalls: 0,
    previewCalls: 0,
    mainTriangles: 0,
    shadowUpdates: 0,
    mapDraws: 0,
    load: null,
    readyMs: null,
    renderCPU: [],
  },
  invalidate = () => renderLoop?.invalidate(),
  yieldTask = () => new Promise((i) => setTimeout(i, 0)),
  nextPaint = () => new Promise((i) => requestAnimationFrame(() => requestAnimationFrame(i)));
function toast(i) {
  ((dom("toast").textContent = i),
    dom("toast").classList.add("show"),
    dom("catalog-dialog").open && (dom("catalog-feedback").textContent = i),
    clearTimeout(toastTimer),
    (toastTimer = setTimeout(() => {
      (dom("toast").classList.remove("show"), (dom("catalog-feedback").textContent = ""));
    }, 3500)));
}
function showFatalError(i) {
  ((ready = false),
    renderLoop?.dispose(),
    dialogs.filter((t) => t.open).forEach((t) => t.close()),
    (dom("loader").hidden = true),
    (dom("error-panel").hidden = false),
    (dom("error-message").textContent = i),
    sceneData && (dom("fallback").src = sceneData.fallbackImage),
    (dom("ready-status").textContent = "显示异常"),
    (dom("reload").onclick = () => location.reload()));
}
function requestShadowUpdate() {
  renderer && (renderer.shadowMap.needsUpdate = true);
}
function applyWalkCamera(i = false) {
  (camera.position.set(state.x, 1.66, -state.y),
    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ"),
    i && ((camera.fov = state.fov), camera.updateProjectionMatrix()),
    (headingDirty = true),
    (mapDirty = true),
    invalidate());
}
function customBlocks() {
  return state.version === "custom" && catalog ? catalog.blocks : [];
}
function canStand(i, t) {
  return isWalkable(i, t, state.withObjects, customBlocks());
}
function ensureValidPosition() {
  if (!camera || canStand(state.x, state.y)) return;
  let i = Object.values(VIEWPOINTS).find((t) => canStand(t.x, t.y));
  if (!i)
    for (let t = 0.4; t < 8 && !i; t += 0.25)
      for (let e = 0.4; e < 11 && !i; e += 0.25)
        canStand(e, t) &&
          (i = {
            x: e,
            y: t,
          });
  i &&
    ((state.x = i.x),
    (state.y = i.y),
    (state.view = "custom"),
    state.mode === "walk" && applyWalkCamera(),
    updateViewButtons());
}
function onLayoutChange(i) {
  (i && requestShadowUpdate(), ensureValidPosition(), (mapDirty = true), invalidate());
}
function setFloorPicking(i) {
  ((pickingFloor = i),
    (dom("map-caption").textContent = i
      ? "点击空地放置成果；Esc 取消"
      : "点击空地，切换站立位置"),
    dom("map-panel").classList.toggle("placing", i),
    i && (dom("map-panel").classList.add("open"), dom("mobile-map").setAttribute("aria-pressed", "true")),
    (mapDirty = true),
    invalidate());
}
function applyVisibility() {
  for (let i of roomMeshes) {
    let t = i.userData.kind;
    if (
      ((i.visible = (t !== "objects" || state.withObjects) && (t !== "ceiling" || state.mode === "walk")), t === "wall")
    ) {
      let e = state.mode === "overview";
      const materials = (Array.isArray(i.material) ? i.material : [i.material]).map((material) => {
        if (wallVisibilityMaterials.has(material)) return material;
        let clone = wallMaterialClones.get(material);
        if (!clone) {
          clone = material.clone();
          wallMaterialClones.set(material, clone);
          wallVisibilityMaterials.add(clone);
        }
        return clone;
      });
      i.material = Array.isArray(i.material) ? materials : materials[0];
      for (const material of materials) {
        material.transparent !== e && ((material.transparent = e), (material.needsUpdate = true));
        material.opacity = e ? 0.19 : 1;
        material.depthWrite = !e;
      }
    }
  }
  v062DrawContacts();
  ((headingDirty = true), requestShadowUpdate(), invalidate());
}
function updateFacadeCulling() {
  for (let i of roomMeshes) {
    if (!i.userData.facade) continue;
    let t = i.userData.surface,
      e = camera.position,
      n = t === "E" ? e.x < 0.2 : t === "F" ? e.z < -8.25 : t === "G" ? e.x > 7.4 : t === "H" ? e.z > -4.95 : false;
    const next = state.mode !== "overview" || !n;
    if (i.visible !== next && i.castShadow) requestShadowUpdate();
    i.visible = next;
  }
}
function setVersion(i) {
  ((state.version = i), (state.withObjects = i === "stocked"), setFloorPicking(false));
  for (let t of ["stocked", "empty", "custom"])
    (dom(t).classList.toggle("selected", t === i), dom(t).setAttribute("aria-pressed", String(t === i)));
  (document.body.classList.toggle("editing-layout", i === "custom"),
    catalog?.showVersion(i),
    ensureValidPosition(),
    applyVisibility(),
    (mapDirty = true),
    invalidate());
}
function setAutoRotate(i) {
  ((state.auto = i),
    dom("auto").setAttribute("aria-pressed", String(i)),
    (dom("auto").querySelector("span").textContent = i ? "暂停环视" : "自动环视"),
    orbit && (orbit.autoRotate = i && state.mode === "overview"),
    invalidate());
}
function updateViewButtons() {
  (document.querySelectorAll("[data-view]").forEach((i) => {
    let t = i.dataset.view === state.view && state.mode === "walk";
    (i.classList.toggle("active", t), i.setAttribute("aria-pressed", String(t)));
  }),
    state.mode === "walk" &&
      (dom("position-label").textContent = VIEWPOINTS[state.view]?.name || "自由移动"));
}
function updateGestureHint() {
  dom("gesture-hint").textContent =
    state.mode === "overview"
      ? "拖动旋转模型 \xB7 滚轮缩放 \xB7 右键平移"
      : matchMedia("(pointer: coarse)").matches
        ? "滑动画面环视 \xB7 左下摇杆移动 \xB7 点 A–I 切换位置"
        : "拖动画面环视 \xB7 WASD / 方向键移动 \xB7 滚轮调整视野";
}
function setMode(i) {
  (setAutoRotate(false), (state.mode = i), (orbit.enabled = i === "overview" && !modalCount && destination === "room"));
  for (let t of ["walk", "overview"])
    (dom(t).classList.toggle("selected", i === t), dom(t).setAttribute("aria-pressed", String(i === t)));
  (i === "overview"
    ? ((camera.fov = 48),
      camera.updateProjectionMatrix(),
      camera.position.set(13, 13, -14.3),
      orbit.target.set(4.6, 0.55, -4),
      orbit.update(),
      (dom("position-label").textContent = "整体鸟瞰"))
    : (ensureValidPosition(), applyWalkCamera(true)),
    applyVisibility(),
    (mapDirty = true),
    (headingDirty = true),
    updateViewButtons(),
    updateGestureHint(),
    invalidate());
}
function goToView(i) {
  let t = VIEWPOINTS[i];
  t &&
    (Object.assign(state, {
      x: t.x,
      y: t.y,
      yaw: t.yaw,
      pitch: t.pitch || 0,
      fov: t.fov || 78,
      view: i,
    }),
    setMode("walk"),
    updateViewButtons(),
    dom("map-panel").classList.remove("open"),
    dom("mobile-map").setAttribute("aria-pressed", "false"));
}
function focusPlacement(i) {
  (setMode("overview"),
    orbit.target.set(i.x, 0.7, -i.y),
    camera.position.set(i.x + 3.2, 5, -i.y - 4.2),
    orbit.update(),
    (headingDirty = true),
    invalidate());
}
function zoom(i) {
  if (state.mode === "walk") ((state.fov = MathUtils.clamp(state.fov + i * 5, 40, 92)), applyWalkCamera(true));
  else {
    let t = camera.position
      .clone()
      .sub(orbit.target)
      .multiplyScalar(i > 0 ? 1.13 : 0.87);
    (camera.position
      .copy(orbit.target)
      .add(t.setLength(MathUtils.clamp(t.length(), orbit.minDistance, orbit.maxDistance))),
      orbit.update(),
      (headingDirty = true),
      invalidate());
  }
}
function syncQualityRendering() {
  const t = QUALITY[state.quality];
  renderer.setPixelRatio(v062PixelRatio());
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = destination === "room" && t.shadows;
  renderer.shadowMap.autoUpdate = false;
  keyLight.castShadow = t.shadows;
  if (t.shadowMapSize && keyLight.shadow.mapSize.x !== t.shadowMapSize) {
    keyLight.shadow.mapSize.set(t.shadowMapSize, t.shadowMapSize);
    keyLight.shadow.map?.dispose();
    keyLight.shadow.map = null;
  }
  if (t.post && destination === "room") {
    if (!postPipeline.isComposer || postPipeline.tier !== state.quality) postPipeline.build(state.quality);
    postPipeline.setSize(innerWidth, innerHeight);
  } else {
    postPipeline.dispose();
  }
  requestShadowUpdate();
}
function setQuality(i) {
  state.quality = QUALITY[i] ? i : "balanced";
  v062QualityReset();
  meshFactory.changeQuality(state.quality);
  syncQualityRendering();
  applyVisibility();
  catalog?.mark();
  dom("quality-select").value = state.quality;
  dom("ready-status").textContent =
    {
      fast: "流畅",
      balanced: "均衡",
      detail: "精细",
    }[state.quality] + " · 已就绪";
  try {
    localStorage.setItem("studio-v062-quality", state.quality);
  } catch {}
  invalidate();
}
function syncModalState() {
  ((modalCount = dialogs.filter((i) => i.open).length),
    modalCount &&
      (pressedKeys.clear(),
      (dragPointer = null),
      (joystick = {
        x: 0,
        y: 0,
      }),
      (dom("joystick-knob").style.transform = "")),
    orbit && (orbit.enabled = state.mode === "overview" && !modalCount && destination === "room"),
    catalog?.setBlocked(dom("reference-dialog").open),
    invalidate());
}
function beginPreview(i) {
  (pressedKeys.clear(),
    (joystick = {
      x: 0,
      y: 0,
    }),
    (dragPointer = null),
    setAutoRotate(false),
    (destination = "preview"),
    (orbit.enabled = false),
    (renderer.shadowMap.enabled = false),
    i.append(renderer.domElement),
    syncModalState());
}
function endPreview() {
  destination === "preview" &&
    ((destination = "room"),
    dom("viewer").append(renderer.domElement),
    syncQualityRendering(),
    (headingDirty = true),
    (mapDirty = true),
    syncModalState(),
    invalidate());
}
async function exportOfflineCopy(i) {
  (toast("正在准备离线副本…"), await nextPaint());
  let t = document.documentElement.cloneNode(true);
  ((t.querySelector("#studio-layout").textContent = JSON.stringify({
    layout: i,
    storageId: "copy-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
  }).replaceAll("<", "\\u003c")),
    t.querySelectorAll("#viewer canvas,#model-preview canvas").forEach((n) => n.remove()),
    t.querySelectorAll("dialog").forEach((n) => n.removeAttribute("open")),
    t.querySelector("#loader").removeAttribute("hidden"),
    t.querySelector("#ready-status").removeAttribute("data-ready"),
    (t.querySelector("#ready-status").textContent = "正在载入"),
    (t.querySelector("#load-detail").textContent = "正在准备工作室…"),
    t.querySelector("#error-panel").setAttribute("hidden", ""),
    t.querySelector("#layout-panel").setAttribute("hidden", ""),
    t.querySelector("body").classList.remove("editing-layout"),
    t.querySelector("#toast").classList.remove("show"));
  for (let n of ["asset-list", "placed-list", "place-surface"]) t.querySelector("#" + n).replaceChildren();
  let e = t.querySelector("#catalog-filter");
  e.innerHTML = '<option value="">全部分类</option>';
  for (let n of ["reference-image", "asset-photo", "plan-image", "fallback"])
    t.querySelector("#" + n).removeAttribute("src");
  (t.querySelector("#layout-copy").removeAttribute("disabled"),
    downloadFile(
      "studio-v070-my-layout.html",
      `<!doctype html>
` + t.outerHTML,
      "text/html;charset=utf-8",
    ));
}
function bindDialogs() {
  for (let i of dialogs)
    (new MutationObserver(syncModalState).observe(i, {
      attributes: true,
      attributeFilter: ["open"],
    }),
      i.addEventListener("close", syncModalState),
      i.addEventListener("click", (t) => {
        if (t.target !== i) return;
        let e = i.getBoundingClientRect();
        (t.clientX < e.left || t.clientX > e.right || t.clientY < e.top || t.clientY > e.bottom) && i.close();
      }));
  document.querySelectorAll(".close-dialog").forEach((i) => (i.onclick = () => i.closest("dialog").close()));
}
function bindToolbar() {
  for (let i of ["stocked", "empty", "custom"]) dom(i).onclick = () => setVersion(i);
  ((dom("quality-select").onchange = (i) => setQuality(i.target.value)),
    (dom("walk").onclick = () => setMode("walk")),
    (dom("overview").onclick = () => setMode("overview")),
    (dom("reset").onclick = () => goToView("center")),
    (dom("auto").onclick = () => setAutoRotate(!state.auto)),
    document.querySelectorAll("[data-view]").forEach((i) => (i.onclick = () => goToView(i.dataset.view))),
    (dom("zoom-in").onclick = () => zoom(-1)),
    (dom("zoom-out").onclick = () => zoom(1)),
    (dom("help").onclick = () => {
      (setAutoRotate(false), dom("help-dialog").showModal(), syncModalState());
    }),
    (dom("plan-button").onclick = () => {
      (setAutoRotate(false),
        dom("plan-image").getAttribute("src") || (dom("plan-image").src = sceneData.planImage),
        dom("plan-dialog").showModal(),
        syncModalState());
    }),
    (dom("fullscreen").onclick = async () => {
      try {
        document.fullscreenElement
          ? await document.exitFullscreen()
          : await document.documentElement.requestFullscreen();
      } catch {
        toast("可使用浏览器的全屏功能");
      }
    }),
    (dom("snapshot").onclick = () => {
      try {
        postPipeline.render();
        let i = document.createElement("a");
        ((i.download = "studio-view-" + state.version + ".png"),
          (i.href = renderer.domElement.toDataURL("image/png")),
          i.click(),
          toast("当前三维视图已导出"));
      } catch {
        toast("当前浏览器未允许导出视图");
      }
    }),
    (dom("mobile-map").onclick = () => {
      let i = dom("map-panel").classList.toggle("open");
      (dom("mobile-map").setAttribute("aria-pressed", String(i)), (mapDirty = true), invalidate());
    }),
    (dom("reload").onclick = () => location.reload()),
    minimapCanvas.addEventListener("click", (i) => {
      let t = minimapCanvas.getBoundingClientRect(),
        e = ((i.clientX - t.left) * 260) / t.width,
        n = ((i.clientY - t.top) * 210) / t.height,
        { scale: s, x0: r, y0: a } = mapTransform(),
        o = (e - r) / s,
        l = (a - n) / s;
      if (pickingFloor) {
        catalog.placeOnFloor(o, l) && setFloorPicking(false);
        return;
      }
      canStand(o, l)
        ? ((state.x = o), (state.y = l), (state.view = "custom"), setMode("walk"))
        : toast(
            "请点击平面图中的空地，避开墙体和设施",
          );
    }));
}
function bindInput() {
  let i = renderer.domElement,
    t = null;
  (i.addEventListener("pointerdown", (a) => {
    modalCount ||
      destination !== "room" ||
      ((t = {
        x: a.clientX,
        y: a.clientY,
      }),
      !(state.mode !== "walk" || a.button !== 0) &&
        ((dragPointer = {
          id: a.pointerId,
          x: a.clientX,
          y: a.clientY,
        }),
        i.setPointerCapture(a.pointerId),
        setAutoRotate(false),
        dom("viewer").focus({
          preventScroll: true,
        })));
  }),
    i.addEventListener("pointermove", (a) => {
      !dragPointer ||
        dragPointer.id !== a.pointerId ||
        state.mode !== "walk" ||
        modalCount ||
        ((state.yaw = wrapAngle(state.yaw - (a.clientX - dragPointer.x) * 42e-4)),
        (state.pitch = MathUtils.clamp(state.pitch - (a.clientY - dragPointer.y) * 36e-4, -1.32, 1.32)),
        (dragPointer.x = a.clientX),
        (dragPointer.y = a.clientY),
        applyWalkCamera());
    }),
    i.addEventListener("pointerup", (a) => {
      (!modalCount &&
        destination === "room" &&
        t &&
        state.version === "custom" &&
        Math.hypot(a.clientX - t.x, a.clientY - t.y) < 5 &&
        catalog?.pick(a, camera, i),
        (t = null),
        (dragPointer = null));
    }),
    i.addEventListener("pointercancel", () => {
      ((dragPointer = null), (t = null));
    }),
    i.addEventListener("contextmenu", (a) => a.preventDefault()),
    i.addEventListener(
      "wheel",
      (a) => {
        !modalCount &&
          destination === "room" &&
          state.mode === "walk" &&
          (a.preventDefault(), zoom(a.deltaY > 0 ? 1 : -1));
      },
      {
        passive: false,
      },
    ),
    window.addEventListener("keydown", (a) => {
      modalCount ||
        /INPUT|TEXTAREA|SELECT/.test(a.target.tagName) ||
        (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(a.code) &&
          state.mode === "walk" &&
          (a.preventDefault(), pressedKeys.add(a.code), setAutoRotate(false), invalidate()),
        a.code === "KeyR" && goToView("center"),
        a.code === "Escape" && setFloorPicking(false));
    }),
    window.addEventListener("keyup", (a) => {
      (pressedKeys.delete(a.code), invalidate());
    }),
    window.addEventListener("blur", () => {
      (pressedKeys.clear(),
        (dragPointer = null),
        (joystick = {
          x: 0,
          y: 0,
        }),
        (dom("joystick-knob").style.transform = ""),
        invalidate());
    }));
  let e = dom("joystick"),
    n = null,
    s = (a) => {
      let o = e.getBoundingClientRect(),
        l = (a.clientX - o.left - o.width / 2) / 28,
        c = (a.clientY - o.top - o.height / 2) / 28,
        h = Math.max(1, Math.hypot(l, c));
      ((l /= h),
        (c /= h),
        (joystick = {
          x: l,
          y: c,
        }),
        (dom("joystick-knob").style.transform = `translate(${l * 24}px,${c * 24}px)`),
        invalidate());
    };
  (e.addEventListener("pointerdown", (a) => {
    ((n = a.pointerId), e.setPointerCapture(n), setAutoRotate(false), s(a), a.preventDefault());
  }),
    e.addEventListener("pointermove", (a) => {
      a.pointerId === n && s(a);
    }));
  let r = () => {
    ((n = null),
      (joystick = {
        x: 0,
        y: 0,
      }),
      (dom("joystick-knob").style.transform = ""),
      invalidate());
  };
  (e.addEventListener("pointerup", r),
    e.addEventListener("pointercancel", r),
    window.addEventListener("resize", onResize),
    document.addEventListener("visibilitychange", () => {
      (pressedKeys.clear(),
        (joystick = {
          x: 0,
          y: 0,
        }),
        (dragPointer = null),
        document.hidden
          ? renderLoop?.pause()
          : ((headingDirty = true), (mapDirty = true), catalog?.mark(), renderLoop?.resume()));
    }),
    updateGestureHint());
}
function isAnimating() {
  return (
    ready &&
    !modalCount &&
    destination === "room" &&
    (state.auto || (state.mode === "walk" && (pressedKeys.size > 0 || joystick.x !== 0 || joystick.y !== 0)))
  );
}
function renderFrame(i, t) {
  if (!ready) return;
  if (destination === "preview") {
    catalog?.render();
    return;
  }
  if (modalCount) return;
  if (state.mode === "walk") {
    let n =
        (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp") ? 1 : 0) -
        (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown") ? 1 : 0) -
        joystick.y,
      s =
        (pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight") ? 1 : 0) -
        (pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft") ? 1 : 0) +
        joystick.x,
      r = Math.max(1, Math.hypot(n, s));
    if (((n /= r), (s /= r), n || s)) {
      let a = 1.5 * t,
        o = (-Math.sin(state.yaw) * n + Math.cos(state.yaw) * s) * a,
        l = (Math.cos(state.yaw) * n + Math.sin(state.yaw) * s) * a,
        c = moveWithCollision(state, o, l, state.withObjects, customBlocks());
      (c.x !== state.x || c.y !== state.y) &&
        ((state.x = c.x), (state.y = c.y), (state.view = "custom"), applyWalkCamera(), updateViewButtons());
    }
    state.auto && !dragPointer && ((state.yaw = wrapAngle(state.yaw + t * 0.16)), applyWalkCamera());
  } else state.auto && ((orbit.autoRotate = true), orbit.update(t));
  if (headingDirty) {
    updateFacadeCulling();
    let n =
        state.mode === "walk"
          ? state.yaw
          : Math.atan2(camera.position.x - orbit.target.x, camera.position.z - orbit.target.z) + Math.PI,
      s = ["N", "NW", "W", "SW", "S", "SE", "E", "NE"][((Math.round(n / (Math.PI / 4)) % 8) + 8) % 8],
      r = Math.round((n * 180) / Math.PI);
    (s !== lastHeading && ((dom("heading").textContent = s), (lastHeading = s)),
      r !== lastNeedle && ((dom("compass-needle").style.transform = `rotate(${r}deg)`), (lastNeedle = r)),
      (headingDirty = false));
  }
  renderer.shadowMap.enabled && renderer.shadowMap.needsUpdate && perf.shadowUpdates++;
  let e = performance.now();
  (postPipeline.render(),
    v062OnFrame(i),
    perf.mainFrames++,
    (perf.mainCalls = renderer.info.render.calls),
    (perf.mainTriangles = renderer.info.render.triangles),
    perf.renderCPU.push(performance.now() - e),
    perf.renderCPU.length > 180 && perf.renderCPU.shift(),
    mapDirty && (i - lastMapDraw >= 100 || !isAnimating()) && (drawMinimap(), (mapDirty = false), (lastMapDraw = i)));
}
function onResize() {
  !renderer ||
    !camera ||
    ((camera.aspect = innerWidth / innerHeight),
    camera.updateProjectionMatrix(),
    destination === "room"
      ? (renderer.setPixelRatio(v062PixelRatio()),
        renderer.setSize(innerWidth, innerHeight),
        postPipeline.setSize(innerWidth, innerHeight))
      : catalog?.resize(),
    (headingDirty = true),
    (mapDirty = true),
    updateGestureHint(),
    invalidate());
}
function mapTransform() {
  return {
    scale: 20.1,
    x0: 15,
    y0: 190,
  };
}
function drawMinimap() {
  (perf.mapDraws++, mapCtx.setTransform(2, 0, 0, 2, 0, 0), mapCtx.clearRect(0, 0, 260, 210));
  let { scale: i, x0: t, y0: e } = mapTransform(),
    n = (a) => t + a * i,
    s = (a) => e - a * i;
  ((mapCtx.fillStyle = "#e6eae4"),
    mapCtx.fillRect(n(7.5), s(4.9), 3.8 * i, 4.9 * i),
    mapCtx.beginPath(),
    sceneData.plan.outline.forEach(([a, o], l) => (l ? mapCtx.lineTo(n(a), s(o)) : mapCtx.moveTo(n(a), s(o)))),
    mapCtx.closePath(),
    (mapCtx.fillStyle = "#fffef9"),
    mapCtx.fill(),
    (mapCtx.strokeStyle = "#526f65"),
    (mapCtx.lineWidth = 1.35),
    mapCtx.stroke(),
    (mapCtx.fillStyle = "#e8ece6"),
    mapCtx.fillRect(n(7.5), s(4.9), 3.8 * i, 4.9 * i));
  for (let a of STATIC_BLOCKERS) {
    let [o, l, c, h] = a.b;
    ((mapCtx.fillStyle = a.kind === "wall" ? "#58756b" : "#d7e7df"),
      mapCtx.fillRect(n(o), s(h), (c - o) * i, (h - l) * i));
  }
  let r = sceneData.plan.table;
  if (
    ((mapCtx.fillStyle = "#e0d3ba"),
    mapCtx.fillRect(n(r[0]), s(r[3]), (r[2] - r[0]) * i, (r[3] - r[1]) * i),
    state.withObjects)
  )
    for (let a of OBJECT_BLOCKERS)
      ((mapCtx.fillStyle = "#bfaa7c70"), mapCtx.fillRect(n(a[0]), s(a[3]), (a[2] - a[0]) * i, (a[3] - a[1]) * i));
  if (
    ((mapCtx.fillStyle = "#5d7669"),
    (mapCtx.font = "bold 10px Arial"),
    (mapCtx.textAlign = "center"),
    mapCtx.fillText("A", n(0.32), s(2.9)),
    mapCtx.fillText("B", n(3.4), s(0.23)),
    mapCtx.fillText("C", n(5.9), s(4.42)),
    mapCtx.fillText("D", n(7.1), s(2)),
    mapCtx.fillText("E", n(0.45), s(6.8)),
    mapCtx.fillText("F", n(3.1), s(8)),
    mapCtx.fillText("G", n(7), s(7)),
    mapCtx.fillText("H", n(6.1), s(5.18)),
    (mapCtx.font = "9px sans-serif"),
    (mapCtx.fillStyle = "#56796b"),
    mapCtx.fillText("机房", n(9.65), s(2.45)),
    (mapCtx.font = "bold 10px Arial"),
    mapCtx.fillText("I", n(10.7), s(4.5)),
    state.version === "custom" && catalog)
  )
    for (let a of catalog.placements) {
      let o = assetById.get(a.assetId),
        l = placementFootprint(o, a);
      ((mapCtx.fillStyle = a.uid === catalog.selected ? "#c48b42" : "#358a7e"),
        mapCtx.fillRect(n(l[0]), s(l[3]), (l[2] - l[0]) * i, (l[3] - l[1]) * i));
    }
  if (
    ((mapCtx.fillStyle = "#294f44"),
    (mapCtx.font = "bold 11px Arial"),
    mapCtx.fillText("N", n(9.8), s(7.9)),
    mapCtx.beginPath(),
    mapCtx.moveTo(n(9.8), s(7.6)),
    mapCtx.lineTo(n(9.65), s(7.2)),
    mapCtx.lineTo(n(9.95), s(7.2)),
    mapCtx.closePath(),
    mapCtx.fill(),
    state.mode === "walk")
  ) {
    let a = n(state.x),
      o = s(state.y),
      l = Math.atan2(-Math.cos(state.yaw), -Math.sin(state.yaw));
    (mapCtx.beginPath(),
      mapCtx.moveTo(a, o),
      mapCtx.arc(a, o, 25, l - 0.5, l + 0.5),
      mapCtx.closePath(),
      (mapCtx.fillStyle = "#2a977733"),
      mapCtx.fill(),
      mapCtx.beginPath(),
      mapCtx.arc(a, o, 4.5, 0, Math.PI * 2),
      (mapCtx.fillStyle = "#176c5d"),
      mapCtx.fill(),
      (mapCtx.strokeStyle = "white"),
      (mapCtx.lineWidth = 2),
      mapCtx.stroke());
  }
}
async function initScene() {
  try {
  renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
  } catch {
    showFatalError(
      "未能启动 WebGL 2。请用 Chrome 或 Edge 打开，并启用硬件加速。",
    );
    return;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(v062PixelRatio());
  renderer.setSize(innerWidth, innerHeight);
  dom("viewer").append(renderer.domElement);

  scene = new Scene();
  scene.background = new Color("#e9eeea");
  scene.environment = createStudioEnvironment(renderer);
  scene.environmentIntensity = 0.62;
  iblTexture = scene.environment;

  camera = new PerspectiveCamera(72, innerWidth / innerHeight, 0.035, 100);
  camera.rotation.order = "YXZ";
  applyWalkCamera(true);
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enabled = false;
  orbit.enableDamping = false;
  orbit.target.set(4.4, 0.85, -4);
  orbit.minDistance = 4;
  orbit.maxDistance = 26;
  orbit.maxPolarAngle = Math.PI * 0.48;
  orbit.autoRotateSpeed = 0.5;
  orbit.addEventListener("change", () => {
    headingDirty = true;
    mapDirty = true;
    invalidate();
  });

  try {
    state.quality = localStorage.getItem("studio-v062-quality") || "balanced";
  } catch {}
  QUALITY[state.quality] || (state.quality = "balanced");

  const lights = createLights(scene, {
    shadows: QUALITY[state.quality].shadows,
    shadowMapSize: QUALITY[state.quality].shadowMapSize,
  });
  keyLight = lights.keyLight;

  const textureJobs = Object.entries(sceneData.textures).map(
    ([n, s]) =>
      new Promise((r, a) => {
        textures[n] = new TextureLoader().load(
          s,
          (o) => {
            o.colorSpace = SRGBColorSpace;
            o.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            r();
          },
          void 0,
          a,
        );
      }),
  );
  v062InitVisual();
  meshFactory = createMeshFactory(textures);
  meshFactory.changeQuality(state.quality);
  postPipeline = createPostPipeline(renderer, scene, camera);
  syncQualityRendering();
  dom("load-detail").textContent = "正在构建工作室环境…";
  for (let n = 0; n < sceneData.meshes.length; n++) {
    const s = meshFactory.make(sceneData.meshes[n]);
    roomMeshes.push(s);
    scene.add(s);
    n % 5 === 4 && (await yieldTask());
  }
  const ground = new Mesh(
    new PlaneGeometry(150, 150),
    new MeshStandardMaterial({
      color: 14016472,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.3,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.17;
  ground.receiveShadow = true;
  ground.matrixAutoUpdate = false;
  ground.updateMatrix();
  scene.add(ground);
  requestShadowUpdate();
  postPipeline.render();
  await nextPaint();
  dom("load-detail").textContent = "正在放入成果与恢复布置…";
  (    (renderLoop = createRenderLoop({
      requestFrame: (n) => requestAnimationFrame(n),
      cancelFrame: (n) => cancelAnimationFrame(n),
      render: renderFrame,
      isActive: isAnimating,
      isHidden: () => document.hidden,
    })),
    bindDialogs(),
    (catalog = createCatalog({
      data: sceneData,
      scene: scene,
      environment: iblTexture,
      factory: meshFactory,
      renderer: renderer,
      toast: toast,
      invalidate: invalidate,
      onChange: onLayoutChange,
      onMode: setVersion,
      onPickFloor: setFloorPicking,
      onFocus: focusPlacement,
      onPreviewStart: beginPreview,
      onPreviewEnd: endPreview,
      onPreviewFrame: () => {
        (perf.previewFrames++, (perf.previewCalls = renderer.info.render.calls));
      },
      exportHTML: exportOfflineCopy,
    })),
    catalog.hasEmbedded && setVersion("custom"),
    bindToolbar(),
    bindInput(),
    setQuality(state.quality),
    renderer.domElement.addEventListener("webglcontextlost", (n) => {
      (n.preventDefault(),
        showFatalError(
          "显卡或浏览器暂停了三维显示。请重新打开软件，或使用流畅画质。",
        ));
    }),
    await Promise.all(textureJobs),
    (ready = true),
    (dom("loader").hidden = true),
    (dom("ready-status").dataset.ready = "true"),
    (perf.readyMs = performance.now()),
    onResize(),
    renderLoop.invalidate(),
    v06Start(),
    (window.STUDIO_PERF = {
      snapshot: () => ({
        appVersion: "7.0.0",
        version: sceneData.version,
        adaptiveDpr: v062PixelRatio(),
        adaptiveAdjustments: v062Adaptive.adjustments,
        reflectionEnvironment: !!iblTexture,
        postProcessing: postPipeline.tier,
        quality: state.quality,
        rendererContexts: 1,
        mainFrames: perf.mainFrames,
        previewFrames: perf.previewFrames,
        mainDrawCalls: perf.mainCalls,
        previewDrawCalls: perf.previewCalls,
        mainTriangles: perf.mainTriangles,
        shadowUpdates: perf.shadowUpdates,
        mapDraws: perf.mapDraws,
        pendingFrame: renderLoop.pending,
        modalCount: modalCount,
        destination: destination,
        geometryBuffers: renderer.info.memory.geometries,
        readyMs: perf.readyMs,
        load: perf.load,
        renderCPUMs: [...perf.renderCPU],
      }),
    }));
}
function v06Scale(factor) {
  factor = Math.max(0.6, Math.min(1, Number(factor) || 0.72));
  window.STUDIO_VISUAL_SCALE = factor;
  for (const mesh of roomMeshes) {
    const specs = mesh.userData.definition.v06Groups;
    if (!specs?.length) continue;
    const p = mesh.geometry.attributes.position;
    if (!mesh.userData.v06Base) {
      mesh.userData.v06Base = p.array.slice();
      mesh.userData.v06Parts = specs.map((s) => {
        const str = atob(s.vertices),
          bytes = new Uint8Array(str.length);
        for (let j = 0; j < str.length; j++) bytes[j] = str.charCodeAt(j);
        return {
          ids: new Uint32Array(bytes.buffer),
          pivot: s.pivot,
        };
      });
    }
    for (const s of mesh.userData.v06Parts)
      for (const id of s.ids)
        for (let k = 0; k < 3; k++)
          p.array[id * 3 + k] = s.pivot[k] + (mesh.userData.v06Base[id * 3 + k] - s.pivot[k]) * factor;
    p.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }
  const poses = new Map([...sceneData.catalog.defaultPlacements, ...catalog.placements].map((p) => [p.uid, p]));
  scene.traverse((g) => {
    const p = poses.get(g.userData.uid);
    if (p) {
      g.scale.setScalar(p.scale * factor);
      g.updateMatrix();
      g.updateMatrixWorld(true);
    }
  });
  window.v06CollisionBase ??= OBJECT_BLOCKERS.map((p) => [...p]);
  for (let n = 0; n < 4; n++) {
    const b = window.v06CollisionBase[n],
      cx = (b[0] + b[2]) / 2,
      cy = (b[1] + b[3]) / 2;
    OBJECT_BLOCKERS[n] = [
      cx + (b[0] - cx) * factor,
      cy + (b[1] - cy) * factor,
      cx + (b[2] - cx) * factor,
      cy + (b[3] - cy) * factor,
    ];
  }
  catalog.showVersion(state.version);
  v062DrawContacts();
  requestShadowUpdate();
  headingDirty = true;
  mapDirty = true;
  invalidate();
}
function v06Start() {
  v06Scale(window.STUDIO_VISUAL_SCALE || 0.72);
  window.STUDIO_V06 = {
    data: sceneData,
    scene: scene,
    camera: camera,
    catalog: catalog,
    renderer: renderer,
    setScale: v06Scale,
    validate: (p) => validatePlacement(p, sceneData.catalog.items),
    select(id) {
      dom("catalog-button").click();
      document.querySelector('[data-asset="' + id + '"]')?.click();
    },
    setFov(v) {
      state.fov = Math.max(60, Math.min(88, Number(v) || 78));
      if (state.mode === "walk") applyWalkCamera(true);
    },
  };
  const scale = dom("v06-scale");
  scale.value = Math.round((window.STUDIO_VISUAL_SCALE || 0.72) * 100);
  dom("v06-scale-value").textContent = scale.value + "%";
  scale.oninput = () => {
    document.getElementById("v06-settings").textContent = "window.STUDIO_VISUAL_SCALE=" + +scale.value / 100 + ";";
    dom("v06-scale-value").textContent = scale.value + "%";
    v06Scale(+scale.value / 100);
    try {
      localStorage.setItem("studio-v06-exhibit-scale", scale.value);
    } catch {}
  };
  dom("v06-fov").onchange = () => window.STUDIO_V06.setFov(dom("v06-fov").value);
}

// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
// Cached lighting textures and one transparent floor pass; no full-screen postprocessing.
function v062CreateAdaptive(max = 1.35, min = 0.85) {
  let ratio = 1.25,
    samples = [],
    stable = 0,
    adjustments = 0;
  return {
    reset() {
      ratio = 1.25;
      samples = [];
      stable = 0;
    },
    observe(ms) {
      if (!Number.isFinite(ms) || ms < 4 || ms > 250) return false;
      samples.push(ms);
      if (samples.length < 36) return false;
      const sorted = samples.slice().sort((a, b) => a - b),
        p75 = sorted[Math.floor(sorted.length * 0.75)];
      samples = [];
      const old = ratio;
      if (p75 > 26) {
        ratio = Math.max(min, Math.round((ratio - 0.12) * 100) / 100);
        stable = 0;
      } else if (p75 < 18.5) {
        stable += 36;
        if (stable >= 216) {
          ratio = Math.min(max, Math.round((ratio + 0.05) * 100) / 100);
          stable = 0;
        }
      } else stable = 0;
      if (old !== ratio) {
        adjustments++;
        return true;
      }
      return false;
    },
    get ratio() {
      return ratio;
    },
    get adjustments() {
      return adjustments;
    },
  };
}
var v062Contact = null,
  v062ContactCanvas = null,
  v062Adaptive = v062CreateAdaptive(),
  v062LastMoving = null;
function v062PixelRatio() {
  return Math.min(
    devicePixelRatio || 1,
    QUALITY[state.quality].ratio,
    state.quality === "balanced" ? v062Adaptive.ratio : Infinity,
  );
}
function v062DrawContacts() {
  if (!v062ContactCanvas) return;
  const c = v062ContactCanvas.getContext("2d"),
    size = 512;
  c.clearRect(0, 0, size, size);
  c.save();
  c.beginPath();
  sceneData.plan.outline.forEach(([x, y], i) =>
    i ? c.lineTo((x / 11.3) * size, (1 - y / 8.4) * size) : c.moveTo((x / 11.3) * size, (1 - y / 8.4) * size),
  );
  c.closePath();
  c.clip();
  function pad(x, y, rx, ry, strength = 0.24) {
    c.save();
    c.translate((x / 11.3) * size, (1 - y / 8.4) * size);
    c.scale((rx / 11.3) * size, (ry / 8.4) * size);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, "rgba(25,43,39," + strength + ")");
    g.addColorStop(0.4, "rgba(25,43,39," + strength * 0.65 + ")");
    g.addColorStop(1, "rgba(25,43,39,0)");
    c.fillStyle = g;
    c.fillRect(-1, -1, 2, 2);
    c.restore();
  }
  for (const rect of [...sceneData.plan.chairs, ...sceneData.plan.server.chairs])
    pad((rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2, 0.31, 0.31, 0.25);
  const table = sceneData.plan.table;
  pad((table[0] + table[2]) / 2, (table[1] + table[3]) / 2, 1, 1.42, 0.2);
  const t = sceneData.plan.server.table;
  pad((t[0] + t[2]) / 2, (t[1] + t[3]) / 2, 0.8, 1.33, 0.22);
  for (const p of sceneData.plan.pedestals)
    pad(
      (p.bounds[0] + p.bounds[2]) / 2,
      (p.bounds[1] + p.bounds[3]) / 2,
      (p.bounds[2] - p.bounds[0]) / 2 + 0.12,
      (p.bounds[3] - p.bounds[1]) / 2 + 0.12,
      0.21,
    );
  const k = sceneData.plan.kiosk;
  pad((k[0] + k[2]) / 2, (k[1] + k[3]) / 2, 0.73, 0.37, 0.22);
  for (const b of sceneData.plan.server.racks)
    pad((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[2] - b[0]) / 2 + 0.12, (b[3] - b[1]) / 2 + 0.12, 0.24);
  if (state.withObjects) {
    const f = window.STUDIO_VISUAL_SCALE || 0.72;
    pad(6.96, 1.45, 0.34 * f, 0.27 * f, 0.25);
    pad(0.8, 2.4, 0.56 * f, 0.52 * f, 0.22);
    pad(0.68, 4.84, 0.43 * f, 0.42 * f, 0.22);
  }
  c.restore();
  if (v062Contact) v062Contact.material.map.needsUpdate = true;
}
function v062InitVisual() {
  v062ContactCanvas = document.createElement("canvas");
  v062ContactCanvas.width = v062ContactCanvas.height = 512;
  const texture = new Texture(v062ContactCanvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.name = "Baked contact shading";
  v062Contact = new Mesh(
    new PlaneGeometry(11.3, 8.4),
    new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      side: FrontSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  v062Contact.name = "Soft floor contacts";
  v062Contact.rotation.x = -Math.PI / 2;
  v062Contact.position.set(5.65, 0.012, -4.2);
  v062Contact.matrixAutoUpdate = false;
  v062Contact.updateMatrix();
  v062Contact.renderOrder = 1;
  scene.add(v062Contact);
  v062DrawContacts();
  // Fit the existing 1024px shadow map to the room rather than a much larger square.
  const c = keyLight.shadow.camera;
  c.position.copy(keyLight.position);
  c.lookAt(keyLight.target.position);
  c.updateMatrixWorld(true);
  const m = c.matrixWorldInverse.elements,
    xs = [],
    ys = [];
  for (const [x, y] of sceneData.plan.outline)
    for (const h of [0, sceneData.plan.wall_height]) {
      const z = -y;
      xs.push(m[0] * x + m[4] * h + m[8] * z + m[12]);
      ys.push(m[1] * x + m[5] * h + m[9] * z + m[13]);
    }
  c.left = Math.min(...xs) - 0.6;
  c.right = Math.max(...xs) + 0.6;
  c.bottom = Math.min(...ys) - 0.6;
  c.top = Math.max(...ys) + 0.6;
  c.updateProjectionMatrix();
}
function v062QualityReset() {
  v062Adaptive.reset();
  v062LastMoving = null;
}
function v062OnFrame(now) {
  if (state.quality !== "balanced" || !isAnimating() || modalCount || destination !== "room") {
    v062LastMoving = null;
    return;
  }
  if (v062LastMoving !== null && v062Adaptive.observe(now - v062LastMoving)) {
    renderer.setPixelRatio(v062PixelRatio());
    postPipeline.setSize(innerWidth, innerHeight);
    dom("ready-status").textContent = "均衡 · 自适应清晰度";
    invalidate();
  }
  v062LastMoving = now;
}
async function boot() {
  await nextPaint();
  let i = await loadSceneData((t) => (dom("load-detail").textContent = t));
  ((sceneData = i.data),
    (assetById = new Map(sceneData.catalog.items.map((t) => [t.id, t]))),
    (perf.load = {
      ...i.timing,
      worker: i.usedWorker,
    }),
    await initScene());
}
boot().catch((i) => {
  (console.error(i),
    showFatalError(
      "场景载入失败。请完整解压，用 Chrome 或 Edge 打开 index.html。",
    ));
});
