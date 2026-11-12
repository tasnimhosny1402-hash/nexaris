/* NexAris Odyssey — app logic */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let level='School (ages 13-18)';

/* ---------- routing ---------- */
const VIEWS=['home','sky','detections','spectral','data','agent','motion','planetx','dashboard','mindmap','play'];
function route(){const v=VIEWS.includes(location.hash.slice(1))?location.hash.slice(1):'home';
 document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));
 document.querySelectorAll('.nav a').forEach(a=>a.setAttribute('aria-current',a.dataset.v===v?'page':'false'));document.body.classList.toggle('on-play',v==='play');
 if(v==='sky')drawSky();if(v==='planetx')drawPX();if(v==='dashboard')renderDash();if(v==='mindmap')renderMind();if(v==='data')renderChans();if(v==='play'){fit();draw()}
 if(v!=='play'&&S&&S.screen==='race'){pauseGame()}}
addEventListener('hashchange',()=>{route();scrollTo({top:0})});
document.querySelectorAll('.levels button').forEach(b=>b.onclick=()=>{level=b.dataset.l;document.querySelectorAll('.levels button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));$('lvlTag').textContent=b.textContent+' level'});

/* =========================================================
   BACKEND HOOK
   Set API_URL to the backend endpoint when it is ready.
   The backend receives {question, level, history} as JSON
   and should return {answer: "..."}.
   While API_URL is empty, the built-in knowledge base answers.
   ========================================================= */
const API_URL='';
async function askBackend(question,history){
 const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,level,history})});
 if(!r.ok)throw new Error('HTTP '+r.status);
 const d=await r.json();return d.answer||'';
}

/* ---------- built-in agent (works on any host, no AI service needed) ---------- */
const KB=[
 {k:['spherex','sphere x','sphere-x'],a:"SPHEREx is a NASA space telescope that launched in 2025. It maps the whole sky in 102 infrared colors (0.75 to 5 microns), using 6 detectors with 17 bands each. Its maps help scientists study how the universe began, how galaxies grew, and where water ice sits in space. Source: NASA JPL."},
 {k:['dust','through dust','see through','behind dust'],a:"Infrared light has longer waves than visible light, so it can slip past tiny dust grains that block visible light. That is why an infrared telescope like SPHEREx can see stars being born inside dark dust clouds that look black to our eyes. Source: NASA."},
 {k:['near infrared','near ir','near-infrared'],a:"Near infrared is the part of infrared closest to red light, about 0.7 to 5 microns. It shows warm stars, starlight from distant galaxies, and stars hidden behind dust. SPHEREx works in this range. Your TV remote also uses near infrared."},
 {k:['mid infrared','mid ir','mid-infrared'],a:"Mid infrared is about 5 to 40 microns. It shows warm dust around young stars, discs where planets may form, and molecules in space. NASA's James Webb telescope (MIRI camera) and WISE observed in this range."},
 {k:['far infrared','far ir','far-infrared'],a:"Far infrared is about 40 to 350 microns. It shows very cold dust and gas, only a few tens of degrees above absolute zero. Water vapour in our air absorbs it, so far infrared telescopes must fly high or go to space, like ESA's Herschel."},
 {k:['difference','near and far','types of infrared','regions','bands'],a:"Think of infrared as three zones. Near infrared (0.7-5 µm) shows warm stars and light from far galaxies. Mid infrared (5-40 µm) shows warm dust and planet-forming discs. Far infrared (40-350 µm) shows the coldest dust and gas. The longer the wave, the colder the object it reveals."},
 {k:['what is infrared','infrared light','infrared','heat','الأشعة تحت الحمراء','تحت الحمراء'],a:"Infrared is light with waves longer than red light, so our eyes can not see it, but we feel it as heat. William Herschel discovered it in 1800 with a prism and thermometers. Everything warm gives off infrared, which lets telescopes see cold, dark or dusty objects that are invisible in normal light."},
 {k:['herschel','1800','discover infrared','who discovered'],a:"In 1800 William Herschel split sunlight with a prism and put thermometers under each color. The thermometer just past the red end got the warmest, even though no light was visible there. He had discovered infrared light. He also found Uranus in 1781."},
 {k:['wavelength','micron','µm','spectrum','electromagnetic'],a:"Light comes in many wavelengths. From short to long: gamma rays, X-rays, ultraviolet, visible light, infrared, microwaves, radio. Infrared runs from about 0.7 microns to about 350 microns (a micron is one thousandth of a millimetre). Open the Spectral page to see where each band sits."},
 {k:['planck','black body','blackbody','temperature','colour of stars','color of stars'],a:"Every object glows according to its temperature, which scientists describe with a Planck curve. Hot stars peak in blue light, the Sun peaks in visible light, and cold objects peak in infrared. That is why infrared is perfect for cold planets, dust and baby stars. Try the temperature slider on the Spectral page."},
 {k:['planet x','planet nine','planet 9','hidden planet'],a:"Planet X (often called Planet Nine) is an idea, not a confirmed planet. Some icy objects beyond Neptune have orbits that line up strangely, and a planet several times Earth's mass far out could explain it. Nobody has seen it yet. It would be cold and faint, so infrared surveys are one of the best ways to search. Source: NASA."},
 {k:['real','exist','confirmed'],a:"Not yet. Planet X is a hypothesis based on the odd orbits of some distant icy objects. Searches with infrared and visible surveys have not found it, and some scientists think the orbits can be explained another way. If it exists, it would be very cold and faint."},
 {k:['check','new planet','candidate','unmatched','artifact','confirm'],a:"Before calling a dot a new planet, astronomers: 1) rule out image artifacts like cosmic rays or hot pixels, 2) check star and asteroid catalogs such as Gaia, WISE and the Minor Planet Center, 3) confirm it moves the way a distant orbit predicts, using images from several nights, 4) get follow-up images from another telescope. Only then is it a real candidate."},
 {k:['neptune'],a:"Neptune was found in 1846 using maths. Uranus was moving slightly off its expected path, so Urbain Le Verrier calculated where an unseen planet must be pulling it. Johann Galle pointed a telescope there and found Neptune within one degree of the prediction."},
 {k:['uranus'],a:"William Herschel discovered Uranus in 1781 with a telescope he built himself. It was the first planet found with a telescope. At first he thought it was a comet. Uranus spins on its side, tilted about 98 degrees."},
 {k:['pluto','dwarf planet','tombaugh'],a:"Clyde Tombaugh found Pluto in 1930 by blinking between photos of the same sky taken on different nights and spotting a dot that moved. In 2006 it was reclassified as a dwarf planet because it shares its region with many other icy objects in the Kuiper Belt. NASA's New Horizons flew past it in 2015."},
 {k:['kuiper'],a:"The Kuiper Belt is a ring of icy bodies beyond Neptune, about 30 to 50 times farther from the Sun than Earth. Pluto, Eris and Makemake live there. These objects are cold and faint, which makes infrared useful for studying them."},
 {k:['mars','red planet'],a:"Mars looks red because its dust is full of iron oxide, which is rust. It has the biggest volcano in the solar system, Olympus Mons, and NASA rovers like Perseverance are searching it for signs of ancient life."},
 {k:['jupiter','galileo'],a:"Jupiter is the largest planet, more than 1,000 Earths could fit inside. In 1610 Galileo saw four of its moons (Io, Europa, Ganymede, Callisto), which showed that not everything circles the Earth. NASA's Juno spacecraft studies it today."},
 {k:['saturn','rings'],a:"Saturn's rings are made of billions of pieces of ice and rock. Galileo saw them in 1610 but thought they were 'ears'. Christiaan Huygens explained in 1655 that they were a ring. The Cassini mission studied Saturn from 2004 to 2017."},
 {k:['wise','neowise'],a:"WISE was a NASA telescope launched in 2009 that mapped the whole sky in four infrared bands. It found cold brown dwarfs and many asteroids, and later as NEOWISE it hunted near-Earth asteroids until 2024. Its maps are in Sky View as the AllWISE layer."},
 {k:['2mass'],a:"2MASS (Two Micron All Sky Survey) mapped the entire sky in three near infrared bands from two ground telescopes, 1997 to 2001. It catalogued about 470 million sources. You can switch to it in Sky View."},
 {k:['webb','jwst','james webb'],a:"The James Webb Space Telescope launched in 2021 and is the largest infrared telescope in space. Its 6.5 metre gold mirror sees from 0.6 to 28 microns, showing the first galaxies and the atmospheres of exoplanets. It complements SPHEREx: Webb zooms in, SPHEREx maps everything."},
 {k:['star','betelgeuse','orion','rigel','sirius','aldebaran','constellation','نجم','نجوم'],a:"Stars look different in infrared. Cool red stars like Betelgeuse in Orion shine brightly in infrared, while hot blue stars like Rigel are brighter in visible light. In Sky View you can switch between DSS2 (visible), 2MASS (near infrared) and AllWISE (mid infrared) to compare the same stars."},
 {k:['galaxy','galaxies','milky way','universe','big bang','مجرة'],a:"Light from very distant galaxies is stretched to longer wavelengths as the universe expands (redshift), so it arrives as infrared. SPHEREx measures this for about 450 million galaxies to learn how the universe grew right after the Big Bang."},
 {k:['water','ice'],a:"SPHEREx searches for frozen water, carbon dioxide and other ices in clouds of gas and dust in our galaxy. These ices may be where much of the water in planets, including Earth's oceans, first formed."},
 {k:['game','play','odyssey','race','how to play','لعبة'],a:"In the NexAris Odyssey you race through 5 eras of planet discovery: Ancient Sky, Telescope, New Planets, Pluto and Infrared. Steer between three lanes with the arrow keys or by tapping, fly into planets to collect them and learn a fact, and avoid asteroids that slow you down. Finish all eras before the rivals to reach Planet X."},
 {k:['sky view','skyview','aladin','sky map'],a:"Sky View is a planetarium of the real sky. Drag to look around, tap a star or constellation to learn about it, and open it in Aladin Lite to see real survey images: DSS2 in visible light, 2MASS in near infrared, and AllWISE in mid infrared."},
 {k:['nexaris','this app','this site','what is this','who made','team'],a:"NexAris is a NASA Space Apps project by Team NexAris, designed by Tasneem Hosny. It helps people explore the infrared sky: a live sky view, infrared regions explained simply, a spectrum lab, a discovery game and a planet hunt."},
 {k:['hello','hi','hey','مرحبا','السلام','اهلا'],a:"Hi! I am the NexAris Agent. Ask me about infrared light, SPHEREx, the planets or Planet X. You can also tap one of the suggested questions."},
 {k:['thank','thanks','شكرا'],a:"You are welcome! Keep exploring, and try the game to collect all 10 planets."}];
