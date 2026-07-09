# Architecture — Todo App

> Living doc, owned by the **architect**, maintained by the **librarian**.
> Grounded in the real `mobile/src` tree + the Graphify graph once code exists.
> This is a frontend-only React Native client consuming a remote backend API — no backend, no database in this repo.

_(Greenfield stub — filled in after the DATA/architecture (DAT) phase. The architect records the concrete
layers, data-flow, and integrations here once the first modules land; the librarian keeps it current.)_

## Layer diagram
_(to be filled — the enforced import-boundary direction is `app → features → core / components / theme / platform`,
with features never importing each other. See `docs/context/conventions.md`.)_

## core/api
_(to be filled — the axios client, request/response interceptors, auth/token handling, and multi-tenancy header.)_

## core/config
_(to be filled — app bootstrap and any dynamic config resolution before the first screen renders.)_

## core/store — Zustand
_(to be filled — UI-state stores. Server state lives in React Query hooks, never duplicated into Zustand.)_

## core/hooks — React Query wrappers
_(to be filled — the hooks that wrap the pure service functions in `core/services/`. No axios calls inside components.)_

## src/app/navigation
_(to be filled — the screen manifest, role/tab shells, top bar, deep-link config, and typed nav params.)_

## src/platform — native-bridge adapters
_(to be filled — MMKV storage, Keychain secure storage, JWT decode, and any other native modules the product needs.)_

## src/theme — design tokens
_(to be filled — color/typography/layout tokens and the ThemeProvider. See `docs/context/design-system.md`.)_

## External integrations
_(to be filled — the backend API(s), auth provider, and any third-party services, with protocol + auth per row.)_

## Data model
_(to be filled — no local database; persistent state is MMKV (non-secret), Keychain (secrets), and the React Query cache.
Canonical TypeScript types live in `core/types/`.)_

## Graphify graph summary
_(to be filled by the librarian after the first `/graphify ./mobile` rebuild — node/edge counts, god nodes, cycles.)_
