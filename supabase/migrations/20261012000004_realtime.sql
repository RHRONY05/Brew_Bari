-- Migration: realtime (03-DATABASE.md §4)

alter publication supabase_realtime add table public.service_requests, public.table_sessions;
