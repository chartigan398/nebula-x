/**
 * Nebula X — GPU particle path (blueprint §2: WebGL vertex shader parity with simulation-core.js).
 * Runs morph + forces + color + size on GPU; no per-particle CPU loop when active.
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});

    const VERT = [
        'attribute vec3 cloudPos;',
        'attribute vec3 ringPos;',
        'attribute vec3 spherePos;',
        'attribute float phase;',
        'attribute float size;',
        '',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        '',
        'uniform float uMorph1;',
        'uniform float uMorph2;',
        'uniform float uFlowTime;',
        'uniform float uMorphPhaseOffset;',
        'uniform float uCameraPhaseOffset;',
        'uniform float uColorWavePhase;',
        'uniform float uMouseX;',
        'uniform float uMouseY;',
        'uniform float uGravityBase;',
        'uniform float uGravityStrength;',
        'uniform float uFlowStrength;',
        'uniform float uFlowScale;',
        'uniform float uMaxStray;',
        'uniform float uBloomRadialK;',
        'uniform float uMaxBloomPush;',
        'uniform float uReformMagnet;',
        'uniform float uOnset;',
        'uniform float uBloomEnv;',
        'uniform float uMidNorm;',
        'uniform float uBassImpulse;',
        'uniform float uPulseEnergy;',
        'uniform float uHighLevel;',
        'uniform float uAudioLevel;',
        'uniform float uBassLevel;',
        'uniform float uDetailCadence;',
        'uniform float uPulseScale;',
        'uniform float uPulseReadScale;',
        'uniform float uShimmerScale;',
        'uniform float uMaxShimmerUnits;',
        'uniform float uSaturationBoost;',
        'uniform float uLightnessBoost;',
        'uniform float uHighlightHueShift;',
        'uniform float uVelocityVariance;',
        'uniform float uNarrFlow;',
        'uniform float uNarrBloom;',
        'uniform float uSatAdd;',
        'uniform float uLightAdd;',
        'uniform float uPaletteHue;',
        'uniform float uPaletteWhite;',
        'uniform float uPaletteReactor;',
        'uniform float uPointSize;',
        'uniform float uSizeScale;',
        '',
        'varying vec3 vColor;',
        'varying float vOpacity;',
        '',
        'float min1(float a, float b) { return a < b ? a : b; }',
        'float max1(float a, float b) { return a > b ? a : b; }',
        'float clamp1(float x, float lo, float hi) { return min1(hi, max1(lo, x)); }',
        '',
        'vec3 hsl2rgb(float h, float s, float l) {',
        '  float c = (1.0 - abs(2.0 * l - 1.0)) * s;',
        '  float hp = h * 6.0;',
        '  float x = c * (1.0 - abs(mod(hp, 2.0) - 1.0));',
        '  vec3 rgb;',
        '  if (hp < 1.0) rgb = vec3(c, x, 0.0);',
        '  else if (hp < 2.0) rgb = vec3(x, c, 0.0);',
        '  else if (hp < 3.0) rgb = vec3(0.0, c, x);',
        '  else if (hp < 4.0) rgb = vec3(0.0, x, c);',
        '  else if (hp < 5.0) rgb = vec3(x, 0.0, c);',
        '  else rgb = vec3(c, 0.0, x);',
        '  float m = l - 0.5 * c;',
        '  return rgb + vec3(m);',
        '}',
        '',
        'void main() {',
        '  vec3 target = mix(cloudPos, ringPos, uMorph1);',
        '  vec3 finalP = mix(target, spherePos, uMorph2);',
        '  float fx = finalP.x;',
        '  float fy = finalP.y;',
        '  float fz = finalP.z;',
        '  float cursorX = uMouseX;',
        '  float cursorY = -uMouseY;',
        '  float dx = cursorX - fx;',
        '  float dy = cursorY - fy;',
        '  float dz = -fz;',
        '  float r2 = dx*dx + dy*dy + dz*dz + 400.0;',
        '  float dist = sqrt(r2);',
        '  float magnetDrive = min1(1.0, uReformMagnet * 0.95 + uOnset * 0.55);',
        '  float magnetGain = uGravityBase * 3200.0 * uGravityStrength * (0.45 + magnetDrive * 2.2);',
        '  float falloff = 1.0 / (dist + 280.0);',
        '  fx += (dx / (dist + 1e-6)) * magnetGain * falloff;',
        '  fy += (dy / (dist + 1e-6)) * magnetGain * falloff;',
        '  fz += (dz / (dist + 1e-6)) * magnetGain * falloff;',
        '  float corePull = uReformMagnet * 0.11 * (0.6 + uFlowScale);',
        '  fx -= fx * corePull;',
        '  fy -= fy * corePull;',
        '  fz -= fz * corePull;',
        '  float flowBase = uFlowStrength * (0.32 + uMidNorm * 0.68) * uFlowScale * uNarrFlow;',
        '  float n = sin(fx * 0.0005 + uFlowTime * 0.35 + uMorphPhaseOffset * 0.2) *',
        '            cos(fz * 0.0004 + uFlowTime * 0.25);',
        '  float nAux = sin(fy * 0.00042 + uFlowTime * 0.073 + fx * 0.00019 + uMorphPhaseOffset * 0.37) * 0.55 +',
        '             cos(fz * 0.00031 + uFlowTime * 0.041 + uCameraPhaseOffset * 0.11) * 0.45;',
        '  float nBlend = (n * (0.72 + 0.28 * nAux)) * uVelocityVariance;',
        '  float flowDirX = cos(uFlowTime * 0.06 + uCameraPhaseOffset * 0.3) + uMouseX / 450.0;',
        '  float flowDirZ = sin(uFlowTime * 0.08 + uCameraPhaseOffset * 0.2) + uMouseY / 450.0;',
        '  float fvx = flowDirX * nBlend * 9.0 * flowBase;',
        '  float fvz = flowDirZ * nBlend * 9.0 * flowBase;',
        '  float flowMag = sqrt(fvx*fvx + fvz*fvz);',
        '  float flowCap = 38.0 * uFlowScale;',
        '  if (flowMag > flowCap && flowMag > 0.0) {',
        '    float sc = flowCap / flowMag;',
        '    fvx *= sc;',
        '    fvz *= sc;',
        '  }',
        '  fx += fvx;',
        '  fz += fvz;',
        '  float ox = fx - finalP.x;',
        '  float oy = fy - finalP.y;',
        '  float oz = fz - finalP.z;',
        '  float ol = sqrt(ox*ox + oy*oy + oz*oz);',
        '  if (ol > uMaxStray && ol > 0.0) {',
        '    float sc2 = uMaxStray / ol;',
        '    fx = finalP.x + ox * sc2;',
        '    fy = finalP.y + oy * sc2;',
        '    fz = finalP.z + oz * sc2;',
        '  }',
        '  float radialDirX = fx;',
        '  float radialDirY = fy;',
        '  float radialDirZ = fz;',
        '  float radialLen = sqrt(radialDirX*radialDirX + radialDirY*radialDirY + radialDirZ*radialDirZ) + 1e-3;',
        '  float bloomDrive = min1(1.0, uBloomEnv * 0.92 + uOnset * 0.55);',
        '  float radialScale = 1.0 + bloomDrive * uBloomRadialK * uNarrBloom * 2.55;',
        '  float pushAmt = min1(uMaxBloomPush, uBassImpulse * 26.0 + uBloomEnv * 20.0 + uOnset * 16.0);',
        '  float baseX = fx * radialScale + (radialDirX / radialLen) * pushAmt;',
        '  float baseY = fy * radialScale + (radialDirY / radialLen) * pushAmt;',
        '  float baseZ = fz * radialScale + (radialDirZ / radialLen) * pushAmt;',
        '  float highJitter = 1.0 + uHighLevel * 3.0 * uShimmerScale;',
        '  float pulse = min1(1.0, uPulseEnergy * 1.25 * uPulseScale * uPulseReadScale);',
        '  float contract = pulse * 0.055;',
        '  float bloom = pulse * 0.16;',
        '  float pulseScale = 1.0 - contract + bloom;',
        '  float sh = min1(uMaxShimmerUnits, 10.0 * highJitter);',
        '  float fd = uFlowTime * uDetailCadence;',
        '  vec3 pos = vec3(',
        '    baseX * pulseScale + sin(fd + phase) * sh,',
        '    baseY * pulseScale + cos(fd + phase) * sh,',
        '    baseZ * pulseScale + sin(fd * 0.5 + phase) * sh',
        '  );',
        '  float radius = sqrt(baseX*baseX + baseY*baseY + baseZ*baseZ);',
        '  float colorDelay = radius * 0.01 + phase * 0.6;',
        '  float colorWave = 0.5 + 0.5 * sin(uColorWavePhase - colorDelay);',
        '  float hueBase = uPaletteHue + uHighLevel * uHighlightHueShift;',
        '  float hue = hueBase;',
        '  float saturation;',
        '  float lightness;',
        '  if (uPaletteReactor < 0.5) {',
        '    saturation = clamp1(0.8 + colorWave * 0.15 + uHighLevel * 0.1 + uSaturationBoost + uSatAdd, 0.0, 1.0);',
        '    lightness = clamp1(0.42 + colorWave * 0.16 + uAudioLevel * 0.1 + uBassLevel * 0.04 + uLightnessBoost + uLightAdd, 0.0, 1.0);',
        '    float whiteMix = min1(0.45, uHighLevel * 0.25 + uOnset * 0.8 + uPaletteWhite * 0.95);',
        '    saturation *= 1.0 - whiteMix * 0.92;',
        '    lightness = min1(1.0, lightness + whiteMix * 0.32);',
        '  } else {',
        '    saturation = clamp1(0.86 + colorWave * 0.1 + uHighLevel * 0.05 + uSaturationBoost + uSatAdd, 0.0, 1.0);',
        '    lightness = clamp1(0.42 + colorWave * 0.12 + uAudioLevel * 0.1 + uBassLevel * 0.05 + uLightnessBoost + uLightAdd, 0.0, 1.0);',
        '    float whiteMix2 = min1(0.4, uHighLevel * 0.2 + uOnset * 0.6 + uPaletteWhite * 0.85);',
        '    saturation *= 1.0 - whiteMix2 * 0.88;',
        '    lightness = min1(1.0, lightness + whiteMix2 * 0.28);',
        '  }',
        '  vec3 rgb = hsl2rgb(fract(hue), saturation, lightness);',
        '  vColor = rgb;',
        '  float twinkle = 0.7 + sin(uFlowTime * 4.0 * uDetailCadence + phase) * (0.2 + uHighLevel * 0.5) + uAudioLevel * 0.1;',
        '  float bloomSize = 1.0 + bloomDrive * 0.55;',
        '  float ptSize = size * max1(0.3, twinkle) * bloomSize;',
        '  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '  float dist = max1(1.0, -mvPosition.z);',
        '  float ps = ptSize * uPointSize * (uSizeScale / dist);',
        '  gl_PointSize = clamp1(ps, 4.0, 250.0);',
        '  vOpacity = 0.9;',
        '}'
    ].join('\n');

    const FRAG = [
        'uniform sampler2D map;',
        'uniform float opacity;',
        'varying vec3 vColor;',
        'varying float vOpacity;',
        'void main() {',
        '  vec4 tex = texture2D(map, gl_PointCoord);',
        '  if (tex.a < 0.05) discard;',
        '  gl_FragColor = vec4(vColor * tex.rgb, tex.a * opacity * vOpacity);',
        '}'
    ].join('\n');

    /**
     * @param {object} THREE
     * @param {THREE.Texture} mapTexture
     */
    function createGpuPointsMaterial(THREE, mapTexture) {
        try {
            const mat = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib.common,
                    {
                        map: { value: mapTexture },
                        opacity: { value: 0.9 },
                        uMorph1: { value: 0 },
                        uMorph2: { value: 0 },
                        uFlowTime: { value: 0 },
                        uMorphPhaseOffset: { value: 0 },
                        uCameraPhaseOffset: { value: 0 },
                        uColorWavePhase: { value: 0 },
                        uMouseX: { value: 0 },
                        uMouseY: { value: 0 },
                        uGravityBase: { value: 0.0005 },
                        uGravityStrength: { value: 0.6 },
                        uFlowStrength: { value: 0.6 },
                        uFlowScale: { value: 1 },
                        uMaxStray: { value: 280 },
                        uBloomRadialK: { value: 0.72 },
                        uMaxBloomPush: { value: 42 },
                        uReformMagnet: { value: 0 },
                        uOnset: { value: 0 },
                        uBloomEnv: { value: 0 },
                        uMidNorm: { value: 0 },
                        uBassImpulse: { value: 0 },
                        uPulseEnergy: { value: 0 },
                        uHighLevel: { value: 0 },
                        uAudioLevel: { value: 0 },
                        uBassLevel: { value: 0 },
                        uDetailCadence: { value: 1 },
                        uPulseScale: { value: 1 },
                        uPulseReadScale: { value: 1 },
                        uShimmerScale: { value: 1 },
                        uMaxShimmerUnits: { value: 11 },
                        uSaturationBoost: { value: 0 },
                        uLightnessBoost: { value: 0 },
                        uHighlightHueShift: { value: 0 },
                        uVelocityVariance: { value: 1 },
                        uNarrFlow: { value: 1 },
                        uNarrBloom: { value: 1 },
                        uSatAdd: { value: 0 },
                        uLightAdd: { value: 0 },
                        uPaletteHue: { value: 0 },
                        uPaletteWhite: { value: 0 },
                        uPaletteReactor: { value: 0 },
                        uPointSize: { value: 4.5 },
                        uSizeScale: { value: 400.0 }
                    }
                ]),
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                fog: false,
                lights: false
            });
            return mat;
        } catch (e) {
            console.warn('GpuPointsMaterial: compile failed', e);
            return null;
        }
    }

    /**
     * @param {THREE.ShaderMaterial} material
     * @param {object} ctx — same fields as SimulationCore.updateParticleFrame + particleSizeSmoothed, experienceMode paletteMode
     * @param {THREE.WebGLRenderer} [ctx.renderer] — for point-size attenuation (matches PointsMaterial)
     */
    function updateGpuUniforms(material, ctx) {
        const u = material.uniforms;
        if (ctx.renderer && ctx.renderer.domElement) {
            const h = ctx.renderer.domElement.height || 800;
            const pr = ctx.renderer.getPixelRatio ? ctx.renderer.getPixelRatio() : 1;
            u.uSizeScale.value = h * pr * 0.5;
        }
        const mode = ctx.mode;
        const af = ctx.audioFeatures;
        const nu = ctx.nu;
        const narr = ctx.narrativeEnabled;

        u.uMorph1.value = ctx.morphFactor1;
        u.uMorph2.value = ctx.morphFactor2;
        u.uFlowTime.value = ctx.flowTime;
        u.uMorphPhaseOffset.value = ctx.morphPhaseOffset;
        u.uCameraPhaseOffset.value = ctx.cameraPhaseOffset;
        u.uColorWavePhase.value = ctx.colorWavePhase;
        u.uMouseX.value = ctx.mouse.x;
        u.uMouseY.value = ctx.mouse.y;
        u.uGravityBase.value = ctx.gravityBaseStrength;
        u.uGravityStrength.value = ctx.params.gravityStrength;
        u.uFlowStrength.value = ctx.params.flowStrength;
        u.uFlowScale.value = mode.flowScale;
        u.uMaxStray.value = mode.maxStrayFromTarget;
        u.uBloomRadialK.value = mode.bloomRadialK;
        u.uMaxBloomPush.value = mode.maxBloomPush;
        u.uReformMagnet.value = af.reformMagnet;
        u.uOnset.value = af.onset;
        u.uBloomEnv.value = af.bloomEnv;
        u.uMidNorm.value = af.midNorm;
        u.uBassImpulse.value = ctx.bassImpulse;
        u.uPulseEnergy.value = ctx.pulseEnergy;
        u.uHighLevel.value = ctx.highLevel;
        u.uAudioLevel.value = ctx.audioLevel;
        u.uBassLevel.value = ctx.bassLevel;
        u.uDetailCadence.value = mode.detailCadence != null ? mode.detailCadence : 1;
        u.uPulseScale.value = mode.pulseScale;
        u.uPulseReadScale.value = mode.pulseReadScale != null ? mode.pulseReadScale : 1;
        u.uShimmerScale.value = mode.shimmerScale;
        u.uMaxShimmerUnits.value = mode.maxShimmerUnits;
        u.uSaturationBoost.value = mode.saturationBoost;
        u.uLightnessBoost.value = mode.lightnessBoost;
        u.uHighlightHueShift.value = mode.highlightHueShift != null ? mode.highlightHueShift : 0;
        u.uVelocityVariance.value = mode.velocityVariance != null ? mode.velocityVariance : 1;
        u.uNarrFlow.value = narr ? nu.flowMul : 1;
        u.uNarrBloom.value = narr ? nu.bloomKMul : 1;
        u.uSatAdd.value = narr ? nu.satAdd : 0;
        u.uLightAdd.value = narr ? nu.lightAdd : 0;
        u.uPaletteHue.value = ctx.paletteHueShifted;
        u.uPaletteWhite.value = ctx.paletteWhiteBlend;
        u.uPaletteReactor.value = ctx.paletteMode === 'reactor' ? 1 : 0;
        u.uPointSize.value = ctx.particleSizeSmoothed;
    }

    function disposeGpuMaterial(material) {
        try {
            if (material) material.dispose();
        } catch (_) {}
    }

    NX.GpuPointsMaterial = {
        createGpuPointsMaterial: createGpuPointsMaterial,
        updateGpuUniforms: updateGpuUniforms,
        disposeGpuMaterial: disposeGpuMaterial
    };
})(typeof window !== 'undefined' ? window : globalThis);
