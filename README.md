# NexAris

NexAris is a NASA Space Apps hackathon project: an interactive web platform concept for exploring NASA SPHEREx all-sky infrared survey data.

> Status: UI prototype. All numbers in the prototype are sample data, not SPHEREx measurements, and some controls are visual only.

**Live site:** https://nexaris-cyan.vercel.app

## How to deploy (for the whole team)
You never run a deploy command. Vercel watches this repository:

| You do | What happens |
|---|---|
| Open a pull request (or push any branch other than `main`) | Vercel builds a **preview** and posts its link on the PR. GitHub runs the **Build** check. |
| Merge the pull request into `main` | The **live site updates automatically**, usually within 2 minutes. |
| Push something that does not build | The Build check turns red and the live site stays as it was. Fix it and push again. |

Rules of thumb:
- Work on a branch, open a PR, wait for the green Build check, then merge.
- To undo a bad release: in Vercel → project **nexaris** → Deployments, open the last good deployment → **Promote to Production**. Or revert the commit on GitHub.
- The Vercel project is on the Hobby plan (owner: Tasneem). If Vercel ever says a deploy is blocked because the commit author has no access, ask Tasneem to merge the PR (or move the project to Pro).

Updating the SPHEREx movers data is a different, rare step done on the machine that runs the GhostShift pipeline. See **Deployment** below.

## Run it (Next.js)
Needs Node.js 20 or newer.

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

### Project layout
- `app/`: Next.js App Router (`layout.js`, `page.js`, `globals.css`)
- `app/api/fits/route.js`: server proxy so FITS files from servers without CORS headers can be opened
- `components/NexarisApp.jsx`: app shell and all views (hash navigation: `#home`, `#sky`, `#play`, ...)
- `components/SkyView.jsx`: Sky View built on [Aladin Lite v3](https://aladin.cds.unistra.fr/AladinLite/) (npm `aladin-lite`)
- `lib/legacy.js`: the original app logic (agent, game, charts), unchanged from the prototype
- `lib/sky-data.js`: targets, surveys, bright stars and constellations
- `legacy/prototype.html`: the original single-file prototype, kept for reference
- `index.html`: redirects the old GitHub Pages address to the live site (not part of the Next.js app)
- `.github/workflows/build.yml`: the Build check run on every pull request

### Sky View
- Real survey images: DSS2 (visible), 2MASS (near IR) and AllWISE (mid IR), loaded from the ESA ESASky mirrors of the CDS HiPS.
- FITS images: open a local file, drop it on the map, or paste a URL. The image needs a celestial WCS header. Opacity, colormap and stretch can be set per image.
- Loading a FITS file from a URL uses the `/api/fits` route, so it needs the Next.js server. It does not work on a static host such as GitHub Pages. Local files work everywhere.

### Movers (GhostShift pilot)
Real SPHEREx results from the GhostShift pipeline (separate project, `python -m ghostshift.run ... --dest public/ghostshift`).
- `public/ghostshift/`: HiPS layers (`hips/deep`, `hips/movers`), `movers/index.json`, one file per sky tile in `movers/tiles/`, stamp strips in `movers/stamps/`, and `moc.json` (processed area).
- The Sky View loads only the tiles near the current view as you pan and zoom (`components/sky/useGhostShift.js`), lists what is in view or inside a dragged box (`components/sky/MoversPanel.jsx`), and shows a blink of each mover's visits.
- Classes: green = known asteroid, orange = unidentified mover (3+ visits on a line), violet = barely moving, grey = unconfirmed single detection (hidden by default).
- Everything is static files, so this part also works on a static host.
- Code: `components/sky/`, `lib/movers.js`.

## Deployment
- **App:** Vercel, team `tasneem24` (Hobby plan). Production: https://nexaris-cyan.vercel.app. Deploys automatically from this GitHub repo (see "How to deploy" above); the command below is only a manual fallback.
- **GhostShift data:** Cloudflare R2 bucket `nexaris-ghostshift`, public at `https://pub-26ea368373434497ab9344264e063a9a.r2.dev` (CORS: read-only, any origin). The app reads it through `NEXT_PUBLIC_GHOSTSHIFT_BASE`, which is set on the Vercel project and baked in at build time.
- `public/ghostshift` is only for local development; it is excluded from git (`.gitignore`) and from Vercel uploads (`.vercelignore`).

Redeploy the app (needs `VERCEL_TOKEN`):
```bash
vercel deploy --prod --scope tasneem24 --token $VERCEL_TOKEN \
  --build-env NEXT_PUBLIC_GHOSTSHIFT_BASE=https://pub-26ea368373434497ab9344264e063a9a.r2.dev
```
Update the data after a pipeline run (in the GhostShift project; needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `boto3`):
```bash
python -m ghostshift.run publish        # rebuild pilot_out
python -m ghostshift.upload             # sync pilot_out to R2: only changed files are sent
```
The site picks up new data on reload; no app redeploy is needed.

R2's `r2.dev` address is rate-limited and meant for light use. For heavy traffic, attach a custom domain to the bucket in Cloudflare and update `NEXT_PUBLIC_GHOSTSHIFT_BASE`.

## Links
- Prototype: https://www.figma.com/proto/2QfrGsR3XtffukJpkDDgjj?node-id=3-16
- Figma file: https://www.figma.com/design/2QfrGsR3XtffukJpkDDgjj

Access to these links must be granted from Figma's Share menu.

## Screens
1. Sky View
2. Orion Compare
3. Detection Results
4. Spectral Analysis
5. Data Explorer
6. Infrared Basics

## Handoff notes
- Font: Inter. Design width: 1440 px, desktop.
- Colors are stored as variables in the Figma file (collection "NexAris Colors").
- Images are placeholders until they are added in Figma.
- Buttons, tables and cards are not reusable Figma components yet.
- Loading, error and empty states are not designed.
- Settings and My Objects screens are not designed.
- The clickable prototype has not been tested end to end.
- Detection IDs, coordinates, magnitudes and the spectral profile on Sky View are placeholders.
- Lecture content comes from "Infrared Astronomy" by Shiraz (30 Oct 2026), marked for personal educational use only. Get permission before sharing it beyond the team.
- 
Live site: https://tasnimhosny1402-hash.github.io/nexaris/
