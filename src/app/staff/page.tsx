import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function StaffRootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/staff/login');
  }

  const { data: staffMember } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (staffMember?.role === 'admin') {
    redirect('/staff/admin');
  } else {
    redirect('/staff/counter');
  }
}
