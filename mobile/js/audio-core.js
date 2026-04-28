/**
 * AudioCore — blueprint §3: MIR-oriented features + validation helpers.
 * Called from index computeAudioBands() with shared fft magnitudes (0..1).
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});

    /** Geometric / arithmetic mean ratio — ~1 = noise-like, low = tonal. */
    function spectralFlatnessFromBytes(data) {
        let logSum = 0;
        let sum = 0;
        const n = data.length;
        if (n < 2) return 0;
        for (let i = 0; i < n; i++) {
            const m = data[i] / 255;
            const v = Math.max(1e-12, m);
            logSum += Math.log(v);
            sum += m;
        }
        const gm = Math.exp(logSum / n);
        const am = sum / n;
        return am > 1e-10 ? Math.min(1, gm / am) : 0;
    }

    /** Spread proxy: normalized spread of bin index around centroid (0..~1). */
    function perceptualSpread(data, centroidHz, binHz) {
        if (!centroidHz || data.length < 2) return 0;
        let wSum = 0;
        let varSum = 0;
        for (let i = 0; i < data.length; i++) {
            const f = i * binHz;
            const w = data[i] / 255;
            const d = f - centroidHz;
            varSum += w * d * d;
            wSum += w;
        }
        if (wSum < 1e-6) return 0;
        return Math.min(1, Math.sqrt(varSum / wSum) / 8000);
    }

    NX.AudioCore = {
        spectralFlatnessFromBytes: spectralFlatnessFromBytes,
        perceptualSpread: perceptualSpread,

        /**
         * Rolling sparkline (fixed alloc — blueprint §3.3).
         */
        createSparklineBuffer(len) {
            const buf = new Float32Array(len);
            let head = 0;
            return {
                push(v) {
                    buf[head % len] = v;
                    head++;
                },
                getArray() {
                    return buf;
                },
                head() {
                    return head;
                }
            };
        },

        /**
         * Health flags — silent / clipped / stuck spectral (blueprint §3.3).
         */
        createHealthTracker() {
            let silentMs = 0;
            let clipFrames = 0;
            let lastCentroid = -1;
            let stuckMs = 0;
            const SILENT_RMS = 0.012;
            const STUCK_EPS = 120;
            const STUCK_MS = 4000;

            return {
                update(opts) {
                    const { audioEnabled, rms, centroid, dtMs, timeDomain } = opts;

                    if (!audioEnabled) {
                        silentMs = stuckMs = 0;
                        return { silent: false, clipped: false, stuckSpectrum: false };
                    }

                    if (rms < SILENT_RMS) silentMs += dtMs;
                    else silentMs = 0;
                    const silent = silentMs > 900;

                    if (timeDomain && timeDomain.length) {
                        let peak = 0;
                        for (let i = 0; i < timeDomain.length; i++) {
                            const a = Math.abs(timeDomain[i] - 128);
                            if (a > peak) peak = a;
                        }
                        if (peak > 126) clipFrames++;
                        else clipFrames = Math.max(0, clipFrames - 1);
                    }
                    const clipped = clipFrames > 4;

                    if (lastCentroid < 0) lastCentroid = centroid;
                    if (Math.abs(centroid - lastCentroid) < STUCK_EPS) stuckMs += dtMs;
                    else stuckMs = 0;
                    lastCentroid = centroid;
                    const stuckSpectrum = stuckMs > STUCK_MS && rms > 0.018;

                    return { silent, clipped, stuckSpectrum };
                }
            };
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
