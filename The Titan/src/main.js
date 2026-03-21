/**
 * The Titan — ordered stack:
 * 1) Polish (audio transport + mapping + URL)
 * 2) Phase B GPU texture sim (?sim=gpu) or high-count vertex (?sim=vertex default)
 * 3) Director (slow A↔B curl “acts”)
 * 4) Bloom (UnrealBloomPass, toggle ?bloom=0)
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { parseTitanParams, pickParticleCount, gpuSimTextureSize } from './params.js';
import { createGpuCurlSim, createGpuDisplayMaterial } from './gpuCurlSim.js';

const statusEl = document.getElementById('status');
const errEl = document.getElementById('err');

function showError(msg) {
  errEl.style.display = 'flex';
  errEl.textContent = msg;
  if (statusEl) statusEl.textContent = 'Stopped';
}

const VERT = `
attribute float aSeed;
attribute float aSize;

uniform float uTime;
uniform float uPulse;
uniform vec2 uMouse;
uniform float uFlowAmp;
uniform float uMagnet;
uniform float uPointScale;
uniform float uSizeAudio;
uniform float uDirectorBlend;

varying float vEnergy;
varying float vHue;

vec3 curlLike(vec3 p, float t) {
  float f = mix(1.12, 0.86, uDirectorBlend);
  float g = mix(1.73, 2.08, uDirectorBlend);
  float cx =
      (g * sin(p.y * g - t * 0.47))
    - (f * cos(p.z * f + t * 0.31));
  float cy =
      (g * sin(p.z * g + t * 0.28))
    - (f * cos(p.x * f - t * 0.36));
  float cz =
      (g * sin(p.x * g - t * 0.41))
    - (f * cos(p.y * f + t * 0.25));
  return vec3(cx, cy, cz);
}

void main() {
  vec3 p = position;
  float t = uTime * (0.55 + aSeed * 0.9);

  vec3 c = curlLike(p * (0.0045 + aSeed * 0.002), t);
  p += c * (uFlowAmp * (0.35 + aSeed * 0.9));

  p.x += sin(t * 0.71 + aSeed * 9.0) * 0.9;
  p.y += cos(t * 0.47 + aSeed * 13.0) * 0.7;
  p.z += sin(t * 0.31 + aSeed * 17.0) * 0.8;

  vec2 toM = (uMouse * 7.5) - p.xy;
  float md = length(toM) + 0.25;
  p.xy += (toM / md) * uMagnet * (0.45 + uPulse * 0.9) / (1.0 + md * 0.65);

  float e = clamp(length(c) * 0.22, 0.0, 1.0);
  vEnergy = e;
  vHue = fract(0.58 + aSeed * 0.31 + c.x * 0.03 + uTime * 0.006);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (aSize * (1.25 + uPulse * 1.85) + e * 3.1) * uSizeAudio * uPointScale / max(1.0, -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAG = `
precision highp float;

varying float vEnergy;
varying float vHue;

uniform float uHueBias;

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

function init() {
  const params = parseTitanParams();

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x010106, 1);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(0, 0, 14.5);

  /** --- Particles: GPU sim or vertex --- */
  let simMode = 'vertex';
  let gpu = null;
  let points;
  let uniforms;
  let geometry;

  if (params.sim === 'gpu') {
    const want = params.lite ? 96 * 96 : 256 * 256;
    const side = gpuSimTextureSize(want);
    gpu = createGpuCurlSim(renderer, side, side);
    if (gpu) {
      simMode = 'gpu';
      const posTex = gpu.gpuCompute.getCurrentRenderTarget(gpu.posVar).texture;
      const material = createGpuDisplayMaterial(posTex);
      uniforms = material.uniforms;
      points = new THREE.Points(gpu.geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      if (statusEl) statusEl.textContent = `The Titan · GPU sim ${side}×${side} = ${gpu.count.toLocaleString()} texels · ?sim=vertex for classic mode`;
    }
  }

  if (simMode === 'vertex') {
    const particleCount = pickParticleCount(params);
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const rr = 5.5 * Math.pow(Math.random(), 0.58);
      positions[i3] = rr * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = rr * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = rr * Math.cos(phi);
      seeds[i] = Math.random();
      sizes[i] = 0.7 + Math.random() * 1.9;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    uniforms = {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uFlowAmp: { value: 2.35 },
      uMagnet: { value: 2.25 },
      uPointScale: { value: 18.0 },
      uSizeAudio: { value: 1 },
      uHueBias: { value: 0 },
      uDirectorBlend: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    if (statusEl) {
      if (params.sim === 'gpu' && !gpu) {
        statusEl.textContent = `The Titan · vertex fallback (${particleCount.toLocaleString()} pts) — GPU sim unavailable`;
      } else if (!gpu) {
        statusEl.textContent = `The Titan · vertex ${particleCount.toLocaleString()} pts · ?sim=gpu for texture sim`;
      }
    }
  }

  const BASE_FLOW = 2.35;
  const BASE_MAGNET = 2.25;
  const BASE_PULSE_LFO = () =>
    0.52 +
    0.28 * Math.sin(uniforms.uTime.value * 0.67) +
    0.14 * Math.sin(uniforms.uTime.value * 1.91 + 1.2) +
    0.08 * Math.sin(uniforms.uTime.value * 3.7 + 0.4);

  let audioCtx = null;
  let analyser = null;
  let fftBytes = null;
  let timeDomainData = null;
  let audioEl = null;
  let mediaSource = null;
  let objectUrl = null;
  let audioPlaying = false;
  const smooth = { bass: 0, mid: 0, high: 0, rms: 0, onset: 0, centroid: 0.35 };
  const audioStatusEl = document.getElementById('audio-status');
  const fileInput = document.getElementById('titan-audio-file');
  const btnPlay = document.getElementById('btn-audio-play');
  const seekEl = document.getElementById('audio-seek');
  const volEl = document.getElementById('audio-vol');
  const mapBass = document.getElementById('map-bass');
  const mapMid = document.getElementById('map-mid');
  const mapHigh = document.getElementById('map-high');
  const mapSmooth = document.getElementById('map-smooth');

  function readMappingFromUI() {
    if (mapBass) params.bassGain = parseFloat(mapBass.value) || 1;
    if (mapMid) params.midGain = parseFloat(mapMid.value) || 1;
    if (mapHigh) params.highGain = parseFloat(mapHigh.value) || 1;
    if (mapSmooth) params.envelopeSmooth = parseFloat(mapSmooth.value) || 8;
  }

  [mapBass, mapMid, mapHigh, mapSmooth].forEach((el) => {
    if (el) el.addEventListener('input', readMappingFromUI);
  });
  if (mapBass) mapBass.value = String(params.bassGain);
  if (mapMid) mapMid.value = String(params.midGain);
  if (mapHigh) mapHigh.value = String(params.highGain);
  if (mapSmooth) mapSmooth.value = String(params.envelopeSmooth);

  function disposeAudioFile() {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (_) {}
      objectUrl = null;
    }
    if (mediaSource) {
      try {
        mediaSource.disconnect();
      } catch (_) {}
      mediaSource = null;
    }
    if (audioEl) {
      try {
        audioEl.pause();
      } catch (_) {}
      audioEl = null;
    }
    audioPlaying = false;
    if (seekEl) seekEl.disabled = true;
    if (btnPlay) btnPlay.textContent = 'Play';
  }

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = params.analyserSmooth;
    fftBytes = new Uint8Array(analyser.frequencyBinCount);
    timeDomainData = new Uint8Array(analyser.fftSize);
    return audioCtx;
  }

  function updateSeekUI() {
    if (!audioEl || !seekEl) return;
    const d = audioEl.duration;
    if (Number.isFinite(d) && d > 0) {
      seekEl.max = String(d);
      seekEl.value = String(audioEl.currentTime);
    }
  }

  if (btnPlay) {
    btnPlay.addEventListener('click', async () => {
      if (!audioEl) return;
      const ctx = ensureAudioContext();
      if (ctx && ctx.state === 'suspended') await ctx.resume();
      if (audioEl.paused) {
        await audioEl.play();
        btnPlay.textContent = 'Pause';
      } else {
        audioEl.pause();
        btnPlay.textContent = 'Play';
      }
    });
  }

  if (seekEl) {
    seekEl.addEventListener('input', () => {
      if (audioEl && Number.isFinite(audioEl.duration)) {
        audioEl.currentTime = parseFloat(seekEl.value) || 0;
      }
    });
  }

  if (volEl) {
    volEl.addEventListener('input', () => {
      if (audioEl) audioEl.volume = parseFloat(volEl.value) || 0;
    });
    if (volEl) volEl.value = '0.85';
  }

  function updateAudioUniforms(dt) {
    readMappingFromUI();
    if (analyser) analyser.smoothingTimeConstant = params.analyserSmooth;

    const lfoPulse = BASE_PULSE_LFO();
    if (!audioPlaying || !analyser || !fftBytes) {
      uniforms.uPulse.value = lfoPulse;
      if (uniforms.uFlowAmp) uniforms.uFlowAmp.value += (BASE_FLOW - uniforms.uFlowAmp.value) * 0.05;
      if (uniforms.uMagnet) uniforms.uMagnet.value += (BASE_MAGNET - uniforms.uMagnet.value) * 0.05;
      uniforms.uSizeAudio.value += (1 - uniforms.uSizeAudio.value) * 0.08;
      uniforms.uHueBias.value += (0 - uniforms.uHueBias.value) * 0.04;
      if (gpu) {
        gpu.velUniforms.uFlowScale.value += (2.1 - gpu.velUniforms.uFlowScale.value) * 0.05;
        gpu.velUniforms.uMagnetStrength.value += (2.0 - gpu.velUniforms.uMagnetStrength.value) * 0.05;
      }
      return;
    }

    analyser.getByteFrequencyData(fftBytes);
    const sr = audioCtx.sampleRate;
    const nyq = sr / 2;
    const n = fftBytes.length;
    const binHz = nyq / n;

    let bassSum = 0,
      bassN = 0,
      midSum = 0,
      midN = 0,
      highSum = 0,
      highN = 0;
    let wMag = 0,
      wFreq = 0;
    for (let i = 0; i < n; i++) {
      const hz = i * binHz;
      const v = fftBytes[i] / 255;
      wFreq += hz * v;
      wMag += v;
      if (hz < 250) {
        bassSum += v;
        bassN++;
      } else if (hz < 4000) {
        midSum += v;
        midN++;
      } else if (hz < 20000) {
        highSum += v;
        highN++;
      }
    }
    const bass = bassN ? bassSum / bassN : 0;
    const mid = midN ? midSum / midN : 0;
    const high = highN ? highSum / highN : 0;
    const centroid = wMag > 1e-6 ? wFreq / wMag : 2000;
    const centroidNorm = Math.min(1, Math.max(0, (centroid - 400) / 8000));

    const a = 1 - Math.exp(-dt * params.envelopeSmooth);
    smooth.bass += (bass - smooth.bass) * a;
    smooth.mid += (mid - smooth.mid) * a;
    smooth.high += (high - smooth.high) * a;
    smooth.centroid += (centroidNorm - smooth.centroid) * a * 0.5;

    let sumSq = 0;
    if (timeDomainData && timeDomainData.length === analyser.fftSize) {
      analyser.getByteTimeDomainData(timeDomainData);
      for (let i = 0; i < timeDomainData.length; i++) {
        const x = (timeDomainData[i] - 128) / 128;
        sumSq += x * x;
      }
    }
    const rms = timeDomainData && timeDomainData.length ? Math.sqrt(sumSq / timeDomainData.length) : 0;
    const flux = Math.max(0, rms - smooth.rms);
    smooth.rms += (rms - smooth.rms) * 0.12;
    smooth.onset += (flux * 3.5 - smooth.onset) * 0.22;

    const midDrive = Math.min(1, smooth.mid * 1.15 * params.midGain);
    const bassDrive = Math.min(1, smooth.bass * 1.2 * params.bassGain);
    const highDrive = Math.min(1, smooth.high * 1.1 * params.highGain);

    if (uniforms.uFlowAmp) uniforms.uFlowAmp.value = BASE_FLOW * (0.85 + midDrive * 0.55);
    if (uniforms.uMagnet) uniforms.uMagnet.value = BASE_MAGNET * (0.75 + bassDrive * 0.85);
    const audioPulse = Math.min(1.2, 0.35 + smooth.onset * 0.95 + bassDrive * 0.45);
    uniforms.uPulse.value = lfoPulse * 0.35 + audioPulse * 0.65;
    uniforms.uSizeAudio.value = 1 + highDrive * 0.22 + smooth.onset * 0.08;
    uniforms.uHueBias.value = (smooth.centroid - 0.5) * 0.12;

    if (gpu) {
      gpu.velUniforms.uFlowScale.value = 1.4 + midDrive * 1.2;
      gpu.velUniforms.uMagnetStrength.value = 1.2 + bassDrive * 1.4;
    }

    if (audioStatusEl) {
      audioStatusEl.textContent = `rms ${rms.toFixed(3)} · mid ${midDrive.toFixed(2)} · on ${smooth.onset.toFixed(2)}`;
    }
    updateSeekUI();
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      disposeAudioFile();
      const ctx = ensureAudioContext();
      if (!ctx) {
        if (audioStatusEl) audioStatusEl.textContent = 'Web Audio API not available';
        return;
      }
      if (ctx.state === 'suspended') await ctx.resume();

      objectUrl = URL.createObjectURL(file);
      audioEl = new Audio(objectUrl);
      audioEl.crossOrigin = 'anonymous';
      if (volEl) audioEl.volume = parseFloat(volEl.value) || 0.85;
      mediaSource = ctx.createMediaElementSource(audioEl);
      mediaSource.connect(analyser);
      analyser.connect(ctx.destination);

      audioEl.addEventListener('ended', () => {
        audioPlaying = false;
        if (btnPlay) btnPlay.textContent = 'Play';
        if (audioStatusEl) audioStatusEl.textContent = 'Ended';
      });
      audioEl.addEventListener('play', () => {
        audioPlaying = true;
        if (btnPlay) btnPlay.textContent = 'Pause';
      });
      audioEl.addEventListener('pause', () => {
        audioPlaying = !audioEl.ended;
        if (btnPlay) btnPlay.textContent = 'Play';
      });
      audioEl.addEventListener('loadedmetadata', updateSeekUI);
      audioEl.addEventListener('timeupdate', updateSeekUI);

      if (seekEl) seekEl.disabled = false;
      if (btnPlay) btnPlay.disabled = false;

      try {
        await audioEl.play();
        audioPlaying = true;
        if (audioStatusEl) audioStatusEl.textContent = `Playing · ${file.name}`;
        if (btnPlay) btnPlay.textContent = 'Pause';
      } catch (err) {
        if (audioStatusEl) audioStatusEl.textContent = 'Tap Play after load (browser policy)';
        console.warn(err);
      }
    });
  }

  let targetMouseX = 0;
  let targetMouseY = 0;
  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -((e.clientY / window.innerHeight) * 2 - 1);
  });

  /** --- Bloom composer --- */
  let composer = null;
  let bloomPass = null;
  if (params.bloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const w = window.innerWidth;
    const h = window.innerHeight;
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(256, w / 2), Math.max(256, h / 2)),
      params.bloomStrength,
      params.bloomRadius,
      params.bloomThreshold
    );
    composer.addPass(bloomPass);
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) {
        bloomPass.resolution.set(Math.max(256, w / 2), Math.max(256, h / 2));
      }
    }
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, clock.getDelta());
    uniforms.uTime.value = clock.getElapsedTime();

    const cycle = params.actSec * 2;
    const ph = cycle > 0 ? (uniforms.uTime.value % cycle) / params.actSec : 0;
    const tri = ph < 1 ? ph : 2 - ph;
    const blend = tri * tri * (3 - 2 * tri);
    uniforms.uDirectorBlend.value = blend;

    if (gpu) {
      gpu.velUniforms.uTime.value = uniforms.uTime.value;
      gpu.velUniforms.uDelta.value = dt;
      gpu.posUniforms.uDelta.value = dt;
      gpu.velUniforms.uMouse.value.x += (targetMouseX - gpu.velUniforms.uMouse.value.x) * 0.06;
      gpu.velUniforms.uMouse.value.y += (targetMouseY - gpu.velUniforms.uMouse.value.y) * 0.06;
      gpu.velUniforms.uCurlF.value = THREE.MathUtils.lerp(1.12, 0.86, blend);
      gpu.velUniforms.uCurlG.value = THREE.MathUtils.lerp(1.73, 2.08, blend);
      gpu.gpuCompute.compute();
      const posTex = gpu.gpuCompute.getCurrentRenderTarget(gpu.posVar).texture;
      points.material.uniforms.uPosTex.value = posTex;
    }

    updateAudioUniforms(dt);

    uniforms.uMouse.value.x += (targetMouseX - uniforms.uMouse.value.x) * 0.06;
    uniforms.uMouse.value.y += (targetMouseY - uniforms.uMouse.value.y) * 0.06;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  animate();
}

try {
  init();
} catch (e) {
  console.error(e);
  showError(`Init failed: ${e && e.message ? e.message : String(e)}`);
}
