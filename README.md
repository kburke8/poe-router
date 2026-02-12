# PoE Speed Run Planner

A Path of Exile 1 speed run planning tool with regex pattern generation, build planning, and run history tracking. Runs entirely in the browser with no backend — all data is stored locally in IndexedDB.

## Features

- **Regex Builder** — Generate optimized stash-search regex patterns for gems, items, and exclusions. The abbreviation engine finds the shortest unique pattern that won't false-match against PoE's full item text search.
- **Build Planner** — Plan your leveling route act-by-act: gem setups, gear goals, skill transitions, and vendor purchases.
- **Run View** — Guided playthrough mode that walks you through each town stop with gem pickups and vendor buys.
- **Run History** — Track your speed run times with act splits.
- **Import/Export** — Share builds and presets as JSON.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables or external services required.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build (generates standalone bundle) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run standalone` | Run standalone Node.js server (after build) |

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + TypeScript 5 (strict)
- [Tailwind CSS v4](https://tailwindcss.com/) — dark PoE-inspired theme
- [Zustand 5](https://zustand.docs.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) — state management
- [Dexie.js 4](https://dexie.org/) — IndexedDB persistence
- [Fuse.js 7](https://www.fusejs.io/) — fuzzy search for gem/item pickers
- [Radix UI](https://www.radix-ui.com/) — headless UI primitives
- [Lucide React](https://lucide.dev/) — icons

## Standalone Deployment

The app produces a self-contained Node.js server via `output: 'standalone'`:

```bash
npm run build
cp -r .next/static .next/standalone/poe-router/.next/static
cp -r public .next/standalone/poe-router/public
node .next/standalone/poe-router/server.js
```

See [docs/RUNBOOK.md](docs/RUNBOOK.md) for full deployment details including Docker.

## Contributing

See [docs/CONTRIB.md](docs/CONTRIB.md) for development workflow, project structure, and conventions.

## Support

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/kburke8)

## License

[MIT](LICENSE)
