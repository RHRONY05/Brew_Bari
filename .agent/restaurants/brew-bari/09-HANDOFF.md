# 09 — Handoff to Antigravity (for the human)

> **Archive: Brew Bari build (2026-10-12, finished, tag `brew-bari-v1`).** Kept as the record. Paths here are from before the 2026-10-14 reorganisation: shared docs (00–04, 06, 10) are now in `.agent/platform/`, Brew Bari's own files are in this folder, routes are `/<slug>` (see `platform/10-PLATFORM.md`). Do not pick tasks from here.

This file is for **you**, not the agents. It says how to start the build and how to keep it on track. The prompts are copy-paste ready.

## How the pieces fit
- **`.agent/` is the brain.** Everything an agent needs is here: rules, product, architecture, database, API, design, tests, tasks.
- **`.agent/PROGRESS.md` is the memory.** Agents read it first and update it at the end of every session: what's done, what's next, problems. Open it any time to see where the project stands. You can also ask any agent `/status`.
- **`.agent/07-TASKS.md` is the plan.** Tasks have IDs, dependencies and checkboxes.
- **`.agent/design/`** holds the mockup source files (agents can't open the claude.ai canvas link).
- **`.agent/rules/`** and **`.agent/workflows/`** are Antigravity-style rule and workflow files. If your Antigravity version auto-loads them, great. If not, the kickoff prompt tells the agent to read them anyway.

## Before you start (10 minutes, once)
1. **GitHub:** create an empty private repo (e.g. `brew-bari-demo`). Copy its URL.
2. **Supabase MCP:** check it's connected in Antigravity and logged in to the account and organization you want. The free plan allows 2 active projects, so the agent should reuse a free slot and **must ask you before anything paid**.
3. **Antigravity permissions** (names may differ slightly between versions):
   - Terminal command execution: **Auto/Turbo**, so it doesn't stop on every `npm` command.
   - Review policy: **Agent decides / Always proceed**.
   - Browser use: **allowed**. It needs this to test the UI.
   - If there's a deny list, add: `rm -rf /`, `git push --force`, `git reset --hard origin`, and deleting Supabase projects.
4. **Model:** pick the strongest model available for the main agent.
5. *(Optional, recommended)* In the Claude Design canvas: **Share › Export** each screen as PNG into `.agent/design/screenshots/`. Pictures help agents match the look better than the HTML alone.

## Phase 1 — one agent builds the foundation (M0 + M1)
The foundation (project setup, database, shared code) touches files every other task needs, so **one agent does it alone**. Paste this:

```
You are the lead engineer for this project. Everything you need is in the .agent/ folder.

1. Read .agent/agent.md, then every file it lists, in order. Also read .agent/PROGRESS.md and .agent/rules/*.md. Follow .agent/00-AGENT-RULES.md strictly.
2. Run task T0.0 Preflight from .agent/07-TASKS.md. Check you have everything: Node/npm, git, the Supabase MCP (list projects), browser use, write access to this folder. Report anything missing to me in one list, then wait for my answer before continuing.
3. After preflight passes, complete milestone M0 and then M1 (T0.1 → T1.5) yourself, one task at a time, in dependency order.
   GitHub remote: <PASTE YOUR REPO URL>
4. After every task: run the checks in the Definition of Done, tick the task in 07-TASKS.md, and add a session-log entry plus the "Now" table in PROGRESS.md. Commit.
5. Never use a paid Supabase option, never commit secrets, never change a decision listed in agent.md without asking me.
6. When M1 is done, stop and give me: a summary, the Supabase project ref, where the staff test logins are stored, and anything I must do by hand.
```

## Phase 2 — parallel lanes (after M1 is ticked)
Lanes B (guest UI) and C (staff UI) can run **at the same time**. Lane A is mostly finished after M1.

**Use one git worktree per agent, so parallel agents never edit the same folder.** Ask the lead agent first:
```
Create two git worktrees next to this repo: ../coffe-lane-b on branch lane/b and ../coffe-lane-c on branch lane/c, both from main. Copy .env.local into each. Tell me the paths.
```
Then, in Antigravity's Agent Manager, open each worktree folder as its own workspace and start one agent in each:

**Lane B agent:**
```
You are the Lane B (guest UI) engineer. Read .agent/agent.md and everything it lists, plus .agent/PROGRESS.md. Follow .agent/00-AGENT-RULES.md.
Your tasks, in order: M2 (T2.1–T2.5), M3 (T3.1–T3.3), then M5 (T5.1–T5.3). Only take tasks whose dependencies are ticked. If you need a Lane C task that isn't done yet (e.g. the counter board for an e2e test), build and test your half and note it in PROGRESS.md.
Match the mockups in .agent/design/ (Main, ItemDetail, Cart, Status, Bill, Review, Info). Phone first; the tablet/desktop fallback layout follows 05-UI-DESIGN.md "Responsive rules".
After each task: Definition of Done, tick 07-TASKS.md, update PROGRESS.md (your lane row + session log), commit, and merge to main only when green (rebase on main first).
```

**Lane C agent:**
```
You are the Lane C (staff UI) engineer. Read .agent/agent.md and everything it lists, plus .agent/PROGRESS.md. Follow .agent/00-AGENT-RULES.md.
Your tasks, in order: M4 (T4.1–T4.3), then M6 (T6.1–T6.7). Only take tasks whose dependencies are ticked.
Every screen has two layouts: desktop (Counter, AdminMenu, AdminTables, AdminSettings in .agent/design/) and phone (CounterMobile, AdminMobile*). Both must match the mockups.
After each task: Definition of Done, tick 07-TASKS.md, update PROGRESS.md (your lane row + session log), commit, and merge to main only when green (rebase on main first).
```

**Merge conflicts:** the only shared files should be `07-TASKS.md`, `PROGRESS.md` and possibly `src/lib/i18n/*`. Tell the agents: "when rebasing, keep both sides' entries in PROGRESS.md and 07-TASKS.md".

## Phase 3 — finish (one agent, back on main)
```
All lanes are merged. Read .agent/PROGRESS.md and .agent/07-TASKS.md. Complete M7 (T7.1–T7.5): demo launcher, full e2e suite green, performance & accessibility budgets, deploy to Vercel, and rehearse .agent/08-DEMO-SCRIPT.md. Ask me before connecting Vercel or anything that needs my accounts. Update PROGRESS.md at the end with the production URL and the final test results.
```

## Everyday prompts
| When | Paste |
|---|---|
| See where we are | `/status` *(or: "Read .agent/PROGRESS.md and 07-TASKS.md and give me a 10-line status: done, in progress, next, blockers.")* |
| Continue after a break / new chat | `/next-task` *(or: "Read .agent/agent.md and .agent/PROGRESS.md, then continue with the next unblocked task for your lane.")* |
| Something looks wrong | "Compare the <screen> you built with .agent/design/<file>.dc.html and list every visual difference, then fix them." |
| Agent is going in circles | "Stop. Write what you tried and what failed into PROGRESS.md under Open problems, then tell me." |
| Before showing Turjo | "Run the full test suite and walk through .agent/08-DEMO-SCRIPT.md in the browser. Report anything that fails." |

## What to watch for
- **Secrets in commits.** Ask occasionally: "check the git history for keys or passwords".
- **Docs drifting.** If an agent changes behaviour, it must update the matching doc and add a line under "Decisions" in PROGRESS.md.
- **Skipped tests.** If PROGRESS.md shows e2e ⏭ for many tasks, run Phase 3's test step earlier.
