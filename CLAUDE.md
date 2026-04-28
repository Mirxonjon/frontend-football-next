# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — `next lint` (eslint-config-next)

No test runner is configured.

## Architecture

This is a Next.js 15 App Router migration of an older Create React App / react-router-dom codebase. The migration is in-progress, and the legacy structure still drives most rendering. Understanding the split is essential:

### Two-layer routing

- `src/app/` — App Router shell. Route segments are intentionally thin: each `page.tsx` exports `metadata` and renders a legacy page component. Routes are grouped:
  - `(auth)/` — `login`, `register` (no shared header)
  - `(with-header)/` — main app, with shared `layout.tsx`. Includes `books/[id]`, `training/[id]`, `contests`, `copies`, `individualtraining`, `masterclass`, `user`, `userupdate`.
- `src/pages-legacy/` — the actual page components (e.g. `TrainingPage`, `BookSinglePage`). All real UI lives here. When changing a page, edit the component under `pages-legacy/`, not the App Router file.

### react-router-dom compatibility shim

Legacy components still import `Link`, `NavLink`, `useNavigate`, `useParams`, `useLocation` as if `react-router-dom` were installed — it isn't. `src/lib/router-compat.tsx` re-implements those APIs on top of `next/navigation` and `next/link`. There is also `src/lib/helmet-compat.tsx` for `react-helmet-async`. Keep using these shims for legacy code; use Next.js APIs directly in new App Router code.

### Redux store

`src/store/config-store.ts` wires a single `configureStore` with feature slices under `src/store/{books,competion,copy,individualTraining,masterclass,trening,slice}`. Slices are exported as `*Reducers` (note the trailing `s`) and combined by feature name. Use the typed hooks `useAppDispatch` / `useAppSelector` from `config-store`.

The store is created once at module load and provided via `src/app/providers.tsx`, which also wraps `AntdRegistry` (SSR-safe Ant Design) and `HelmetProvider`. AOS is dynamically imported and initialized client-side in the same provider.

### API client

`src/api/api.ts` exports `FT_API`, an axios instance with `baseURL` from `NEXT_PUBLIC_API_BASE_URL` (defaults to `https://api.coachingzona.uz/api/v1/`). A request interceptor reads `localStorage.token` on every request — do not cache the token at module load, as the comment in that file warns. A `key` query param is set from `NEXT_PUBLIC_YT_API_KEY` for YouTube calls.

### Localization

`useLocalizedText` (in `src/hook/useLocalizedText.tsx`) reads `state.lang.lang` and, for `lang === "ru"`, returns the field name with a `_ru` suffix. This means the API stores localized fields side-by-side (e.g. `title`, `title_ru`) and the UI picks the suffix based on the active language. Language defaults to `uz` (root layout sets `<html lang="uz">`).

### Styling

SCSS via `sass`. `next.config.mjs` sets `sassOptions.includePaths: ["./src/assets/scss"]` so global partials can be `@import`ed by short name. Component styles are colocated (`Header.scss` next to `Header.tsx`) and imported in `app/layout.tsx` for the global ones.

### Next config notes

- `transpilePackages` includes `antd` and its `rc-*` deps — required for Ant Design 5 with App Router.
- `images.remotePatterns` whitelists `api.coachingzona.uz`, YouTube thumbnail hosts, and `staging.e.ufa.uz`. Add new hosts here before using `next/image` with them.

### Path alias

`@/*` → `src/*` (configured in `tsconfig.json`). Strict mode is **off**.
