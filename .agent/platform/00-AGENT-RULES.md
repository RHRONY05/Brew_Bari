# 00 — Agent rules

These rules apply to every agent working in this repo. If a rule conflicts with a task description, the rule wins — stop and flag it.

## Where things are
- `.agent/platform/` = the shared code's docs (true for every restaurant). `.agent/restaurants/<slug>/` = one restaurant's brief, look, tasks, designs, images.
- The **active restaurant** (the one being built now) is named in `.agent/agent.md` → "Active build". Below, "the task list" = `.agent/restaurants/<active>/07-TASKS.md` and "the UI spec" = `.agent/restaurants/<active>/05-UI-DESIGN.md`.
- A change to shared code (schema, RPC, components, theme types) must also update the matching **platform** doc. A change that only concerns one restaurant (its data, theme values, copy) goes in that **restaurant's** folder.

## Workflow
1. **Pick one task** from the task list whose dependencies are all ticked `[x]`. Write your agent name next to it (`— in progress: <agent>`) so parallel agents don't collide.
2. **Branch** per task: `task/<ID>-<short-name>` (e.g. `task/G3-item-detail`). Small, focused commits. Conventional commit messages (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
3. **Read the relevant docs** before coding. Do not invent features that aren't in `platform/01-PRODUCT.md` or the active restaurant's `01-BRIEF.md`. If something is missing or contradictory, add it to the "Questions" section at the bottom of the task list and pick the most conservative interpretation.
4. **Definition of done** (all must be true before you tick the task):
   - `npm run typecheck`, `npm run lint`, `npm run test` pass.
   - The task's own acceptance criteria and named tests pass (e2e where specified: `npm run test:e2e`).
   - The UI was checked at **375×812** (customer screens) or **1280×800** (staff screens) and matches the UI spec.
   - **Other restaurants still work**: the existing e2e suite (Brew Bari) stays green. One codebase serves every restaurant.
   - No `console.log`, no commented-out code, no `any` without a comment explaining why.
   - Task checkbox ticked in the task list with a one-line note of what was done.
   - **`.agent/PROGRESS.md` updated**: the "Now" table, the restaurant's section, and a session-log entry (template in the file). A session that ends without updating PROGRESS.md is not done — the next agent depends on it.
5. Merge to `main` only when green. Never force-push `main`. When rebasing, keep both sides' entries in PROGRESS.md and the task list.
6. **Parallel agents** work in separate git worktrees (one per lane), never in the same folder.
7. **UI source of truth:** `.agent/restaurants/<active>/design/*.dc.html` (see its `README.md`). Screens a restaurant did not redraw reuse `.agent/restaurants/brew-bari/design/` with that restaurant's theme. Compare your screen against the matching file before ticking a UI task.
8. **Never fork a component per restaurant.** A visual difference = a theme token or a `Theme['layout']` option (see `platform/10-PLATFORM.md`).

## Database (Supabase via MCP)
- The Supabase project is managed through the **Supabase MCP**. Before creating a project, list existing projects; **use the free tier only** and ask the human before any action that has a cost.
- **Every schema change = a migration file first.** Write `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`, then apply it with the MCP `apply_migration` tool using the same name. Never change the schema with ad-hoc `execute_sql` (use `execute_sql` only for reads and for the SQL tests in 06-TESTING.md).
- After every migration: regenerate types with the MCP `generate_typescript_types` tool into `src/types/database.ts`, and run the MCP security **advisors** (`get_advisors`); fix any RLS / security warning before finishing.
- **RLS is on for every table.** Customers never write to tables directly — only through the `SECURITY DEFINER` RPC functions defined in 03-DATABASE.md.
- Never trust prices from the client. Prices are always computed in Postgres (`price_cart`).

## Secrets
- Never commit keys. Use `.env.local` (git-ignored) and keep `.env.example` up to date with variable **names** only.
- The service-role / secret key is **never** used in browser code or in a `NEXT_PUBLIC_*` variable. The app itself must work with the anon/publishable key + staff sessions only.

## Code style
- TypeScript `strict`. Server Components by default; `"use client"` only where interaction needs it.
- Validate every input crossing a boundary with **zod** (`src/lib/schemas.ts`).
- Money is an **integer number of taka**. Format only through `formatTaka()` in `src/lib/money.ts`.
- All customer-facing text goes through the i18n dictionaries (`src/lib/i18n/en.ts`, `bn.ts`). No hard-coded English strings in customer components.
- Feature checks only via `features(pkg)` in `src/lib/features.ts` — never `if (package === 3)` scattered around.
- Use shadcn/ui primitives and the theme tokens (`globals.css` defaults + `src/themes/<key>.ts`). No hex colours, fonts or radii in components: only tokens. A new token or font goes into the theme system (`platform/10-PLATFORM.md`).
- **Ask before adding a dependency** that isn't listed in 02-ARCHITECTURE.md (note it in the Questions section).

## Quality bar (this is a sales demo)
- Mobile-first. Tap targets ≥ 44 px. Works on a 4-year-old Android phone on 4G.
- Every async action shows a loading state, a success state, and a friendly error (EN + BN). Nothing fails silently.
- No layout shift when images load (fixed aspect ratios).
- Accessible: labels on icon buttons, visible focus, AA contrast, respects `prefers-reduced-motion`.
