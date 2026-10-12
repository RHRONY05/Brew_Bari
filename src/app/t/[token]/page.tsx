import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { getTableContextRpc } from '@/lib/table/rpc';
import { getMenu } from '@/lib/menu/data';
import { TableClient } from '@/components/table/TableClient';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export const metadata: Metadata = {
  title: 'Brew Bari — Table Service',
  description: 'Order food and call waiter right from your table.',
};

async function TableServiceContent({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { lang } = await searchParams;

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value;
  const locale = (lang === 'bn' || (!lang && cookieLocale === 'bn')) ? 'bn' : 'en';

  // Call get_table_context RPC
  const contextRes = await getTableContextRpc(token);

  // If token is invalid (G8)
  if (contextRes.error || !contextRes.data) {
    return (
      <main className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-surface-2 text-brand flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 stroke-[2]" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">
          {locale === 'bn' ? 'টেবিল পাওয়া যায়নি' : 'Table Not Found'}
        </h1>
        <p className="text-[14px] text-ink-2 leading-relaxed mb-6">
          {locale === 'bn'
            ? 'এই কিউআর কোডটি সঠিক নয় বা মেয়াদ উত্তীর্ণ হয়েছে। অনুগ্রহ করে ওয়েটারকে জানান।'
            : 'This QR code is invalid or has expired. Please ask staff for assistance.'}
        </p>
        <Link
          href="/m/brew-bari"
          className="h-12 px-6 rounded-full bg-brand text-bg font-bold text-[14.5px] flex items-center justify-center hover:bg-brand-dark transition-colors"
        >
          {locale === 'bn' ? 'মেন্যু দেখুন' : 'View menu instead'}
        </Link>
      </main>
    );
  }

  const tableData = contextRes.data;

  // Fetch menu
  const menu = await getMenu(tableData.restaurant_slug);
  if (!menu) {
    notFound();
  }

  return (
    <TableClient
      token={token}
      tableContext={tableData}
      menu={menu}
      initialLocale={locale}
    />
  );
}

export default function TablePage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-12 w-48 bg-line rounded-2xl" />
          <div className="h-[50px] w-full bg-line rounded-full" />
          <div className="h-40 w-full bg-line rounded-3xl" />
        </div>
      }
    >
      <TableServiceContent {...props} />
    </Suspense>
  );
}
