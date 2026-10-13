# Menuwala — always-on rules

- Start every session by reading `.agent/agent.md` (it names the **active restaurant**) and `.agent/PROGRESS.md`. Follow `.agent/platform/00-AGENT-RULES.md`.
- Pick work only from `.agent/restaurants/<active>/07-TASKS.md`, one task at a time, dependencies first.
- One codebase serves every restaurant: never copy or fork a component per restaurant; differences are theme tokens or `Theme['layout']` options. Brew Bari must keep working (its e2e suite stays green).
- UI must match `.agent/restaurants/<active>/design/*.dc.html`; screens not redrawn there reuse `.agent/restaurants/brew-bari/design/` with the active theme. Rebuild in React/Tailwind, never copy the template syntax.
- Database changes: migration file in `supabase/migrations/` first, then apply via Supabase MCP `apply_migration`; regenerate types; run advisors; run `supabase/tests/09_multi_restaurant.sql`. Free tier only — ask the human before anything paid.
- Never commit secrets or staff passwords (the GitHub repo is public). Never change a decision listed in `agent.md` or the restaurant's `README.md` without asking the human.
- Before ending a session: tick the task, update `PROGRESS.md` ("Now" table, the restaurant's section, a session-log entry), commit.