function kbFind(q){q=' '+q.toLowerCase().replace(/[?!.,]/g,' ')+' ';let best=null,score=0;
 for(const e of KB){let s=0;for(const w of e.k)if(q.includes(w))s+=w.length+(w.includes(' ')?4:0);if(s>score){score=s;best=e}}return best}
function kbAnswer(input,key){
 if(key==='dash'){const got=S?S.learned.map(l=>l.t):[];if(!got.length)return "You have not collected any planets yet. Open Play, race through the five eras and fly into planets to learn about them. Come back here for your summary!";
  const last=ERAS.find(e=>e.items.some(i=>i.t===got[got.length-1]));return `Great flying! You collected ${got.length} of 10: ${got.join(', ')}. You now know how sky-watchers moved from naked eyes to telescopes to infrared surveys. Your strength: you made it to the ${last?last.name:'first'} era. Next, explore the Spectral page to see why infrared reveals cold worlds like a possible Planet X.`}
 let q=Array.isArray(input)?input[input.length-1].content:String(input);
 const m=q.match(/Tell me one surprising thing about (.+?) and how/);if(m){const e=kbFind(m[1]);if(e)return e.a;const it=ALL.find(i=>i.t===m[1]);return it?it.f+' Keep racing to learn more!':"Keep racing to discover more planets!"}
 const e=kbFind(q);if(e)return e.a;
 return "I am not sure about that one. I answer questions about infrared light, SPHEREx, the planets, Planet X and this app. Try: \"What is near infrared?\" or \"How was Neptune found?\""}
async function typeOut(el,text){el.textContent='';const w=text.split(' ');for(let i=0;i<w.length;i++){el.textContent+=(i?' ':'')+w[i];const l=el.closest('.log');if(l)l.scrollTop=1e9;if(i%3===0)await new Promise(r=>setTimeout(r,28))}}

/* ---------- live agent core ---------- */
let sample=null;const busy=new Set();
const ERR={not_granted:'The agent is off because AI access was not allowed for this page.',sampling_disabled:'The AI agent is not available for this account.',rate_limited:'Too many questions right now. Wait a moment, then try again.',session_expired:'Sign in again to use the agent.',refused:'I can not answer that one. Try asking differently.',upstream_error:'The answer was interrupted. Try again.'};
const NOSAMPLE='The live agent is not available right now. Sign in and open the shared link to use it.';
const RULES=extra=>`You are the NexAris Agent inside NexAris, a NASA Space Apps web app about NASA's SPHEREx infrared all-sky survey, with a game that races through 5 eras of finding planets (Ancient Sky, Telescope, New Planets, Pluto, Infrared) toward a possible Planet X.
Rules: answer only questions about space, planets, astronomy, infrared light and SPHEREx; politely decline anything else. Explain for this level: ${level}. Under 110 words, plain text, no markdown headings. If unsure, say so; never invent numbers. Name a reliable source (NASA, JPL, ESA, CDS) when useful.
Facts: SPHEREx observes 0.75-5.0 microns in 102 spectral bands (6 detectors x 17). Near IR 0.7-5 µm, mid IR 5-40 µm, far IR 40-350 µm.
${S?`Game progress: stage ${S.stage+1} (${ERAS[S.stage].name}), planets collected: ${S.learned.map(l=>l.t).join(', ')||'none yet'}.`:''}${extra?'\n'+extra:''}`;
async function agent(input,el,key){if(busy.has(key))return null;if(!sample){busy.add(key);el.classList.remove('err');el.textContent='Thinking…';let t='';
 if(API_URL){try{const q=Array.isArray(input)?input[input.length-1].content:String(input);t=await askBackend(q,Array.isArray(input)?input.slice(1,-1):[])}catch(e){t=''}}
 if(!t){await new Promise(r=>setTimeout(r,450));t=kbAnswer(input,key)}
 await typeOut(el,t);busy.delete(key);return t}
 busy.add(key);el.textContent='Thinking…';
 try{const{text}=await sample(input,{cache:false,modelTier:'quick',onText:({text})=>{el.textContent=text;const l=el.closest('.log');if(l)l.scrollTop=1e9}});return text}
 catch(e){if(e&&e.text){el.textContent=e.text;return e.text}el.classList.add('err');el.textContent=ERR[e&&e.code]||ERR.upstream_error;return null}
 finally{busy.delete(key)}}
function chatBox(logId,formId,inputId,turns,key){$(formId).addEventListener('submit',async e=>{e.preventDefault();const q=$(inputId).value.trim();if(!q||busy.has(key))return;$(inputId).value='';
 const log=$(logId);const m=document.createElement('div');m.className='msg me';m.textContent=q;log.appendChild(m);const a=document.createElement('div');a.className='msg ai';log.appendChild(a);log.scrollTop=1e9;
 turns.push({role:'user',content:q});const recent=turns.slice(-8);if(recent[0].role==='assistant')recent.shift();
 const t=await agent([{role:'user',content:RULES()},...recent],a,key);if(t)turns.push({role:'assistant',content:t});else turns.pop()})}
function askInChat(q){location.hash='#agent';setTimeout(()=>{$('chatQ').value=q;$('chatForm').requestSubmit()},60)}

/* ---------- sky ---------- */
const T=[
 {name:'Orion Nebula',alias:'M42',ra:83.8221,dec:-5.3911,fov:1.2,c:'#58e0a8',band:'Near IR',x:.30,y:.46,type:'Star-forming nebula',dist:'≈1,340 ly',note:'Dust hides young stars in visible light. Near infrared sees through it.'},
 {name:'NGC 3603',alias:'Carina star cluster',ra:168.7875,dec:-61.26,fov:.4,c:'#58e0a8',band:'Near IR',x:.56,y:.30,type:'Star-forming region',dist:'≈20,000 ly',note:'One of the densest clusters of young massive stars in our galaxy.'},
 {name:'Tarantula Nebula',alias:'30 Doradus',ra:84.676,dec:-69.101,fov:.8,c:'#58e0a8',band:'Near IR',x:.44,y:.72,type:'Star-forming nebula',dist:'≈160,000 ly',note:'In the Large Magellanic Cloud. Webb studied it in near infrared.'},
 {name:'Southern Ring Nebula',alias:'NGC 3132',ra:151.757,dec:-40.436,fov:.15,c:'#5aa6ff',band:'Mid IR',x:.18,y:.70,type:'Planetary nebula',dist:'≈2,500 ly',note:'Gas thrown off by a dying star. Mid infrared shows its warm dust.'},
 {name:"Barnard's Star",alias:'Fastest star',ra:269.4521,dec:4.6934,fov:.1,c:'#ffb054',band:'Near IR',x:.76,y:.56,type:'Red dwarf',dist:'5.96 ly',note:'Moves 10.4 arcseconds a year, faster across our sky than any other star.'},
 {name:'Vega',alias:'Alpha Lyrae',ra:279.2347,dec:38.7837,fov:.5,c:'#5aa6ff',band:'Mid IR',x:.84,y:.22,type:'Main-sequence star',dist:'25 ly',note:'Infrared revealed a disk of warm dust around it.'}];
