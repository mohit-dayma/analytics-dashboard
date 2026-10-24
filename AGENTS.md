# AGENTS.md

Guidance for AI agents working in this repo. Only repo-specific, non-obvious facts — the rest follows standard React/TS conventions.

## Commands

- Package manager is **pnpm** (pinned via `packageManager`); use pnpm, never npm/yarn.
- `pnpm dev` — Vite dev server with HMR.
- **No test framework exists yet** (Vitest is a roadmap item, milestone M5). Do not invent test scripts or expect `pnpm test` to work.
- **No formatter is configured** (no Prettier/Biome/dprint). The only autofix step is `oxlint --fix`; don't invent a formatting command.

## Verification workflow — run in this order after finishing a change

1. `pnpm exec oxlint --fix` — apply autofixable lint issues.
2. `pnpm lint` — confirm everything else is clean (oxlint, see `.oxlintrc.json` below).
3. `pnpm build` — **this doubles as the typecheck** (`tsc -b` + bundle); there is no separate `typecheck` script.
4. `pnpm dlx react-doctor` — React Doctor audit; not a repo dependency, always run it via `pnpm dlx` from the project root. New React-related findings it reports must be addressed before the work is considered done.

## TypeScript strictness gotchas

`tsconfig.app.json` enforces settings most agents get wrong:

- `verbatimModuleSyntax`: all type-only imports/exports must use the `import type` / `export type` syntax.
- `erasableSyntaxOnly`: no enums, no parameter properties, no namespace runtime code. Use union types and plain objects.
- `noUnusedLocals` / `noUnusedParameters` are errors, not warnings.
- Path alias `@` -> `./src` is configured in **both** `tsconfig.app.json` and `vite.config.ts` — keep them in sync when touching either.

## Toolchain quirks

- **Vite 8 runs on Rolldown.** Vendorchunking in `vite.config.ts` uses Rolldown's `codeSplitting.groups`, matched in order: `recharts` and `victory-vendor`/`d3-*` must be listed **before** the generic `vendor` group, or heavy chart code lands in the eager vendor chunk. Preserve that order.
- **Linting is oxlint, not ESLint.** Config in `.oxlintrc.json`; `correctness` category = error, `no-unused-vars` and `react-hooks/exhaustive-deps` = warn.
- `pnpm-workspace.yaml` contains **no workspace packages** — it only holds `minimumReleaseAgeExclude` for a pnpm supply-chain guard. Don't mistake this for a monorepo.
- Tailwind v4 is CSS-first: no tailwind config file; theme tokens live in `src/index.css` and dark mode is `class`-strategy (tokens flip via `.dark` — chart components use `var(--chart-1)`… and need no theme-specific code).

## Architecture map

- Single-page app, React 19, no server. Entrypoints: `src/main.tsx` -> `src/App.tsx`.
- `src/features/<name>/` owns feature pages (`overview`, `orders`); `src/components/ui/` is the shared ShadCN-style primitive kit; `src/components/charts/` for viz.
- **The app talks only to `src/data/mock-api.ts`**, which simulates ~300 ms latency over a seeded, deterministic dataset (`src/data/seed.ts`). Features must not reach past this layer — the point is to swap the module for a real client (roadmap M3) without touching features.
- Zustand store (`src/store/ui-store.ts`) is intentionally tiny: theme + palette + drawer only. Server data stays local to features, not in global state.
- All number/currency/date formatting goes through `src/lib/format.ts` — don't inline `Intl` calls.
- Filters/sorting on `/orders` persist via **URL search params**; keep them sync-able/shareable when modifying table state (TanStack Table).

## Conventions

- Commit history uses Conventional Commits with scopes (e.g. `feat(orders):`, `feat(palette):`). Follow the same pattern.
- `dashboard-research/` (RESEARCH.md, UI-PLAN.md) is design research, not runtime code; `docs/screenshots/` are README captures (headless Chromium, 1440px, device-scale 1.5 — match that for new captures).
