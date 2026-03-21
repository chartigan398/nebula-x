/**
 * URL + defaults for The Titan (order: polish → sim → director → bloom).
 */
export function parseTitanParams() {
  const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const f = (key, def) => {
    const v = parseFloat(p.get(key));
    return Number.isFinite(v) ? v : def;
  };
  return {
    /** explicit count override */
    n: p.get('n'),
    /** ?lite=1 → fewer particles */
    lite: p.get('lite') === '1',
    /** audio → visual gains */
    bassGain: f('bass', 1),
    midGain: f('mid', 1),
    highGain: f('high', 1),
    /** envelope follow speed (higher = snappier) */
    envelopeSmooth: f('smooth', 8),
    /** AnalyserNode smoothing 0..1 */
    analyserSmooth: Math.min(0.99, Math.max(0.1, f('aft', 0.65))),
    /** vertex = high-count shader deform · gpu = float texture sim (Phase B) */
    sim: p.get('sim') === 'gpu' ? 'gpu' : 'vertex',
    /** post bloom */
    bloom: p.get('bloom') !== '0',
    bloomStrength: f('bloomstr', 0.35),
    bloomRadius: f('bloomrad', 0.45),
    bloomThreshold: f('bloomthr', 0.82),
    /** director: full A→B cycle length (seconds) */
    actSec: Math.max(30, f('act', 180))
  };
}

export function pickParticleCount(params) {
  const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const forced = Number(p.get('n'));
  if (Number.isFinite(forced) && forced > 1000) return Math.floor(forced);
  if (params.lite) return 72_000;
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  if (dpr > 1.5) return 180_000;
  return 240_000;
}

/** Texture side for GPU sim: must match texel count ≥ particles */
export function gpuSimTextureSize(wantParticles) {
  const side = Math.ceil(Math.sqrt(wantParticles));
  let s = 128;
  while (s < side) s *= 2;
  return Math.min(512, Math.max(128, s));
}
