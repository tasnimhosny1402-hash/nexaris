// GhostShift movers: data published by the SPHEREx pipeline (D:\spherx, `python -m ghostshift.run publish --dest`)
// into public/ghostshift. Only the tiles near the current view are fetched, as the user pans and zooms.

// In production the data lives in a Cloudflare R2 bucket (set NEXT_PUBLIC_GHOSTSHIFT_BASE at build time);
// in development it is served from public/ghostshift.
export const GS_BASE = (process.env.NEXT_PUBLIC_GHOSTSHIFT_BASE || '/ghostshift').replace(/\/$/, '');

export const CLASSES = {
  known: { label: 'Known asteroid', color: '#58e0a8', shape: 'circle' },
  tracklet: { label: 'Unidentified mover', color: '#ffb054', shape: 'diamond' },
  slow: { label: 'Barely moving', color: '#c7a6ff', shape: 'square' },
  single: { label: 'Unconfirmed (1 visit)', color: '#9aa3c7', shape: 'dot' },
};

const D2R = Math.PI / 180;
export function sepDeg(ra1, dec1, ra2, dec2) {
  const c = Math.sin(dec1 * D2R) * Math.sin(dec2 * D2R) + Math.cos(dec1 * D2R) * Math.cos(dec2 * D2R) * Math.cos((ra1 - ra2) * D2R);
  return Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
}

export async function loadIndex() {
  try {
    const r = await fetch(`${GS_BASE}/movers/index.json`, { cache: 'no-cache' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const tileCache = new Map();
export function loadTile(npix) {
  if (!tileCache.has(npix)) {
    tileCache.set(npix, fetch(`${GS_BASE}/movers/tiles/${npix}.json`)
      .then((r) => (r.ok ? r.json() : { movers: [] }))
      .then((d) => d.movers || [])
      .catch(() => { tileCache.delete(npix); return []; }));
  }
  return tileCache.get(npix);
}

// Tiles whose centre is within `radius` degrees of (ra, dec), only those that have movers.
export function tilesNear(index, ra, dec, radius) {
  return index.tiles.filter((t) => Object.keys(t.counts || {}).length && sepDeg(ra, dec, t.ra, t.dec) <= radius).map((t) => t.npix);
}

export const moverName = (m) => (m.known ? m.known.name : `GS ${m.sweep} #${m.id.split('-').pop()}`);

export function fmtRate(m) {
  if (m.rate_deg_day == null) return '—';
  const r = m.rate_deg_day;
  return `${r.toFixed(3)}°/day (${(r * 3600 / 24).toFixed(1)}″/h)`;
}

export const paName = (pa) => (pa == null ? '' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(pa / 45) % 8]);

export function mpcLink(m) {
  if (!m.known) return null;
  const n = m.known.name.replace(/^\((\d+)\).*$/, '$1');
  return `https://minorplanetcenter.net/db_search/show_object?object_id=${encodeURIComponent(n)}`;
}
export function jplLink(m) {
  if (!m.known) return null;
  const n = m.known.name.replace(/^\((\d+)\).*$/, '$1');
  return `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(n)}`;
}

// Parse "RA Dec" in degrees or sexagesimal ("01 54 40.8 +11 54 36").
export function parseCoords(s) {
  const t = s.trim().replace(/[,;]/g, ' ').replace(/[hmsd°′″'"]/g, ' ').split(/\s+/).filter(Boolean);
  if (t.length === 2) {
    const ra = +t[0], dec = +t[1];
    if (Number.isFinite(ra) && Number.isFinite(dec) && Math.abs(dec) <= 90) return { ra: ((ra % 360) + 360) % 360, dec };
  }
  if (t.length === 6) {
    const [h, m, sec, d, dm, ds] = t.map(Number);
    if ([h, m, sec, d, dm, ds].every(Number.isFinite)) {
      const sign = t[3].startsWith('-') ? -1 : 1;
      return { ra: (h + m / 60 + sec / 3600) * 15, dec: sign * (Math.abs(d) + dm / 60 + ds / 3600) };
    }
  }
  return null;
}
