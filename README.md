# NexAris Odyssey

**Explore the infrared universe with NASA's SPHEREx.**
A NASA Space Apps 2026 project by **Team NexAris**. UI/UX, prototype and front-end by **Tasneem Hosny**.

Live site: https://tasnimhosny1402-hash.github.io/nexaris/

## What's inside

| View | What it does |
|---|---|
| Home | Project intro and feature overview |
| Sky View | Interactive planetarium: drag the sky, tap stars and constellations, open real survey images in Aladin Lite (DSS2, 2MASS, AllWISE) |
| Infrared Regions | Near, mid and far infrared explained with everyday analogies |
| Spectral Analysis | Prism spectrum of SPHEREx's 102 bands and a Planck temperature curve |
| Data Explorer | Sample detections table (sample data, marked) |
| Astronomy Chatbot | Space agent that answers infrared and astronomy questions |
| Motion / Planet X | Star motion over time and a simulated planet hunt |
| Dashboard / Mind map | Game progress and topic map |
| Play | NexAris Odyssey race game through 5 eras of planet discovery |

## Files

```
index.html   page structure and content
style.css    all styles (colors, layout, mobile)
script.js    app logic (views, sky, spectrum, game, agent)
```

No build step. Open `index.html` in a browser, or serve the folder with any static server.

## Connecting the backend

The chatbot currently answers from a built-in knowledge base inside `script.js`.
To connect a real AI backend, set `API_URL` at the **BACKEND HOOK** section in `script.js`.

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

## Notes

- Game rivals are simulated. Detections and Planet X data are sample data.
- Sky images come from Aladin Lite (CDS), DSS2, 2MASS and AllWISE.
- Code was written with AI assistance.
