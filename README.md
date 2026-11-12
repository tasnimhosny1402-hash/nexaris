# NexAris Odyssey

**Explore the infrared universe with NASA's SPHEREx.**
A NASA Space Apps 2026 project by **Team NexAris**. UI/UX, prototype and front-end by **Tasneem Hosny**.

**Live site:** https://nexaris-cyan.vercel.app (the old address https://tasnimhosny1402-hash.github.io/nexaris/ redirects there)

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

## What's inside

| View | What it does |
|---|---|
| Home | Project intro and feature overview |
| Sky View | Real sky in Aladin Lite (DSS2, 2MASS, AllWISE), your own FITS images, and real SPHEREx movers from the GhostShift pipeline with motion playback |
| Infrared Regions | Near, mid and far infrared explained with everyday analogies |
| Spectral Analysis | Prism spectrum of SPHEREx's 102 bands and a Planck temperature curve |
| Data Explorer | SPHEREx channels (sample data, marked) |
| Astronomy Chatbot | Space agent that answers infrared and astronomy questions |
| Motion / Planet X | Star motion over time and a simulated planet hunt, with a link to the real movers |
| Dashboard / Mind map | Game progress and topic map |
| Play | NexAris Odyssey race game through 5 eras of planet discovery |

## Run it locally (Next.js)
Needs Node.js 20 or newer.

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
```

### Project layout
- `app/`: Next.js App Router (`layout.js`, `page.js`, `globals.css`)
- `app/api/fits/route.js`: server proxy so FITS files from servers without CORS headers can be opened
- `components/NexarisApp.jsx`: app shell and all views (hash navigation: `#home`, `#sky`, `#play`, ...)
- `components/SkyView.jsx`: Sky View built on [Aladin Lite v3](https://aladin.cds.unistra.fr/AladinLite/) (npm `aladin-lite`)
- `components/sky/`, `lib/movers.js`: SPHEREx movers (layers, playback, panel)
- `lib/legacy.js`: the prototype's app logic (agent, game, charts) running inside the Next.js app
- `lib/sky-data.js`: targets, surveys, bright stars and constellations
- `legacy/`: the static prototype (`index.html`, `style.css`, `script.js`), kept for reference
- `index.html` (repo root): redirects the old GitHub Pages address to the live site (not part of the Next.js app)
- `.github/workflows/build.yml`: the Build check run on every pull request

### Sky View
- Real survey images: DSS2 (visible), 2MASS (near IR) and AllWISE (mid IR), loaded from the ESA ESASky mirrors of the CDS HiPS.
- FITS images: open a local file, drop it on the map, or paste a URL. The image needs a celestial WCS header. Opacity, colormap and stretch can be set per image.
- Loading a FITS file from a URL uses the `/api/fits` route (limit 100 MB), so it needs the Next.js server. Local files work everywhere.

### Movers (GhostShift)
Real SPHEREx results from the GhostShift pipeline (separate project). Six fields along the ecliptic, 225 sky tiles.
- The Sky View loads only the tiles near the current view as you pan and zoom (`components/sky/useGhostShift.js`), lists what is in view or inside a dragged box (`components/sky/MoversPanel.jsx`), and plays each mover's motion between its SPHEREx visits.
- Classes: green = known asteroid, orange = unidentified mover (3+ visits on a line), violet = barely moving, grey = unconfirmed single detection (hidden by default).
- Data layout: HiPS layers (`hips/deep`, `hips/movers`), `movers/index.json`, one file per sky tile in `movers/tiles/`, stamp strips in `movers/stamps/`, `moc.json`.

## Connecting the backend

The chatbot currently answers from a built-in knowledge base.
To connect a real AI backend, set `API_URL` at the **BACKEND HOOK** section in `lib/legacy.js` (in the static prototype: `legacy/script.js`).

The page sends:

```json
POST API_URL
{ "question": "What is near infrared?", "level": "School (ages 13-18)", "history": [] }
```

and expects:

```json
{ "answer": "Near infrared is ..." }
```

If the request fails, the built-in answers are used as a fallback.

## Deployment
- **App:** Vercel, team `tasneem24` (Hobby plan). Production: https://nexaris-cyan.vercel.app. Deploys automatically from this GitHub repo (see "How to deploy" above); the command below is only a manual fallback.
- **GhostShift data:** Cloudflare R2 bucket `nexaris-ghostshift`, public at `https://pub-26ea368373434497ab9344264e063a9a.r2.dev` (CORS: read-only, any origin). The app reads it through `NEXT_PUBLIC_GHOSTSHIFT_BASE`, which is set on the Vercel project and baked in at build time.
- `public/ghostshift` is only for local development; it is excluded from git (`.gitignore`) and from Vercel uploads (`.vercelignore`).

Manual redeploy (needs `VERCEL_TOKEN`):
```bash
vercel deploy --prod --scope tasneem24 --token $VERCEL_TOKEN \
  --build-env NEXT_PUBLIC_GHOSTSHIFT_BASE=https://pub-26ea368373434497ab9344264e063a9a.r2.dev
```
Update the movers data after a pipeline run (in the GhostShift project; needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `boto3`):
```bash
python -m ghostshift.run publish        # rebuild pilot_out
python -m ghostshift.upload             # sync pilot_out to R2: only changed files are sent
```
The site picks up new data on reload; no app redeploy is needed.

R2's `r2.dev` address is rate-limited and meant for light use. For heavy traffic, attach a custom domain to the bucket in Cloudflare and update `NEXT_PUBLIC_GHOSTSHIFT_BASE`.

## Notes

- Game rivals are simulated. Planet X field and Data Explorer use sample data (marked). The movers in Sky View are real SPHEREx detections.
- Sky images come from Aladin Lite (CDS), DSS2, 2MASS and AllWISE (ESA ESASky mirrors).
- Code was written with AI assistance.
