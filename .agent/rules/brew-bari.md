# Brew Bari — always-on rules

- Start every session by reading `.agent/agent.md` and `.agent/PROGRESS.md`. Follow `.agent/00-AGENT-RULES.md`.
- Pick work only from `.agent/07-TASKS.md`, one task at a time, dependencies first.
- UI must match the mockups in `.agent/design/*.dc.html` (reference markup — rebuild in React/Tailwind, never copy the template syntax).
- Database changes: migration file in `supabase/migrations/` first, then apply via Supabase MCP `apply_migration`; regenerate types; run advisors. Free tier only — ask the human before anything paid.
- Never commit secrets. Never change a decision listed in `agent.md` without asking the human.
- Before ending a session: tick the task in `07-TASKS.md`, update `PROGRESS.md` ("Now" table, your lane row, a session-log entry), commit.
