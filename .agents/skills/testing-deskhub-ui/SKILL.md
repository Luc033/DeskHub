---
name: testing-deskhub-ui
description: Set up DeskHub locally and test frontend modules (e.g. QuickLinks, Links) end-to-end via the browser. Use when verifying DeskHub UI features or CRUD modules.
---

# Testing DeskHub UI end-to-end

DeskHub = Node.js/Express + Prisma + PostgreSQL backend, React (Vite) + Tailwind frontend.

## Devin Secrets Needed
- None for local testing. A seeded admin account is created by the backend seed (see below). If the seed/login changes, ask the user for valid credentials instead of guessing.

## Local stack setup
1. Start Postgres (Docker): `docker compose up -d` (only the DB is needed; you can run backend/frontend on the host).
2. Backend (`cd backend`):
   - `npm install`
   - Build schema on a fresh DB with `npx prisma db push` then `npx prisma generate`.
     - `npx prisma migrate deploy` may FAIL on a fresh DB because of pre-existing migration/model mismatches (e.g. a migration referencing `system_settings` while the model lacks `@@map`). `db push` is the reliable workaround for setting up a test DB.
   - Seed the admin: check `backend/prisma/seed*` / package scripts. Seeded login has historically been `admin@deskhub.com.br`.
   - `npm run dev` (listens on `:3333`).
3. Frontend (`cd frontend`):
   - `npm install`
   - The Vite proxy target may be `http://backend:3333` (Docker service name). For host-only runs, temporarily set it to `http://localhost:3333` in `vite.config.js`. This is a test-only edit — do not commit it.
   - `npm run dev` (serves on `:5173`).

## Known pre-existing pitfalls (NOT feature defects — patch temporarily to boot)
- Case-sensitive require: `backend/src/routers/routes.js` may `require('../controllers/aiController')` while the file is `AiController.js`. On Linux this crashes the backend on startup. Fix the case to boot. These might already be fixed in the future — check before patching.
- Migration vs model `@@map` mismatch (see `db push` note above).

## Auth model (important for writing tests)
- No React Router. Navigation is state-based in `App.jsx` via `activeMainTab`; pages render with `if`/`&&` inside `<main>`. New modules appear as a top-nav tab.
- JWT is automatic: `main.jsx` overrides `window.fetch` and injects `Authorization: Bearer <token>` on every `/api/` call. Frontend code just calls `fetch('/api/...')`. When testing with an authenticated browser session, do NOT use curl against the backend — go through the UI.

## Open-in-new-tab caveat (verify, don't assume)
- Anchors with `target="_blank"` in JSX may render WITHOUT the `target` attribute in the running app (observed app-wide, affecting both QuickLinks and the existing Hub→Links module). Result: clicking a link navigates the SAME tab instead of opening a new one.
- This is an app-wide rendering behavior, not a per-module bug. When a "open in new tab" test fails, confirm scope by checking an existing module (Hub→Links) before blaming the feature under test. It may be fixed in the future — re-verify the rendered DOM (`read_dom`) rather than assuming.

## Test execution tips
- Maximize the window before recording: `sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.
- Record browser interactions and use `annotate_recording` (setup / test_start / assertion) per test.
- Verify DB persistence by reloading (F5) after create/delete — proves the call hit the backend, not just local state.
- Dark mode toggle lives in the profile dropdown (top-right) as "Modo Escuro".
- Toasts confirm CRUD: "Link criado/atualizado com sucesso!", "Link excluido!".

## Reporting
- Post ONE PR comment with a T# results table, `<details>` sections (T6/open-in-new-tab caveat + escalations), inline screenshots (the `git_comment_on_pr` tool auto-uploads local image paths), recording link, and the Devin session link.
- Be conservative: if any step deviated, report it as a failure/red flag, and distinguish pre-existing issues from feature defects.
