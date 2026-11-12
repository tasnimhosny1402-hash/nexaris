'use client';

// Sky View: an Aladin Lite v3 viewer (real HiPS surveys + FITS images) dressed in the
// original NexAris planetarium look: same toolbar, zoom buttons, readout, legend and tooltip.

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  TARGETS, SURVEYS, STARS, CONSTELLATIONS, SPECTRAL_COLORS as SPC,
  aladinUrl, fmtRA, fmtDec, fmtFov,
} from '@/lib/sky-data';
import { askInChat } from '@/lib/legacy';
import { useGhostShift } from '@/components/sky/useGhostShift';
import { MoversPanel, MoverDetails, MotionBar } from '@/components/sky/MoversPanel';
import { CLASSES, moverName, fmtRate } from '@/lib/movers';

const D2R = Math.PI / 180;
const START = { ra: 84, dec: -2, fov: 50 };
const SAMPLE_FITS = { name: 'HST FOC sample (NASA FITS samples)', url: 'https://fits.gsfc.nasa.gov/samples/FOCx38i0101t_c0f.fits' };
const COLORMAPS = ['grayscale', 'viridis', 'inferno', 'magma', 'plasma', 'cubehelix', 'rainbow', 'redtemperature', 'native'];
// Remote FITS go through our own proxy (app/api/fits) so servers without CORS headers still work.
const viaProxy = (url) => '/api/fits?url=' + encodeURIComponent(url);
const STRETCHES = ['linear', 'asinh', 'log', 'sqrt', 'pow2'];

const LAYERS = [
  ['lines', 'Constellations'],
  ['names', 'Names'],
  ['grid', 'Grid'],
  ['stars', 'Star colors'],
  ['dso', 'Targets'],
  ['night', 'Night vision'],
];

const STAR_INDEX = Object.fromEntries(STARS.map((s) => [s[0], s]));

// Mean direction of a constellation's stars, for its label position.
function constellationCenter(segs) {
  let x = 0, y = 0, z = 0;
  for (const [a] of segs) {
    const s = STAR_INDEX[a];
    const ra = s[1] * D2R, dec = s[2] * D2R;
    x += Math.cos(dec) * Math.cos(ra); y += Math.cos(dec) * Math.sin(ra); z += Math.sin(dec);
  }
  const ra = (Math.atan2(y, x) / D2R + 360) % 360;
  const dec = Math.atan2(z, Math.hypot(x, y)) / D2R;
  return [ra, dec];
}

const Spinner = () => <i aria-hidden="true" />;