const SURV=[['Visible · DSS2','P/DSS2/color','#9aa3c7'],['Near IR · 2MASS','P/2MASS/color','#58e0a8'],['Mid IR · AllWISE','P/allWISE/color','#5aa6ff']];
const sexa=(ra,dec)=>{const f=(v,d)=>{v=Math.abs(v);const a=Math.floor(v),m=Math.floor((v-a)*60),s=((v-a)*60-m)*60;return String(a).padStart(2,'0')+' '+String(m).padStart(2,'0')+' '+s.toFixed(d).padStart(d+3,'0')};ra=((ra%360)+360)%360;return f(ra/15,2)+' '+(dec<0?'-':'+')+f(dec,1)};
const aladin=(t,s)=>'https://aladin.cds.unistra.fr/AladinLite/?target='+encodeURIComponent(sexa(t.ra,t.dec))+'&fov='+t.fov+'&survey='+encodeURIComponent(s);
let sel=T[0];
/* planetarium: stereographic projection, equatorial J2000 */
const D2R=Math.PI/180;
const ST=[// name,ra,dec,mag,class,const
['Betelgeuse',88.79,7.41,.5,'M','Ori'],['Rigel',78.63,-8.2,.13,'B','Ori'],['Bellatrix',81.28,6.35,1.64,'B','Ori'],['Saiph',86.94,-9.67,2.06,'B','Ori'],['Alnitak',85.19,-1.94,1.77,'O','Ori'],['Alnilam',84.05,-1.2,1.69,'B','Ori'],['Mintaka',83,-.3,2.23,'O','Ori'],['Meissa',83.78,9.93,3.39,'O','Ori'],
['Aldebaran',68.98,16.51,.85,'K','Tau'],['Elnath',81.57,28.61,1.65,'B','Tau'],['Alcyone',56.87,24.11,2.87,'B','Tau'],['Zeta Tauri',84.41,21.14,3,'B','Tau'],
['Pollux',116.33,28.03,1.14,'K','Gem'],['Castor',113.65,31.89,1.58,'A','Gem'],['Alhena',99.43,16.4,1.93,'A','Gem'],
['Sirius',101.29,-16.72,-1.46,'A','CMa'],['Adhara',104.66,-28.97,1.5,'B','CMa'],['Wezen',107.1,-26.39,1.83,'F','CMa'],['Mirzam',95.67,-17.96,1.98,'B','CMa'],['Procyon',114.83,5.22,.34,'F','CMi'],
['Regulus',152.09,11.97,1.35,'B','Leo'],['Algieba',154.99,19.84,2.08,'K','Leo'],['Zosma',168.53,20.52,2.56,'A','Leo'],['Denebola',177.26,14.57,2.13,'A','Leo'],
['Dubhe',165.93,61.75,1.79,'K','UMa'],['Merak',165.46,56.38,2.37,'A','UMa'],['Phecda',178.46,53.69,2.44,'A','UMa'],['Megrez',183.86,57.03,3.31,'A','UMa'],['Alioth',193.51,55.96,1.77,'A','UMa'],['Mizar',200.98,54.93,2.27,'A','UMa'],['Alkaid',206.89,49.31,1.86,'B','UMa'],['Polaris',37.95,89.26,1.98,'F','UMi'],
['Caph',2.29,59.15,2.28,'F','Cas'],['Schedar',10.13,56.54,2.24,'K','Cas'],['Gamma Cas',14.18,60.72,2.47,'B','Cas'],['Ruchbah',21.45,60.24,2.68,'A','Cas'],['Segin',28.6,63.67,3.37,'B','Cas'],
['Vega',279.23,38.78,.03,'A','Lyr'],['Zeta Lyrae',281.19,37.6,4.3,'A','Lyr'],['Sheliak',282.52,33.36,3.5,'B','Lyr'],['Sulafat',284.74,32.69,3.25,'B','Lyr'],
['Deneb',310.36,45.28,1.25,'A','Cyg'],['Sadr',305.56,40.26,2.23,'F','Cyg'],['Gienah',311.55,33.97,2.48,'K','Cyg'],['Delta Cygni',296.24,45.13,2.87,'B','Cyg'],['Albireo',292.68,27.96,3.05,'K','Cyg'],
['Altair',297.7,8.87,.77,'A','Aql'],['Tarazed',296.56,10.61,2.72,'K','Aql'],['Alshain',298.83,6.41,3.71,'G','Aql'],
['Antares',247.35,-26.43,1.06,'M','Sco'],['Dschubba',240.08,-22.62,2.29,'B','Sco'],['Acrab',241.36,-19.81,2.62,'B','Sco'],['Tau Scorpii',248.97,-28.22,2.82,'B','Sco'],['Epsilon Scorpii',252.54,-34.29,2.29,'K','Sco'],['Mu Scorpii',252.97,-38.05,3,'B','Sco'],['Sargas',264.33,-43,1.86,'F','Sco'],['Kappa Scorpii',265.62,-39.03,2.4,'B','Sco'],['Shaula',263.4,-37.1,1.62,'B','Sco'],
['Kaus Australis',276.04,-34.38,1.85,'B','Sgr'],['Nunki',283.82,-26.3,2.05,'B','Sgr'],['Ascella',285.65,-29.88,2.6,'A','Sgr'],['Kaus Media',274.41,-29.83,2.7,'K','Sgr'],['Kaus Borealis',276.99,-25.42,2.8,'K','Sgr'],['Alnasl',271.45,-30.42,2.98,'K','Sgr'],['Phi Sagittarii',281.41,-26.99,3.2,'B','Sgr'],['Tau Sagittarii',286.74,-27.67,3.3,'K','Sgr'],
['Acrux',186.65,-63.1,.77,'B','Cru'],['Mimosa',191.93,-59.69,1.25,'B','Cru'],['Gacrux',187.79,-57.11,1.59,'M','Cru'],['Delta Crucis',183.79,-58.75,2.79,'B','Cru'],
['Rigil Kentaurus',219.9,-60.83,-.27,'G','Cen'],['Hadar',210.96,-60.37,.61,'B','Cen'],['Canopus',95.99,-52.7,-.74,'F','Car'],['Arcturus',213.92,19.18,-.05,'K','Boo'],['Spica',201.3,-11.16,.97,'B','Vir'],['Capella',79.17,46,.08,'G','Aur'],['Achernar',24.43,-57.24,.46,'B','Eri'],['Fomalhaut',344.41,-29.62,1.16,'A','PsA']];
const SI=Object.fromEntries(ST.map((s,i)=>[s[0],i]));
const CL=[['Orion','Ori',[['Betelgeuse','Meissa'],['Meissa','Bellatrix'],['Betelgeuse','Alnitak'],['Bellatrix','Mintaka'],['Alnitak','Alnilam'],['Alnilam','Mintaka'],['Alnitak','Saiph'],['Mintaka','Rigel'],['Betelgeuse','Bellatrix']]],['Taurus','Tau',[['Aldebaran','Elnath'],['Aldebaran','Zeta Tauri'],['Aldebaran','Alcyone']]],['Gemini','Gem',[['Castor','Pollux'],['Pollux','Alhena']]],['Canis Major','CMa',[['Mirzam','Sirius'],['Sirius','Wezen'],['Wezen','Adhara']]],['Leo','Leo',[['Regulus','Algieba'],['Algieba','Zosma'],['Zosma','Denebola'],['Denebola','Regulus']]],['Ursa Major','UMa',[['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],['Megrez','Dubhe'],['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid']]],['Cassiopeia','Cas',[['Caph','Schedar'],['Schedar','Gamma Cas'],['Gamma Cas','Ruchbah'],['Ruchbah','Segin']]],['Lyra','Lyr',[['Vega','Zeta Lyrae'],['Zeta Lyrae','Sheliak'],['Sheliak','Sulafat'],['Sulafat','Zeta Lyrae']]],['Cygnus','Cyg',[['Deneb','Sadr'],['Sadr','Albireo'],['Gienah','Sadr'],['Sadr','Delta Cygni']]],['Aquila','Aql',[['Tarazed','Altair'],['Altair','Alshain']]],['Scorpius','Sco',[['Acrab','Dschubba'],['Dschubba','Antares'],['Antares','Tau Scorpii'],['Tau Scorpii','Epsilon Scorpii'],['Epsilon Scorpii','Mu Scorpii'],['Mu Scorpii','Sargas'],['Sargas','Kappa Scorpii'],['Kappa Scorpii','Shaula']]],['Sagittarius','Sgr',[['Alnasl','Kaus Media'],['Kaus Media','Kaus Australis'],['Kaus Australis','Alnasl'],['Kaus Media','Kaus Borealis'],['Kaus Borealis','Phi Sagittarii'],['Phi Sagittarii','Kaus Media'],['Phi Sagittarii','Nunki'],['Nunki','Tau Sagittarii'],['Tau Sagittarii','Ascella'],['Ascella','Phi Sagittarii'],['Ascella','Kaus Australis']]],['Crux','Cru',[['Acrux','Gacrux'],['Mimosa','Delta Crucis']]],['Centaurus','Cen',[['Rigil Kentaurus','Hadar']]]];
const SPC={O:'#9bb0ff',B:'#aabfff',A:'#cad7ff',F:'#f8f7ff',G:'#fff4e8',K:'#ffd2a1',M:'#ffb07a'};
const FAINT=(()=>{let s=11;const rn=()=>(s=(s*16807)%2147483647)/2147483647;const cl='BAAFFGGKKKMM';return Array.from({length:2200},()=>{const ra=rn()*360,dec=Math.asin(2*rn()-1)/D2R;return[null,ra,dec,3.8+Math.pow(rn(),.6)*2.7,cl[Math.floor(rn()*cl.length)]]})})();
const MW=(()=>{const aG=192.85948*D2R,dG=27.12825*D2R,lN=122.93192*D2R,out=[];for(let l=0;l<360;l+=2)for(const b of[-12,-6,0,6,12]){const L=l*D2R,B=b*D2R;const sd=Math.sin(B)*Math.sin(dG)+Math.cos(B)*Math.cos(dG)*Math.cos(lN-L);const ra=aG+Math.atan2(Math.cos(B)*Math.sin(lN-L),Math.sin(B)*Math.cos(dG)-Math.cos(B)*Math.sin(dG)*Math.cos(lN-L));const core=Math.exp(-Math.pow(((l+180)%360-180)/70,2));out.push([(ra/D2R+360)%360,Math.asin(sd)/D2R,b,core])}return out})();
const SKY={ra0:84,dec0:-2,scale:0,lay:{lines:1,names:1,grid:1,mw:1,color:1,dso:1,night:0},hits:[]};
function proj(ra,dec){const d0=SKY.dec0*D2R,d=dec*D2R,da=(ra-SKY.ra0)*D2R;const cc=Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(da);if(cc<-.35)return null;const k=2/(1+cc);return{x:SKY.cx-k*Math.cos(d)*Math.sin(da)*SKY.scale,y:SKY.cy-k*(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(da))*SKY.scale}}
const magR=m=>Math.max(.5,(5.6-m)*.9)*Math.min(1.6,Math.max(.7,SKY.scale/380));
const fmtRA=ra=>{const h=ra/15,hh=Math.floor(h),mm=Math.round((h-hh)*60);return String(hh).padStart(2,'0')+'h '+String(mm%60).padStart(2,'0')+'m'};
const fmtDec=d=>(d<0?'−':'+')+String(Math.floor(Math.abs(d))).padStart(2,'0')+'° '+String(Math.round((Math.abs(d)%1)*60)).padStart(2,'0')+'′';
function drawSky(){const cv=$('skyCv'),r=cv.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(r.width*dpr)){cv.width=r.width*dpr;cv.height=r.height*dpr}const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);const w=r.width,h=r.height;SKY.cx=w/2;SKY.cy=h/2;if(!SKY.scale)SKY.scale=w/1.5;
 const L=SKY.lay;SKY.hits=[];
 const bg=g.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.75);bg.addColorStop(0,'#0a0d24');bg.addColorStop(1,'#010208');g.fillStyle=bg;g.fillRect(0,0,w,h);
 if(L.mw){for(const[ra,dec,b,core]of MW){const p=proj(ra,dec);if(!p)continue;const rr=SKY.scale*.16*(1-Math.abs(b)/18);const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);const a=(.05+.07*core)*(1-Math.abs(b)/16);gr.addColorStop(0,`rgba(${150+60*core},${150+30*core},${220-40*core},${a.toFixed(3)})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(p.x-rr,p.y-rr,rr*2,rr*2)}}
 if(L.grid){g.lineWidth=1;g.strokeStyle='rgba(143,211,255,.13)';g.fillStyle='rgba(143,211,255,.45)';g.font='10px "JetBrains Mono",monospace';
  for(let ra=0;ra<360;ra+=30){g.beginPath();let on=false;for(let d=-85;d<=85;d+=2.5){const p=proj(ra,d);if(!p){on=false;continue}on?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);on=true}g.stroke();const lp=proj(ra,SKY.dec0+3);if(lp&&lp.x>20&&lp.x<w-30&&lp.y>50&&lp.y<h-20)g.fillText((ra/15)+'h',lp.x+3,lp.y)}
  for(let d=-60;d<=60;d+=30){g.beginPath();let on=false;for(let ra=0;ra<=360;ra+=2){const p=proj(ra,d);if(!p){on=false;continue}on?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);on=true}g.stroke();const lp=proj(SKY.ra0+2,d);if(lp&&lp.y>50&&lp.y<h-20)g.fillText((d>0?'+':'')+d+'°',lp.x+3,lp.y-3)}
  g.strokeStyle='rgba(255,176,84,.28)';g.setLineDash([4,6]);g.beginPath();let on=false;for(let l=0;l<=360;l+=2){const e=23.44*D2R,L2=l*D2R;const ra=(Math.atan2(Math.sin(L2)*Math.cos(e),Math.cos(L2))/D2R+360)%360,dec=Math.asin(Math.sin(e)*Math.sin(L2))/D2R;const p=proj(ra,dec);if(!p){on=false;continue}on?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);on=true}g.stroke();g.setLineDash([])}
 for(const s of FAINT){if(s[3]>4.4+SKY.scale/900)continue;const p=proj(s[1],s[2]);if(!p||p.x<-5||p.x>w+5||p.y<-5||p.y>h+5)continue;g.fillStyle=L.color?SPC[s[4]]:'#fff';g.globalAlpha=Math.max(.25,1-(s[3]-3.8)/3.2);g.beginPath();g.arc(p.x,p.y,magR(s[3])*.8,0,7);g.fill()}g.globalAlpha=1;
 if(L.lines){g.strokeStyle='rgba(143,211,255,.42)';g.lineWidth=1.2;for(const[,,segs]of CL)for(const[a,b]of segs){const A=ST[SI[a]],B2=ST[SI[b]];const p=proj(A[1],A[2]),q=proj(B2[1],B2[2]);if(!p||!q)continue;const dx=q.x-p.x,dy=q.y-p.y,dl=Math.hypot(dx,dy),o=Math.min(6,dl/4);g.beginPath();g.moveTo(p.x+dx/dl*o,p.y+dy/dl*o);g.lineTo(q.x-dx/dl*o,q.y-dy/dl*o);g.stroke()}}
 if(L.names){g.font='600 11px "JetBrains Mono",monospace';g.fillStyle='rgba(199,166,255,.75)';g.textAlign='center';for(const[name,ab,segs]of CL){let x=0,y=0,n=0;for(const[a]of segs){const s=ST[SI[a]];const p=proj(s[1],s[2]);if(p){x+=p.x;y+=p.y;n++}}if(n&&x/n>0&&x/n<w&&y/n>40&&y/n<h)g.fillText(name.toUpperCase(),x/n,y/n+26)}g.textAlign='left'}
 for(const s of ST){const p=proj(s[1],s[2]);if(!p||p.x<-10||p.x>w+10||p.y<-10||p.y>h+10)continue;const R=magR(s[3]);const c=L.color?SPC[s[4]]:'#ffffff';const gl=g.createRadialGradient(p.x,p.y,0,p.x,p.y,R*3.2);gl.addColorStop(0,c);gl.addColorStop(.35,c+'55');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.beginPath();g.arc(p.x,p.y,R*3.2,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,R*.55,0,7);g.fill();
  SKY.hits.push({x:p.x,y:p.y,r:Math.max(8,R*2),star:s});if(L.names&&s[3]<1.4){g.font='12px "Instrument Sans",sans-serif';g.fillStyle='rgba(238,241,255,.82)';g.fillText(s[0],p.x+R+5,p.y-R-2)}}
 if(L.dso)for(const t of T){const p=proj(t.ra,t.dec);if(!p)continue;const on=t===sel,R=on?13:9;g.strokeStyle=t.c;g.lineWidth=on?2.5:1.6;g.shadowColor=t.c;g.shadowBlur=on?14:6;g.beginPath();
  if(/Planetary/.test(t.type)){g.arc(p.x,p.y,R,0,7);g.moveTo(p.x+2,p.y);g.arc(p.x,p.y,2,0,7)}else if(/nebula|region/i.test(t.type)){g.rect(p.x-R,p.y-R,R*2,R*2)}else{g.arc(p.x,p.y,R,0,7);g.moveTo(p.x-R-5,p.y);g.lineTo(p.x-R+2,p.y);g.moveTo(p.x+R-2,p.y);g.lineTo(p.x+R+5,p.y)}g.stroke();g.shadowBlur=0;
  if(on||L.names){g.font=(on?'700 ':'600 ')+'12px "Instrument Sans",sans-serif';g.fillStyle=t.c;g.fillText(t.name,p.x+R+6,p.y+4)}SKY.hits.unshift({x:p.x,y:p.y,r:R+6,tgt:t})}
 const c0=proj(SKY.ra0,SKY.dec0);$('radec').textContent=`Center RA ${fmtRA((SKY.ra0+360)%360)} · Dec ${fmtDec(SKY.dec0)} · FOV ${Math.round(2*Math.atan(w/2/SKY.scale/2)*2/D2R)}°`;
 g.fillStyle='rgba(238,241,255,.55)';g.font='700 11px "JetBrains Mono",monospace';g.fillText('N',w/2-4,58);g.fillText('E',14,h/2+4);g.fillText('W',w-60,h/2+4)}
function renderTargets(){drawSky()}
(function(){const pl=$('planet'),cv=$('skyCv');let drag=null;
 const at=(e)=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 const hitAt=p=>SKY.hits.find(h=>Math.hypot(h.x-p.x,h.y-p.y)<h.r);
 pl.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,ra:SKY.ra0,dec:SKY.dec0,moved:false};pl.setPointerCapture(e.pointerId)});
 pl.addEventListener('pointermove',e=>{const tip=$('tip');if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;const k=1/SKY.scale/D2R*1.0;SKY.ra0=drag.ra+dx*k/Math.max(.2,Math.cos(SKY.dec0*D2R));SKY.dec0=Math.max(-89,Math.min(89,drag.dec+dy*k));tip.hidden=true;drawSky();return}
  const p=at(e),h=hitAt(p);if(!h){tip.hidden=true;return}tip.hidden=false;tip.style.left=p.x+'px';tip.style.top=p.y+'px';tip.innerHTML=h.tgt?`<b>${esc(h.tgt.name)}</b>${esc(h.tgt.type)} · click for details`:`<b>${esc(h.star[0])}</b>mag ${h.star[3]} · class ${h.star[4]} · ${h.star[5]}`});
 pl.addEventListener('pointerup',e=>{const was=drag;drag=null;if(was&&was.moved)return;const h=hitAt(at(e));if(!h)return;if(h.tgt)pick(h.tgt);else showStar(h.star)});
 pl.addEventListener('pointerleave',()=>{$('tip').hidden=true});
 pl.addEventListener('wheel',e=>{e.preventDefault();SKY.scale=Math.max(160,Math.min(9000,SKY.scale*(e.deltaY<0?1.15:1/1.15)));drawSky()},{passive:false});
 pl.addEventListener('keydown',e=>{const st=6/Math.max(1,SKY.scale/400);const k={ArrowLeft:[st,0],ArrowRight:[-st,0],ArrowUp:[0,st],ArrowDown:[0,-st]}[e.key];if(k){e.preventDefault();SKY.ra0+=k[0];SKY.dec0=Math.max(-89,Math.min(89,SKY.dec0+k[1]));drawSky()}if(e.key==='+'||e.key==='='){SKY.scale*=1.2;drawSky()}if(e.key==='-'){SKY.scale/=1.2;drawSky()}});
 $('zIn').onclick=()=>{SKY.scale=Math.min(9000,SKY.scale*1.3);drawSky()};$('zOut').onclick=()=>{SKY.scale=Math.max(160,SKY.scale/1.3);drawSky()};
 $('zHome').onclick=()=>flyTo(sel);
 pl.querySelectorAll('.tb button').forEach(b=>b.onclick=()=>{const k=b.dataset.layer;SKY.lay[k]=SKY.lay[k]?0:1;b.setAttribute('aria-pressed',SKY.lay[k]?'true':'false');pl.classList.toggle('night',!!SKY.lay.night);drawSky()});})();
function flyTo(t){const s={ra:SKY.ra0,dec:SKY.dec0,sc:SKY.scale},e={ra:t.ra,dec:t.dec,sc:Math.max(SKY.scale,700)};let dra=((e.ra-s.ra+540)%360)-180;const t0=performance.now();const st=n=>{const k=Math.min(1,(n-t0)/700),q=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;SKY.ra0=s.ra+dra*q;SKY.dec0=s.dec+(e.dec-s.dec)*q;SKY.scale=s.sc+(e.sc-s.sc)*q;drawSky();if(k<1)requestAnimationFrame(st)};requestAnimationFrame(st)}
function showStar(s){$('tName').textContent=s[0];$('tNote').textContent='A bright star in '+(CL.find(c=>c[1]===s[5])||[s[5]])[0]+'.';$('tType').textContent='Class '+s[4];$('tType').style.color=SPC[s[4]];
 $('tKv').innerHTML=[['Magnitude',String(s[3])],['Spectral class',s[4]+' type star'],['RA, Dec (J2000)',s[1].toFixed(2)+'°, '+s[2].toFixed(2)+'°']].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
 const t={ra:s[1],dec:s[2],fov:.6};$('tLinks').innerHTML=SURV.map(([l,su,c])=>`<a href="${aladin(t,su)}" target="_blank" rel="noopener"><i style="--c:${c}"></i>${l} ↗</a>`).join('');sel={...T[0],name:s[0],ra:s[1],dec:s[2],c:SPC[s[4]],type:'Star',_star:1};drawSky()}
function pick(t,fly=true){sel=t;if(fly&&$('skyCv').getBoundingClientRect().width)flyTo(t);else renderTargets();$('tName').textContent=t.name;$('tNote').textContent=t.note;$('tType').textContent=t.band;$('tType').style.color=t.c;
 $('tKv').innerHTML=[['Also known as',t.alias],['Type',t.type],['Distance',t.dist]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
 $('tLinks').innerHTML=SURV.map(([l,s,c])=>`<a href="${aladin(t,s)}" target="_blank" rel="noopener"><i style="--c:${c}"></i>${l} ↗</a>`).join('');
 document.querySelectorAll('#tTbl tbody tr').forEach(r=>r.classList.toggle('on',r.dataset.n===t.name))}
$('tTbl').querySelector('tbody').innerHTML=T.map(t=>`<tr data-n="${esc(t.name)}"><td><button type="button">${esc(t.name)}</button></td><td>${esc(t.type)}</td><td style="color:${t.c}">${t.band}</td><td>${t.ra.toFixed(4)}</td><td>${t.dec.toFixed(4)}</td><td>${esc(t.dist)}</td></tr>`).join('');
$('tTbl').querySelectorAll('tbody button').forEach((b,i)=>b.onclick=()=>pick(T[i]));
$('tAsk').onclick=()=>askInChat('Tell me about '+sel.name+(sel._star?', the star,':'')+' and how it looks in infrared.');

/* bands */
const BANDS=[[.75,1.1,39],[1.1,1.6,41],[1.6,2.4,41],[2.4,3.8,35],[3.8,4.4,112],[4.4,5.0,128]];
let lo=1.2,hi=2.8;
const chanHue=q=>270-275*q;const bandCol=i=>`hsl(${Math.round(chanHue((i*17+8)/101))} 90% 62%)`;
function drawPrism(){const cv=$('prismCv');if(!cv)return;const r=cv.getBoundingClientRect();if(!r.width)return;const d=Math.min(2,devicePixelRatio||1);cv.width=r.width*d;cv.height=r.height*d;const g=cv.getContext('2d');g.setTransform(d,0,0,d,0,0);const w=r.width,h=r.height,now=performance.now()/1000;
 g.clearRect(0,0,w,h);const n=102,gap=2,bw=(w-24-gap*(n-1))/n;g.globalCompositeOperation='lighter';
 for(let i=0;i<n;i++){const b=Math.floor(i/17),bd=BANDS[b],l=bd[0]+(bd[1]-bd[0])*((i%17)+.5)/17,on=l>=lo&&l<=hi;const x=12+i*(bw+gap);
  const amp=.35+.45*Math.exp(-Math.pow((l-1.6)/.9,2))+.25*Math.exp(-Math.pow((l-3.3)/.25,2))+.12*Math.sin(i*.9+now*1.4)*.5;const bh=(h-26)*Math.min(1,amp)*(on?1:.55);
  const hue=chanHue(i/101);const gr=g.createLinearGradient(0,h-6-bh,0,h-6);gr.addColorStop(0,`hsla(${hue},100%,${on?78:60}%,${on?.95:.25})`);gr.addColorStop(1,`hsla(${hue},95%,45%,${on?.35:.06})`);g.fillStyle=gr;g.fillRect(x,h-6-bh,bw,bh);
  if(on){g.fillStyle=`hsla(${hue},100%,85%,.9)`;g.fillRect(x,h-8-bh,bw,2);g.shadowColor=`hsl(${hue},100%,65%)`;g.shadowBlur=14;g.fillRect(x,h-8-bh,bw,1);g.shadowBlur=0}}
 g.globalCompositeOperation='source-over';for(let b=1;b<6;b++){const x=12+b*17*(bw+gap)-gap/2;g.strokeStyle='rgba(255,255,255,.12)';g.setLineDash([2,4]);g.beginPath();g.moveTo(x,8);g.lineTo(x,h-6);g.stroke();g.setLineDash([])}
 const fl=g.createLinearGradient(0,0,0,h);fl.addColorStop(0,'rgba(255,255,255,.06)');fl.addColorStop(.4,'rgba(255,255,255,0)');g.fillStyle=fl;g.fillRect(0,0,w,h)}
(function anim(){if(location.hash==='#sky')drawPrism();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setTimeout(()=>requestAnimationFrame(anim),60)})();
document.addEventListener('click',e=>{if(e.target.id!=='prismCv')return;const r=e.target.getBoundingClientRect();const i=Math.max(0,Math.min(101,Math.floor((e.clientX-r.left-12)/((r.width-24)/102))));const b=BANDS[Math.floor(i/17)];lo=b[0];hi=b[1];$('rLo').value=lo;$('rHi').value=hi;renderRange()});
function renderRange(){const p=v=>(v-.75)/4.25*100;$('rFill').style.left=p(lo)+'%';$('rFill').style.width=(p(hi)-p(lo))+'%';$('rangeTxt').textContent=lo.toFixed(2)+' – '+hi.toFixed(2)+' µm';
 const inb=BANDS.map(b=>lo<b[1]&&hi>b[0]);$('bands').innerHTML=BANDS.map((b,i)=>`<button type="button" class="band${inb[i]?' in':''}" style="--bc:${bandCol(i)}" data-b="${i}" aria-pressed="${inb[i]}"><b>Band ${i+1}</b>${b[0]}–${b[1].toFixed(1)} µm<br>R=${b[2]}</button>`).join('');
 $('bands').querySelectorAll('button').forEach(x=>x.onclick=()=>{const b=BANDS[+x.dataset.b];lo=b[0];hi=b[1];$('rLo').value=lo;$('rHi').value=hi;renderRange()});drawPrism();
 const n=inb.filter(Boolean).length;$('rangeNote').textContent=`Touches ${n} of 6 detector bands · ${n*17} of 102 channels.`;$('chanSel').textContent='Selected '+lo.toFixed(2)+' – '+hi.toFixed(2)+' µm'}
$('rLo').oninput=e=>{lo=Math.min(+e.target.value,hi-.05);e.target.value=lo;renderRange()};$('rHi').oninput=e=>{hi=Math.max(+e.target.value,lo+.05);e.target.value=hi;renderRange()};

/* ---------- regions ---------- */
(function(){const lg=v=>Math.log10(v),S0=lg(.38),S1=lg(350),pct=(a,b)=>((lg(b)-lg(a))/(S1-S0)*100).toFixed(2)+'%';const T0=lg(10),T1=lg(6000),tp=v=>((lg(v)-T0)/(T1-T0)*100).toFixed(1);
 const R=[{n:'Near infrared',k:'near',c:'#58e0a8',w:'0.7 – 5 µm',t:[740,5200],tt:'740 – 5,200 K',sub:'Just past red light',an:'Like night-vision goggles that see through smoke, near infrared sees through cosmic dust.',ex:['Cool red stars','Red giants','Stars hidden in dust'],ic:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58e0a8" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'},
 {n:'Mid infrared',k:'mid',c:'#5aa6ff',w:'5 – 40 µm',t:[93,740],tt:'93 – 740 K',sub:'The warm glow',an:'Like a thermal camera that shows warm things, mid infrared shows dust heated by starlight.',ex:['Planets and comets','Warm dust','Planet-forming disks'],ic:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5aa6ff" stroke-width="2" stroke-linecap="round"><path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/></svg>'},
 {n:'Far infrared',k:'far',c:'#ff6b7f',w:'40 – 350 µm',t:[11,93],tt:'11 – 93 K',sub:'The coldest light',an:'Like feeling the faint chill of ice, far infrared finds the coldest gas and dust in space.',ex:['Cold dust clouds','Galaxy centers','Where stars are born'],ic:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b7f" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11M9 3l3 3 3-3M9 21l3-3 3 3"/></svg>'}];
 $('regions').innerHTML=R.map(r=>`<article class="panel rg" style="--c:${r.c}"><div class="top"><span class="ico">${r.ic}</span><div><h2>${r.n}</h2><div class="sub">${r.sub}</div></div></div>
 <p class="analogy">${r.an}</p>
 <div><div class="meterlbl"><span>Where it sits in light</span><b>${r.w}</b></div><div class="specbar" aria-label="Spectrum position: ${r.w}"><span class="vis" style="width:${pct(.38,.7)}">Vis</span><span class="${r.k==='near'?'on':''}" style="width:${pct(.7,5)}">Near</span><span class="${r.k==='mid'?'on':''}" style="width:${pct(5,40)}">Mid</span><span class="${r.k==='far'?'on':''}" style="width:${pct(40,350)}">Far</span></div></div>
 <div><div class="meterlbl"><span>How warm the objects are</span><b>${r.tt}</b></div><div class="gauge" aria-label="Temperature ${r.tt}"><i style="left:${tp(r.t[0])}%;width:${(tp(r.t[1])-tp(r.t[0])).toFixed(1)}%"></i></div><div class="gscale"><span>10 K cold</span><span>300 K room</span><span>6,000 K Sun</span></div></div>
 <div><div class="meterlbl"><span>What you can see</span></div><div class="ex">${r.ex.map(x=>`<span>${x}</span>`).join('')}</div></div></article>`).join('')})();

/* ---------- spectral ---------- */
const planck=(x,T)=>Math.pow(x,-5)/(Math.exp(14388/(x*T))-1);
function renderBB(T){const X0=56,X1=700,Y0=280,Y1=36,xm=3,pk=planck(2898/T,T)*1.05;const sx=x=>X0+x/xm*(X1-X0),sy=v=>Y0-v/pk*(Y0-Y1);
 const curve=TT=>{let d='';for(let i=1;i<=300;i++){const x=i/100;d+=(i>1?'L':'M')+sx(x).toFixed(1)+' '+sy(planck(x,TT)).toFixed(1)}return d};
 const lam=2898/T,peak=planck(lam,T);let s=`<defs><linearGradient id="vis" x1="0" x2="1"><stop offset="0" stop-color="#6a1fb0"></stop><stop offset=".3" stop-color="#2a7be0"></stop><stop offset=".55" stop-color="#3fc75a"></stop><stop offset=".75" stop-color="#ffd23f"></stop><stop offset="1" stop-color="#e8352e"></stop></linearGradient><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb054" stop-opacity=".35"></stop><stop offset="1" stop-color="#ffb054" stop-opacity="0"></stop></linearGradient></defs>`;
 s+=`<rect x="${sx(.38)}" y="${Y1}" width="${sx(.75)-sx(.38)}" height="${Y0-Y1}" fill="url(#vis)" fill-opacity=".28"></rect><rect x="${sx(.75)}" y="${Y1}" width="${X1-sx(.75)}" height="${Y0-Y1}" fill="#ff6b7f" fill-opacity=".05"></rect>`;
 for(const v of[0,.5,1,1.5,2,2.5,3])s+=`<line x1="${sx(v)}" y1="${Y1}" x2="${sx(v)}" y2="${Y0}" stroke="rgba(143,211,255,.08)"></line><text x="${sx(v)}" y="${Y0+18}" text-anchor="middle">${v}</text>`;
 s+=`<text x="${X1}" y="${Y0+36}" text-anchor="end">wavelength (µm)</text><text x="${sx(.56)}" y="${Y1+14}" text-anchor="middle">visible</text><text x="${sx(1.8)}" y="${Y1+14}" text-anchor="middle">infrared →</text>`;
 for(const TT of[2000,3000,4000,6000,8000].filter(v=>v<T-200))s+=`<path d="${curve(TT)}" fill="none" stroke="rgba(154,163,199,.45)" stroke-width="1.2"></path><text x="${sx(2898/TT)+6}" y="${sy(planck(2898/TT,TT))-6}">${TT} K</text>`;
 const c=curve(T);s+=`<path d="${c}L${sx(3)} ${Y0}L${sx(.01)} ${Y0}Z" fill="url(#ar)"></path><path d="${c}" fill="none" stroke="#ffb054" stroke-width="3"></path>`;
 if(lam<=3)s+=`<circle cx="${sx(lam)}" cy="${sy(peak)}" r="6" fill="#ffb054"></circle><text x="${sx(lam)+10}" y="${Math.max(Y1+28,sy(peak)-10)}" fill="#eef1ff">peak ${lam.toFixed(2)} µm</text>`;
 $('bbSvg').innerHTML=s;$('tVal').textContent=T.toLocaleString('en-US')+' K';
 const where=lam<.38?'Ultraviolet':lam<=.75?'Visible':'Infrared';$('tOut').innerHTML=`<dt>Peak wavelength</dt><dd>${lam.toFixed(2)} µm</dd><dt>Peak falls in</dt><dd style="color:${where==='Infrared'?'#ff6b7f':'#8fd3ff'}">${where}</dd>`}
$('tRange').oninput=e=>renderBB(+e.target.value);
$('tPresets').innerHTML=[['Red dwarf',3000],['Sun',5778],['Vega',9600],['Brown dwarf',2000]].map(([n,v])=>`<button type="button" data-t="${v}">${n} · ${v.toLocaleString('en-US')} K</button>`).join('');
$('tPresets').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('tRange').value=b.dataset.t;renderBB(+b.dataset.t)});

/* ---------- channels ---------- */
function renderChans(){$('chans').innerHTML=BANDS.map((b,i)=>`<div class="chan"><b>Band ${i+1}</b><span>${b[0]}–${b[1].toFixed(1)} µm</span><span style="color:var(--mute)">R=${b[2]}</span><div class="cells">${Array.from({length:17},(_,j)=>{const l=b[0]+(b[1]-b[0])*(j+.5)/17,q=(i*17+j)/101;const c=`hsl(${Math.round(chanHue(q))} 90% 62%)`;return`<i title="${l.toFixed(3)} µm" style="background:${c};color:${c};opacity:${l>=lo&&l<=hi?1:.18}"></i>`}).join('')}</div></div>`).join('');
 $('dataKpi').innerHTML=[['Wavelength range','0.75 – 5.0 µm'],['Spectral channels','102'],['Detectors','6 × 17 bands'],['Survey','Whole sky']].map(([k,v])=>`<div class="panel kpi"><small>${k}</small><b style="font-size:22px">${v}</b></div>`).join('')}

/* ---------- agent page ---------- */
const chatTurns=[];chatBox('chatLog','chatForm','chatQ',chatTurns,'chat');
$('chatSugg').innerHTML=['Why can SPHEREx see through dust?','What is near infrared?','How was Neptune found?','Is Planet X real?'].map(q=>`<button type="button">${q}</button>`).join('');
$('chatSugg').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('chatQ').value=b.textContent;$('chatForm').requestSubmit()});

