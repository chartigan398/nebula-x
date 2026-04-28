/**
 * StabilityMonitor — blueprint §8: context loss, basic frame stats, optional idle hook.
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});

    let frameCount = 0;
    let lastReport = performance.now();
    let contextLost = false;
    let drawCallsEstimate = 1;
    let fps = 0;
    let fpsFrames = 0;
    let lastFpsTime = performance.now();

    NX.StabilityMonitor = {
        init(renderer, canvas) {
            if (!canvas) return;
            canvas.addEventListener(
                'webglcontextlost',
                (e) => {
                    e.preventDefault();
                    contextLost = true;
                    console.warn('[NebulaX] WebGL context lost');
                },
                false
            );
            canvas.addEventListener('webglcontextrestored', () => {
                contextLost = false;
                console.warn('[NebulaX] WebGL context restored — reload recommended');
            });

            global.addEventListener('beforeunload', () => {
                try {
                    if (renderer && renderer.dispose) renderer.dispose();
                } catch (_) {}
            });
        },

        tickFrame() {
            frameCount++;
            fpsFrames++;
            const now = performance.now();
            if (now - lastFpsTime >= 1000) {
                fps = (fpsFrames * 1000) / (now - lastFpsTime);
                fpsFrames = 0;
                lastFpsTime = now;
            }
        },

        getFPS() {
            return fps;
        },

        getDrawCallsEstimate() {
            return drawCallsEstimate;
        },

        setDrawCallsEstimate(n) {
            drawCallsEstimate = n;
        },

        isContextLost() {
            return contextLost;
        },

        getMemoryHint() {
            if (performance.memory && performance.memory.usedJSHeapSize) {
                return Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
            return null;
        },

        /** Optional: call when tab hidden for long sessions */
        shouldThrottle(hidden) {
            return hidden === true;
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
