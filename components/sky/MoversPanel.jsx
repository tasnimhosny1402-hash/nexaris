'use client';

import { useEffect, useState } from 'react';
import { CLASSES, GS_BASE, fmtRate, jplLink, moverName, mpcLink, paName, parseCoords } from '@/lib/movers';

const CHIPS = [
  ['movers', 'Markers'], ['coverage', 'Coverage'],
  ['image', 'SPHEREx image'], ['map', 'Mover map'], ['unconfirmed', 'Unconfirmed'],
];

export function MoversPanel({ gs, ready, onPick, onGo, selectedId }) {
  const [q, setQ] = useState('');
  const [qErr, setQErr] = useState('');
  const { index, layers, toggle, inView, area } = gs;
  const list = area ? area.movers : inView;
  const count = (cls) => list.filter((m) => m.cls === cls).length;
  const R = gs.region || gs.regions[0];
  const stats = index && R ? (index.stats?.regions?.[R.name] || index.stats) : null;

  const go = (e) => {
    e.preventDefault();
    const c = parseCoords(q);
    if (!c) { setQErr('Use "RA Dec" in degrees (28.67 11.91) or sexagesimal (01 54 40.8 +11 54 36).'); return; }
    setQErr(''); onGo(c.ra, c.dec, 1.5);
  };

  return (
    <div className="panel gs">
      <h3>Movers · GhostShift pilot <span className="tag" style={{ color: 'var(--flare)' }}>Real SPHEREx data</span></h3>
      {index === undefined && <p className="note">Loading mover data…</p>}
      {index === null && (
        <p className="note">No GhostShift data is published in this app yet. Run the pipeline in the SPHEREx project
          (<code>python -m ghostshift.run all --dest &lt;nexaris&gt;/public/ghostshift</code>) and reload.</p>
      )}
      {index && (
        <>
          <p className="note">
            {R && <><b style={{ color: 'var(--text)' }}>{R.label}</b>: </>}SPHEREx detector D2 (1.1–1.65 µm), sweeps {Object.entries(R?.sweeps || {}).map(([k, v]) => `${v.start.slice(0, 10)} → ${v.end.slice(0, 10)}`).join(' and ')}.
            Each visit is compared with the same sky a year apart; anything that appeared is checked against every known asteroid.
            Pan and zoom the map: the list shows what is in view.
          </p>
          <div className="chips" role="group" aria-label="Mover layers">
            {CHIPS.map(([k, label]) => (
              <button key={k} type="button" aria-pressed={layers[k] ? 'true' : 'false'} onClick={() => toggle(k)} disabled={!ready}>{label}</button>
            ))}
          </div>
          <div className="gs-kpi">
            <div><small>{area ? 'In selection' : 'In view'}</small><b>{list.length}</b></div>
            <div style={{ '--c': CLASSES.known.color }}><small>Known asteroids</small><b>{count('known')}</b></div>
            <div style={{ '--c': CLASSES.tracklet.color }}><small>Unidentified movers</small><b>{count('tracklet')}</b></div>
            <div style={{ '--c': CLASSES.slow.color }}><small>Barely moving</small><b>{count('slow')}</b></div>
          </div>
          <div className="row">
            <div className="fields" role="group" aria-label="Fields">
              <span className="note">Fields:</span>
              {gs.regions.map((r) => (
                <button key={r.name} type="button" disabled={!ready} aria-pressed={R?.name === r.name ? 'true' : 'false'}
                  onClick={() => onGo(r.ra, r.dec, Math.max(3, r.radius * 1.9))}>{r.label}</button>
              ))}
            </div>
            <button className="btn ghost sm" type="button" disabled={!ready} aria-pressed={gs.motion ? 'true' : 'false'}
              onClick={() => (gs.motion ? gs.stopMotion() : gs.startMotion())}>{gs.motion ? 'Stop motion' : '▶ Play motion'}</button>
            <button className="btn ghost sm" type="button" disabled={!ready} aria-pressed={gs.selecting ? 'true' : 'false'}
              onClick={() => gs.setSelecting(!gs.selecting)}>{gs.selecting ? 'Drag a box on the map…' : 'Select area'}</button>
            {area && <button className="btn ghost sm" type="button" onClick={gs.clearArea}>Clear selection</button>}
            <form className="coord" onSubmit={go}>
              <label htmlFor="gsCoord" hidden>Coordinates</label>
              <input id="gsCoord" placeholder="RA Dec, e.g. 28.47 11.86" value={q} onChange={(e) => setQ(e.target.value)} disabled={!ready} />
              <button className="btn ghost sm" type="submit" disabled={!ready || !q.trim()}>Go</button>
            </form>
          </div>
          {qErr && <p className="note" style={{ color: 'var(--bad)' }}>{qErr}</p>}
          <div className="scroll gs-list">
            {list.length === 0 ? (
              <p className="note">{area ? 'No movers in the selected area.' : 'No movers in view. Zoom out, or go to the pilot area.'}</p>
            ) : (
              <table className="tbl">
                <thead><tr><th>Mover</th><th>Class</th><th>Visits</th><th>Motion</th><th>First seen</th><th>Signal</th></tr></thead>
                <tbody>
                  {list.slice(0, 150).map((m) => (
                    <tr key={m.id} className={selectedId === m.id ? 'on' : ''}>
                      <td><button type="button" onClick={() => onPick(m)}>{moverName(m)}</button></td>
                      <td style={{ color: CLASSES[m.cls].color }}>{CLASSES[m.cls].label}</td>
                      <td>{m.n}</td>
                      <td>{m.rate_deg_day == null ? '—' : `${m.rate_deg_day.toFixed(3)}°/d ${paName(m.pa_deg)}`}</td>
                      <td>{m.start}</td>
                      <td>{m.snr_max.toFixed(1)}σ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {list.length > 150 && <p className="note">Showing 150 of {list.length}. Zoom in or select an area to narrow it down.</p>}
          </div>
          {stats && (
            <p className="note">
              {R?.label}: {stats.tiles_ok} of {R?.tiles} tiles processed · {stats.detections} detections ·
              known asteroids recovered by brightness: {Object.entries(stats.known_detected_by_V).map(([k, v]) => `${k.replace('V', 'V ')}: ${v}`).join(', ')}.
              SPHEREx cannot see Planet Nine; finding known asteroids is the proof the method works.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const mjdLabel = (t) => new Date((t - 40587) * 86400000).toISOString().slice(0, 16).replace('T', ' ');

// Time bar on the sky map: play every mover in view along its track through one sweep.
export function MotionBar({ gs }) {
  const mo = gs.motion;
  if (!mo) return null;
  const sweeps = Object.keys((gs.region || gs.regions[0])?.sweeps || {});
  return (
    <div className="motionbar" role="group" aria-label="Motion playback">
      <div className="mb-sweeps">
        {sweeps.map((s) => (
          <button key={s} type="button" aria-pressed={mo.sweep === s ? 'true' : 'false'} onClick={() => gs.startMotion(s)}>{s}</button>
        ))}
      </div>
      <button type="button" className="mb-btn" aria-label="Previous visit" onClick={() => gs.step(-1)}>⏮</button>
      <button type="button" className="mb-btn mb-play" aria-label={mo.playing ? 'Pause' : 'Play'} onClick={() => gs.setPlaying(!mo.playing)}>{mo.playing ? '❚❚' : '▶'}</button>
      <button type="button" className="mb-btn" aria-label="Next visit" onClick={() => gs.step(1)}>⏭</button>
      <input type="range" min={gs.range.t0} max={gs.range.t1} step="0.002" value={Math.min(gs.range.t1, Math.max(gs.range.t0, gs.tNow))} aria-label="Time"
        onChange={(e) => { gs.setPlaying(false); gs.seek(+e.target.value); }} />
      <span className="mb-time">{mjdLabel(gs.tNow)} UTC</span>
      <span className="mb-count">{gs.movingCount} on screen</span>
      <button type="button" className="mb-btn mb-speed" aria-label="Playback speed" onClick={() => gs.setSpeed(mo.speed === 1 ? 2 : mo.speed === 2 ? 0.5 : 1)}>{mo.speed}×</button>
      <button type="button" className="mb-btn" aria-label="Stop playback and show still markers" title="Still markers" onClick={gs.stopMotion}>■</button>
    </div>
  );
}

const EXPLAIN = {
  known: (m) => `Detected in ${m.n} SPHEREx visit${m.n > 1 ? 's' : ''} and matched to the Minor Planet Center orbit of ${m.known.name} (predicted position ${m.known.sep_arcsec}″ away).`,
  tracklet: (m) => `Seen in ${m.n} visits along a straight line at a steady rate, and not matched to any known asteroid brighter than V 20.5. Before calling it new: check fainter catalogs, then confirm with follow-up images.`,
  slow: (m) => `Present in ${m.n} visits of this sweep at the same spot, but absent from the sweep a year apart. Could be a slow, distant object, or a star that changed brightness.`,
  single: () => 'Seen in one visit only. Most single detections are noise or image artifacts, so treat it with care.',
};

export function MoverDetails({ m, onZoom, onAsk }) {
  const meta = CLASSES[m.cls];
  const mpc = mpcLink(m), jpl = jplLink(m);
  return (
    <div className="panel"><h3>Selected mover <span className="tag" style={{ color: meta.color }}>{meta.label}</span></h3>
      <div><h2 style={{ fontFamily: 'var(--display)', fontSize: '22px' }}>{moverName(m)}</h2><p className="note" style={{ marginTop: '4px' }}>{EXPLAIN[m.cls](m)}</p></div>
      {m.stamp && <StampBlink m={m} />}
      <dl className="kv">
        <dt>Seen</dt><dd>{m.n} visit{m.n > 1 ? 's' : ''} · {m.start}{m.n > 1 ? ` → ${m.end}` : ''}</dd>
        <dt>Motion</dt><dd>{fmtRate(m)}{m.pa_deg != null ? ` toward ${paName(m.pa_deg)} (${m.pa_deg.toFixed(0)}°)` : ''}</dd>
        <dt>Signal</dt><dd>{m.snr_max.toFixed(1)}σ peak{m.n > 2 ? ` · line fit ${m.rms_arcsec}″` : ''}</dd>
        {m.known && <><dt>Known</dt><dd>{m.known.name} · V {m.known.V}</dd></>}
        <dt>RA, Dec</dt><dd>{m.ra.toFixed(4)}°, {m.dec.toFixed(4)}°</dd>
      </dl>
      <div className="links">
        <button type="button" onClick={onZoom}><i style={{ '--c': meta.color }} />Zoom to track</button>
        {mpc && <a href={mpc} target="_blank" rel="noopener"><i style={{ '--c': 'var(--good)' }} />MPC ↗</a>}
        {jpl && <a href={jpl} target="_blank" rel="noopener"><i style={{ '--c': 'var(--mid)' }} />JPL ↗</a>}
      </div>
      <button className="btn ghost sm" type="button" onClick={onAsk}>{m.known ? 'Ask the agent about this asteroid' : 'Ask the agent what to check next'}</button>
    </div>
  );
}

// Blink through the visits: each frame is a 33 x 33 px SPHEREx stamp centred on the detection.
function StampBlink({ m }) {
  const [k, setK] = useState(0);
  const [row, setRow] = useState(0);
  const [play, setPlay] = useState(true);
  const n = m.points.length, CELL = 33, S = 4;
  useEffect(() => { setK(0); setRow(0); setPlay(true); }, [m.id]);
  useEffect(() => {
    if (!play || (n < 2 && row === 0)) return;
    const id = setInterval(() => (n > 1 ? setK((x) => (x + 1) % n) : setRow((r) => 1 - r)), 700);
    return () => clearInterval(id);
  }, [play, n, row, m.id]);
  const p = m.points[k];
  return (
    <div className="blink">
      <div className="frame" role="img" aria-label={`SPHEREx image of ${moverName(m)}, visit ${k + 1} of ${n}`}
        style={{ backgroundImage: `url(${GS_BASE}/${m.stamp})`, backgroundSize: `${CELL * n * S}px ${CELL * 2 * S}px`, backgroundPosition: `-${k * CELL * S}px -${row * CELL * S}px` }}>
        <i className="cross" />
      </div>
      <div className="bctl">
        <b>{row ? 'Same sky, a year apart' : `Visit ${k + 1} of ${n}`}</b>
        <span className="note">{p.iso} · {p.snr.toFixed(1)}σ</span>
        <div className="row">
          <button className="btn ghost sm" type="button" onClick={() => setPlay(!play)}>{play ? 'Pause' : 'Play'}</button>
          <button className="btn ghost sm" type="button" aria-pressed={row ? 'true' : 'false'} onClick={() => { setRow(1 - row); setPlay(false); }}>{row ? 'Show visit' : 'Compare'}</button>
        </div>
        <span className="note">Each frame is centred on the detection, so the mover stays in the middle while the stars around it shift.</span>
      </div>
    </div>
  );
}
