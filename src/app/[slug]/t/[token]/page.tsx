import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { getTableContextRpc } from '@/lib/table/rpc';
import { getMenu } from '@/lib/menu/data';
import { TableClient } from '@/components/table/TableClient';
import { getTheme } from '@/themes';
import { ThemeStyle } from '@/themes/ThemeStyle';
import { MenuSkeleton } from '@/components/menu/MenuSkeleton';
import { menuPath, tablePath } from '@/lib/site-urls';

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);
  return {
    title: menu ? `${menu.restaurant.name_en} — Table service` : 'Table service',
    description: 'Order food and call a waiter right from your table.',
  };
}

async function TableServiceContent({ params, searchParams }: PageProps) {
  const { slug, token } = await params;
  const { lang } = await searchParams;

  const menu = await getMenu(slug);
  if (!menu) {
    notFound();
  }
  const theme = getTheme(menu.restaurant.theme_key);

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value;
  const locale = (lang === 'bn' || (!lang && cookieLocale === 'bn')) ? 'bn' : 'en';

  const contextRes = await getTableContextRpc(token);

  // Invalid or regenerated QR (G8)
  if (contextRes.error || !contextRes.data) {
    return (
      <main className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <ThemeStyle theme={theme} />
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
          href={menuPath(slug)}
          className="h-12 px-6 rounded-full bg-brand text-bg font-bold text-[14.5px] flex items-center justify-center hover:bg-brand-dark transition-colors"
        >
          {locale === 'bn' ? 'মেন্যু দেখুন' : 'View menu instead'}
        </Link>
      </main>
    );
  }

  const tableData = contextRes.data;

  // The token belongs to another restaurant: send the guest to the right one.
  if (tableData.restaurant_slug !== slug) {
    redirect(tablePath(tableData.restaurant_slug, token));
  }

  return (
    <>
      <ThemeStyle theme={theme} />
      <TableClient
        token={token}
        tableContext={tableData}
        menu={menu}
        initialLocale={locale}
      />
    </>
  );
}

export default function TablePage(props: PageProps) {
  return (
    <Suspense fallback={<MenuSkeleton withGrid={false} />}>
      <TableServiceContent {...props} />
    </Suspense>
  );
}
