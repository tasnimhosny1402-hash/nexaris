// Sky View data: targets, surveys, bright stars and constellation lines (J2000, approximate).

export const TARGETS = [
  { name: 'Orion Nebula', alias: 'M42', ra: 83.8221, dec: -5.3911, fov: 1.2, c: '#58e0a8', band: 'Near IR', type: 'Star-forming nebula', dist: '≈1,340 ly', note: 'Dust hides young stars in visible light. Near infrared sees through it.' },
  { name: 'NGC 3603', alias: 'Carina star cluster', ra: 168.7875, dec: -61.26, fov: 0.4, c: '#58e0a8', band: 'Near IR', type: 'Star-forming region', dist: '≈20,000 ly', note: 'One of the densest clusters of young massive stars in our galaxy.' },
  { name: 'Tarantula Nebula', alias: '30 Doradus', ra: 84.676, dec: -69.101, fov: 0.8, c: '#58e0a8', band: 'Near IR', type: 'Star-forming nebula', dist: '≈160,000 ly', note: 'In the Large Magellanic Cloud. Webb studied it in near infrared.' },
  { name: 'Southern Ring Nebula', alias: 'NGC 3132', ra: 151.757, dec: -40.436, fov: 0.15, c: '#5aa6ff', band: 'Mid IR', type: 'Planetary nebula', dist: '≈2,500 ly', note: 'Gas thrown off by a dying star. Mid infrared shows its warm dust.' },
  { name: "Barnard's Star", alias: 'Fastest star', ra: 269.4521, dec: 4.6934, fov: 0.1, c: '#ffb054', band: 'Near IR', type: 'Red dwarf', dist: '5.96 ly', note: 'Moves 10.4 arcseconds a year, faster across our sky than any other star.' },
  { name: 'Slipher field', alias: 'GhostShift pilot', ra: 28.67, dec: 11.91, fov: 2.5, c: '#ffb054', band: 'Near IR', type: 'Asteroid field', dist: 'Solar System', note: 'On the ecliptic, where GhostShift caught asteroid (1766) Slipher moving between SPHEREx visits. Turn on the movers below to see what else moved.' },
  { name: 'Vega', alias: 'Alpha Lyrae', ra: 279.2347, dec: 38.7837, fov: 0.5, c: '#5aa6ff', band: 'Mid IR', type: 'Main-sequence star', dist: '25 ly', note: 'Infrared revealed a disk of warm dust around it.' },
];

// Surveys. `url` is the HiPS the viewer loads (ESA ESASky mirror of the CDS HiPS, served with CORS
// and without the CDS ID lookup); `id` is the CDS ID used for the external Aladin link.
export const SURVEYS = [
  { label: 'Visible · DSS2', short: 'DSS2', id: 'CDS/P/DSS2/color', url: 'https://skies.esac.esa.int/DSSColor/', c: '#9aa3c7' },
  { label: 'Near IR · 2MASS', short: '2MASS', id: 'CDS/P/2MASS/color', url: 'https://skies.esac.esa.int/2MASSColor/', c: '#58e0a8' },
  { label: 'Mid IR · AllWISE', short: 'AllWISE', id: 'CDS/P/allWISE/color', url: 'https://skies.esac.esa.int/AllWISEColor/', c: '#5aa6ff' },
];

// RA/Dec as sexagesimal ("hh mm ss.ss +dd mm ss.s"), the form Aladin Lite's target parameter resolves reliably.
export const sexa = (ra, dec) => {
  const f = (v, d) => {
    v = Math.abs(v);
    const a = Math.floor(v), m = Math.floor((v - a) * 60), s = ((v - a) * 60 - m) * 60;
    return String(a).padStart(2, '0') + ' ' + String(m).padStart(2, '0') + ' ' + s.toFixed(d).padStart(d + 3, '0');
  };
  ra = ((ra % 360) + 360) % 360;
  return f(ra / 15, 2) + ' ' + (dec < 0 ? '-' : '+') + f(dec, 1);
};

