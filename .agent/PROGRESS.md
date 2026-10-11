# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.** It is the single place a human or a new agent looks to know: what's done, what's in progress, what's next, and what went wrong.
`07-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | M0 — Setup |
| **Current milestone** | M0 — Setup |
| **Next task(s) to pick** | T0.1 Scaffold the app |
| **Blocked on** | — |
| **Last updated** | 2026-10-12 by Antigravity |

## Lane status
| Lane | Owner (agent) | Current task | Branch | State |
|---|---|---|---|---|
| Setup (M0) | Antigravity | T0.1 Scaffold the app | main | ready to build |
| A — DB & API | — | — | — | waiting on M0 |
| B — Guest UI | — | — | — | waiting on M0 |
| C — Staff UI | — | — | — | waiting on M0 |

## Environment facts (no secrets here!)
| Item | Value |
|---|---|
| GitHub repo | https://github.com/RHRONY05/Brew_Bari.git |
| Supabase project ref / region | _(set in T0.2)_ |
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
Next: Stop and wait for human confirmation before scaffolding in T0.1.

## Open problems / known bugs
| # | Found in | Problem | Status |
|---|---|---|---|
| — | | | |
