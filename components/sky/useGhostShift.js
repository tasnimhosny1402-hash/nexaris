'use client';

// GhostShift layers inside the Sky View: mover markers and motion playback (loaded per tile as you pan/zoom),
// the processed-area coverage, and the SPHEREx deep image / mover map HiPS overlays.

import { useCallback, useEffect, useRef, useState } from 'react';
import { CLASSES, GS_BASE, loadIndex, loadTile, tilesNear, sepDeg } from '@/lib/movers';

// Fields in the published data (older data had a single region and top-level sweeps).
export const regionsOf = (index) => (!index ? [] : index.regions?.length ? index.regions
  : [{ name: 'slipher', label: 'Pilot area', ra: index.region.ra, dec: index.region.dec, tiles: index.region.tiles, radius: 5.5, sweeps: index.sweeps }]);

const ORDER = ['tracklet', 'slow', 'known', 'single'];

export function useGhostShift({ aladinRef, ARef, hostRef, ready, live, redraw }) {
  const [index, setIndex] = useState(undefined);           // undefined = loading, null = no data published
  const [layers, setLayers] = useState({ movers: true, coverage: false, image: false, map: false, unconfirmed: false });
  const [inView, setInView] = useState([]);
  const [area, setArea] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [objsReady, setObjsReady] = useState(false);
  const objs = useRef({});
  const loaded = useRef(new Map());
  const loadedTiles = useRef(new Set());
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const timer = useRef(0);

  // Motion playback: movers glide along their tracks through a sweep (time in MJD).
  const [motion, setMotion] = useState(null);          // { sweep, t0, t1, playing, speed }
  const [tNow, setTNow] = useState(0);
  const [movingCount, setMovingCount] = useState(0);
  const tRef = useRef(0);
  const rangeRef = useRef({ t0: 0, t1: 1 });
  const [range, setRange] = useState({ t0: 0, t1: 1 });
  const userClosed = useRef(false);
  const userSweep = useRef(null);
  const motionRef = useRef(null);
  motionRef.current = motion;
  // The field nearest the centre of the view: playback uses its sweeps.
  const [region, setRegion] = useState(null);
  const regionRef = useRef(null);
  const curSweeps = () => (regionRef.current || regionsOf(index)[0] || { sweeps: {} }).sweeps;
  const inSweep = (m, mo) => m.sweep === mo.sweep && (!m.region || !regionRef.current || m.region === regionRef.current.name);

  useEffect(() => { loadIndex().then(setIndex); }, []);
  useEffect(() => { const r = regionsOf(index)[0]; if (r && !regionRef.current) { regionRef.current = r; setRegion(r); } }, [index]);

  const visible = (m) => m.cls !== 'single' || layersRef.current.unconfirmed;

  /* ---------- drawing ---------- */
  const drawPoint = useCallback((src, ctx, vp) => {
    const { m, last } = src.data;
    const meta = CLASSES[m.cls];
    const S = live.current.sel;
    const on = S.kind === 'mover' && S.m.id === m.id;
    const fov = vp.fov[0];
    ctx.save();
    ctx.strokeStyle = meta.color; ctx.fillStyle = meta.color;
    if (!last) {
      ctx.globalAlpha = on ? 1 : 0.8;
      ctx.beginPath(); ctx.arc(src.x, src.y, fov > 5 ? 1.5 : 2.5, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    const R = (fov > 6 ? 4 : fov > 1.5 ? 6 : 8) * (m.cls === 'single' ? 0.7 : 1);
    ctx.lineWidth = on ? 2.5 : 1.8; ctx.shadowColor = meta.color; ctx.shadowBlur = on ? 14 : 6;
    ctx.beginPath();
    if (meta.shape === 'diamond') { ctx.moveTo(src.x, src.y - R * 1.25); ctx.lineTo(src.x + R * 1.25, src.y); ctx.lineTo(src.x, src.y + R * 1.25); ctx.lineTo(src.x - R * 1.25, src.y); ctx.closePath(); }
    else if (meta.shape === 'square') ctx.rect(src.x - R, src.y - R, 2 * R, 2 * R);
    else if (meta.shape === 'dot') ctx.arc(src.x, src.y, R * 0.6, 0, 7);
    else ctx.arc(src.x, src.y, R, 0, 7);
    meta.shape === 'dot' ? ctx.fill() : ctx.stroke();
    ctx.shadowBlur = 0;
    if (on) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(src.x, src.y, R + 7, 0, 7); ctx.stroke();
    }
    if (on || (fov < 1.2 && m.cls !== 'single')) {
      ctx.font = (on ? '700 ' : '600 ') + '12px "Instrument Sans",sans-serif'; ctx.fillStyle = meta.color;
      ctx.fillText(m.known ? m.known.name : CLASSES[m.cls].label, src.x + R + 6, src.y + 4);
    }
    ctx.restore();
  }, [live]);

  // Playback marker: a glowing dot at the mover's position "now", plus fading tail dots behind it.
  const drawNow = useCallback((src, ctx, vp) => {
    const { m, tail, a } = src.data;
    const meta = CLASSES[m.cls];
    const S = live.current.sel;
    const on = S.kind === 'mover' && S.m.id === m.id;
    ctx.save();
    ctx.fillStyle = meta.color;
    if (tail) {
      ctx.globalAlpha = a * 0.45;
      ctx.beginPath(); ctx.arc(src.x, src.y, 1.6, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    // simple highlight: a ring in the class colour around a bright centre
    const R = vp.fov[0] > 6 ? 5 : 8;
    ctx.globalAlpha = a;
    ctx.strokeStyle = meta.color; ctx.lineWidth = on ? 2.5 : 1.8;
    ctx.shadowColor = meta.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(src.x, src.y, R, 0, 7); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(src.x, src.y, 1.8, 0, 7); ctx.fill();
    if (on) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(src.x, src.y, R + 6, 0, 7); ctx.stroke();
    }
    if (on || (vp.fov[0] < 1.5 && m.known)) {
      ctx.font = (on ? '700 ' : '600 ') + '12px "Instrument Sans",sans-serif'; ctx.fillStyle = meta.color;
      ctx.fillText(m.known ? m.known.name : CLASSES[m.cls].label, src.x + R + 6, src.y + 4);
    }
    ctx.restore();
  }, [live]);

  /* ---------- rebuild still markers from what is loaded ---------- */
  const rebuild = useCallback(() => {
    const A = ARef.current, o = objs.current;
    if (!A || !o.cat) return;
    o.cat.removeAll();
    const srcs = [];
    const mo = motionRef.current;
    for (const m of loaded.current.values()) {
      if (!visible(m)) continue;
      if (mo && !inSweep(m, mo)) continue;                 // during playback, only the sweep being played
      m.points.forEach((p, k) => srcs.push(A.source(p.ra, p.dec, { kind: 'mover', m, last: k === m.points.length - 1 })));
    }
    o.cat.addSources(srcs);
    redraw();
  }, [ARef, redraw]);

  const computeInView = useCallback(() => {
    const a = aladinRef.current, host = hostRef.current;
    if (!a || !host) return;
    const w = host.clientWidth, h = host.clientHeight, out = [];
    for (const m of loaded.current.values()) {
      if (!visible(m)) continue;
      const hit = m.points.some((p) => {
        const xy = a.world2pix(p.ra, p.dec);
        return xy && xy[0] >= 0 && xy[0] <= w && xy[1] >= 0 && xy[1] <= h;
      });
      if (hit) out.push(m);
    }
    out.sort((x, y) => ORDER.indexOf(x.cls) - ORDER.indexOf(y.cls) || y.snr_max - x.snr_max);
    setInView(out);
  }, [aladinRef, hostRef]);

  // Fetch the tiles around the current view that are not loaded yet, then refresh the list.
  const refresh = useCallback(async () => {
    const a = aladinRef.current;
    if (!a || !index) return;
    const [ra, dec] = a.getRaDec();
    const fov = Math.max(...a.getFov());
    const regs = regionsOf(index);
    if (regs.length) {
      const near = regs.reduce((b, r) => (sepDeg(ra, dec, r.ra, r.dec) < sepDeg(ra, dec, b.ra, b.dec) ? r : b));
      if (regionRef.current?.name !== near.name) { regionRef.current = near; setRegion(near); }
    }
    const want = tilesNear(index, ra, dec, Math.min(180, fov * 0.75 + 0.8)).filter((t) => !loadedTiles.current.has(t));
    if (want.length) {
      want.forEach((t) => loadedTiles.current.add(t));
      const lists = await Promise.all(want.map(loadTile));
      lists.flat().forEach((m) => loaded.current.set(m.id, m));
      rebuild();
    }
    computeInView();
  }, [aladinRef, index, rebuild, computeInView]);

  const onView = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 250);
  }, [refresh]);

  /* ---------- create Aladin objects once the viewer and the index are ready ---------- */
  useEffect(() => {
    const a = aladinRef.current, A = ARef.current;
    if (!ready || !index || !a || objs.current.cat) return;
    const cat = A.catalog({ name: 'Movers', shape: drawPoint, sourceSize: 14 });
    a.addCatalog(cat);
    const areaOv = A.graphicOverlay({ name: 'Selected area', color: '#8fd3ff', lineWidth: 1.5 });
    a.addOverlay(areaOv);
    const timeCat = A.catalog({ name: 'Movers now', shape: drawNow, sourceSize: 14 });
    a.addCatalog(timeCat);
    timeCat.hide();
    objs.current = { cat, areaOv, timeCat };
    setObjsReady(true);
    refresh();
  }, [ready, index, aladinRef, ARef, drawPoint, drawNow, refresh]);

  /* ---------- layer switches ---------- */
  useEffect(() => {
    const a = aladinRef.current, A = ARef.current, o = objs.current;
    if (!a || !o.cat) return;
    layers.movers && !motionRef.current ? o.cat.show() : o.cat.hide();
    // Coverage outline: created when switched on, removed when switched off (a MOC still loading
    // must not be shown/hidden, Aladin throws "MOC not found").
    if (layers.coverage && !o.moc) {
      const tiles = index.tiles.filter((t) => t.status === 'ok').map((t) => t.npix);
      o.moc = A.MOCFromJSON({ [index.order]: tiles }, { name: 'GhostShift coverage', color: '#8fd3ff', fill: false, opacity: 0.6, lineWidth: 1, perimeter: true });
      a.addMOC(o.moc);
    } else if (!layers.coverage && o.moc) {
      try { a.removeLayer(o.moc); } catch { /* still loading: Aladin drops it on its own */ }
      o.moc = null;
    }
    const hips = (key, on, path, name) => {
      const has = !!o[key];
      if (on && !has) {
        o[key] = true;
        // no trailing slash: Aladin adds one itself, and R2 treats "//" as a different file name
        a.setOverlayImageLayer(A.HiPS(new URL(`${GS_BASE}/${path}`, location.href).href, { name }), key);
      } else if (!on && has) {
        a.removeImageLayer(key); o[key] = false;
      }
    };
    hips('gs-deep', layers.image, index?.layers.deep, 'SPHEREx D2 deep (pilot)');
    if (layers.image && layers.map && o['gs-map']) { a.removeImageLayer('gs-map'); o['gs-map'] = false; }  // keep the map on top
    hips('gs-map', layers.map, index?.layers.movers, 'GhostShift mover map');
    rebuild(); computeInView();
  }, [layers, index, objsReady, aladinRef, ARef, rebuild, computeInView]);

  const toggle = (k) => setLayers((L) => ({ ...L, [k]: !L[k] }));

  /* ---------- motion playback ---------- */
  // Where a mover is at time t: interpolate between visits, extrapolate up to half a day past the ends.
  const positionAt = (m, t) => {
    const p = m.points;
    if (p.length === 1) {
      const d = Math.abs(t - p[0].mjd);
      return d <= 0.12 ? { ra: p[0].ra, dec: p[0].dec, a: 1 - d / 0.15 } : null;
    }
    const n = p.length;
    const lerp = (A, B, f) => ({ ra: (A.ra + (((B.ra - A.ra + 540) % 360) - 180) * f + 360) % 360, dec: A.dec + (B.dec - A.dec) * f });
    if (t < p[0].mjd) {
      const lead = p[0].mjd - t;
      if (lead > 0.5) return null;
      return { ...lerp(p[0], p[1], -lead / (p[1].mjd - p[0].mjd)), a: 1 - lead / 0.6 };
    }
    if (t > p[n - 1].mjd) {
      const lag = t - p[n - 1].mjd;
      if (lag > 0.5) return null;
      return { ...lerp(p[n - 2], p[n - 1], 1 + lag / (p[n - 1].mjd - p[n - 2].mjd)), a: 1 - lag / 0.6 };
    }
    let k = 0;
    while (k < n - 2 && t > p[k + 1].mjd) k++;
    return { ...lerp(p[k], p[k + 1], (t - p[k].mjd) / (p[k + 1].mjd - p[k].mjd)), a: 1 };
  };

  const renderMotion = useCallback(() => {
    const A = ARef.current, o = objs.current, mo = motionRef.current;
    if (!A || !o.timeCat || !mo) return;
    const t = tRef.current, srcs = [];
    let moving = 0;
    for (const m of loaded.current.values()) {
      if (!inSweep(m, mo) || !visible(m)) continue;
      const now = positionAt(m, t);
      if (!now) continue;
      const xy = aladinRef.current?.world2pix(now.ra, now.dec), host = hostRef.current;
      if (xy && host && xy[0] >= 0 && xy[0] <= host.clientWidth && xy[1] >= 0 && xy[1] <= host.clientHeight) moving++;
      if (m.points.length > 1) {
        const gap = (rangeRef.current.t1 - rangeRef.current.t0) / 60;
        for (let k = 3; k >= 1; k--) {
          const q = positionAt(m, t - k * gap);
          if (q) srcs.push(A.source(q.ra, q.dec, { kind: 'tail', m, tail: true, a: (1 - k / 4) * q.a }));
        }
      }
      srcs.push(A.source(now.ra, now.dec, { kind: 'mover', m, a: Math.max(0.15, now.a) }));
    }
    o.timeCat.removeAll();
    o.timeCat.addSources(srcs);
    setMovingCount(moving);
    redraw();
  }, [ARef, redraw]);

  const isoToMjd = (iso) => Date.parse(iso.replace(' ', 'T') + ':00Z') / 86400000 + 40587;

  const sweepRange = (s) => {
    const w = curSweeps()[s];
    return w ? { t0: isoToMjd(w.start) - 0.3, t1: isoToMjd(w.end) + 0.3 } : rangeRef.current;
  };
  // Loop over the time span of the movers in view, so zooming in on one object plays just its passage.
  const viewRange = (s, list) => {
    const ms = list.filter((m) => inSweep(m, { sweep: s }) && m.points.length > 1);
    if (!ms.length) return sweepRange(s);
    const t0 = Math.min(...ms.map((m) => m.points[0].mjd));
    const t1 = Math.max(...ms.map((m) => m.points[m.points.length - 1].mjd));
    const pad = Math.max(0.1, (t1 - t0) * 0.08);
    return { t0: t0 - pad, t1: t1 + pad };
  };
  const applyRange = (r) => {
    rangeRef.current = r; setRange(r);
    if (tRef.current < r.t0 || tRef.current > r.t1) { tRef.current = r.t0; setTNow(r.t0); }
  };
  const startMotion = (sweep) => {
    if (!index) return;
    userClosed.current = false;
    if (sweep) userSweep.current = sweep;
    const names = Object.keys(curSweeps());
    const s = sweep || (names.includes(userSweep.current) ? userSweep.current : names[names.length - 1]);
    applyRange(viewRange(s, inView));
    tRef.current = rangeRef.current.t0; setTNow(rangeRef.current.t0);
    setMotion({ sweep: s, playing: true, speed: 1 });
  };
  const stopMotion = () => { userClosed.current = true; setMotion(null); };

  // Playback is the default view: start it once the data and the viewer are ready.
  useEffect(() => {
    if (ready && index && objs.current.timeCat && !motion && !userClosed.current) startMotion();
  }, [ready, index, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the view: new loop range, and switch sweep when only the other sweep has movers here.
  useEffect(() => {
    if (!motion || !index) return;
    const names = Object.keys(curSweeps());
    if (!names.includes(motion.sweep) && names.length) {        // moved to another field: use its sweeps
      const s0 = names[names.length - 1];
      setMotion((mo) => (mo ? { ...mo, sweep: s0 } : mo)); applyRange(viewRange(s0, inView)); return;
    }
    const has = (s) => inView.some((m) => inSweep(m, { sweep: s }) && m.points.length > 1);
    if (!has(motion.sweep)) {
      const other = names.find((s) => s !== motion.sweep && has(s));
      if (other) { setMotion((mo) => (mo ? { ...mo, sweep: other } : mo)); applyRange(viewRange(other, inView)); return; }
    }
    applyRange(viewRange(motion.sweep, inView));
  }, [inView, motion?.sweep, region?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const setPlaying = (playing) => setMotion((mo) => (mo ? { ...mo, playing } : mo));
  const setSpeed = (speed) => setMotion((mo) => (mo ? { ...mo, speed } : mo));
  const seek = (t) => { tRef.current = t; setTNow(t); renderMotion(); };

  // Times of the visits in this sweep (from the movers loaded so far), for stepping.
  const visitTimes = () => {
    const mo = motionRef.current; if (!mo) return [];
    const set = new Set();
    for (const m of loaded.current.values()) if (inSweep(m, mo)) m.points.forEach((p) => set.add(Math.round(p.mjd * 50) / 50));
    return [...set].sort((a, b) => a - b);
  };
  const step = (dir) => {
    const ts = visitTimes(), t = tRef.current;
    const next = dir > 0 ? ts.find((x) => x > t + 0.005) : [...ts].reverse().find((x) => x < t - 0.005);
    if (next != null) { setPlaying(false); seek(next); }
  };

  // Switch between the normal markers and the playback markers.
  useEffect(() => {
    const o = objs.current; if (!o.timeCat) return;
    rebuild();
    if (motion) { o.cat.hide(); o.timeCat.show(); renderMotion(); }
    else { o.timeCat.hide(); o.timeCat.removeAll(); if (layersRef.current.movers) o.cat.show(); redraw(); }
  }, [motion?.sweep, !!motion, renderMotion, redraw, rebuild]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop: the current loop range plays in ~12 s at 1x, then repeats.
  useEffect(() => {
    if (!motion?.playing) return;
    let raf, last = performance.now(), lastDraw = 0, lastUi = 0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const { t0, t1 } = rangeRef.current;
      let t = tRef.current + dt * (t1 - t0) / 12 * motion.speed;
      if (t > t1) t = t0;
      tRef.current = t;
      if (now - lastDraw > 60) { renderMotion(); lastDraw = now; }
      if (now - lastUi > 150) { setTNow(t); lastUi = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motion?.playing, motion?.speed, renderMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // New tiles loaded while paused: redraw at the current time.
  useEffect(() => { if (motion && !motion.playing) renderMotion(); }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- area selection (drag a box on the map) ---------- */
  const selectArea = useCallback(async (x0, y0, x1, y1) => {
    const a = aladinRef.current, A = ARef.current;
    setSelecting(false);
    if (!a || !index) return;
    const [lx, hx, ly, hy] = [Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1)];
    if (hx - lx < 6 || hy - ly < 6) return;
    const corners = [[lx, ly], [hx, ly], [hx, hy], [lx, hy]].map(([x, y]) => a.pix2world(x, y)).filter(Boolean);
    const c = a.pix2world((lx + hx) / 2, (ly + hy) / 2);
    if (!c || corners.length < 4) return;
    const radius = Math.max(...corners.map(([r, d]) => Math.hypot((r - c[0]) * Math.cos(c[1] * Math.PI / 180), d - c[1]))) + 0.8;
    const want = tilesNear(index, c[0], c[1], radius).filter((t) => !loadedTiles.current.has(t));
    if (want.length) {
      want.forEach((t) => loadedTiles.current.add(t));
      (await Promise.all(want.map(loadTile))).flat().forEach((m) => loaded.current.set(m.id, m));
      rebuild();
    }
    const inside = [];
    for (const m of loaded.current.values()) {
      if (!visible(m)) continue;
      if (m.points.some((p) => { const xy = a.world2pix(p.ra, p.dec); return xy && xy[0] >= lx && xy[0] <= hx && xy[1] >= ly && xy[1] <= hy; })) inside.push(m);
    }
    inside.sort((x, y) => ORDER.indexOf(x.cls) - ORDER.indexOf(y.cls) || y.snr_max - x.snr_max);
    objs.current.areaOv.removeAll();
    objs.current.areaOv.add(A.polygon(corners, { color: '#8fd3ff', lineWidth: 1.5 }));
    setArea({ movers: inside, center: c, corners });
  }, [aladinRef, ARef, index, rebuild]);

  const clearArea = () => { objs.current.areaOv?.removeAll(); setArea(null); };

  return {
    index, layers, toggle, inView, area, selectArea, clearArea, selecting, setSelecting, onView,
    region, regions: regionsOf(index), motion, tNow, range, movingCount, startMotion, stopMotion, setPlaying, setSpeed, seek, step,
  };
}