// Link to the full Aladin Lite site. Survey ids there are given without the "CDS/" prefix.
export const aladinUrl = (t, survey) =>
  'https://aladin.cds.unistra.fr/AladinLite/?target=' + encodeURIComponent(sexa(t.ra, t.dec)) +
  '&fov=' + t.fov + '&survey=' + encodeURIComponent(survey.replace(/^CDS\//, ''));

// name, ra, dec, mag, spectral class, constellation
export const STARS = [
  ['Betelgeuse', 88.79, 7.41, 0.5, 'M', 'Ori'], ['Rigel', 78.63, -8.2, 0.13, 'B', 'Ori'], ['Bellatrix', 81.28, 6.35, 1.64, 'B', 'Ori'], ['Saiph', 86.94, -9.67, 2.06, 'B', 'Ori'], ['Alnitak', 85.19, -1.94, 1.77, 'O', 'Ori'], ['Alnilam', 84.05, -1.2, 1.69, 'B', 'Ori'], ['Mintaka', 83, -0.3, 2.23, 'O', 'Ori'], ['Meissa', 83.78, 9.93, 3.39, 'O', 'Ori'],
  ['Aldebaran', 68.98, 16.51, 0.85, 'K', 'Tau'], ['Elnath', 81.57, 28.61, 1.65, 'B', 'Tau'], ['Alcyone', 56.87, 24.11, 2.87, 'B', 'Tau'], ['Zeta Tauri', 84.41, 21.14, 3, 'B', 'Tau'],
  ['Pollux', 116.33, 28.03, 1.14, 'K', 'Gem'], ['Castor', 113.65, 31.89, 1.58, 'A', 'Gem'], ['Alhena', 99.43, 16.4, 1.93, 'A', 'Gem'],
  ['Sirius', 101.29, -16.72, -1.46, 'A', 'CMa'], ['Adhara', 104.66, -28.97, 1.5, 'B', 'CMa'], ['Wezen', 107.1, -26.39, 1.83, 'F', 'CMa'], ['Mirzam', 95.67, -17.96, 1.98, 'B', 'CMa'], ['Procyon', 114.83, 5.22, 0.34, 'F', 'CMi'],
  ['Regulus', 152.09, 11.97, 1.35, 'B', 'Leo'], ['Algieba', 154.99, 19.84, 2.08, 'K', 'Leo'], ['Zosma', 168.53, 20.52, 2.56, 'A', 'Leo'], ['Denebola', 177.26, 14.57, 2.13, 'A', 'Leo'],
  ['Dubhe', 165.93, 61.75, 1.79, 'K', 'UMa'], ['Merak', 165.46, 56.38, 2.37, 'A', 'UMa'], ['Phecda', 178.46, 53.69, 2.44, 'A', 'UMa'], ['Megrez', 183.86, 57.03, 3.31, 'A', 'UMa'], ['Alioth', 193.51, 55.96, 1.77, 'A', 'UMa'], ['Mizar', 200.98, 54.93, 2.27, 'A', 'UMa'], ['Alkaid', 206.89, 49.31, 1.86, 'B', 'UMa'], ['Polaris', 37.95, 89.26, 1.98, 'F', 'UMi'],
  ['Caph', 2.29, 59.15, 2.28, 'F', 'Cas'], ['Schedar', 10.13, 56.54, 2.24, 'K', 'Cas'], ['Gamma Cas', 14.18, 60.72, 2.47, 'B', 'Cas'], ['Ruchbah', 21.45, 60.24, 2.68, 'A', 'Cas'], ['Segin', 28.6, 63.67, 3.37, 'B', 'Cas'],
  ['Vega', 279.23, 38.78, 0.03, 'A', 'Lyr'], ['Zeta Lyrae', 281.19, 37.6, 4.3, 'A', 'Lyr'], ['Sheliak', 282.52, 33.36, 3.5, 'B', 'Lyr'], ['Sulafat', 284.74, 32.69, 3.25, 'B', 'Lyr'],
  ['Deneb', 310.36, 45.28, 1.25, 'A', 'Cyg'], ['Sadr', 305.56, 40.26, 2.23, 'F', 'Cyg'], ['Gienah', 311.55, 33.97, 2.48, 'K', 'Cyg'], ['Delta Cygni', 296.24, 45.13, 2.87, 'B', 'Cyg'], ['Albireo', 292.68, 27.96, 3.05, 'K', 'Cyg'],
  ['Altair', 297.7, 8.87, 0.77, 'A', 'Aql'], ['Tarazed', 296.56, 10.61, 2.72, 'K', 'Aql'], ['Alshain', 298.83, 6.41, 3.71, 'G', 'Aql'],
  ['Antares', 247.35, -26.43, 1.06, 'M', 'Sco'], ['Dschubba', 240.08, -22.62, 2.29, 'B', 'Sco'], ['Acrab', 241.36, -19.81, 2.62, 'B', 'Sco'], ['Tau Scorpii', 248.97, -28.22, 2.82, 'B', 'Sco'], ['Epsilon Scorpii', 252.54, -34.29, 2.29, 'K', 'Sco'], ['Mu Scorpii', 252.97, -38.05, 3, 'B', 'Sco'], ['Sargas', 264.33, -43, 1.86, 'F', 'Sco'], ['Kappa Scorpii', 265.62, -39.03, 2.4, 'B', 'Sco'], ['Shaula', 263.4, -37.1, 1.62, 'B', 'Sco'],
  ['Kaus Australis', 276.04, -34.38, 1.85, 'B', 'Sgr'], ['Nunki', 283.82, -26.3, 2.05, 'B', 'Sgr'], ['Ascella', 285.65, -29.88, 2.6, 'A', 'Sgr'], ['Kaus Media', 274.41, -29.83, 2.7, 'K', 'Sgr'], ['Kaus Borealis', 276.99, -25.42, 2.8, 'K', 'Sgr'], ['Alnasl', 271.45, -30.42, 2.98, 'K', 'Sgr'], ['Phi Sagittarii', 281.41, -26.99, 3.2, 'B', 'Sgr'], ['Tau Sagittarii', 286.74, -27.67, 3.3, 'K', 'Sgr'],
  ['Acrux', 186.65, -63.1, 0.77, 'B', 'Cru'], ['Mimosa', 191.93, -59.69, 1.25, 'B', 'Cru'], ['Gacrux', 187.79, -57.11, 1.59, 'M', 'Cru'], ['Delta Crucis', 183.79, -58.75, 2.79, 'B', 'Cru'],
  ['Rigil Kentaurus', 219.9, -60.83, -0.27, 'G', 'Cen'], ['Hadar', 210.96, -60.37, 0.61, 'B', 'Cen'], ['Canopus', 95.99, -52.7, -0.74, 'F', 'Car'], ['Arcturus', 213.92, 19.18, -0.05, 'K', 'Boo'], ['Spica', 201.3, -11.16, 0.97, 'B', 'Vir'], ['Capella', 79.17, 46, 0.08, 'G', 'Aur'], ['Achernar', 24.43, -57.24, 0.46, 'B', 'Eri'], ['Fomalhaut', 344.41, -29.62, 1.16, 'A', 'PsA'],
];

export const CONSTELLATIONS = [
  ['Orion', 'Ori', [['Betelgeuse', 'Meissa'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Alnitak', 'Alnilam'], ['Alnilam', 'Mintaka'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Betelgeuse', 'Bellatrix']]],
  ['Taurus', 'Tau', [['Aldebaran', 'Elnath'], ['Aldebaran', 'Zeta Tauri'], ['Aldebaran', 'Alcyone']]],
  ['Gemini', 'Gem', [['Castor', 'Pollux'], ['Pollux', 'Alhena']]],
  ['Canis Major', 'CMa', [['Mirzam', 'Sirius'], ['Sirius', 'Wezen'], ['Wezen', 'Adhara']]],
  ['Leo', 'Leo', [['Regulus', 'Algieba'], ['Algieba', 'Zosma'], ['Zosma', 'Denebola'], ['Denebola', 'Regulus']]],
  ['Ursa Major', 'UMa', [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']]],
  ['Cassiopeia', 'Cas', [['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']]],
  ['Lyra', 'Lyr', [['Vega', 'Zeta Lyrae'], ['Zeta Lyrae', 'Sheliak'], ['Sheliak', 'Sulafat'], ['Sulafat', 'Zeta Lyrae']]],
  ['Cygnus', 'Cyg', [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Gienah', 'Sadr'], ['Sadr', 'Delta Cygni']]],
  ['Aquila', 'Aql', [['Tarazed', 'Altair'], ['Altair', 'Alshain']]],
  ['Scorpius', 'Sco', [['Acrab', 'Dschubba'], ['Dschubba', 'Antares'], ['Antares', 'Tau Scorpii'], ['Tau Scorpii', 'Epsilon Scorpii'], ['Epsilon Scorpii', 'Mu Scorpii'], ['Mu Scorpii', 'Sargas'], ['Sargas', 'Kappa Scorpii'], ['Kappa Scorpii', 'Shaula']]],
  ['Sagittarius', 'Sgr', [['Alnasl', 'Kaus Media'], ['Kaus Media', 'Kaus Australis'], ['Kaus Australis', 'Alnasl'], ['Kaus Media', 'Kaus Borealis'], ['Kaus Borealis', 'Phi Sagittarii'], ['Phi Sagittarii', 'Kaus Media'], ['Phi Sagittarii', 'Nunki'], ['Nunki', 'Tau Sagittarii'], ['Tau Sagittarii', 'Ascella'], ['Ascella', 'Phi Sagittarii'], ['Ascella', 'Kaus Australis']]],
  ['Crux', 'Cru', [['Acrux', 'Gacrux'], ['Mimosa', 'Delta Crucis']]],
  ['Centaurus', 'Cen', [['Rigil Kentaurus', 'Hadar']]],
];

export const SPECTRAL_COLORS = { O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff', G: '#fff4e8', K: '#ffd2a1', M: '#ffb07a' };

export const fmtRA = (ra) => {
  ra = ((ra % 360) + 360) % 360;
  const h = ra / 15, hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return String(mm === 60 ? (hh + 1) % 24 : hh).padStart(2, '0') + 'h ' + String(mm % 60).padStart(2, '0') + 'm';
};
export const fmtDec = (d) =>
  (d < 0 ? '−' : '+') + String(Math.floor(Math.abs(d))).padStart(2, '0') + '° ' + String(Math.round((Math.abs(d) % 1) * 60) % 60).padStart(2, '0') + '′';
export const fmtFov = (f) => (f >= 1 ? f.toFixed(f >= 10 ? 0 : 1) + '°' : f * 60 >= 1 ? (f * 60).toFixed(1) + '′' : (f * 3600).toFixed(0) + '″');
