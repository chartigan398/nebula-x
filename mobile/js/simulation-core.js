/**
 * SimulationCore — blueprint §1 + §4: particle forces, palette, bloom/reform mapping.
 * One frame update; no allocations inside the particle loop (Color created once per frame).
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});

    /**
     * @param {object} ctx — all inputs; mutates geometry.attributes and points.
     * @returns {{ particleSizeSmoothed: number }}
     */
    function updateParticleFrame(ctx) {
        const THREE = ctx.THREE;
        const {
            particleCount,
            geometry,
            points,
            pointsMaterial,
            PI,
            PHI,
            mode,
            params,
            mouse,
            flowTime,
            morphPhaseOffset,
            cameraPhaseOffset,
            colorWavePhase,
            gravityBaseStrength,
            audioFeatures,
            audioLevel,
            bassLevel,
            midLevel,
            highLevel,
            bassImpulse,
            pulseEnergy,
            phases,
            cloudPos,
            ringPos,
            spherePos,
            sizes,
            morphFactor1,
            morphFactor2,
            paletteHueShifted,
            paletteWhiteBlend,
            paletteMode,
            narrativeEnabled,
            nu
        } = ctx;

        let particleSizeSmoothed = ctx.particleSizeSmoothed;

        const posAttr = geometry.attributes.position;
        const sizeAttr = geometry.attributes.size;
        const colAttr = geometry.attributes.color;
        const colorTool = new THREE.Color();

        const ve = params.visualExpress != null ? params.visualExpress : 1;
        const cen = audioFeatures.centroid != null ? audioFeatures.centroid : 2000;
        const cn = THREE.MathUtils.clamp((cen - 180) / 6500, 0, 1);
        /** MIR: brightness of spectrum → global hue drift (readable with audio on). */
        const centroidHue = (cn - 0.5) * 0.34 * ve * (0.38 + audioFeatures.midNorm * 0.62);
        /** Noise-like vs tonal → extra flow churn (guide: flatness → jitter/chaos). */
        const flatBoost = 1 + audioFeatures.flatness * 1.45 * ve;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            const targetX = THREE.MathUtils.lerp(cloudPos[i3], ringPos[i3], morphFactor1);
            const targetY = THREE.MathUtils.lerp(cloudPos[i3 + 1], ringPos[i3 + 1], morphFactor1);
            const targetZ = THREE.MathUtils.lerp(cloudPos[i3 + 2], ringPos[i3 + 2], morphFactor1);

            const finalX = THREE.MathUtils.lerp(targetX, spherePos[i3], morphFactor2);
            const finalY = THREE.MathUtils.lerp(targetY, spherePos[i3 + 1], morphFactor2);
            const finalZ = THREE.MathUtils.lerp(targetZ, spherePos[i3 + 2], morphFactor2);

            let fx = finalX;
            let fy = finalY;
            let fz = finalZ;

            const cursorX = mouse.x;
            const cursorY = -mouse.y;
            const dx = cursorX - fx;
            const dy = cursorY - fy;
            const dz = 0 - fz;
            const r2 = dx * dx + dy * dy + dz * dz + 400;
            const dist = Math.sqrt(r2);
            const magnetDrive = Math.min(1, audioFeatures.reformMagnet * 0.95 + audioFeatures.onset * 0.55);
            /**
             * Magnetic well (readable pull): ~1/dist falloff, strong gain — old 1/r² was invisible at scale.
             */
            const magnetGain =
                gravityBaseStrength * 3200 * params.gravityStrength * (0.45 + magnetDrive * 2.2);
            const falloff = 1 / (dist + 280);
            fx += (dx / (dist + 1e-6)) * magnetGain * falloff;
            fy += (dy / (dist + 1e-6)) * magnetGain * falloff;
            fz += (dz / (dist + 1e-6)) * magnetGain * falloff;

            /** Re-form: pull toward shape center (origin) when reform envelope is high */
            const corePull = audioFeatures.reformMagnet * 0.11 * (0.6 + mode.flowScale);
            fx -= fx * corePull;
            fy -= fy * corePull;
            fz -= fz * corePull;

            const narrFlow = narrativeEnabled ? nu.flowMul : 1;
            const flowBase = params.flowStrength * (0.32 + audioFeatures.midNorm * 0.68) * mode.flowScale * narrFlow;
            const vVar = mode.velocityVariance != null ? mode.velocityVariance : 1;
            /** Blueprint §4.1: incommensurate flow layers so the field does not short-loop. */
            const n =
                Math.sin(fx * 0.0005 + flowTime * 0.35 + morphPhaseOffset * 0.2) *
                Math.cos(fz * 0.0004 + flowTime * 0.25);
            const nAux =
                Math.sin(fy * 0.00042 + flowTime * 0.073 + fx * 0.00019 + morphPhaseOffset * 0.37) * 0.55 +
                Math.cos(fz * 0.00031 + flowTime * 0.041 + cameraPhaseOffset * 0.11) * 0.45;
            const nBlend = (n * (0.72 + 0.28 * nAux)) * vVar * flatBoost;
            const flowDirX = Math.cos(flowTime * 0.06 + cameraPhaseOffset * 0.3) + mouse.x / 450;
            const flowDirZ = Math.sin(flowTime * 0.08 + cameraPhaseOffset * 0.2) + mouse.y / 450;
            let fvx = flowDirX * nBlend * 9 * flowBase;
            let fvz = flowDirZ * nBlend * 9 * flowBase;
            const flowMag = Math.sqrt(fvx * fvx + fvz * fvz);
            const flowCap = 38 * mode.flowScale;
            if (flowMag > flowCap && flowMag > 0) {
                const sc = flowCap / flowMag;
                fvx *= sc;
                fvz *= sc;
            }
            fx += fvx;
            fz += fvz;

            {
                const ox = fx - finalX;
                const oy = fy - finalY;
                const oz = fz - finalZ;
                const ol = Math.sqrt(ox * ox + oy * oy + oz * oz);
                /** Perceptual spread → looser coherence (guide: expansion of cloud). */
                const cap =
                    mode.maxStrayFromTarget *
                    (1 + (audioFeatures.spread != null ? audioFeatures.spread : 0) * 0.62 * ve);
                if (ol > cap && ol > 0) {
                    const sc = cap / ol;
                    fx = finalX + ox * sc;
                    fy = finalY + oy * sc;
                    fz = finalZ + oz * sc;
                }
            }

            const radialDirX = fx;
            const radialDirY = fy;
            const radialDirZ = fz;
            const radialLen = Math.sqrt(radialDirX * radialDirX + radialDirY * radialDirY + radialDirZ * radialDirZ) + 1e-3;
            const bloomDrive = Math.min(1, audioFeatures.bloomEnv * 0.92 + audioFeatures.onset * 0.55);
            const narrBloom = narrativeEnabled ? nu.bloomKMul : 1;
            const radialScale = 1 + bloomDrive * mode.bloomRadialK * narrBloom * 2.55;

            const pushAmt = Math.min(
                mode.maxBloomPush,
                bassImpulse * 26 + audioFeatures.bloomEnv * 20 + audioFeatures.onset * 16
            );
            const baseX = fx * radialScale + (radialDirX / radialLen) * pushAmt;
            const baseY = fy * radialScale + (radialDirY / radialLen) * pushAmt;
            const baseZ = fz * radialScale + (radialDirZ / radialLen) * pushAmt;

            const detailCadence = mode.detailCadence != null ? mode.detailCadence : 1;
            const highJitter = 1 + highLevel * 3 * mode.shimmerScale;
            const pulseMul = mode.pulseReadScale != null ? mode.pulseReadScale : 1;
            const pulse = Math.min(1, pulseEnergy * 1.25 * mode.pulseScale * pulseMul);
            const contract = pulse * 0.055;
            const bloom = pulse * 0.16;
            const pulseScale = 1 - contract + bloom;

            const sh = Math.min(mode.maxShimmerUnits, 10 * highJitter);
            const fd = flowTime * detailCadence;
            posAttr.array[i3] = baseX * pulseScale + Math.sin(fd + phases[i]) * sh;
            posAttr.array[i3 + 1] = baseY * pulseScale + Math.cos(fd + phases[i]) * sh;
            posAttr.array[i3 + 2] = baseZ * pulseScale + Math.sin(fd * 0.5 + phases[i]) * sh;

            const densityMask = 1;

            const radius = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
            const colorDelay = radius * 0.01 + phases[i] * 0.6;
            const colorWave = 0.5 + 0.5 * Math.sin(colorWavePhase - colorDelay);

            const hiShift = mode.highlightHueShift != null ? mode.highlightHueShift : 0;
            const hueBase = paletteHueShifted + highLevel * hiShift;

            let hue;
            let saturation;
            let lightness;
            if (paletteMode === 'spectrum' || paletteMode === 'sleep') {
                hue = THREE.MathUtils.euclideanModulo(hueBase + centroidHue, 1);
                saturation = Math.min(
                    1,
                    Math.max(
                        0,
                        0.8 +
                            colorWave * 0.15 +
                            highLevel * 0.1 +
                            mode.saturationBoost +
                            (narrativeEnabled ? nu.satAdd : 0)
                    )
                );
                lightness = Math.min(
                    1,
                    Math.max(
                        0,
                        0.42 +
                            colorWave * 0.16 +
                            audioLevel * 0.1 +
                            bassLevel * 0.04 +
                            mode.lightnessBoost +
                            (narrativeEnabled ? nu.lightAdd : 0)
                    )
                );
                const whiteMix = Math.min(0.45, highLevel * 0.25 + audioFeatures.onset * 0.8 + paletteWhiteBlend * 0.95);
                saturation *= 1 - whiteMix * 0.92;
                lightness = Math.min(1, lightness + whiteMix * 0.32);
            } else {
                hue = THREE.MathUtils.euclideanModulo(hueBase + centroidHue, 1);
                saturation = Math.min(
                    1,
                    Math.max(
                        0,
                        0.86 +
                            colorWave * 0.1 +
                            highLevel * 0.05 +
                            mode.saturationBoost +
                            (narrativeEnabled ? nu.satAdd : 0)
                    )
                );
                lightness = Math.min(
                    1,
                    Math.max(
                        0,
                        0.42 +
                            colorWave * 0.12 +
                            audioLevel * 0.1 +
                            bassLevel * 0.05 +
                            mode.lightnessBoost +
                            (narrativeEnabled ? nu.lightAdd : 0)
                    )
                );
                const whiteMix = Math.min(0.4, highLevel * 0.2 + audioFeatures.onset * 0.6 + paletteWhiteBlend * 0.85);
                saturation *= 1 - whiteMix * 0.88;
                lightness = Math.min(1, lightness + whiteMix * 0.28);
            }
            colorTool.setHSL(hue, saturation, lightness);

            colAttr.array[i3] = colorTool.r;
            colAttr.array[i3 + 1] = colorTool.g;
            colAttr.array[i3 + 2] = colorTool.b;

            const twinkle =
                0.7 +
                Math.sin(flowTime * 4 * detailCadence + phases[i]) * (0.2 + highLevel * 0.5) +
                audioLevel * 0.1;
            const bloomSize = 1 + bloomDrive * 0.55;
            sizeAttr.array[i] = sizes[i] * Math.max(0.3, twinkle) * densityMask * bloomSize;
        }

        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        /** No whole-scene scale breathing — that reads as fake “zoom”. Fixed scale only. */
        points.scale.setScalar(mode.globalPointScale);

        const sizeTarget =
            4.5 *
            mode.globalPointScale *
            (1 + audioFeatures.bloomEnv * 0.48 * ve + audioFeatures.onset * 0.2 * ve);
        particleSizeSmoothed += (sizeTarget - particleSizeSmoothed) * 0.12;
        if (pointsMaterial) pointsMaterial.size = particleSizeSmoothed;

        /** Subtle drift — not a camera orbit; kept low so it doesn’t steal the show. */
        points.rotation.y += 0.00035 * ve * (1 + audioFeatures.bloomEnv * 1.2 + audioFeatures.midNorm * 0.45);

        const glowMaterial = ctx.glowMaterial;
        const pointsGlow = ctx.pointsGlow;
        if (pointsGlow && glowMaterial) {
            pointsGlow.scale.copy(points.scale);
            pointsGlow.rotation.copy(points.rotation);
            const gSize =
                particleSizeSmoothed *
                (2.25 + audioFeatures.bloomEnv * 1.35 * ve + audioFeatures.onset * 0.75 * ve);
            glowMaterial.size = Math.min(52, Math.max(9, gSize));
            glowMaterial.opacity = Math.min(0.62, 0.26 + audioFeatures.bloomEnv * 0.28 * ve + audioFeatures.onset * 0.12);
        }

        return { particleSizeSmoothed: particleSizeSmoothed };
    }

    NX.SimulationCore = {
        updateParticleFrame: updateParticleFrame
    };
})(typeof window !== 'undefined' ? window : globalThis);
