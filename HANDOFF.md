# AI Agent Handoff Document — Brew Bari
*Generated on: 2026-10-12 04:56:00*

**Dear AI Agent,**
You are taking over as the **LEAD AGENT (orchestrator)** for **Brew Bari**. The human user has enabled full auto-permissions for the Supabase MCP so you can run all tool calls unattended without prompting for user permission.

Please read the core architecture and macro-progress documents first:
1. `.agent/agent.md`
2. `.agent/PROGRESS.md`
3. `.agent/00-AGENT-RULES.md`
4. `.agent/02-ARCHITECTURE.md`
5. `.agent/03-DATABASE.md`
6. `.agent/06-TESTING.md`
7. `.agent/07-TASKS.md`

---

## 1. Project Facts & Status
- **GitHub Remote:** `https://github.com/RHRONY05/Menuwala.git` (branch `main` is clean and pushed).
- **Supabase Project:** Ref `vaxjsaknytquzcfxsukv` (`brew-bari-demo`, Region `ap-southeast-1`), credentials in `.env.local`.
- **Milestone M0 (Foundation & Scaffold):** Complete (Next.js 16, Tailwind v4, shadcn/ui, design tokens, unit tests, Playwright setup).
- **Milestone M1 (Database & API):**
  - **T1.1 Schema migration:** Complete (`20261012000001_init_schema.sql` applied, types generated in `src/types/database.ts`).
  - **T1.2 RLS + storage policies:** Complete (`20261012000002_rls.sql` applied, `01_rls_anon.sql` & `08_staff_rls.sql` verified and passing).

---

## 2. Next Immediate Action Required by You (T1.3)
You will start directly on **T1.3 Guest RPCs + Realtime**:
1. **Create migration `supabase/migrations/20261012000003_rpc.sql`** from `.agent/03-DATABASE.md` §3:
   - Internal helpers: `_table_ctx`, `_ensure_session`, `_check_rate`, `price_cart`, `_create_request`, `_session_json`.
   - Customer RPCs: `get_table_context`, `get_session_status`, `call_waiter`, `place_order`, `request_bill`, `get_bill`, `submit_feedback`.
   - Grants: blanket `revoke execute on all functions in schema public from public, anon, authenticated;`, followed by explicit `grant execute` on the 7 guest RPCs + `is_staff`, `is_admin`, `my_restaurant_id`.
2. **Create migration `supabase/migrations/20261012000004_realtime.sql`** from `.agent/03-DATABASE.md` §4:
   - `alter publication supabase_realtime add table public.service_requests, public.table_sessions;`
3. **Apply both migrations via Supabase MCP `apply_migration`**.
4. **Regenerate types:** run `generate_typescript_types` to update `src/types/database.ts`.
5. **Create & run SQL tests in `supabase/tests/`:**
   - `02_rpc_grants.sql` (internal helpers not executable by anon, guest RPCs callable).
   - `03_call_waiter.sql` (creates session, 1st call creates request, 2nd returns duplicate=true, nudge_count=1).
   - `04_place_order.sql` (tampered price ignored, sold-out raises `ITEM_SOLD_OUT:`, required option raises `OPTION_REQUIRED:`, package 2 raises `FEATURE_NOT_IN_PACKAGE`).
   - `05_bill.sql` (two orders with one cancelled, VAT 5% rounding).
   - `06_rate_limit.sql` (16th request in 10m raises `RATE_LIMITED`).
   - `07_feedback.sql` (rating 0/6 raises `BAD_RATING`, second submit updates).
   - Run each via MCP `execute_sql` in `begin ... rollback`.
6. **Check advisors:** run `get_advisors`.
7. **Tick T1.3 in `07-TASKS.md` and log into `PROGRESS.md`**.

---

## 3. Subsequent Tasks
- **T1.4 Seed data + staff accounts:**
  - Populate `supabase/seed.sql` with Brew Bari 28 menu items, categories, offers, tables 1–8 + test table 99 (from `03-DATABASE.md` §6 + `06-TESTING.md`). Apply via `execute_sql`.
  - Create test staff accounts in `auth.users` (`admin` and `counter`), link to `public.staff`, save credentials to `.env.local` (`TEST_STAFF_*`).
- **T1.5 Typed client layer:**
  - Complete `src/lib/supabase/*`, `src/lib/table/rpc.ts`, `src/lib/schemas.ts`, `src/lib/errors.ts`, `src/lib/requests.ts`.
- **Phase 2 (Parallel Lanes B & C):**
  - Follow the worktree instructions in `07-TASKS.md` and `PROGRESS.md` to run Lane B (guest UI: M2, M3, M5) and Lane C (staff UI: M4, M6) autonomously to completion through M7.
