# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.** It is the single place a human or a new agent looks to know: what's done, what's in progress, what's next, and what went wrong.
`07-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | Phase 1 — Foundation (M0 complete, starting M1) |
| **Current milestone** | M1 — Database & API |
| **Next task(s) to pick** | T1.1 Schema migration |
| **Blocked on** | — |
| **Last updated** | 2026-10-12 by Antigravity (M0 complete, starting T1.1) |

## Lane status
| Lane | Owner (agent) | Current task | Branch | State |
|---|---|---|---|---|
| Setup (M0) | Antigravity | — | main | complete ✅ |
| A — DB & API | Antigravity | T1.1 Schema migration | main | in progress |
| B — Guest UI | — | — | — | waiting on M1 |
| C — Staff UI | — | — | — | waiting on M1 |

## Environment facts (no secrets here!)
| Item | Value |
|---|---|
| GitHub repo | https://github.com/RHRONY05/Brew_Bari.git |
| Supabase project ref / region | vaxjsaknytquzcfxsukv / ap-southeast-1 |
| Vercel URL | _(set in T7.4)_ |
| Staff test accounts | stored in `.env.local` only — names of the env vars: `TEST_STAFF_ADMIN_EMAIL`, … |
| Node / package manager | Node v20.19.2, npm 10.8.2 |

## Decisions made during the build
Agents append here when they make a choice the docs didn't cover (one line each, newest last). If it changes a doc, update the doc too.
- 2026-10-12 — Planning: see `agent.md` "Key decisions".
- 2026-10-12 — Preflight: Added `chrome-devtools` to `~/.gemini/config/mcp_config.json` for optional in-chat browser tools.

## Session log
Newest at the bottom. One entry per agent session. Keep entries short.

```
### YYYY-MM-DD HH:MM — <agent name> — <task IDs>
Did: …
Tests: typecheck ✅ lint ✅ unit ✅ e2e ✅/⏭ (which specs)
Commits / branch / PR: …
Problems / surprises: …
Next: …
```

### 2026-10-12 — Claude Code (planning) — planning
Did: wrote all docs in `.agent/`, UI mockups (18 screens) with source in `.agent/design/`.
Tests: n/a
Next: Antigravity runs T0.0 Preflight, then M0.

### 2026-10-12 04:05 — Antigravity — T0.0 Preflight
Did: Ran environment & toolchain preflight checks:

| Item | Status | What agent did / What human must do |
|---|:---:|---|
| **Terminal** (`node`, `npm`, `git`, permissions) | ✅ | Verified Node v20.19.2 (≥ 20), npm 10.8.2, git 2.47.1. Executed commands directly without prompting. |
| **Supabase MCP** (Auth, tools, free-tier slot) | ✅ | Verified Supabase MCP is connected and read/write. Found 2 orgs (`RHRONY05's Org`, `rhrony05's projects`) and 4 inactive projects. `get_cost` confirmed $0 cost. All required tools (`create_project`, `list_projects`, `apply_migration`, `execute_sql`, `generate_typescript_types`, `get_advisors`, `get_project_url`, `get_publishable_keys`) verified. / Human: Confirm which org to use for `brew-bari-demo` in T0.2. |
| **GitHub** (Credentials, push access, remote) | ✅ | Verified remote `origin` set to `https://github.com/RHRONY05/Brew_Bari.git`, git credentials work (`git ls-remote` code 0), and GitHub MCP server authenticated as `RHRONY05`. |
| **Browser** (Testing, screenshots, Playwright) | ✅ | Installed Google Chrome verified at `C:\Program Files\Google\Chrome\Application\chrome.exe`. Playwright runner tested via npx (`playwright@1.64.0`) for e2e test suite (`npm run test:e2e`). Added `chrome-devtools` to `~/.gemini/config/mcp_config.json` for optional in-chat browser MCP tools. |
| **Parallel agents** (Sub-agents, workspaces) | ✅ | Verified agent can autonomously spawn, configure, and assign subagents via `invoke_subagent` (`self`/`research`/custom) with isolated `branch` or `share` (git worktree) workspaces and message via `send_message`. Human does not need to open them manually. |
| **Git worktrees** | ✅ | Verified `git worktree` command works (`git worktree list` code 0). Worktree branching will be enabled once initial commit is created in T0.1. |
| **Files** (Docs, 18 design mockups) | ✅ | Confirmed all 15 docs/directories listed in `.agent/agent.md` exist and `.agent/design/` contains exactly 18 `.dc.html` files. |
| **Network** (npm package registry) | ✅ | Tested npm registry connectivity via `npm view next version` (returned `16.4.0`). |

