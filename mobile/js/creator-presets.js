/**
 * Creator workflow — blueprint §9: preset packs + session log.
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});
    const LOG_KEY = 'nebula-x-session-log';
    const MAX_LOG = 40;

    const PACKS = {
        sleep60: {
            label: 'Sleep 60m',
            experienceMode: 'sleep',
            paletteMode: 'sleep',
            params: { morphSpeed: 0.55, colorSpeed: 0.45, visualExpress: 0.78, flowStrength: 0.45, gravityStrength: 0.45 },
            narrativeEnabled: true
        },
        study60: {
            label: 'Study 60m',
            experienceMode: 'focus',
            paletteMode: 'spectrum',
            params: { morphSpeed: 0.85, colorSpeed: 0.65, visualExpress: 1.25, flowStrength: 0.55, gravityStrength: 0.55 },
            narrativeEnabled: true
        },
        dystopia60: {
            label: 'Dystopia 60m',
            experienceMode: 'sleep',
            paletteMode: 'reactor',
            params: { morphSpeed: 0.7, colorSpeed: 0.55, visualExpress: 1.1, flowStrength: 0.65, gravityStrength: 0.65 },
            narrativeEnabled: true
        }
    };

    NX.CreatorPresets = {
        list: PACKS,

        logSession(entry) {
            try {
                const raw = global.localStorage.getItem(LOG_KEY);
                const arr = raw ? JSON.parse(raw) : [];
                arr.push({ t: new Date().toISOString(), ...entry });
                while (arr.length > MAX_LOG) arr.shift();
                global.localStorage.setItem(LOG_KEY, JSON.stringify(arr));
            } catch (_) {}
        },

        readLog() {
            try {
                const raw = global.localStorage.getItem(LOG_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (_) {
                return [];
            }
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
