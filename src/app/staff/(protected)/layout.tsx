'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { StaffRestaurantProvider } from '@/components/staff/StaffRestaurantContext';

export default function StaffProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <StaffRestaurantProvider
        fallback={
          <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
          </div>
        }
      >
        <React.Suspense fallback={null}>{children}</React.Suspense>
      </StaffRestaurantProvider>
    </div>
  );
}
