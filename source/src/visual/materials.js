// PBR material factory for the studio walkthrough.
// Environment meshes are merged per source part, so a single def carries many
// surfaces (floor, walls, wood, screens, plants…). We split each environment
// geometry into surface classes by triangle colour and give every class its own
// MeshStandardMaterial parameters; catalog parts keep one material per def.
import {
  Color,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
} from "three";

export const SURFACE = {
  FLOOR: 0,
  WALL: 1,
  WOOD: 2,
  DARK: 3,
  METAL: 4,
  PLANT: 5,
  ACCENT: 6,
  DEFAULT: 7,
};

const CLASS_NAMES = ["floor", "wall", "wood", "dark", "metal", "plant", "accent", "default"];

// Vertex colours are stored as normalized u8 in linear space; prototypes use
// the same 0..1 convention so nearest-neighbour classification is stable.
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
const PROTOTYPES = [
  ...["#666e70", "#8f9999", "#d6dad0", "#2c3735"].map((c) => [hex(c), SURFACE.FLOOR]),
  ...["#f2f4f0", "#e0e6e3", "#e2e2d8", "#cccec4", "#a1b0b0", "#c0cac4"].map((c) => [hex(c), SURFACE.WALL]),
  ...["#633314", "#946e4a", "#5f3317", "#7d481b"].map((c) => [hex(c), SURFACE.WOOD]),
  ...[
    "#020406", "#010305", "#050b0e", "#090d10", "#0e1012", "#060606", "#040609", "#030608",
    "#010203", "#080b0d", "#0d1012", "#050708", "#090c0e",
  ].map((c) => [hex(c), SURFACE.DARK]),
  ...["#476163", "#657779", "#566350"].map((c) => [hex(c), SURFACE.METAL]),
  ...["#2b5717", "#456e1a", "#1e4807", "#1f4706", "#2e8d41", "#205d12"].map((c) => [hex(c), SURFACE.PLANT]),
  ...[
    "#f29106", "#f24009", "#63060a", "#b88729", "#e8d9a6", "#06454a", "#2b776c", "#0a3382",
    "#7d0809", "#b35511", "#8a9079",
  ].map((c) => [hex(c), SURFACE.ACCENT]),
];

function classify(r, g, b) {
  let best = SURFACE.DEFAULT;
  let bestD = Infinity;
  for (const [p, cls] of PROTOTYPES) {
    const dr = r - p[0],
      dg = g - p[1],
      db = b - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = cls;
    }
  }
  return best;
}

const FLOOR_Y = 0.03;
const UP_NORMAL = 0.85 * 32767;

// Reorder the index buffer by surface class and register one geometry group per
// class so the mesh can use a material array. Only opaque, untextured,
// non-metallic environment geometry is split.
export function splitEnvironmentGeometry(geometry) {
  const pos = geometry.attributes.position.array;
  const nor = geometry.attributes.normal.array;
  const col = geometry.attributes.color.array;
  const index = geometry.index.array;
  const triCount = Math.floor(index.length / 3);
  const classes = new Uint8Array(triCount);
  const present = new Set();
  for (let t = 0; t < triCount; t++) {
    const a = index[t * 3] * 3,
      b = index[t * 3 + 1] * 3,
      c = index[t * 3 + 2] * 3;
    let cls;
    if (
      Math.abs(pos[a + 1]) <= FLOOR_Y &&
      Math.abs(pos[b + 1]) <= FLOOR_Y &&
      Math.abs(pos[c + 1]) <= FLOOR_Y &&
      nor[a + 1] > UP_NORMAL &&
      nor[b + 1] > UP_NORMAL &&
      nor[c + 1] > UP_NORMAL
    ) {
      cls = SURFACE.FLOOR;
    } else {
      cls = classify(
        (col[a] + col[b] + col[c]) / 765,
        (col[a + 1] + col[b + 1] + col[c + 1]) / 765,
        (col[a + 2] + col[b + 2] + col[c + 2]) / 765,
      );
    }
    classes[t] = cls;
    present.add(cls);
  }
  if (present.size < 2) return false;
  const order = [...present].sort((x, y) => x - y);
  const rank = new Map(order.map((c, i) => [c, i]));
  const buckets = order.map(() => []);
  for (let t = 0; t < triCount; t++) buckets[rank.get(classes[t])].push(t);
  const next = index instanceof Uint32Array ? new Uint32Array(index.length) : new Uint16Array(index.length);
  geometry.clearGroups();
  let offset = 0;
  for (let i = 0; i < order.length; i++) {
    const bucket = buckets[i];
    if (!bucket.length) continue;
    for (const t of bucket) {
      next[offset] = index[t * 3];
      next[offset + 1] = index[t * 3 + 1];
      next[offset + 2] = index[t * 3 + 2];
      offset += 3;
    }
    geometry.addGroup(offset - bucket.length * 3, bucket.length * 3, i);
  }
  geometry.setIndex(new BufferAttribute(next, 1));
  geometry.userData.surfaceClasses = order;
  return true;
}

