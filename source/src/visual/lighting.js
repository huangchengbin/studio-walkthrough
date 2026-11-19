// Scene lighting for the walkthrough. The IBL environment supplies ambient
// fill and reflections; these lights add the key shadow direction and a few
// warm pools near the ceiling light strips.
import { DirectionalLight, HemisphereLight, PointLight } from "three";

export const LIGHTING = {
  hemi: { sky: 0xfff6e8, ground: 0x8f9494, intensity: 0.32 },
  key: {
    color: 0xfff0d6,
    intensity: 2.1,
    position: [2.5, 8.2, 1.6],
    target: [4.2, 0, -4.2],
  },
  fill: { color: 0xdfe9ff, intensity: 0.5, position: [-6, 4.5, -5] },
  points: [
    { color: 0xffe7bd, intensity: 5, distance: 9, decay: 2, position: [3.4, 2.95, -2.6] },
    { color: 0xffe7bd, intensity: 4, distance: 8, decay: 2, position: [1.4, 2.95, -6.2] },
    { color: 0xffe7bd, intensity: 5, distance: 9, decay: 2, position: [9.4, 2.9, -2.4] },
  ],
};

export function createLights(scene, { shadows = true, shadowMapSize = 2048 } = {}) {
  const { hemi, key, fill, points } = LIGHTING;

  const hemiLight = new HemisphereLight(hemi.sky, hemi.ground, hemi.intensity);
  scene.add(hemiLight);

  const keyLight = new DirectionalLight(key.color, key.intensity);
  keyLight.position.set(...key.position);
  keyLight.target.position.set(...key.target);
  keyLight.castShadow = shadows;
  const mapSize = shadowMapSize || 1024;
  keyLight.shadow.mapSize.set(mapSize, mapSize);
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 26;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight, keyLight.target);

  const fillLight = new DirectionalLight(fill.color, fill.intensity);
  fillLight.position.set(...fill.position);
  scene.add(fillLight);

  const pointLights = points.map((p) => {
    const l = new PointLight(p.color, p.intensity, p.distance, p.decay);
    l.position.set(...p.position);
    scene.add(l);
    return l;
  });

  return { hemiLight, keyLight, fillLight, pointLights };
}
