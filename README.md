# Balar Overseas – Website

Scroll-driven 3D home page for **Balar Overseas** (global sourcing, import–export and logistics, Surat · Guangzhou).

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home page (3D version) |
| `index-static.html` | Earlier plain HTML version (backup) |
| `css/style.css` | All styles |
| `js/main.js` | Smooth scroll, section transitions, preloader, overlays |
| `js/scenes/globe.js` | Hero: dotted 3D globe with trade routes |
| `js/scenes/journey.js` | Reach stacker → truck → road (one continuous scene) |
| `js/scenes/ship.js` | "Why us": container ship + climb into clouds |
| `js/scenes/plane.js` | Testimonials: cargo jet |
| `js/scenes/util.js` | Shared renderer, container, truck and wheel builders |
| `js/fx/` | 2D dotted map and footer particle text |

Built with [Three.js](https://threejs.org) 0.160, GSAP 3.12 + ScrollTrigger and Lenis (all loaded from CDN).

## Run locally

The page uses JavaScript modules, so it must be served over HTTP (double-clicking `index.html` will not work).

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open <http://localhost:5510>. Any other static server works too (for example `npx serve .`).

## Notes

- Fonts, libraries and product images load from the internet (Google Fonts, jsDelivr, unpkg, balaroverseas.com).
- All 3D models are built in code; no model files are needed.
