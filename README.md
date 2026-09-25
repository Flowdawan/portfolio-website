# Florian — Software & AI Engineer

Personal portfolio for [deflow.at](https://deflow.at). On the first visit of a session a deliberately terrible 2001 homepage appears — click anywhere (or wait a moment) and it **burns away in real time**, revealing the new site underneath. The headline letters glow white-hot as the flame front passes over them and cool down to their final colour.

## Highlights

- **Burn intro** — the 2001 page is real DOM, clipped by a noisy burn front computed on the CPU; a raw WebGL2 shader draws the charred rim, the glowing seam, flames, smoke and sparks along the exact same front. Click to ignite, `Esc` to skip, replay via “Relive 2001” in the footer or by typing `2001`.
- **Ember field** — GPU-animated embers (stateless vertex shader) rise behind the hero and the contact section, react to the cursor and sleep when off screen.
- **Live project previews** — each experiment card runs a tiny, interactive canvas sketch (perceptron learning, marble run, ink flow, rule 30 automaton). Code-split, loaded when near the viewport, paused off screen.
- **Scroll storytelling** — Lenis smooth scrolling, words that light up while reading, a burning-fuse timeline, stacking expertise cards and a velocity-reactive marquee.
- **Details** — magnetic buttons, ember cursor with contextual labels, burning-fuse scroll progress, live Vienna time, copy-to-clipboard email, a 404 that “burned down in 2001”.

## Performance & accessibility

- No three.js, no animation framework: raw WebGL2 + a few kilobytes of plain TypeScript. Sections are server components; interactive parts are small client islands.
- Every animation loop pauses when its element leaves the viewport or the tab is hidden; mobile devices get fewer particles and a lower resolution.
- `prefers-reduced-motion` skips the intro, disables smooth scrolling and freezes the sketches on a static frame.
- Content never depends on JavaScript: hidden states only apply after hydration, and an inline boot script removes the intro again if the app bundle fails to start.
- Self-hosted, OFL-licensed WOFF2 fonts ([Host Grotesk](https://github.com/Element-Type/HostGrotesk), [Instrument Serif](https://github.com/Instrument/instrument-serif), [Geist Mono](https://github.com/vercel/geist-font)) — licences in [`app/fonts`](app/fonts).

## Stack

Next.js (App Router, static export) · React · TypeScript · Lenis · WebGL2 · Canvas 2D · Lucide icons

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The intro plays once per browser session — append `?intro` to the URL to force it.

## Production

```bash
npm run build
```

The production build is exported to `out/`. Upload the contents of that folder to Hetzner's `public_html` directory. The export includes the canonical `deflow.at` metadata, sitemap, Open Graph image, icons, HTTPS redirect, compression and cache headers (`public/.htaccess`).

Preview the export with `out/` as the web root. Do not open `out/index.html` below the repository root because the generated `/_next/` asset URLs are intentionally root-relative.

```bash
python3 -m http.server 5500 --directory out
```

Then open [http://127.0.0.1:5500/](http://127.0.0.1:5500/).

After uploading, verify the canonical redirects and critical public assets:

```bash
npm run check:live
```

## Content

Portfolio copy, projects, links and skill groups live in [`data/portfolio.ts`](data/portfolio.ts). Each lab project can pick a live preview sketch (`perceptron`, `marble`, `ink`, `bits`) — the sketches live in [`components/previews`](components/previews).
