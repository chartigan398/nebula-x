/**
 * Phase B — GPU texture ping-pong sim (WebGL float RT "compute").
 * True WebGPU WGSL compute is the next migration; this is zero CPU particle iteration.
 */
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

const VELOCITY_FRAG = `
uniform float uTime;
uniform float uDelta;
uniform float uCurlF;
uniform float uCurlG;
uniform float uFlowScale;
uniform vec2 uMouse;
uniform float uMagnetStrength;

vec3 curlLike(vec3 p, float t) {
  float f = uCurlF;
  float g = uCurlG;
  float cx = (g * sin(p.y * g - t * 0.47)) - (f * cos(p.z * f + t * 0.31));
  float cy = (g * sin(p.z * g + t * 0.28)) - (f * cos(p.x * f - t * 0.36));
  float cz = (g * sin(p.x * g - t * 0.41)) - (f * cos(p.y * f + t * 0.25));
  return vec3(cx, cy, cz);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec3 c = curlLike(pos * 0.0045, uTime);
  vec3 target = c * uFlowScale;
  vec2 toM = (uMouse * 7.5) - pos.xy;
  float md = length(toM) + 0.25;
  target.xy += (toM / md) * uMagnetStrength / (1.0 + md * 0.65);
  vel = mix(vel, target, 0.048);
  vel *= 0.991;
  gl_FragColor = vec4(vel, 0.0);
}
`;

const POSITION_FRAG = `
uniform float uDelta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  pos += vel * uDelta;
  float m = length(pos);
  if (m > 9.2) pos *= 8.6 / m;
  gl_FragColor = vec4(pos, 1.0);
}
`;

function fillSphereTexture(tex, sizeX, sizeY) {
  const data = tex.image.data;
  let i = 0;
  for (let y = 0; y < sizeY; y++) {
    for (let x = 0; x < sizeX; x++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * 3.14159265 * u;
      const phi = Math.acos(2 * v - 1);
      const rr = 5.2 * Math.pow(Math.random(), 0.58);
      data[i] = rr * Math.sin(phi) * Math.cos(theta);
      data[i + 1] = rr * Math.sin(phi) * Math.sin(theta);
      data[i + 2] = rr * Math.cos(phi);
      data[i + 3] = 1;
      i += 4;
    }
  }
  tex.needsUpdate = true;
}

function fillZeroTexture(tex, sizeX, sizeY) {
  const data = tex.image.data;
  for (let i = 0; i < data.length; i++) data[i] = 0;
  tex.needsUpdate = true;
}

/**
 * @returns {null | { gpuCompute, posVar, velVar, geometry, count, dispose, velUniforms, posUniforms }}
 */
export function createGpuCurlSim(renderer, sizeX, sizeY) {
  if (!renderer.capabilities.isWebGL2) return null;

  const gpuCompute = new GPUComputationRenderer(sizeX, sizeY, renderer);
  if (renderer.capabilities.maxVertexTextures === 0) return null;

  const posTexture = gpuCompute.createTexture();
  const velTexture = gpuCompute.createTexture();
  fillSphereTexture(posTexture, sizeX, sizeY);
  fillZeroTexture(velTexture, sizeX, sizeY);

  const velVar = gpuCompute.addVariable('textureVelocity', VELOCITY_FRAG, velTexture);
  const posVar = gpuCompute.addVariable('texturePosition', POSITION_FRAG, posTexture);

  gpuCompute.setVariableDependencies(velVar, [velVar, posVar]);
  gpuCompute.setVariableDependencies(posVar, [velVar, posVar]);

  velVar.material.uniforms.uTime = { value: 0 };
  velVar.material.uniforms.uDelta = { value: 1 / 60 };
  velVar.material.uniforms.uCurlF = { value: 1.12 };
  velVar.material.uniforms.uCurlG = { value: 1.73 };
  velVar.material.uniforms.uFlowScale = { value: 2.1 };
  velVar.material.uniforms.uMouse = { value: new THREE.Vector2(0, 0) };
  velVar.material.uniforms.uMagnetStrength = { value: 2.0 };

  posVar.material.uniforms.uDelta = { value: 1 / 60 };

  const err = gpuCompute.init();
  if (err != null) {
    console.warn('[Titan] GPUComputationRenderer:', err);
    gpuCompute.dispose();
    return null;
  }

  const count = sizeX * sizeY;
  const uvs = new Float32Array(count * 2);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  let k = 0;
  for (let y = 0; y < sizeY; y++) {
    for (let x = 0; x < sizeX; x++) {
      uvs[k * 2] = (x + 0.5) / sizeX;
      uvs[k * 2 + 1] = (y + 0.5) / sizeY;
      seeds[k] = Math.random();
      sizes[k] = 0.65 + Math.random() * 1.85;
      positions[k * 3] = 0;
      positions[k * 3 + 1] = 0;
      positions[k * 3 + 2] = 0;
      k++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRefUv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  return {
    gpuCompute,
    posVar,
    velVar,
    geometry,
    count,
    velUniforms: velVar.material.uniforms,
    posUniforms: posVar.material.uniforms,
    dispose: () => gpuCompute.dispose()
  };
}

export const GPU_DISPLAY_VERT = `
attribute vec2 aRefUv;
attribute float aSeed;
attribute float aSize;

uniform sampler2D uPosTex;
uniform float uTime;
uniform float uPulse;
uniform float uPointScale;
uniform float uSizeAudio;
uniform float uDirectorBlend;

varying float vEnergy;
varying float vHue;

vec3 curlLike(vec3 p, float t, float f, float g) {
  float cx = (g * sin(p.y * g - t * 0.47)) - (f * cos(p.z * f + t * 0.31));
  float cy = (g * sin(p.z * g + t * 0.28)) - (f * cos(p.x * f - t * 0.36));
  float cz = (g * sin(p.x * g - t * 0.41)) - (f * cos(p.y * f + t * 0.25));
  return vec3(cx, cy, cz);
}

void main() {
  vec3 p = texture2D(uPosTex, aRefUv).xyz;
  float t = uTime * (0.55 + aSeed * 0.9);
  float f = mix(1.12, 0.86, uDirectorBlend);
  float g = mix(1.73, 2.08, uDirectorBlend);
  vec3 c = curlLike(p * (0.0045 + aSeed * 0.002), t, f, g);
  float e = clamp(length(c) * 0.18, 0.0, 1.0);
  vEnergy = e;
  vHue = fract(0.58 + aSeed * 0.31 + c.x * 0.03 + uTime * 0.006);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (aSize * (1.15 + uPulse * 1.55) + e * 2.8) * uSizeAudio * uPointScale / max(1.0, -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const GPU_DISPLAY_FRAG = `
precision highp float;
uniform float uHueBias;
varying float vEnergy;
varying float vHue;

vec3 hsl2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d) * 2.0;
  float core = exp(-r * r * 6.5);
  float halo = exp(-r * r * 1.2) * 0.32;
  float alpha = (core + halo) * (0.02 + vEnergy * 0.12);
  vec3 col = hsl2rgb(vec3(fract(vHue + uHueBias), 0.68, 0.30 + vEnergy * 0.10));
  col *= (0.20 + core * 0.14 + vEnergy * 0.10);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

export function createGpuDisplayMaterial(posTexture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPosTex: { value: posTexture },
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uPointScale: { value: 18 },
      uSizeAudio: { value: 1 },
      uHueBias: { value: 0 },
      uDirectorBlend: { value: 0 }
    },
    vertexShader: GPU_DISPLAY_VERT,
    fragmentShader: GPU_DISPLAY_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