// Per-class PBR response. envMapIntensity scales the scene environment.
const CLASS_PBR = {
  [SURFACE.FLOOR]: { roughness: 0.3, metalness: 0, envMapIntensity: 1 },
  [SURFACE.WALL]: { roughness: 0.88, metalness: 0, envMapIntensity: 0.38 },
  [SURFACE.WOOD]: { roughness: 0.46, metalness: 0.04, envMapIntensity: 0.55 },
  [SURFACE.DARK]: { roughness: 0.34, metalness: 0.12, envMapIntensity: 0.75 },
  [SURFACE.METAL]: { roughness: 0.36, metalness: 0.55, envMapIntensity: 0.85 },
  [SURFACE.PLANT]: { roughness: 0.95, metalness: 0, envMapIntensity: 0.2 },
  [SURFACE.ACCENT]: { roughness: 0.52, metalness: 0.05, envMapIntensity: 0.5 },
};

function typedArray(data, Type) {
  return new Type(typeof data === "string" ? base64ToBytes(data).buffer : data);
}

function base64ToBytes(text) {
  const bin = atob(text);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function createMeshFactory(textures) {
  const geometries = new Map();
  const materials = new Map();
  const instances = new Set();
  let quality = "balanced";

  function isEnvironment(def) {
    return typeof def.id === "string" && def.id.startsWith("environment-");
  }

  function splittable(def) {
    return (
      isEnvironment(def) &&
      !def.texture &&
      !def.glow &&
      def.opacity === 1 &&
      (def.metalness || 0) === 0
    );
  }

  function sharedMaterial(key, factory) {
    let m = materials.get(key);
    if (!m) {
      m = factory();
      materials.set(key, m);
    }
    return m;
  }

  function standardFor(def, surface) {
    const pbr = surface === undefined || surface === SURFACE.DEFAULT ? null : CLASS_PBR[surface];
    const roughness = pbr ? pbr.roughness : Math.max(0.3, def.roughness ?? 0.8);
    const metalness = pbr ? pbr.metalness : def.metalness ?? 0;
    const envMapIntensity = pbr ? pbr.envMapIntensity : 0.6;
    const key = JSON.stringify(["std", quality, def.side, roughness, metalness, envMapIntensity]);
    return sharedMaterial(key, () => {
      const m = new MeshStandardMaterial({
        vertexColors: true,
        side: def.side === "front" ? FrontSide : DoubleSide,
        roughness,
        metalness,
        envMapIntensity,
      });
      return m;
    });
  }

  function lambertFor(def) {
    const key = JSON.stringify(["lam", def.side]);
    return sharedMaterial(key, () =>
      new MeshLambertMaterial({
        vertexColors: true,
        side: def.side === "front" ? FrontSide : DoubleSide,
      }),
    );
  }

  function basicFor(def) {
    if (def.texture) {
      const key = JSON.stringify(["tex", def.texture]);
      return sharedMaterial(key, () => {
        const m = new MeshBasicMaterial({
          map: textures[def.texture] || null,
          side: DoubleSide,
          toneMapped: false,
        });
        return m;
      });
    }
    const key = JSON.stringify(["glow", def.side]);
    return sharedMaterial(key, () =>
      new MeshBasicMaterial({
        vertexColors: true,
        color: new Color(2.6, 2.5, 2.35),
        side: def.side === "front" ? FrontSide : DoubleSide,
        toneMapped: false,
      }),
    );
  }

  function materialFor(def, geometry) {
    if (def.texture || def.glow) return basicFor(def);
    if (quality === "fast") return lambertFor(def);
    const classes = geometry?.userData.surfaceClasses;
    if (classes?.length > 1) return classes.map((c) => standardFor(def, c));
    return standardFor(def);
  }

  function buildGeometry(def) {
    let g = geometries.get(def.id);
    if (g) return g;
    g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(typedArray(def.positions, Float32Array), 3));
    g.setAttribute("normal", new BufferAttribute(typedArray(def.normals, Int16Array), 3, true));
    g.setAttribute("color", new BufferAttribute(typedArray(def.colors, Uint8Array), 3, true));
    g.setIndex(new BufferAttribute(typedArray(def.indices, def.indexType === "u16" ? Uint16Array : Uint32Array), 1));
    if (def.uvs) g.setAttribute("uv", new BufferAttribute(typedArray(def.uvs, Float32Array), 2));
    if (splittable(def)) splitEnvironmentGeometry(g);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    geometries.set(def.id, g);
    return g;
  }

  function make(def) {
    const geometry = buildGeometry(def);
    const material = materialFor(def, geometry);
    const mesh = new Mesh(geometry, material);
    mesh.userData = {
      definition: def,
      kind: def.kind,
      facade: def.facade,
      surface: def.surface,
      id: def.id,
    };
    mesh.castShadow =
      ["fixed", "objects"].includes(def.kind) && !def.texture && !def.glow && def.opacity === 1;
    mesh.receiveShadow = !def.texture && !def.glow && def.kind !== "ceiling";
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    instances.add(mesh);
    return mesh;
  }

  return {
    make,
    release(mesh) {
      instances.delete(mesh);
    },
    changeQuality(next) {
      quality = next;
      for (const mesh of instances) {
        mesh.material = materialFor(mesh.userData.definition, mesh.geometry);
      }
    },
    get quality() {
      return quality;
    },
    geometries,
    instances,
    classNames: CLASS_NAMES,
  };
}
