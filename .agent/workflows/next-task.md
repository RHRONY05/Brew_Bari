---
description: Resume work — pick and complete the next unblocked task
---

1. Read `.agent/agent.md` (note the **Active build** restaurant), `.agent/platform/00-AGENT-RULES.md` and `.agent/PROGRESS.md`.
2. In `.agent/restaurants/<active>/07-TASKS.md`, find the first task for your lane whose dependencies are all `[x]` and that nobody has marked "in progress". Mark it `— in progress: <your name>`.
3. Read the docs and the `.agent/restaurants/<active>/design/` files that the task references.
4. Create/checkout the branch `task/<ID>-<short-name>`, implement, and write the tests the task names.
5. Run `npm run typecheck`, `npm run lint`, `npm run test` (and `npm run test:e2e` for the specs the task names, plus the Brew Bari regression suite). Fix until green.
6. Tick the task with a one-line note, update `PROGRESS.md` ("Now", the restaurant's section, session-log entry), commit, rebase on `main`, merge when green.
7. Tell the human in 3 lines what you did and what's next. Then continue with the next task unless the human said to stop.