export default function SkyView() {
  const hostRef = useRef(null);
  const planetRef = useRef(null);
  const fileRef = useRef(null);
  const aladinRef = useRef(null);
  const ARef = useRef(null);
  const startedRef = useRef(false);
  const overlaysRef = useRef({});
  const fitsSeq = useRef(0);
  const blobUrls = useRef({});
  const fitsLayers = useRef({});

  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [errMsg, setErrMsg] = useState('');
  const [layers, setLayers] = useState({ lines: true, names: true, grid: true, stars: true, dso: true, night: false });
  const [survey, setSurvey] = useState(SURVEYS[1].id);
  const [sel, setSel] = useState({ kind: 'target', t: TARGETS[0] });
  const [readout, setReadout] = useState('Loading sky…');
  const [tip, setTip] = useState(null);
  const [fits, setFits] = useState([]);
  const [fitsUrl, setFitsUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const kickRef = useRef(() => {});

  // Sky tiles loading indicator. Aladin does not report tile loading, but the browser reports every
  // image it finishes downloading: while HiPS tiles (…/Norder…/Npix…) keep arriving, show the spinner;
  // hide it shortly after the last one. A zoom or survey change also shows it briefly, since that
  // almost always needs new tiles.
  const [tilesLoading, setTilesLoading] = useState(false);
  const lastTile = useRef(0);
  const kicked = useRef(0);
  const kick = useCallback(() => { kicked.current = performance.now(); }, []);
  kickRef.current = kick;
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    const isTile = (n) => /\/Norder\d+\/(Dir\d+\/Npix\d+|Allsky)\./.test(n);
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (isTile(e.name)) lastTile.current = performance.now();
    });
    try { po.observe({ type: 'resource' }); } catch { return; }
    const id = setInterval(() => {
      const now = performance.now();
      const busy = now - lastTile.current < 700 || now - kicked.current < 1500;
      setTilesLoading((b) => (b === busy ? b : busy));
      if (performance.getEntriesByType('resource').length > 200) performance.clearResourceTimings();
    }, 200);
    return () => { po.disconnect(); clearInterval(id); };
  }, []);

  // Values the canvas shape functions read while Aladin redraws.
  const live = useRef({ layers, sel });
  live.current = { layers, sel };

  const redraw = useCallback(() => aladinRef.current?.view?.requestRedraw?.(), []);

  // GhostShift movers (SPHEREx pipeline output): markers, motion playback, coverage and HiPS layers.
  const gs = useGhostShift({ aladinRef, ARef, hostRef, ready: status === 'ready', live, redraw });
  const gsRef = useRef(gs);
  gsRef.current = gs;

  /* ---------- custom shapes drawn on Aladin's catalog canvas ---------- */
  const drawStar = useCallback((src, ctx, vp) => {
    const { layers: L, sel: S } = live.current;
    const d = src.data, fov = vp.fov[0];
    const c = L.stars ? SPC[d.cls] : '#ffffff';
    const k = Math.min(1.6, Math.max(0.7, 60 / fov));
    const R = Math.max(0.5, (5.6 - d.mag) * 0.9) * k;
    // Wide fields: glowing dots like the planetarium. Narrow fields: a light ring so the real image shows.
    const glow = Math.max(0, Math.min(1, (fov - 4) / 12));
    ctx.save();
    if (glow > 0) {
      ctx.globalAlpha = glow;
      const g = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, R * 3.2);
      g.addColorStop(0, c); g.addColorStop(0.35, c + '55'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(src.x, src.y, R * 3.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(src.x, src.y, R * 0.55, 0, 7); ctx.fill();
    }
    if (glow < 1) {
      ctx.globalAlpha = 1 - glow;
      ctx.strokeStyle = c; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(src.x, src.y, 10, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const on = S.kind === 'star' && S.s[0] === d.name;
    if (on) {
      ctx.strokeStyle = '#ffb054'; ctx.lineWidth = 2.5; ctx.shadowColor = '#ffb054'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(src.x, src.y, Math.max(12, R * 2.2), 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    }
    if ((L.names && d.mag < 1.4) || on) {
      ctx.font = '12px "Instrument Sans",sans-serif'; ctx.fillStyle = 'rgba(238,241,255,.82)';
      ctx.fillText(d.name, src.x + R + 5, src.y - R - 2);
    }
    ctx.restore();
  }, []);

  const drawTarget = useCallback((src, ctx) => {
    const { layers: L, sel: S } = live.current;
    const t = TARGETS[src.data.idx];
    const on = S.kind === 'target' && S.t === t, R = on ? 13 : 9, x = src.x, y = src.y;
    ctx.save();
    ctx.strokeStyle = t.c; ctx.lineWidth = on ? 2.5 : 1.6; ctx.shadowColor = t.c; ctx.shadowBlur = on ? 14 : 6;
    ctx.beginPath();
    if (/Planetary/.test(t.type)) { ctx.arc(x, y, R, 0, 7); ctx.moveTo(x + 2, y); ctx.arc(x, y, 2, 0, 7); }
    else if (/nebula|region/i.test(t.type)) { ctx.rect(x - R, y - R, R * 2, R * 2); }
    else { ctx.arc(x, y, R, 0, 7); ctx.moveTo(x - R - 5, y); ctx.lineTo(x - R + 2, y); ctx.moveTo(x + R - 2, y); ctx.lineTo(x + R + 5, y); }
    ctx.stroke(); ctx.shadowBlur = 0;
    if (on || L.names) {
      ctx.font = (on ? '700 ' : '600 ') + '12px "Instrument Sans",sans-serif'; ctx.fillStyle = t.c;
      ctx.fillText(t.name, x + R + 6, y + 4);
    }
    ctx.restore();
  }, []);

  const drawConName = useCallback((src, ctx, vp) => {
    if (!live.current.layers.names || vp.fov[0] < 8) return;
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono",monospace'; ctx.fillStyle = 'rgba(199,166,255,.75)'; ctx.textAlign = 'center';
    ctx.fillText(src.data.name.toUpperCase(), src.x, src.y + 26);
    ctx.restore();
  }, []);

  /* ---------- readout ---------- */
  const updateReadout = useCallback(() => {
    const a = aladinRef.current; if (!a) return;
    const [ra, dec] = a.getRaDec(); const fov = a.getFov()[0];
    setReadout(`Center RA ${fmtRA(ra)} · Dec ${fmtDec(dec)} · FOV ${fmtFov(fov)}`);
  }, []);

  /* ---------- create the viewer the first time Sky View is shown ---------- */
  useEffect(() => {
    let cancelled = false;
    const visible = () => location.hash === '#sky';

    const create = async () => {
      if (!visible() || startedRef.current) return;
      startedRef.current = true;
      setStatus('loading');
      try {
        const A = (await import('aladin-lite')).default;
        await A.init;
        if (cancelled) return;
        ARef.current = A;
        const aladin = A.aladin(hostRef.current, {
          survey: SURVEYS[1].url,
          target: `${START.ra} ${START.dec}`,
          fov: START.fov,
          cooFrame: 'ICRS',
          projection: 'SIN',
          backgroundColor: 'rgb(1, 2, 8)',
          showReticle: false, showZoomControl: false, showFullscreenControl: false, showLayersControl: false,
          showGotoControl: false, showFrame: false, showCooLocation: false, showFov: false, showProjectionControl: false,
          showStatusBar: false, showContextMenu: false, showCooGridControl: false, showSettingsControl: false,
          showShareControl: false, showSimbadPointerControl: false, showColorPickerControl: false,
          gridOptions: { enabled: true, color: 'rgb(143, 211, 255)', opacity: 0.25, labelSize: 10, thickness: 1, showLabels: true },
          log: false,
        });
        aladinRef.current = aladin;

        // Constellation lines
        const lines = A.graphicOverlay({ name: 'Constellations', color: 'rgba(143,211,255,0.5)', lineWidth: 1.2 });
        aladin.addOverlay(lines);
        for (const [, , segs] of CONSTELLATIONS) for (const [a, b] of segs) {
          const s1 = STAR_INDEX[a], s2 = STAR_INDEX[b];
          lines.add(A.polyline([[s1[1], s1[2]], [s2[1], s2[2]]]));
        }
        // Constellation names
        const conNames = A.catalog({ name: 'Constellation names', shape: drawConName, sourceSize: 8 });
        aladin.addCatalog(conNames);
        conNames.addSources(CONSTELLATIONS.map(([name, ab, segs]) => { const [ra, dec] = constellationCenter(segs); return A.source(ra, dec, { kind: 'con', name, ab }); }));
        // Bright stars
        const stars = A.catalog({ name: 'Bright stars', shape: drawStar, sourceSize: 14 });
        aladin.addCatalog(stars);
        stars.addSources(STARS.map((s) => A.source(s[1], s[2], { kind: 'star', name: s[0], mag: s[3], cls: s[4], con: s[5] })));
        // Targets (drawn last, on top)
        const targets = A.catalog({ name: 'Targets', shape: drawTarget, sourceSize: 26 });
        aladin.addCatalog(targets);
        targets.addSources(TARGETS.map((t, idx) => A.source(t.ra, t.dec, { kind: 'target', idx, name: t.name })));
        overlaysRef.current = { lines, conNames, stars, targets };

        aladin.on('objectHovered', (obj, xy) => {
          const d = obj?.data; if (!d || !xy) return;
          if (d.kind === 'con' && !live.current.layers.names) return;
          if (d.kind === 'mover') { setTip({ x: xy.x, y: xy.y, d: { kind: 'mover', m: d.m } }); return; }
          setTip({ x: xy.x, y: xy.y, d });
        });
        aladin.on('objectHoveredStop', () => setTip(null));
        aladin.on('objectClicked', (obj) => {
          const d = obj?.data; if (!d) return;
          if (d.kind === 'target') pickRef.current(TARGETS[d.idx]);
          else if (d.kind === 'star') pickRef.current(STAR_INDEX[d.name], 'star');
          else if (d.kind === 'mover') pickRef.current(d.m, 'mover', false);
        });
        const onView = () => { updateReadout(); gsRef.current.onView(); };
        aladin.on('positionChanged', onView);
        aladin.on('zoomChanged', () => { onView(); kickRef.current(); });
        updateReadout();
        setStatus('ready');
      } catch (e) {
        console.error('Aladin Lite failed to start', e);
        if (cancelled) return;
        startedRef.current = false;
        setErrMsg(String(e && e.message ? e.message : e).includes('WebGL2')
          ? 'This browser does not support WebGL2, which Aladin Lite needs to draw the sky.'
          : 'The sky viewer could not load. Check your connection and reload the page.');
        setStatus('error');
      }
    };

    const onHash = () => {
      create();
      if (visible() && aladinRef.current) requestAnimationFrame(() => aladinRef.current?.view?.fixLayoutDimensions?.());
    };
    onHash();
    addEventListener('hashchange', onHash);
    return () => {
      cancelled = true;
      removeEventListener('hashchange', onHash);
      if (!aladinRef.current) startedRef.current = false;
    };
  }, [drawConName, drawStar, drawTarget, updateReadout]);

  // Free local file URLs on unmount.
  useEffect(() => () => Object.values(blobUrls.current).forEach((u) => URL.revokeObjectURL(u)), []);

  /* ---------- layer toggles ---------- */
  useEffect(() => {
    const a = aladinRef.current; if (!a || status !== 'ready') return;
    const o = overlaysRef.current;
    layers.lines ? o.lines.show() : o.lines.hide();
    layers.dso ? o.targets.show() : o.targets.hide();
    a.setCooGrid({ enabled: layers.grid });
    redraw();
  }, [layers, status]);

  useEffect(() => { redraw(); }, [sel]);

  // Expand mode: the sky box fills the window. Esc leaves it; the page behind does not scroll.
  useEffect(() => {
    document.body.classList.toggle('sky-expanded', expanded);
    const fit = () => aladinRef.current?.view?.fixLayoutDimensions?.();
    requestAnimationFrame(fit); const t = setTimeout(fit, 250);
    if (!expanded) return () => clearTimeout(t);
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    addEventListener('keydown', onKey);
    const leave = () => { if (location.hash !== '#sky') setExpanded(false); };
    addEventListener('hashchange', leave);
    return () => { clearTimeout(t); removeEventListener('keydown', onKey); removeEventListener('hashchange', leave); };
  }, [expanded]);
  useEffect(() => () => document.body.classList.remove('sky-expanded'), []);

  useEffect(() => {
    const a = aladinRef.current; if (!a || status !== 'ready') return;
    a.setBaseImageLayer(SURVEYS.find((s) => s.id === survey).url);
    kick();
  }, [survey, status]);

  const toggle = (k) => setLayers((L) => ({ ...L, [k]: !L[k] }));

  /* ---------- navigation ---------- */
  const flyTo = (ra, dec, fov) => {
    const a = aladinRef.current; if (!a) return;
    a.animateToRaDec(ra, dec, 1);
    if (fov) a.zoomToFoV(fov, 1);
  };
  const moverView = (m) => {
    const ras = m.points.map((p) => p.ra), decs = m.points.map((p) => p.dec);
    const ext = Math.max(Math.max(...ras) - Math.min(...ras), Math.max(...decs) - Math.min(...decs));
    return [(Math.max(...ras) + Math.min(...ras)) / 2, (Math.max(...decs) + Math.min(...decs)) / 2, Math.max(0.12, ext * 1.8)];
  };
  const pick = (item, kind = 'target', fly = true) => {
    if (kind === 'mover') { setSel({ kind: 'mover', m: item }); if (fly) flyTo(...moverView(item)); return; }
    if (kind === 'star') { setSel({ kind: 'star', s: item }); if (fly) flyTo(item[1], item[2], Math.min(aladinRef.current?.getFov()[0] ?? 10, 10)); }
    else { setSel({ kind: 'target', t: item }); if (fly) flyTo(item.ra, item.dec, item.fov); }
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  const selRaDec = sel.kind === 'target' ? [sel.t.ra, sel.t.dec, sel.t.fov] : sel.kind === 'mover' ? moverView(sel.m) : [sel.s[1], sel.s[2], 0.6];
  const zoomBy = (f) => { const a = aladinRef.current; if (!a) return; a.zoomToFoV(Math.min(180, Math.max(0.0005, a.getFov()[0] * f)), 0.25); };

  const onKey = (e) => {
    const a = aladinRef.current; if (!a) return;
    if (gs.motion) {   // playback keys: space = play/pause, comma / period = previous / next visit
      if (e.key === ' ') { e.preventDefault(); gs.setPlaying(!gs.motion.playing); return; }
      if (e.key === ',') { gs.step(-1); return; }
      if (e.key === '.') { gs.step(1); return; }
    }
    if (e.key === '+' || e.key === '=') { zoomBy(1 / 1.3); return; }
    if (e.key === '-') { zoomBy(1.3); return; }
    const k = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!k) return;
    e.preventDefault();
    const [ra, dec] = a.getRaDec(), st = a.getFov()[0] / 10;
    a.gotoRaDec((ra + k[0] * st / Math.max(0.2, Math.cos(dec * D2R)) + 360) % 360, Math.max(-89.9, Math.min(89.9, dec + k[1] * st)));
  };

  /* ---------- FITS images ---------- */
  const patchFits = (id, p) => setFits((list) => list.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const loadFits = (url, name, blob) => {
    const a = aladinRef.current, A = ARef.current; if (!a || !A) return;
    const id = 'fits-' + ++fitsSeq.current;
    if (blob) blobUrls.current[id] = url;
    setFits((list) => [...list, { id, name, status: 'loading', opacity: 1, colormap: 'grayscale', stretch: 'asinh', err: '' }]);
    try {
      const img = A.image(url, {
        name, imgFormat: 'fits', colormap: 'grayscale', stretch: 'asinh',
        successCallback: (ra, dec, fov) => {
          patchFits(id, { status: 'ok', ra, dec, fov });
          if (Number.isFinite(ra) && Number.isFinite(dec)) flyTo(ra, dec, Number.isFinite(fov) && fov > 0 ? fov * 1.15 : undefined);
        },
        errorCallback: () => {
          patchFits(id, { status: 'error', err: 'Could not read this file. It must be a FITS image with a celestial WCS header, and a URL must be reachable from the browser.' });
          delete fitsLayers.current[id];
        },
      });
      fitsLayers.current[id] = img;
      a.setOverlayImageLayer(img, id);
    } catch {
      patchFits(id, { status: 'error', err: 'Could not open this image.' });
    }
  };

  const setFitsOpt = (id, p) => {
    patchFits(id, p);
    const img = fitsLayers.current[id]; if (!img) return;
    const f = { ...fits.find((x) => x.id === id), ...p };
    if ('opacity' in p) img.setOpacity(p.opacity);
    if ('colormap' in p || 'stretch' in p) img.setColormap(f.colormap, { stretch: f.stretch });
  };

  const removeFits = (id) => {
    aladinRef.current?.removeImageLayer(id);
    delete fitsLayers.current[id];
    if (blobUrls.current[id]) { URL.revokeObjectURL(blobUrls.current[id]); delete blobUrls.current[id]; }
    setFits((list) => list.filter((f) => f.id !== id));
  };

  const openFile = (file) => { if (file) loadFits(URL.createObjectURL(file), file.name, true); };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (status === 'ready') openFile(e.dataTransfer.files?.[0]); };

  const ready = status === 'ready';
  const surv = SURVEYS.find((s) => s.id === survey);

  /* ---------- selected panel ---------- */
  let selPanel;
  if (sel.kind === 'target') {
    const t = sel.t;
    selPanel = { name: t.name, note: t.note, tag: t.band, tagColor: t.c, kv: [['Also known as', t.alias], ['Type', t.type], ['Distance', t.dist]], link: aladinUrl(t, survey), ask: `Tell me about ${t.name} and how it looks in infrared.` };
  } else if (sel.kind === 'star') {
    const s = sel.s, con = CONSTELLATIONS.find((c) => c[1] === s[5]);
    selPanel = { name: s[0], note: `A bright star in ${con ? con[0] : s[5]}.`, tag: 'Class ' + s[4], tagColor: SPC[s[4]], kv: [['Magnitude', String(s[3])], ['Spectral class', s[4] + ' type star'], ['RA, Dec (J2000)', s[1].toFixed(2) + '°, ' + s[2].toFixed(2) + '°']], link: aladinUrl({ ra: s[1], dec: s[2], fov: 0.6 }, survey), ask: `Tell me about ${s[0]}, the star, and how it looks in infrared.` };
  }

  return (
    <>
      <div className="head"><div><div className="eyebrow">Explore</div><h1>Sky View</h1><p>Pick a target to see it in real survey images. Compare visible light with near and mid infrared, the way SPHEREx sees the sky, or open your own FITS image on top.</p></div></div>
      <div className="grid2">
        <div className="panel"><h3>Sky map · J2000 <span className="tag" style={{ color: 'var(--ice)' }}>Drag · Zoom · Click</span></h3>
          <div
            ref={planetRef}
            className={'planet' + (layers.night ? ' night' : '') + (dragOver ? ' drop' : '') + (expanded ? ' expanded' : '')}
            id="planet" tabIndex={0}
            aria-label="Interactive sky map powered by Aladin Lite. Drag to pan, scroll or use plus and minus to zoom."
            onKeyDown={onKey}
            onDragOver={(e) => { if (ready && [...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); setDragOver(true); } }}
            onDragLeave={(e) => { if (!planetRef.current?.contains(e.relatedTarget)) setDragOver(false); }}
            onDrop={onDrop}
            onPointerLeave={() => setTip(null)}
          >
            <div className="aladin-host" ref={hostRef} />
            {status !== 'ready' && (
              <div className={'skymsg' + (status === 'error' ? ' err' : '')}>
                {status === 'error' ? errMsg : <span><Spinner />Loading sky survey…</span>}
              </div>
            )}
            <div className="tb" role="group" aria-label="Map layers">
              {LAYERS.map(([k, label]) => (
                <button key={k} type="button" aria-pressed={layers[k] ? 'true' : 'false'} onClick={() => toggle(k)} disabled={k !== 'night' && !ready}>{label}</button>
              ))}
              {gs.index && (
                <button type="button" className="tb-motion" aria-pressed={gs.motion ? 'true' : 'false'} disabled={!ready}
                  onClick={() => (gs.motion ? gs.stopMotion() : gs.startMotion())}>{gs.motion ? '❚❚ Motion' : '▶ Motion'}</button>
              )}
            </div>
            <div className="surv" role="group" aria-label="Survey">
              {SURVEYS.map((s) => (
                <button key={s.id} type="button" aria-pressed={survey === s.id ? 'true' : 'false'} onClick={() => setSurvey(s.id)} disabled={!ready}><i style={{ '--c': s.c }} />{s.label}</button>
              ))}
            </div>
            <div className="zm">
              <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1 / 1.5)} disabled={!ready}>+</button>
              <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1.5)} disabled={!ready}>−</button>
              <button type="button" aria-label="Center on selected target" style={{ fontSize: '13px' }} onClick={() => flyTo(...selRaDec)} disabled={!ready}>◎</button>
              <button type="button" aria-label={expanded ? 'Exit expanded view' : 'Expand the sky view'} title={expanded ? 'Exit (Esc)' : 'Expand'}
                aria-pressed={expanded ? 'true' : 'false'} style={{ fontSize: '16px' }} onClick={() => setExpanded(!expanded)}>{expanded ? '⤡' : '⤢'}</button>
            </div>
            <div className="leg" aria-hidden="true"><i style={{ width: '9px', height: '9px', background: surv?.c }} />{surv?.label}{fits.some((f) => f.status === 'ok') ? ' + FITS' : ''}</div>
            <div className="readout" id="radec">{readout}</div>
            <div className={'tileload' + (ready && tilesLoading ? ' on' : '')} role="status" aria-live="polite">
              {ready && tilesLoading ? <><i aria-hidden="true" />Loading sky images…</> : null}
            </div>
            <MotionBar gs={gs} />
            {gs.selecting && <SelectBox onDone={gs.selectArea} onCancel={() => gs.setSelecting(false)} />}
            {tip && (
              <div className="tip" style={{ left: tip.x + 'px', top: tip.y + 'px' }}>
                {tip.d.kind === 'target' && (() => { const t = TARGETS[tip.d.idx]; return <><b>{t.name}</b>{t.type} · click for details</>; })()}
                {tip.d.kind === 'star' && <><b>{tip.d.name}</b>mag {tip.d.mag} · class {tip.d.cls} · {tip.d.con}</>}
                {tip.d.kind === 'con' && <><b>{tip.d.name}</b>Constellation</>}
                {tip.d.kind === 'mover' && <><b style={{ color: CLASSES[tip.d.m.cls].color }}>{moverName(tip.d.m)}</b>{CLASSES[tip.d.m.cls].label} · {tip.d.m.n} visit{tip.d.m.n > 1 ? 's' : ''}{tip.d.m.rate_deg_day != null ? ' · ' + fmtRate(tip.d.m) : ''}</>}
              </div>
            )}
          </div>
          <div className="note">Real sky images from Aladin Lite (CDS): DSS2 in visible light, 2MASS in near infrared and AllWISE in mid infrared. Bright stars, constellation lines and targets are drawn at their real positions (approximate). Drop a FITS file on the map to open it.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          {sel.kind === 'mover' ? (
            <MoverDetails m={sel.m} onZoom={() => flyTo(...moverView(sel.m))}
              onAsk={() => askInChat(sel.m.known
                ? `Tell me about the asteroid ${sel.m.known.name}. SPHEREx saw it in ${sel.m.n} visits moving ${fmtRate(sel.m)}.`
                : `SPHEREx saw a faint object in ${sel.m.n} visits moving ${fmtRate(sel.m)} that matches no known asteroid brighter than magnitude 20.5. What should astronomers check before calling it new?`)} />
          ) : (
          <div className="panel"><h3>Selected target <span className="tag" style={{ color: selPanel.tagColor }}>{selPanel.tag}</span></h3>
            <div><h2 style={{ fontFamily: 'var(--display)', fontSize: '22px' }}>{selPanel.name}</h2><p className="note" style={{ marginTop: '4px' }}>{selPanel.note}</p></div>
            <dl className="kv">{selPanel.kv.map(([k, v]) => <FragmentKV key={k} k={k} v={v} />)}</dl>
            <div className="links">
              {SURVEYS.map((s) => (
                <button key={s.id} type="button" aria-pressed={survey === s.id ? 'true' : 'false'} disabled={!ready}
                  onClick={() => { setSurvey(s.id); flyTo(...selRaDec); }}><i style={{ '--c': s.c }} />{s.label}</button>
              ))}
              <a href={selPanel.link} target="_blank" rel="noopener"><i style={{ '--c': 'var(--violet)' }} />Open in Aladin ↗</a>
            </div>
            <button className="btn ghost sm" type="button" onClick={() => askInChat(selPanel.ask)}>Ask the agent about this target</button>
          </div>
          )}
          <BandsPanel />
        </div>
      </div>
      <MoversPanel gs={gs} ready={ready} selectedId={sel.kind === 'mover' ? sel.m.id : null}
        onPick={(m) => pick(m, 'mover')} onGo={(ra, dec, fov) => flyTo(ra, dec, fov)} />
      <div className="grid2">
        <div className="panel"><h3>Targets <span>{TARGETS.length} objects · J2000</span></h3>
          <div className="scroll"><table className="tbl"><thead><tr><th>Target</th><th>Type</th><th>Best seen in</th><th>RA (°)</th><th>Dec (°)</th><th>Distance</th></tr></thead>
            <tbody>{TARGETS.map((t) => (
              <tr key={t.name} className={sel.kind === 'target' && sel.t === t ? 'on' : ''}>
                <td><button type="button" onClick={() => pick(t)}>{t.name}</button></td><td>{t.type}</td><td style={{ color: t.c }}>{t.band}</td><td>{t.ra.toFixed(4)}</td><td>{t.dec.toFixed(4)}</td><td>{t.dist}</td>
              </tr>))}
            </tbody></table></div>
        </div>
        <div className="panel fits"><h3>FITS images <span className="tag" style={{ color: 'var(--flare)' }}>Your data</span></h3>
          <p className="note">Open a FITS image with a celestial WCS header. Aladin Lite places it at its real position on the sky, on top of the survey.</p>
          <div className="row">
            <button className="btn sm" type="button" disabled={!ready} onClick={() => fileRef.current?.click()}>Open FITS file</button>
            <input ref={fileRef} type="file" accept=".fits,.fit,.fts,image/fits,application/fits" onChange={(e) => { openFile(e.target.files?.[0]); e.target.value = ''; }} />
            <button className="btn ghost sm" type="button" disabled={!ready} onClick={() => loadFits(viaProxy(SAMPLE_FITS.url), SAMPLE_FITS.name)}>Load a sample</button>
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); const u = fitsUrl.trim(); if (!/^https?:\/\//i.test(u)) return; loadFits(viaProxy(u), decodeURIComponent(u.split('/').pop() || u)); setFitsUrl(''); }}>
            <label htmlFor="fitsUrl" hidden>FITS URL</label>
            <input id="fitsUrl" type="url" placeholder="https://…/image.fits" value={fitsUrl} onChange={(e) => setFitsUrl(e.target.value)} disabled={!ready} />
            <button className="btn ghost sm" type="submit" disabled={!ready || !fitsUrl.trim()}>Load URL</button>
          </form>
          {fits.length === 0 && <p className="note">No FITS image loaded yet. You can also drop a file on the sky map.</p>}
          {fits.map((f) => (
            <div className="lay" key={f.id}>
              <div className="nm">
                <span title={f.name}>{f.name}</span>
                {f.status === 'loading' && <small className="note">Loading…</small>}
                {f.status === 'ok' && <button className="tag" type="button" style={{ color: 'var(--good)', background: 'none' }} onClick={() => flyTo(f.ra, f.dec, f.fov * 1.15)}>Go to</button>}
                <button className="x" type="button" aria-label={'Remove ' + f.name} onClick={() => removeFits(f.id)}>×</button>
              </div>
              {f.status === 'error' && <p className="err">{f.err}</p>}
              {f.status === 'ok' && (
                <>
                  <label className="ctl"><span>Opacity</span><input type="range" min="0" max="1" step="0.05" value={f.opacity} onChange={(e) => setFitsOpt(f.id, { opacity: +e.target.value })} /><span>{Math.round(f.opacity * 100)}%</span></label>
                  <div className="ctl"><span>Colors</span>
                    <div className="row">
                      <select aria-label="Colormap" value={f.colormap} onChange={(e) => setFitsOpt(f.id, { colormap: e.target.value })}>{COLORMAPS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                      <select aria-label="Stretch" value={f.stretch} onChange={(e) => setFitsOpt(f.id, { stretch: e.target.value })}>{STRETCHES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                    </div><span />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Drag a rectangle on the map to list the movers inside it. Esc cancels.
function SelectBox({ onDone, onCancel }) {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onCancel(); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onCancel]);
  const at = (e) => { const r = e.currentTarget.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  return (
    <div className="selbox-layer" role="presentation"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); const [x, y] = at(e); setBox({ x0: x, y0: y, x1: x, y1: y }); }}
      onPointerMove={(e) => { if (!box) return; const [x, y] = at(e); setBox((b) => ({ ...b, x1: x, y1: y })); }}
      onPointerUp={() => { if (box) onDone(box.x0, box.y0, box.x1, box.y1); setBox(null); }}>
      <span className="selhint">Drag a box to list the movers inside · Esc to cancel</span>
      {box && <i style={{ left: Math.min(box.x0, box.x1), top: Math.min(box.y0, box.y1), width: Math.abs(box.x1 - box.x0), height: Math.abs(box.y1 - box.y0) }} />}
    </div>
  );
}

function FragmentKV({ k, v }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}

// The SPHEREx band picker is driven by the original app logic (lib/legacy.js), so it must never re-render.
const BandsPanel = memo(function BandsPanel() {
  return (
    <div className="panel"><h3>Spectral bands · SPHEREx <span style={{ color: 'var(--text)' }} id="rangeTxt">1.20 – 2.80 µm</span></h3>
      <div className="prism"><canvas id="prismCv" aria-label="SPHEREx spectrum: 102 channels from 0.75 to 5 microns. Click a band to select it."></canvas><div className="ticks"><span>0.75 µm</span><span>1.1</span><span>1.6</span><span>2.4</span><span>3.8</span><span>4.4</span><span>5.0 µm</span></div></div>
      <div className="dual"><div className="tr"></div><div className="fi" id="rFill"></div><input id="rLo" type="range" min="0.75" max="5" step="0.05" defaultValue="1.2" aria-label="Lowest wavelength" /><input id="rHi" type="range" min="0.75" max="5" step="0.05" defaultValue="2.8" aria-label="Highest wavelength" /></div>
      <div className="bands" id="bands"></div>
      <p className="note" id="rangeNote"></p>
    </div>
  );
}, () => true);
