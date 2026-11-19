// Post-processing pipeline: HDR render → GTAO → subtle bloom → linear grade →
// OutputPass (tone mapping + sRGB). The "fast" tier bypasses the composer and
// lets the renderer tone-map directly, keeping weak devices responsive.
import { HalfFloatType, Vector2, WebGLRenderTarget } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 1.07 },
    uContrast: { value: 1.045 },
    uVignette: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // Gentle saturation around the luma axis (linear space).
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);
      // Soft contrast pivoting on mid grey.
      c = (c - 0.18) * uContrast + 0.18;
      c = max(c, 0.0);
      // Vignette, strongest at the corners.
      float d = distance(vUv, vec2(0.5));
      c *= 1.0 - uVignette * smoothstep(0.32, 0.86, d);
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export function createPostPipeline(renderer, scene, camera) {
  let composer = null;
  let passes = null;
  let enabled = false;
  let tier = null;
  let width = 1;
  let height = 1;

  function build(t) {
    dispose();
    width = Math.max(1, Math.floor(innerWidth * renderer.getPixelRatio()));
    height = Math.max(1, Math.floor(innerHeight * renderer.getPixelRatio()));
    const target = new WebGLRenderTarget(width, height, {
      type: HalfFloatType,
      samples: 4,
    });
    composer = new EffectComposer(renderer, target);
    passes = {
      render: new RenderPass(scene, camera),
      gtao: new GTAOPass(scene, camera, width, height),
      bloom:
        t === "detail"
          ? new UnrealBloomPass(new Vector2(width, height), 0.1, 0.3, 3.2)
          : null,
      grade: new ShaderPass(GradeShader),
      output: new OutputPass(),
    };
    passes.gtao.blendIntensity = 0.85;
    if (t === "detail") {
      passes.gtao.updateGtaoMaterial({
        radius: 0.55,
        distanceExponent: 1.2,
        thickness: 1.0,
        scale: 1.0,
        distanceFallOff: 1.0,
        screenSpaceRadius: false,
      });
    } else {
      passes.gtao.updateGtaoMaterial({
        radius: 0.45,
        distanceExponent: 1.1,
        thickness: 0.9,
        scale: 0.9,
        distanceFallOff: 1.0,
        screenSpaceRadius: false,
      });
    }
    composer.addPass(passes.render);
    composer.addPass(passes.gtao);
    if (passes.bloom) composer.addPass(passes.bloom);
    composer.addPass(passes.grade);
    composer.addPass(passes.output);
    enabled = true;
    tier = t;
  }

  function dispose() {
    if (composer) {
      composer.dispose();
      composer = null;
    }
    passes = null;
    enabled = false;
    tier = null;
  }

  return {
    build,
    dispose,
    setSize(w, h) {
      if (!composer) return;
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      passes.gtao.setSize(
        Math.floor(w * renderer.getPixelRatio()),
        Math.floor(h * renderer.getPixelRatio()),
      );
    },
    setPixelRatio() {
      if (!composer) return;
      composer.setPixelRatio(renderer.getPixelRatio());
    },
    render() {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    },
    get passes() {
      return passes;
    },
    get tier() {
      return tier;
    },
    get active() {
      return enabled;
    },
    get isComposer() {
      return !!composer;
    },
  };
}