/* ---------- motion ---------- */
function renderMotion(y){const W=640,H=380,pmRA=-0.7984,pmDec=10.3279,S=0.185;const px=yr=>({x:W*.5+(yr-2025)*pmRA*S*3,y:H*.5-(yr-2025)*pmDec*S});
 let s='';let sd=9;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;for(let i=0;i<150;i++)s+=`<circle cx="${(rn()*W).toFixed(0)}" cy="${(rn()*H).toFixed(0)}" r="${rn()>.9?1.2:.6}" fill="#fff" fill-opacity="${(.3+rn()*.6).toFixed(2)}"></circle>`;
 const a=px(1950),b=px(2100);s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#8b6cff" stroke-width="2" stroke-dasharray="6 6"></line>`;
 const p0=px(y),past=px(Math.min(y,2026)),fut=px(Math.max(y,2026));s+=`<line x1="${past.x}" y1="${past.y}" x2="${fut.x}" y2="${fut.y}" stroke="#ffb054" stroke-width="3" stroke-linecap="round"></line>`;
 for(const yr of[1950,1975,2000,2026,2050,2075,2100]){const p=px(yr);s+=`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${yr===2026?'#58e0a8':'#9aa3c7'}"></circle><text x="${p.x-14}" y="${p.y+4}" text-anchor="end" fill="${yr===2026?'#58e0a8':'#9aa3c7'}" font-size="12">${yr===2026?'Today 2026':yr}</text>`}
 s+=`<circle cx="${p0.x}" cy="${p0.y}" r="18" fill="#ff8a5c" fill-opacity=".2"></circle><circle cx="${p0.x}" cy="${p0.y}" r="8" fill="#ffb054"></circle><text x="${p0.x+24}" y="${p0.y+6}" fill="#ffb054" font-size="18" font-weight="700">${y}</text>`;
 $('mvSvg').innerHTML=s;$('yrTag').textContent=y;const sh=Math.abs(y-2026)*10.36;$('mvShift').textContent=(y>=2026?'+':'−')+sh.toFixed(0)+'″ ('+(sh/60).toFixed(1)+'′)'}
