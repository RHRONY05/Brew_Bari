import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Close table 99's live session so each spec starts fresh. All specs share table 99,
 * and the guest RPCs rate-limit to 15 requests per session per 10 minutes.
 * Needs a client logged in as staff of the restaurant.
 */
export async function resetTable99(supabase: SupabaseClient<Database>) {
  const { data: table } = await supabase.from('tables').select('id').eq('number', 99).single();
  if (!table) return;
  // Finish leftover requests from earlier specs so the counter board starts empty for table 99
  await supabase
    .from('service_requests')
    .update({ status: 'cancelled' })
    .eq('table_id', table.id)
    .not('status', 'in', '(done,cancelled)');
  await supabase
    .from('table_sessions')
    .update({ status: 'closed' })
    .eq('table_id', table.id)
    .neq('status', 'closed');
}