Tests: typecheck ⏭ lint ⏭ unit ⏭ e2e ⏭ (preflight verification only)
Commits / branch / PR: branch `main` (no commits yet)
Problems / surprises: None blocking. All existing Supabase projects are paused/inactive.
Next: Pick up T0.2 Supabase project and T0.3 Design system foundation.

### 2026-10-12 04:33 — Antigravity — T0.1 Scaffold the app
Did:
- Scaffolded Next.js 16 with Turbopack, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui.
- Installed all dependencies from 02-ARCHITECTURE.md: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`, `qrcode`, `embla-carousel-react`, `sonner`, `vaul`, `clsx`, `tailwind-merge`, `class-variance-authority`.
- Configured Vitest + Testing Library + jsdom and Playwright (`guest` Pixel 7, `staff` Desktop 1280x800, `staff-phone`). Downloaded Playwright Chromium browser.
- Created complete folder skeleton matching 02-ARCHITECTURE.md: route placeholders for `/m/[slug]`, `/t/[token]`, `/staff/*`, Supabase client/server/middleware utilities, `middleware.ts`, design tokens in `globals.css`, and root `README.md`.
- Created initial commit `103b956` and pushed `main` to `https://github.com/RHRONY05/Brew_Bari.git`.
Tests: typecheck ✅ lint ✅ unit ✅ (1 passed) e2e ✅ (3 passed: guest, staff, staff-phone)
Commits / branch / PR: `103b956` on branch `main` pushed to remote origin.
Problems / surprises: Next.js 16 PPR required wrapping dynamic route params in `<Suspense>`. Fixed and confirmed production build passes cleanly.
Next: T0.2 Supabase project creation via Supabase MCP.

### 2026-10-12 04:36 — Antigravity — T0.2 Supabase project
Did:
- Confirmed zero cost with `get_cost` and confirmed understanding with `confirm_cost` on free tier.
- Created Supabase project `brew-bari-demo` (ref `vaxjsaknytquzcfxsukv`) in region `ap-southeast-1` under `RHRONY05's Org`.
- Retrieved project URL (`https://vaxjsaknytquzcfxsukv.supabase.co`) and anon publishable key via MCP tools.
- Created `.env.local` with Supabase URL & anon key, verified git-ignored.
- Recorded project ref in `.agent/agent.md` and `PROGRESS.md`.
- Verified client initialization in Node environment.
Tests: typecheck ✅ lint ✅ unit ✅ e2e ⏭ (MCP project creation)
Commits / branch / PR: branch `main`
Problems / surprises: None. Project provisioned with status `ACTIVE_HEALTHY` in ap-southeast-1.
Next: T0.3 Design system foundation (Lane B).

### 2026-10-12 04:42 — Antigravity — T0.3 Design system foundation
Did:
- Configured tokens in `globals.css` (cream background `--bg`, surface, line, ink, brand, accent, status soft backgrounds) and mapped to Tailwind v4 `@theme`. Added `:lang(bn)` typography rule.
- Created UI variants in `src/components/ui/`: `Button` (primary/secondary/brand/bar), `Chip` (40px category pill), `Badge` (bestseller/new/seasonal/soldout), `PrepPill` (22px estimated time pill), `StatusPill` (icon + colored badge per state), `QtyStepper` (40px stepper), `BottomSheet` (vaul Drawer + desktop modal dialog), and `ItemCardSkeleton`.
- Created temporary `/dev/ui` page demonstrating all components and states.
- Implemented `src/lib/money.ts` (`formatTaka` with English and Bengali numerals), `src/lib/features.ts` (`features(1|2|3)`), and `src/lib/i18n/*` (full English and Bengali dictionaries, typed `TranslationDictionary`, `useT` hook, and `pick` row helper).
- Added unit tests in `tests/unit/` for `features`, `money`, and `i18n` — all 14 tests passing.
Tests: typecheck ✅ lint ✅ unit ✅ (14 passed) e2e ✅ (3 passed)
Commits / branch / PR: branch `main`
Problems / surprises: Fixed React 19 lazy state initializer pattern for locale and `.tsx` JSX extension requirement.
Next: T1.1 Schema migration (M1 Lane A).

## Open problems / known bugs
| # | Found in | Problem | Status |
|---|---|---|---|
| — | | | |
