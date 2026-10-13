# 09 — Handoff to Antigravity (for the human)

Grill Ghar is built by **one agent in one go** (tasks G0 → G9). It is smaller than Brew Bari and every task touches shared code, so parallel lanes would mostly create merge conflicts.

## Before you start (5 minutes)
1. Answer the **font licence** question at the bottom of [07-TASKS.md](07-TASKS.md) (or tell the agent to use the Hind Siliguri fallback for now).
2. Antigravity: Supabase MCP connected; terminal auto-run on; browser use allowed; strongest model selected. Same deny list as for Brew Bari (`rm -rf /`, `git push --force`, `git reset --hard origin`, deleting Supabase projects).
3. Make sure `D:\Projects\Coffe_house` is on `main`, clean, and `.env.local` exists.

## The kickoff prompt (paste into a new Antigravity agent)
```
You are the lead engineer for Menuwala. Your GOAL: build restaurant #2, Grill Ghar, end to end.

1. Read .agent/agent.md, then .agent/restaurants/grill-ghar/README.md and every file it lists, then .agent/platform/00-AGENT-RULES.md and .agent/platform/10-PLATFORM.md. Read .agent/rules/*.md and .agent/PROGRESS.md.
2. Do the tasks in .agent/restaurants/grill-ghar/07-TASKS.md in order, G0 → G9, one at a time. After each task: run the Definition of Done checks, tick the task, add a session-log entry to .agent/PROGRESS.md, commit.
3. Brew Bari must keep working: one codebase serves both restaurants. Never fork a component per restaurant; add theme tokens or Theme['layout'] options instead. Keep the Brew Bari e2e suite green.
4. The UI must match .agent/restaurants/grill-ghar/design/*.dc.html. Screens not in that folder reuse .agent/restaurants/brew-bari/design/ with the Grill Ghar theme.
5. Food photos: Unsplash or Pexels only. Look at every photo before using it and make sure it shows that exact dish. Convert to WebP as described in 03-DATA.md §5 and credit each one.
6. Never commit secrets or staff passwords (the repo is public). Free Supabase tier only. Ask me before anything paid or anything that needs my accounts.
7. If something is unclear, add it to "Questions for the human" in 07-TASKS.md, choose the most conservative option, and keep going. Stop only when G9 is done or you are truly blocked; then give me a short summary, the URLs, where the Grill Ghar staff logins are stored (env var names only), and anything I must do by hand.
```

## While it runs
| When | Paste |
|---|---|
| Where are we? | `/status` |
| New chat / after a break | `/next-task` |
| A screen looks off | "Compare <screen> with .agent/restaurants/grill-ghar/design/<file>.dc.html and list every difference, then fix them." |
| Worried about Brew Bari | "Run the full Brew Bari e2e suite and show me the results." |
| A photo looks wrong | "Item <name> shows the wrong food. Find a better photo following 03-DATA.md §5." |
