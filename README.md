# Florian — Software & AI Engineer

A high-motion personal portfolio built with Next.js, React and TypeScript. The experience opens on a deliberately outdated portfolio that burns away to reveal the new site underneath.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons
- Canvas particles for the burn intro

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run build
```

The production build is exported to `out/`. Upload the contents of that folder to Hetzner's `public_html` directory. The export includes the canonical `deflow.at` metadata, sitemap, HTTPS redirect and cache headers.

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

Portfolio copy, projects, links and skill groups live in [`data/portfolio.ts`](data/portfolio.ts). Project artwork is stored in [`public/projects`](public/projects).