$('yr').oninput=e=>renderMotion(+e.target.value);

/* ---------- planet x ---------- */
let scanned=false,scanAnim=0;
function drawPX(prog){const cv=$('pxCv'),r=cv.getBoundingClientRect();if(!r.width)return;const d=Math.min(2,devicePixelRatio||1);cv.width=r.width*d;cv.height=r.height*d;const g=cv.getContext('2d');g.scale(d,d);const w=r.width,h=r.height;
 g.fillStyle='#03040f';g.fillRect(0,0,w,h);let s=5;const rn=()=>(s=(s*16807)%2147483647)/2147483647;const dots=[];for(let i=0;i<150;i++){dots.push({x:rn()*w,y:rn()*h,b:rn(),k:rn()})}
 for(const p of dots){g.fillStyle=`rgba(255,255,255,${(.3+p.b*.7).toFixed(2)})`;g.beginPath();g.arc(p.x,p.y,p.b>.85?1.7:.9,0,7);g.fill()}
 const cand={x:w*.46,y:h*.48};g.fillStyle='rgba(255,138,92,.9)';g.beginPath();g.arc(cand.x,cand.y,1.6,0,7);g.fill();
 const pr=prog==null?(scanned?1:0):prog;if(pr>0){const ln=pr*w;for(const p of dots){if(p.x>ln||p.b<.55)continue;g.strokeStyle=p.k>.17?'#58e0a8':'#5aa6ff';g.lineWidth=1.2;g.beginPath();g.arc(p.x,p.y,8,0,7);g.stroke()}
  if(cand.x<ln){g.strokeStyle='#ffb054';g.lineWidth=3;g.beginPath();g.arc(cand.x,cand.y,16,0,7);g.stroke();g.fillStyle='#ffb054';g.font='600 12px "JetBrains Mono",monospace';g.fillText('PX-01',cand.x+22,cand.y+4)}
  if(pr<1){g.fillStyle='rgba(143,211,255,.2)';g.fillRect(ln-30,0,30,h);g.strokeStyle='#8fd3ff';g.beginPath();g.moveTo(ln,0);g.lineTo(ln,h);g.stroke()}}}
