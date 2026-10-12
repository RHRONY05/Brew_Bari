'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

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
          if (!staffMember || staffMember.role !== 'admin') {
            router.replace('/staff/counter');
            return;
          }
          setIsAdmin(true);
        });
    });
  }, [router]);

  return (
    <>
      {!isAdmin && (
        <div className="min-h-screen bg-[#FFF7EE] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
        </div>
      )}
      <div className={!isAdmin ? 'invisible' : 'min-h-screen bg-[#FFF7EE] flex flex-col lg:flex-row'}>
        <React.Suspense fallback={null}>
          <AdminNav />
          <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto">
            {children}
          </main>
        </React.Suspense>
      </div>
    </>
  );
}
