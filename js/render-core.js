/**
 * RenderCore — blueprint §1: scene, camera, WebGL renderer, particle Points, star texture.
 * No per-frame simulation (see simulation-core.js).
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});

    function createStarTexture(THREE) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * @param {object} THREE — global THREE
     * @param {object} opts
     * @param {number} opts.particleCount
     * @param {number} opts.initialFogHex
     * @param {number} opts.initialFogDensity
     * @param {number} opts.cameraDistance — fixed distance along +Z (no user zoom)
     * @param {number} opts.width
     * @param {number} opts.height
     * @param {HTMLElement} [opts.container] — default document.body
     */
    function initParticleScene(THREE, opts) {
        const container = opts.container || document.body;
        const particleCount = opts.particleCount;
        const scene = new THREE.Scene();
        const fogColor = new THREE.Color(opts.initialFogHex);
        scene.fog = new THREE.FogExp2(fogColor.getHex(), opts.initialFogDensity);

        const camera = new THREE.PerspectiveCamera(65, opts.width / opts.height, 1, 6000);
        camera.position.z = opts.cameraDistance != null ? opts.cameraDistance : opts.zoomDistance;

        const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        renderer.setSize(opts.width, opts.height);
        renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const cloudPos = new Float32Array(particleCount * 3);
        const ringPos = new Float32Array(particleCount * 3);
        const spherePos = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const phases = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            cloudPos[i3] = (Math.random() - 0.5) * 2000;
            cloudPos[i3 + 1] = (Math.random() - 0.5) * 2000;
            cloudPos[i3 + 2] = (Math.random() - 0.5) * 2000;

            const angle = Math.random() * Math.PI * 2;
            const radius = 600 + (Math.random() - 0.5) * 200;
            ringPos[i3] = Math.cos(angle) * radius;
            ringPos[i3 + 1] = (Math.random() - 0.5) * 100;
            ringPos[i3 + 2] = Math.sin(angle) * radius;

            const u = Math.random();
            const v = Math.random();
            const thetaS = 2 * Math.PI * u;
            const phiS = Math.acos(2 * v - 1);
            const rS = 400 * Math.pow(Math.random(), 1 / 3);
            spherePos[i3] = rS * Math.sin(phiS) * Math.cos(thetaS);
            spherePos[i3 + 1] = rS * Math.sin(phiS) * Math.sin(thetaS);
            spherePos[i3 + 2] = rS * Math.cos(phiS);

            positions[i3] = cloudPos[i3];
            positions[i3 + 1] = cloudPos[i3 + 1];
            positions[i3 + 2] = cloudPos[i3 + 2];

            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;

            sizes[i] = 1.0 + Math.random() * 3.5;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        /** Blueprint §2: shape buffers as attributes for GPU vertex shader path. */
        geometry.setAttribute('cloudPos', new THREE.BufferAttribute(cloudPos, 3));
        geometry.setAttribute('ringPos', new THREE.BufferAttribute(ringPos, 3));
        geometry.setAttribute('spherePos', new THREE.BufferAttribute(spherePos, 3));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const starTex = createStarTexture(THREE);

        const pointsMaterial = new THREE.PointsMaterial({
            size: 4.5,
            map: starTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        /** Second draw: same geometry, soft halo — reads as light/volume, not “zooming” the whole scene. */
        const glowMaterial = new THREE.PointsMaterial({
            size: 16,
            map: starTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const pointsGlow = new THREE.Points(geometry, glowMaterial);
        pointsGlow.frustumCulled = false;
        const points = new THREE.Points(geometry, pointsMaterial);
        points.frustumCulled = false;
        scene.add(pointsGlow);
        scene.add(points);

        container.appendChild(renderer.domElement);

        return {
            scene,
            camera,
            renderer,
            geometry,
            points,
            pointsGlow,
            pointsMaterial,
            glowMaterial,
            positions,
            cloudPos,
            ringPos,
            spherePos,
            colors,
            sizes,
            phases,
            initialFogColor: fogColor
        };
    }

    function resize(camera, renderer, width, height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function disposeParticleResources(geometry, pointsMaterial, glowMaterial) {
        try {
            if (geometry) geometry.dispose();
            let starTex = null;
            if (pointsMaterial && pointsMaterial.map) starTex = pointsMaterial.map;
            else if (glowMaterial && glowMaterial.map) starTex = glowMaterial.map;
            if (pointsMaterial) {
                pointsMaterial.map = null;
                pointsMaterial.dispose();
            }
            if (glowMaterial) {
                glowMaterial.map = null;
                glowMaterial.dispose();
            }
            if (starTex) starTex.dispose();
        } catch (_) {}
    }

    NX.RenderCore = {
        createStarTexture: createStarTexture,
        initParticleScene: initParticleScene,
        resize: resize,
        disposeParticleResources: disposeParticleResources
    };
})(typeof window !== 'undefined' ? window : globalThis);
