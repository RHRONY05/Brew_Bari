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
        .select('user_id, display_name, role, restaurant_id')
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

  return (
    <div className="min-h-screen bg-bg text-ink">
      {!isAuthorized && (
        <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
        </div>
      )}
      <div className={!isAuthorized ? 'invisible' : ''}>
        <React.Suspense fallback={null}>
          {children}
        </React.Suspense>
      </div>
    </div>
  );
}
