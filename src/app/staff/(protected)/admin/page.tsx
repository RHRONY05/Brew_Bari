'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff/admin/menu');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
    </div>
  );
}
