---
description: Report project status from PROGRESS.md and the active restaurant's task list
---

1. Read `.agent/agent.md` (Active build), `.agent/PROGRESS.md` and `.agent/restaurants/<active>/07-TASKS.md`.
2. Run `git status` and `git log --oneline -10` on the current branch.
3. Reply in at most 12 lines:
   - Active restaurant, milestone and % of tasks ticked (count `[x]` vs all tasks)
   - Done since the last session-log entry
   - In progress (task ID, lane, agent)
   - Next unblocked tasks
   - Blockers / open problems
   - Anything the human must do
4. Do not change any files.
