/**
 * Beast profile — save/load slider state + tier + modes (localStorage).
 */
(function (global) {
    'use strict';
    const NX = (global.NebulaX = global.NebulaX || {});
    const KEY = 'nebula-x-beast-profile';
    const VERSION = 1;

    NX.UserProfile = {
        KEY: KEY,

        save(bundle) {
            try {
                const payload = { v: VERSION, savedAt: new Date().toISOString(), ...bundle };
                global.localStorage.setItem(KEY, JSON.stringify(payload));
                return true;
            } catch (e) {
                console.warn('[NebulaX] UserProfile.save failed', e);
                return false;
            }
        },

        load() {
            try {
                const raw = global.localStorage.getItem(KEY);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (_) {
                return null;
            }
        },

        clear() {
            try {
                global.localStorage.removeItem(KEY);
            } catch (_) {}
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
