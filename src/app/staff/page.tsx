'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function StaffRootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/staff/login');
        return;
      }
      supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .single()
        .then(({ data: staffMember }) => {
          if (staffMember?.role === 'admin') {
            router.replace('/staff/admin');
          } else {
            router.replace('/staff/counter');
          }
        });
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF7EE] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
    </div>
  );
}
