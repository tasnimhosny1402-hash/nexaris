'use client';

// NexAris app shell. Markup is ported from the original single-file prototype.
// Views are switched by hash (#home, #sky, ...) exactly like before; the original
// behaviour runs from lib/legacy.js, and the Sky View is a React + Aladin Lite component.

import { useEffect } from 'react';
import SkyView from '@/components/SkyView';
import { initLegacy } from '@/lib/legacy';

export default function NexarisApp() {
  useEffect(() => { initLegacy(); }, []);

  return (
    <>
      <canvas id="bg" aria-hidden="true"></canvas>
      <header className="bar"><div className="bar-in">
        <img className="logoimg" alt="NexAris logo" src="/logo.jpg" />
        <a className="word" href="#home"><b>NexAris</b><small>Exploring the moving universe with SPHEREx</small></a>
        <span className="spacer"></span>
        <div className="levels" role="group" aria-label="Explanation level"><button type="button" data-l="Kids (ages 8-12)">Kids</button><button type="button" data-l="School (ages 13-18)" aria-pressed="true">School</button><button type="button" data-l="University">University</button></div>
        <a className="playbtn" href="#play"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 3 4 7 4 11l3 3v3l-4-2h-6l-4 2v-3l3-3c0-4 1-8 4-11Z" fill="currentColor"></path><circle cx="12" cy="10" r="2" fill="#0d1130"></circle><path d="M10 19c.5 2 1.2 3 2 3s1.5-1 2-3" fill="#ffb054"></path></svg>Play</a>
        <span className="chip">NASA Space Apps 2026</span>
        <span className="chip live">Space agent</span>
      </div></header>
      
      <div className="app">
        <nav className="nav" aria-label="Main">
          <a href="#home" data-v="home"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3Z"></path></svg>Home</a>
          <span className="grp">Explore</span>
          <a href="#sky" data-v="sky"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg>Sky View</a>
          <a href="#detections" data-v="detections"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"></path></svg>Infrared Regions</a>
          <a href="#spectral" data-v="spectral"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4v16h16M7 15c3-9 5-9 7-3s3 4 5 1"></path></svg>Spectral Analysis</a>
          <a href="#data" data-v="data"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4ZM4 10h16M10 10v9"></path></svg>Data Explorer</a>
          <span className="grp">AI Agent</span>
          <a href="#agent" data-v="agent"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4Z"></path></svg>Astronomy Chatbot</a>
          <a href="#motion" data-v="motion"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"></path></svg>Motion History</a>
          <a href="#planetx" data-v="planetx"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 1v4M12 19v4M1 12h4M19 12h4"></path></svg>Find Planet X</a>
          <a href="#dashboard" data-v="dashboard"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>My Dashboard</a>
          <a href="#mindmap" data-v="mindmap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 5l4 4M19 5l-4 4M5 19l4-4M19 19l-4-4"></path></svg>Mind Map</a>
          <a href="#play" data-v="play" className="play"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 3 4 7 4 11l3 3v3l-4-2h-6l-4 2v-3l3-3c0-4 1-8 4-11Z" fill="currentColor"></path><circle cx="12" cy="10" r="2" fill="#0d1130"></circle><path d="M10 19c.5 2 1.2 3 2 3s1.5-1 2-3" fill="#ffb054"></path></svg>Play the Odyssey</a>
        </nav>
      
        <main>
        {/* HOME */}
        <section className="view" id="v-home" aria-label="Home">
          <div className="hero">
            <div className="copy">
              <div className="eyebrow">NASA Space Apps 2026 · Team NexAris</div>
              <h1>See the universe in <em>102 colors</em> of infrared</h1>
              <p className="lede">NexAris turns NASA's SPHEREx all-sky survey into something anyone can explore. Look at real infrared skies, ask the NexAris space guide, and race through 400 years of finding planets.</p>
              <div className="ctas"><a className="btn" href="#play">Play the Odyssey</a><a className="btn ghost" href="#sky">Explore the sky</a></div>
            </div>
            <div className="art"><div className="orbitline"></div><img alt="NexAris logo over Earth at sunrise" src="/hero.jpg" /></div>
          </div>
          <div className="stats">
            <div className="stat"><b data-count="102">102</b><span>infrared spectral bands</span></div>
            <div className="stat"><b>0.75–5 µm</b><span>wavelengths SPHEREx sees</span></div>
            <div className="stat"><b data-count="5">5</b><span>eras of planet discovery to race</span></div>
            <div className="stat"><b data-count="10">10</b><span>planets to collect and learn</span></div>
          </div>
          <div className="feats">
            <a className="panel feat" href="#sky"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fd3ff" strokeWidth="2" strokeLinecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg></span><h2>Real sky, real data</h2><p>Explore the sky in Aladin Lite, flip between visible, near and mid infrared surveys, and open your own FITS images.</p><span className="go">Sky View →</span></a>
            <a className="panel feat" href="#agent"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fd3ff" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4Z"></path></svg></span><h2>A space guide</h2><p>Ask anything about space. The agent explains for kids, school or university.</p><span className="go">Ask the agent →</span></a>
            <a className="panel feat" href="#play"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffb054" strokeWidth="2" strokeLinejoin="round"><path d="M12 2 4 20l8-4 8 4Z"></path></svg></span><h2>The Odyssey race</h2><p>Fly through five eras, collect planets, dodge asteroids and reach Planet X first.</p><span className="go">Play →</span></a>
            <a className="panel feat" href="#spectral"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fd3ff" strokeWidth="2" strokeLinecap="round"><path d="M4 4v16h16M7 15c3-9 5-9 7-3s3 4 5 1"></path></svg></span><h2>Why infrared?</h2><p>Drag a star's temperature and watch its light move from blue to infrared.</p><span className="go">Spectral Analysis →</span></a>
            <a className="panel feat" href="#planetx"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fd3ff" strokeWidth="2"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg></span><h2>Hunt for Planet X</h2><p>Scan a field, match every dot to known catalogs and flag what is left.</p><span className="go">Find Planet X →</span></a>
            <a className="panel feat" href="#mindmap"><span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fd3ff" strokeWidth="2" strokeLinecap="round"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 5l4 4M19 5l-4 4M5 19l4-4M19 19l-4-4"></path></svg></span><h2>Your mind map</h2><p>Everything you collect in the game becomes a study map of planet history.</p><span className="go">Mind Map →</span></a>
          </div>
        </section>
      
        {/* SKY (Aladin Lite) */}
        <section className="view" id="v-sky" aria-label="Sky View">
          <SkyView />
        </section>

        {/* REGIONS */}
        <section className="view" id="v-detections" aria-label="Infrared Regions">
          <div className="head"><div><div className="eyebrow">Explore</div><h1>Three windows of infrared</h1><p>The longer the wavelength, the cooler the objects we can see. Each region reveals a different part of the universe.</p></div></div>
          <div className="grid3" id="regions"></div>
          <p className="note">Band edges follow NASA's classic table. Some sources use 5–25 µm for mid infrared and 25–350 µm for far infrared.</p>
        </section>
      
        {/* SPECTRAL */}
        <section className="view" id="v-spectral" aria-label="Spectral Analysis">
          <div className="head"><div><div className="eyebrow">Explore</div><h1>Why hot looks blue and cold glows infrared</h1><p>Every object glows. Drag the temperature and watch where its light peaks. Cooler objects peak further into the infrared.</p></div></div>
          <div className="grid2">
            <div className="panel"><h3>Blackbody radiation <span>Planck's law</span></h3><svg className="chart" id="bbSvg" viewBox="0 0 720 320" role="img" aria-label="Blackbody curve"></svg></div>
            <div className="panel"><h3>Temperature</h3>
              <div style={{fontFamily:"var(--display)",fontSize:"38px",fontWeight:"700"}} id="tVal">5,000 K</div>
              <input id="tRange" type="range" min="2000" max="10000" step="10" defaultValue="5000" aria-label="Temperature in kelvin" />
              <div className="sugg" id="tPresets"></div>
              <dl className="kv" id="tOut"></dl>
              <p className="note">Wien's law: peak wavelength = 2898 / temperature (µm).</p>
            </div>
          </div>
        </section>
      
        {/* DATA */}
        <section className="view" id="v-data" aria-label="Data Explorer">
          <div className="head"><div><div className="eyebrow">Explore</div><h1>102 colors of infrared</h1><p>Each of SPHEREx's six detectors splits light into 17 bands, for 102 colors in every exposure. Highlighted channels match the range you picked in Sky View.</p></div></div>
          <div className="panel"><h3>SPHEREx channels <span id="chanSel"></span></h3><div className="scroll"><div style={{display:"flex",flexDirection:"column",gap:"10px",minWidth:"520px"}} id="chans"></div></div></div>
          <div className="grid4" id="dataKpi"></div>
        </section>
      
        {/* AGENT */}
        <section className="view" id="v-agent" aria-label="Astronomy Chatbot">
          <div className="head"><div><div className="eyebrow">AI Agent</div><h1>Ask the NexAris Agent</h1><p>An assistant for space questions. It explains at your level, names its sources, and says when it is not sure.</p></div></div>
          <div className="grid2">
            <div className="panel" style={{minHeight:"520px"}}><h3>Conversation <span id="lvlTag" style={{color:"var(--ice)"}}>School level</span></h3>
              <div className="log" id="chatLog" aria-live="polite" style={{flex:"1",maxHeight:"440px"}}><div className="msg ai">Hi! I am the NexAris Agent. Ask me about planets, stars, infrared light or SPHEREx.</div></div>
              <div className="sugg" id="chatSugg"></div>
              <form className="ask" id="chatForm"><label htmlFor="chatQ" hidden>Question</label><input id="chatQ" maxLength="400" placeholder="Ask about a planet, star or wavelength…" autoComplete="off" /><button className="btn" id="chatBtn" type="submit">Send</button></form>
              <p className="note" id="chatNote">Answers come from an AI model and can contain mistakes. Check important facts with NASA.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"18px",minWidth:"0"}}>
              <div className="panel"><h3>How the agent behaves</h3><ul style={{margin:"0",paddingLeft:"18px",display:"flex",flexDirection:"column",gap:"6px"}}><li>Answers space and infrared questions only</li><li>Explains for Kids, School or University</li><li>Says "I am not sure" instead of guessing</li><li>Knows which era you reached in the game</li></ul></div>
              <div className="panel"><h3>Where you meet it</h3><ul style={{margin:"0",paddingLeft:"18px",display:"flex",flexDirection:"column",gap:"6px"}}><li>Here, as a full chat</li><li>On every planet card in the game</li><li>On any target in Sky View</li></ul></div>
            </div>
          </div>
        </section>
      
        {/* MOTION */}
        <section className="view" id="v-motion" aria-label="Motion History">
          <div className="head"><div><div className="eyebrow">AI Agent</div><h1>Barnard's Star on the move</h1><p>The fastest-moving star in our sky. Slide through the years to see where it was and where it will be. The motion is magnified so you can see it.</p></div></div>
          <div className="grid2">
            <div className="panel"><h3>Sky position <span id="yrTag" style={{color:"var(--flare)"}}>2026</span></h3>
              <svg className="chart" id="mvSvg" viewBox="0 0 640 380" role="img" aria-label="Path of Barnard's Star" style={{borderRadius:"14px",background:"#03040f"}}></svg>
              <input id="yr" type="range" min="1950" max="2100" step="1" defaultValue="2026" aria-label="Year" />
              <div style={{display:"flex",justifyContent:"space-between"}} className="note"><span>1950</span><span>2100</span></div>
            </div>
            <div className="panel"><h3>Barnard's Star</h3>
              <dl className="kv"><dt>Type</dt><dd>Red dwarf</dd><dt>Distance</dt><dd>5.96 light years</dd><dt>Proper motion</dt><dd>10.4″ per year</dd><dt>Shift since 2026</dt><dd id="mvShift">0″</dd></dl>
              <p style={{color:"#d9def5"}}>In a human lifetime Barnard's Star moves about a quarter of the Moon's width across the sky. Stars drift over years; asteroids move in hours.</p>
              <p className="note">Positions are a straight-line estimate from proper motion, magnified for display.</p>
              <div className="links"><a href="https://aladin.cds.unistra.fr/AladinLite/?target=17%2057%2048.50%20%2B04%2041%2036.2&amp;fov=0.25&amp;survey=P%2F2MASS%2Fcolor" target="_blank" rel="noopener"><i style={{'--c':"var(--good)"}}></i>See it in 2MASS ↗</a></div>
            </div>
          </div>
        </section>
      
        {/* PLANET X */}
        <section className="view" id="v-planetx" aria-label="Find Planet X">
          <div className="head"><div><div className="eyebrow">AI Agent</div><h1>Hunt for Planet X</h1><p>The agent matches every dot against known catalogs. A dot with no match becomes a candidate to check, never a discovery on its own.</p></div><span className="spacer"></span><button className="btn" id="scanBtn" type="button">Run scan</button></div>
          <div className="grid2">
            <div className="panel"><h3>Field 14 · simulated <span className="tag" style={{color:"var(--flare)"}}>Sample data</span></h3><div className="sky" style={{aspectRatio:"4/3"}}><canvas id="pxCv" aria-hidden="true"></canvas></div>
              <div style={{display:"flex",gap:"16px",flexWrap:"wrap"}} className="note"><span>● <span style={{color:"var(--good)"}}>Matched in Gaia</span></span><span>● <span style={{color:"var(--mid)"}}>Matched in WISE</span></span><span>● <span style={{color:"var(--flare)"}}>No match: candidate</span></span></div></div>
            <div style={{display:"flex",flexDirection:"column",gap:"18px",minWidth:"0"}}>
              <div className="panel"><h3>Scan result</h3><dl className="kv" id="pxOut"><dt>Status</dt><dd>Not scanned yet</dd></dl></div>
              <div className="panel" id="pxCand" hidden><h3 style={{color:"var(--flare)"}}>Candidate PX-01</h3><p>Faint, red in infrared, and shifted slightly between two images. No match in Gaia, WISE or the asteroid list.</p><p className="note">Most unmatched dots turn out to be image artifacts. A scientist would need to confirm this.</p><button className="btn ghost sm" id="pxAsk" type="button">Ask the agent what to check next</button></div>
              <div className="panel"><h3>Now with real data <span className="tag" style={{color:"var(--good)"}}>SPHEREx</span></h3><p>This field is a simulation. The same hunt on real SPHEREx images runs in Sky View: GhostShift compares every visit with the sky a year apart and checks what moved against 1.5 million known asteroids.</p><a className="btn sm" href="#sky">See real movers in Sky View</a></div>
            </div>
          </div>
        </section>
      
        {/* DASHBOARD */}
        <section className="view" id="v-dashboard" aria-label="My Dashboard">
          <div className="head"><div><div className="eyebrow">AI Agent</div><h1>My Dashboard</h1><p>Your results from the Odyssey, updated live as you play.</p></div></div>
          <div className="grid4" id="dKpi"></div>
          <div className="grid2">
            <div className="panel"><h3>Facts per era</h3><svg className="chart" id="dChart" viewBox="0 0 640 260" role="img" aria-label="Facts collected per era"></svg></div>
            <div className="panel"><h3>Agent note</h3><p className="ans" id="dNote">Play the Odyssey, then ask the agent for a summary of what you learned.</p><button className="btn ghost sm" id="dAsk" type="button">Summarize my game</button></div>
          </div>
        </section>
      
        {/* MINDMAP */}
        <section className="view" id="v-mindmap" aria-label="Mind Map">
          <div className="head"><div><div className="eyebrow">AI Agent</div><h1>Your Mind Map</h1><p>Built from the planets you actually collected. Solid nodes are ones you found; faint ones are still waiting in the game.</p></div></div>
          <div className="panel"><div className="scroll"><svg className="chart" id="mmSvg" viewBox="0 0 1100 560" role="img" aria-label="Mind map of collected planets" style={{minWidth:"760px"}}></svg></div></div>
        </section>
      
        {/* PLAY */}
        <section className="view" id="v-play" aria-label="Play the Odyssey">
          <div className="head"><div><div className="eyebrow">Game</div><h1>The NexAris Odyssey</h1><p>Race through 400 years of finding planets. Fly into planets to unlock their story, dodge asteroids, and reach the infrared era first.</p></div></div>
          <nav className="rail" id="rail" aria-label="Eras"><div className="fill" id="railFill"></div></nav>
          <div className="gmain">
            <div className="stage" aria-label="Race track">
              <canvas id="cv" width={520} height={640}></canvas>
              <div className="hud">
                <div className="box"><div className="lbl">Position</div><div className="pos" id="hPos">1<small>/4</small></div></div>
                <div className="box" style={{flex:"1",maxWidth:"260px"}}><div className="lbl" id="hEra">Stage 1 · Ancient Sky</div><div className="val" id="hPct">0% of stage</div><div className="meter"><i id="hBar" style={{width:"0%"}}></i></div></div>
                <div className="box"><div className="lbl">Facts</div><div className="val" id="hFacts">0/10</div></div>
              </div>
              <div className="pads"><button className="pad" id="padL" type="button" aria-label="Move left"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eef1ff" strokeWidth="2.4" strokeLinecap="round"><path d="m15 5-7 7 7 7"></path></svg></button><button className="pad" id="padR" type="button" aria-label="Move right"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eef1ff" strokeWidth="2.4" strokeLinecap="round"><path d="m9 5 7 7-7 7"></path></svg></button></div>
              <div className="ov" id="ov" role="dialog" aria-live="polite"></div>
            </div>
            <aside style={{display:"flex",flexDirection:"column",gap:"18px",minWidth:"0"}}>
              <div className="panel"><h3>Live standings <span>4 racers</span></h3><div id="board" style={{display:"flex",flexDirection:"column",gap:"12px"}}></div></div>
              <div className="panel"><h3>Ask the Agent <span style={{color:"var(--ice)"}}>in race</span></h3>
                <div className="log" id="log" aria-live="polite" style={{maxHeight:"200px"}}><div className="msg ai">Ask me anything while you race.</div></div>
                <form className="ask" id="askForm"><label htmlFor="askQ" hidden>Question</label><input id="askQ" maxLength="300" placeholder="Why is Pluto a dwarf planet?" autoComplete="off" /><button className="btn sm" id="askBtn" type="submit">Ask</button></form>
              </div>
              <div className="panel"><h3>Planet collection <span id="colN">0/10</span></h3><div className="slots" id="slots"></div><p className="note"><kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to steer · tap the sides on touch screens</p></div>
            </aside>
          </div>
        </section>
        </main>
      </div>
      <a className="fab" href="#play" aria-label="Play the Odyssey game"><span className="lbl">Play the Odyssey</span><span className="core"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 3 4 7 4 11l3 3v3l-4-2h-6l-4 2v-3l3-3c0-4 1-8 4-11Z" fill="currentColor"></path><circle cx="12" cy="10" r="2" fill="#0d1130"></circle><path d="M10 19c.5 2 1.2 3 2 3s1.5-1 2-3" fill="#ffb054"></path></svg></span></a>
      <footer><span>Designed by <b style={{color:"var(--text)"}}>Tasneem Hosny</b> · Team NexAris</span><span>NexAris · NASA Space Apps prototype. Game rivals are simulated. Sample data is marked.</span><span>Sky images: Aladin Lite (CDS), DSS2, 2MASS, AllWISE · AI-powered agent</span></footer>
    </>
  );
}
