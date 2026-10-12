'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function StaffProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/staff/login');
        return;
      }
      supabase
        .from('staff')
        .select('id, name, role, restaurant_id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: staffMember }) => {
          if (!staffMember) {
            router.replace('/staff/login');
            return;
          }
          setIsAuthorized(true);
        });
    });
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FFF7EE] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7EE] text-[#24170F]">
      {children}
    </div>
  );
}