$('scanBtn').onclick=()=>{const t0=performance.now();$('scanBtn').disabled=true;cancelAnimationFrame(scanAnim);const st=n=>{const p=Math.min(1,(n-t0)/1800);drawPX(p);if(p<1)scanAnim=requestAnimationFrame(st);else{scanned=true;$('scanBtn').disabled=false;$('scanBtn').textContent='Scan again';
 $('pxOut').innerHTML=[['Objects found','148'],['Matched in Gaia','121'],['Matched in WISE','25'],['Known asteroids','1'],['No match','1 candidate']].map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');$('pxCand').hidden=false}};scanAnim=requestAnimationFrame(st)};
$('pxAsk').onclick=()=>askInChat('A faint red dot in an infrared image has no match in Gaia, WISE or the asteroid list, and it moved slightly between two images. What should astronomers check before calling it a new planet?');

/* ---------- dashboard & mind map ---------- */
function renderDash(){const n=S?S.learned.length:0,st=S?Math.min(5,S.stage+(S.dist>=STAGE_LEN?1:0)):0;const rows=S?[{n:S.name,p:myP(),me:1},...S.rivals].sort((a,b)=>b.p-a.p):[];const pos=S?rows.findIndex(r=>r.me)+1:'–';
 $('dKpi').innerHTML=[['Planets collected',n+'/10',n?'Keep flying into planets':'Start a race to begin'],['Eras completed',st+'/5',''],['Race position',S&&S.screen!=='start'?pos+'/4':'–',''],['Questions asked',String(chatTurns.filter(t=>t.role==='user').length+gameTurns.filter(t=>t.role==='user').length),'to the agent']].map(([k,v,s])=>`<div class="panel kpi"><small>${k}</small><b>${v}</b><span>${s}</span></div>`).join('');
 const per=ERAS.map(e=>e.items.filter(it=>S&&S.shown.has(it.t)).length);let s='';ERAS.forEach((e,i)=>{const x=50+i*118,h=per[i]/2*170;s+=`<rect x="${x}" y="30" width="70" height="170" rx="10" fill="rgba(143,211,255,.06)"></rect><rect x="${x}" y="${200-h}" width="70" height="${h}" rx="10" fill="url(#dg)"></rect><text x="${x+35}" y="${222}" text-anchor="middle">${e.name}</text><text x="${x+35}" y="${190-h}" text-anchor="middle" fill="#eef1ff">${per[i]}/2</text>`});
 $('dChart').innerHTML=`<defs><linearGradient id="dg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8b6cff"></stop><stop offset="1" stop-color="#8fd3ff"></stop></linearGradient></defs>`+s}
$('dAsk').onclick=async()=>{const el=$('dNote');el.classList.remove('err');const got=S?S.learned.map(l=>l.t):[];await agent(RULES(`Write a short encouraging study summary for this player: what they learned from the planets they collected (${got.join(', ')||'none yet'}), one strength, and one thing to explore next. If they collected nothing, invite them to play.`),el,'dash')};
function renderMind(){const W=1100,H=560,C={x:550,y:280};let lines='',nodes='';
 const N=(x,y,w,t,c,on,root)=>`<g opacity="${on?1:.35}"><rect x="${x-w/2}" y="${y-22}" width="${w}" height="44" rx="22" fill="${root?'url(#mr)':'#0d1130'}" stroke="${c}" stroke-width="${on?2:1}"></rect><text x="${x}" y="${y+5}" text-anchor="middle" fill="#eef1ff" style="font-family:'Instrument Sans',sans-serif;font-size:14px;font-weight:600">${esc(t)}</text></g>`;
 const L=(a,b,c,on)=>`<path d="M${a.x} ${a.y} C${(a.x+b.x)/2} ${a.y} ${(a.x+b.x)/2} ${b.y} ${b.x} ${b.y}" fill="none" stroke="${c}" stroke-opacity="${on?.7:.18}" stroke-width="2"></path>`;
 const ang=i=>-Math.PI/2+i*2*Math.PI/5,at=(a,r)=>({x:C.x+Math.cos(a)*r*1.75,y:C.y+Math.sin(a)*r});
 ERAS.forEach((e,i)=>{const a=ang(i),p=at(a,150);const doneE=e.items.some(it=>S&&S.shown.has(it.t));lines+=L(C,p,'#8fd3ff',doneE);
  e.items.forEach((it,j)=>{const on=S&&S.shown.has(it.t);const q=at(a+(j?.3:-.3),255);q.x=Math.max(80,Math.min(W-80,q.x));q.y=Math.max(28,Math.min(H-28,q.y));lines+=L(p,q,it.c,on);nodes+=N(q.x,q.y,150,it.t,it.c,on)});
  nodes+=N(p.x,p.y,170,(i+1)+'. '+e.name,'#8fd3ff',doneE)});
 nodes+=N(C.x,C.y,240,'Finding planets','#ffb054',true,true);$('mmSvg').innerHTML=`<defs><linearGradient id="mr" x1="0" x2="1"><stop offset="0" stop-color="#8b6cff"></stop><stop offset="1" stop-color="#5d8bff"></stop></linearGradient></defs>${lines}${nodes}`}

/* ---------- game ---------- */
const ERAS=[
 {name:"Ancient Sky",when:"before 1600",hue:[255,160,90],items:[{t:"Mars",c:"#d9644a",f:"Mars looks red because its soil is full of iron oxide, the same thing as rust. People saw it with their eyes thousands of years ago."},{t:"Jupiter",c:"#e0b48a",f:"Jupiter is the biggest planet. More than 1,000 Earths could fit inside it."}]},
 {name:"Telescope",when:"1600s",hue:[240,200,110],items:[{t:"Jupiter's moons",c:"#f0d77a",f:"In 1610 Galileo pointed a telescope at Jupiter and saw four moons going around it."},{t:"Saturn's rings",c:"#e8cf9a",ring:1,f:"Early telescopes showed strange 'ears' on Saturn. Later, astronomers understood they were rings."}]},
 {name:"New Planets",when:"1781–1846",hue:[90,210,220],items:[{t:"Uranus",c:"#8fe0e0",f:"In 1781 William Herschel found Uranus. It was the first planet discovered with a telescope."},{t:"Neptune",c:"#4f7dff",f:"Neptune was found in 1846 because maths predicted where it should be, before anyone saw it."}]},
 {name:"Pluto",when:"1930",hue:[140,170,255],items:[{t:"Pluto",c:"#c9a98a",f:"Clyde Tombaugh found Pluto in 1930 by comparing photos of the sky taken on different nights and spotting a dot that moved."},{t:"Kuiper Belt",c:"#9aa6c9",f:"Beyond Neptune is a belt of icy objects. Pluto is one of them, so in 2006 it was called a dwarf planet."}]},
 {name:"Infrared",when:"2009 → today",hue:[255,90,140],items:[{t:"WISE",c:"#ff8f6b",f:"NASA's WISE telescope mapped the whole sky in infrared light, which shows cold, dark objects."},{t:"SPHEREx",c:"#b48af0",f:"SPHEREx maps the whole sky in 102 infrared colors. Cold, far-away worlds like a possible Planet X glow in infrared."}]}];
const ALL=ERAS.flatMap(e=>e.items);const STAGE_LEN=1000,W=520,H=640,HZ=170,CX=W/2;
const cv=$('cv'),ctx=cv.getContext('2d');const RIV=[{n:'Sara',c:'#8fd3ff'},{n:'Layla',c:'#c7a6ff'},{n:'Omar',c:'#58e0a8'}];
let S,raf=0;const gameTurns=[];
function newStar(any){return{x:(Math.random()-.5)*2,y:(Math.random()-.5)*1.4,z:any?Math.random():1}}
function fresh(name){return{screen:'start',name:name||'You',lane:1,lx:1,stage:0,dist:0,speed:4,slow:0,obj:[],spawn:20,learned:[],shown:new Set(),stars:Array.from({length:160},()=>newStar(true)),rivals:RIV.map((r,i)=>({...r,p:0,v:[3.65,3.55,3.4][i]})),winner:null,last:0,phase:0,shake:0}}
function total(){return ERAS.length*STAGE_LEN}
function myP(){return S.stage*STAGE_LEN+Math.min(S.dist,STAGE_LEN)}
function fit(){const d=Math.min(2,devicePixelRatio||1);cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
function renderRail(){const r=$('rail');r.querySelectorAll('.era').forEach(e=>e.remove());ERAS.forEach((e,i)=>{const d=document.createElement('div');d.className='era'+(i<S.stage?' done':i===S.stage?' now':'');d.innerHTML=`<i>${i<S.stage?'✓':i+1}</i><b>${esc(e.name)}</b><span>${esc(e.when)}</span>`;r.appendChild(d)});updRail()}
function updRail(){const f=myP()/total();$('railFill').style.width=`calc(${f*80}% - ${f*36}px)`}
function renderBoard(){const rows=[{n:S.name,p:myP(),me:1,c:'#ffb054'},...S.rivals].sort((a,b)=>b.p-a.p);
 $('board').innerHTML=rows.map((r,i)=>{const pc=Math.min(100,Math.round(r.p/total()*100));return`<div class="racer${r.me?' me':''}"><span class="p">${i+1}</span><span class="av" style="background:${r.c}">${esc(r.n[0].toUpperCase())}</span><div class="nm"><span>${esc(r.n)}${r.me?' (you)':''}</span><div class="pbar"><i style="width:${pc}%;background:${r.c}"></i></div></div><span class="pc">${pc}%</span></div>`}).join('');
 $('hPos').innerHTML=(rows.findIndex(r=>r.me)+1)+'<small>/4</small>';updRail()}
function renderSlots(){$('slots').innerHTML=ALL.map(it=>{const got=S.shown.has(it.t);return`<div class="slot${got?' got':''}" title="${got?esc(it.t):'Locked'}">${got?`<i style="--c:${it.c};background:radial-gradient(circle at 35% 35%,#fff,${it.c} 35%,#1a1238)"></i>`:'?'}</div>`}).join('');$('colN').textContent=S.learned.length+'/10';$('hFacts').textContent=S.learned.length+'/10'}
function hud(){const pc=Math.min(100,Math.round(S.dist/STAGE_LEN*100));$('hEra').textContent=`Stage ${S.stage+1} · ${ERAS[S.stage].name}`;$('hPct').textContent=pc+'% of stage';$('hBar').style.width=pc+'%'}
const ov=$('ov');function show(h){ov.innerHTML=h;ov.hidden=false}function hide(){ov.hidden=true;ov.innerHTML=''}
function startScreen(){S=fresh(S&&S.name);renderRail();renderBoard();renderSlots();hud();draw();
 show(`<form class="card" id="joinf"><div class="kick">Online race · 4 racers</div><h2>Race through 400 years of finding planets</h2><p>Five eras, from the naked-eye sky to NASA's SPHEREx. Fly into planets to unlock their story. Dodge asteroids. First across the infrared finish line reaches Planet X.</p><label for="nm">Pilot name</label><input id="nm" maxlength="12" placeholder="Your name" value="${S.name==='You'?'':esc(S.name)}"><button class="btn" type="submit">Join the race</button></form>`);
 $('joinf').addEventListener('submit',e=>{e.preventDefault();const v=$('nm').value.trim();if(v)S.name=v;renderBoard();countdown()})}
function countdown(){let n=3;S.screen='count';const tick=()=>{if(n===0){go();return}show(`<div class="count">${n}</div>`);n--;setTimeout(tick,650)};tick()}
function go(){hide();S.screen='race';S.last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function pauseGame(){S.screen='pause';cancelAnimationFrame(raf);show(`<div class="card"><div class="kick">Paused</div><h2>Race paused</h2><p>Your progress is kept.</p><button class="btn" id="cont" type="button">Resume race</button></div>`);$('cont').onclick=go}
function infoCard(it){S.screen='info';if(!S.shown.has(it.t)){S.shown.add(it.t);S.learned.push(it);renderSlots()}const e=ERAS[S.stage];
 show(`<div class="card"><div class="kick">Stage ${S.stage+1} · ${esc(e.name)} · ${esc(e.when)}</div><div class="orb${it.ring?' ring':''}" style="--c:${it.c};background:radial-gradient(circle at 34% 30%,#fff,${it.c} 30%,#1a1238 92%)"></div><h2>${esc(it.t)}</h2><p>${esc(it.f)}</p><div class="agentbox"><div class="who">NexAris Agent</div><div class="ans" id="cardAns">Want the story behind ${esc(it.t)}? Ask me.</div><button class="btn ghost sm" id="cardAsk" type="button">Ask the Agent</button></div><button class="btn" id="cont" type="button">Keep racing</button></div>`);
 $('cont').onclick=go;$('cont').focus();$('cardAsk').onclick=ev=>{ev.currentTarget.hidden=true;agent(RULES()+'\n\nQuestion: Tell me one surprising thing about '+it.t+' and how people discovered or studied it. The card already says: '+it.f,$('cardAns'),'card')}}
function checkpoint(){S.screen='check';const n=ERAS[S.stage+1];show(`<div class="card"><div class="kick">Checkpoint saved</div><h2>${esc(ERAS[S.stage].name)} complete</h2><p>Progress saved. Next era: <b>${esc(n.name)}</b> (${esc(n.when)}).</p><button class="btn" id="cont" type="button">Launch stage ${S.stage+2}</button></div>`);
 $('cont').onclick=()=>{S.stage++;S.dist=0;S.obj=[];renderRail();hud();go()};$('cont').focus()}
function finish(){S.screen='finish';const rows=[{n:S.name,p:total(),me:1},...S.rivals].sort((a,b)=>(b.n===S.winner)-(a.n===S.winner)||b.p-a.p);const won=S.winner===S.name;
 show(`<div class="card"><div class="kick">${won?'You reached Planet X first':'Race over'}</div><h2>${won?'You win the Odyssey':esc(S.winner)+' crossed first'}</h2><p>You collected ${S.learned.length} of 10 planet facts.</p><ol class="podium">${rows.map((r,i)=>`<li class="${r.me?'me':''}"><b>${i+1}</b>${esc(r.n)}${r.me?' (you)':''}</li>`).join('')}</ol><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="again" type="button">Race again</button><a class="btn ghost" href="#mindmap">See my mind map</a><a class="btn ghost" href="#dashboard">Dashboard</a></div></div>`);$('again').onclick=startScreen}
function laneX(l,t){return CX+(l-1)*(18+132*t)}function yAt(t){return HZ+Math.pow(t,1.55)*(H-HZ)}
function spawn(){const era=ERAS[S.stage];const pend=era.items.filter(it=>!S.shown.has(it.t)&&!S.obj.some(o=>o.it===it));const planet=pend.length&&Math.random()<.45;S.obj.push({lane:Math.floor(Math.random()*3),t:0,it:planet?pend[0]:null,rot:Math.random()*6})}
function loop(now){if(S.screen!=='race')return;const dt=Math.min(3,(now-S.last)/16.7);S.last=now;const sp=S.slow>0?S.speed*.45:S.speed;if(S.slow>0)S.slow-=dt;S.dist+=sp*dt;S.phase+=sp*dt;S.lx+=(S.lane-S.lx)*Math.min(1,.25*dt);if(S.shake>0)S.shake-=dt;
 S.rivals.forEach(r=>{r.p=Math.min(total(),r.p+r.v*dt*(.85+Math.random()*.3));if(r.p>=total()&&!S.winner)S.winner=r.n});
 for(const s of S.stars){s.z-=sp*dt*.004;if(s.z<=.02)Object.assign(s,newStar(false))}
 S.spawn-=dt;if(S.spawn<=0){spawn();S.spawn=38+Math.random()*30}for(const o of S.obj){o.t+=sp*dt*.0021*(.35+o.t);o.rot+=.02*dt}
 const hit=S.obj.find(o=>o.lane===S.lane&&o.t>.84&&o.t<.97);S.obj=S.obj.filter(o=>o!==hit&&o.t<1.08);renderBoard();hud();draw();
 if(hit){if(hit.it){infoCard(hit.it);return}S.slow=40;S.shake=14}
 if(S.dist>=STAGE_LEN){if(S.stage===ERAS.length-1){if(!S.winner)S.winner=S.name;renderBoard();finish();return}checkpoint();return}raf=requestAnimationFrame(loop)}
function draw(){if(!S)return;const[r,g,b]=ERAS[S.stage].hue;ctx.save();if(S.shake>0)ctx.translate((Math.random()-.5)*6,(Math.random()-.5)*6);
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#020309');sky.addColorStop(.32,`rgba(${r},${g},${b},.16)`);sky.addColorStop(.6,'#05061a');sky.addColorStop(1,'#020309');ctx.fillStyle=sky;ctx.fillRect(-10,-10,W+20,H+20);
 const neb=ctx.createRadialGradient(CX,HZ,10,CX,HZ,320);neb.addColorStop(0,`rgba(${r},${g},${b},.38)`);neb.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=neb;ctx.fillRect(0,0,W,H);
 for(const s of S.stars){const k=1/s.z,x=CX+s.x*160*k,y=HZ-20+s.y*160*k;if(x<0||x>W||y<0||y>H)continue;const k2=1/(s.z+.03),x2=CX+s.x*160*k2,y2=HZ-20+s.y*160*k2;ctx.strokeStyle=`rgba(238,241,255,${Math.min(1,(1-s.z)*1.1)})`;ctx.lineWidth=Math.max(.6,(1-s.z)*2);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x,y);ctx.stroke()}
 const hg=ctx.createLinearGradient(0,HZ-30,0,HZ+30);hg.addColorStop(0,'rgba(0,0,0,0)');hg.addColorStop(.5,`rgba(${r},${g},${b},.55)`);hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;ctx.fillRect(0,HZ-30,W,60);
 const lt=laneX(-.5,0),rt=laneX(2.5,0),lb=laneX(-.5,1),rb=laneX(2.5,1);const road=ctx.createLinearGradient(0,HZ,0,H);road.addColorStop(0,'rgba(139,108,255,.04)');road.addColorStop(1,'rgba(139,108,255,.22)');ctx.fillStyle=road;ctx.beginPath();ctx.moveTo(lt,HZ);ctx.lineTo(rt,HZ);ctx.lineTo(rb,H);ctx.lineTo(lb,H);ctx.closePath();ctx.fill();
 ctx.strokeStyle='rgba(143,211,255,.55)';ctx.lineWidth=2;ctx.shadowColor='#8fd3ff';ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(lt,HZ);ctx.lineTo(lb,H);ctx.moveTo(rt,HZ);ctx.lineTo(rb,H);ctx.stroke();ctx.shadowBlur=0;
 const seg=.09,off=(S.phase*.0021)%(seg*2);for(const l of[.5,1.5]){for(let t=-off;t<1;t+=seg*2){const a=Math.max(0,t),c=Math.min(1,t+seg);if(c<=0)continue;ctx.strokeStyle=`rgba(238,241,255,${.15+.5*c})`;ctx.lineWidth=1+3*c;ctx.beginPath();ctx.moveTo(laneX(l,a),yAt(a));ctx.lineTo(laneX(l,c),yAt(c));ctx.stroke()}}
 for(const o of[...S.obj].sort((a,b)=>a.t-b.t)){const t=Math.min(1.08,o.t),x=laneX(o.lane,t),y=yAt(t)-10,sc=.18+.95*t;
  if(o.it){const R=30*sc;const gl=ctx.createRadialGradient(x,y,R*.5,x,y,R*2.4);gl.addColorStop(0,o.it.c+'66');gl.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gl;ctx.fillRect(x-R*2.5,y-R*2.5,R*5,R*5);
   if(o.it.ring){ctx.strokeStyle='rgba(232,207,154,.8)';ctx.lineWidth=3*sc;ctx.beginPath();ctx.ellipse(x,y,R*1.8,R*.5,-.25,Math.PI,2*Math.PI);ctx.stroke()}
   const pg=ctx.createRadialGradient(x-R*.35,y-R*.35,R*.1,x,y,R);pg.addColorStop(0,'#fff');pg.addColorStop(.3,o.it.c);pg.addColorStop(1,'#140f30');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.fill();
   if(o.it.ring){ctx.strokeStyle='rgba(232,207,154,.9)';ctx.beginPath();ctx.ellipse(x,y,R*1.8,R*.5,-.25,0,Math.PI);ctx.stroke()}
   if(t>.3){ctx.fillStyle=`rgba(238,241,255,${Math.min(1,(t-.3)*2)})`;ctx.font=`600 ${Math.round(11+5*t)}px "Instrument Sans",sans-serif`;ctx.textAlign='center';ctx.fillText(o.it.t,x,y+R+16*sc+6)}}
  else{const R=20*sc;ctx.save();ctx.translate(x,y);ctx.rotate(o.rot);const ag=ctx.createRadialGradient(-R*.3,-R*.3,1,0,0,R*1.3);ag.addColorStop(0,'#a59a8c');ag.addColorStop(1,'#3b342c');ctx.fillStyle=ag;ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283,rr=R*(.75+((i*37)%5)/10);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.restore()}}
 const sx=laneX(S.lx,.9),sy=yAt(.9)-6,hot=S.slow>0;const sg=ctx.createRadialGradient(sx,sy+20,4,sx,sy+20,70);sg.addColorStop(0,hot?'rgba(255,107,127,.55)':'rgba(255,176,84,.5)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.fillRect(sx-80,sy-50,160,140);
 const fl=14+Math.random()*12;const fg=ctx.createLinearGradient(0,sy+14,0,sy+28+fl);fg.addColorStop(0,'#fff');fg.addColorStop(.3,'#ffb054');fg.addColorStop(1,'rgba(139,108,255,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(sx-9,sy+14);ctx.lineTo(sx,sy+28+fl);ctx.lineTo(sx+9,sy+14);ctx.fill();
 ctx.save();ctx.translate(sx,sy);ctx.rotate((S.lane-S.lx)*.35);const hull=ctx.createLinearGradient(0,-40,0,20);hull.addColorStop(0,'#ffffff');hull.addColorStop(1,hot?'#ff6b7f':'#8fd3ff');ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(0,-40);ctx.lineTo(10,-8);ctx.lineTo(30,14);ctx.lineTo(10,10);ctx.lineTo(0,20);ctx.lineTo(-10,10);ctx.lineTo(-30,14);ctx.lineTo(-10,-8);ctx.closePath();ctx.fill();ctx.fillStyle='#0d1130';ctx.beginPath();ctx.ellipse(0,-14,4,9,0,0,7);ctx.fill();ctx.restore();
 if(S.stage===4){ctx.fillStyle='rgba(255,90,140,.06)';ctx.fillRect(0,0,W,H)}ctx.restore()}
function move(d){if(S&&S.screen==='race')S.lane=Math.max(0,Math.min(2,S.lane+d))}
document.addEventListener('keydown',e=>{if(location.hash!=='#play'||(e.target&&e.target.tagName==='INPUT'))return;const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a'){move(-1);e.preventDefault()}if(k==='arrowright'||k==='d'){move(1);e.preventDefault()}});
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();move(e.clientX-r.left<r.width/2?-1:1)});$('padL').onclick=()=>move(-1);$('padR').onclick=()=>move(1);
chatBox('log','askForm','askQ',gameTurns,'game');

/* ---------- boot ---------- */
addEventListener('resize',()=>{if(location.hash==='#planetx')drawPX();if(location.hash==='#sky')drawSky()});
(function(){const c=$('bg'),g=c.getContext('2d');let st=[],w,h;const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function sz(){const d=Math.min(2,devicePixelRatio||1);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;g.setTransform(d,0,0,d,0,0);st=Array.from({length:Math.round(w*h/5200)},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.2+.2,p:Math.random()*6.28,s:Math.random()*.6+.2}))}
 function fr(t){g.clearRect(0,0,w,h);for(const s of st){const a=.25+.55*(.5+.5*Math.sin(s.p+t*.001*s.s));g.fillStyle=`rgba(225,232,255,${a.toFixed(2)})`;g.beginPath();g.arc(s.x,s.y-(scrollY*.04*s.s)%h,s.r,0,7);g.fill()}if(!rm)requestAnimationFrame(fr)}
 sz();addEventListener('resize',sz);requestAnimationFrame(fr)})();
document.addEventListener('pointermove',e=>{const p=e.target.closest&&e.target.closest('.panel');if(!p)return;const r=p.getBoundingClientRect();p.style.setProperty('--mx',(e.clientX-r.left)+'px');p.style.setProperty('--my',(e.clientY-r.top)+'px')});
fit();startScreen();pick(T[0],false);renderRange();renderBB(5000);renderMotion(2026);renderChans();route();
(async()=>{try{sample=window.claude?await window.claude.use('sample'):null}catch(e){sample=null}if(!sample){$('chatNote').textContent='Built-in agent mode: answers come from the NexAris knowledge base (NASA and JPL facts). Check important facts with NASA.'}})();
