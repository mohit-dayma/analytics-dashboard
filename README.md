# Pulse

**An analytics dashboard for a fictional SaaS product — a portfolio project that shows real-world frontend craft beyond to-do-list projects.**

React 19 · TypeScript strict · Vite · Tailwind CSS v4 · ShadCN/UI-style primitives · TanStack Table · Recharts · Zustand · React Router · Oxlint

## Demo

<!-- TODO: add a walkthrough GIF after milestone 1 -->

## What's inside

- App shell with responsive sidebar navigation and dark mode (tokens flip via the `.dark` class)
- Command palette stub built on `cmdk`, ready to be wired to real actions
- Mock API (`src/data/mock-api`) that simulates ~300ms latency, driving skeleton loading states everywhere
- Seeded, deterministic dataset: 90 days of revenue/traffic series, 4 KPIs, and 60 orders
- Overview: 4 KPI cards with a hand-built SVG sparkline (Catmull-Rom smoothing, CSS draw-in animation) plus Recharts area/composed charts
- Orders table on TanStack Table: sortable headers, global filter, and pagination
- Shared ShadCN-style UI primitives under `src/components/ui`

## Roadmap

### M1 — Core UX polish

- [ ] Loading/skeleton pass on every data-bound surface
- [ ] Empty and error states for all features
- [ ] Command palette wired to real actions (navigation, theme toggle)
- [ ] README walkthrough GIF

### M2 — Data interaction

- [ ] Per-column filters with saved filter state
- [ ] Sorting persistence across sessions
- [ ] Row detail view as a slide-over
- [ ] CSV export of the (filtered) table

### M3 — Data layer upgrade

- [ ] Replace `mock-api` fetch with React Query and real cache keys
- [ ] Optimistic status updates on orders
- [ ] Retry/error toasts

### M4 — Depth

- [ ] Date-range switcher feeding the whole dashboard
- [ ] Dashboard-level derived KPIs
- [ ] Compare-to-previous-period shading in charts

### M5 — Quality

- [ ] Vitest + Testing Library coverage for the table and KPI formatting
- [ ] axe audit fixes
- [ ] Storybook (or Ladle) stories for the UI kit

### M6 — Ship it

- [ ] `prefers-reduced-motion` pass across animations
- [ ] Lighthouse score >= 95
- [ ] README GIF + architecture write-up
- [ ] Deploy to GitHub Pages or Netlify

## Architecture notes

<!-- TODO: expand this section as the data layer matures -->

- The app talks only to `src/data/mock-api`, which simulates ~300ms latency — swap the module for a real client without touching features.
- Global state is intentionally tiny (theme + palette + drawer) — server data stays local to features.
- Path alias `@` -> `./src`.
- Design tokens in `src/index.css` flip via the `.dark` class, so `var(--chart-1)`–`var(--chart-5)` need no theme-specific chart code.
- Number, currency, and date formatting is centralized in `src/lib/format.ts`.

## Scripts

| Script            | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `pnpm dev`     | Start the Vite dev server with HMR.             |
| `pnpm build`   | Type-check (`tsc -b`) then bundle for prod.     |
| `pnpm lint`    | Run Oxlint across the project.                  |
| `pnpm preview` | Serve the production build locally.             |
