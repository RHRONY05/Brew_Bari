import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getMenu } from '@/lib/menu/data';
import { MenuClient } from '@/components/menu/MenuClient';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; pkg?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);
  if (!menu) {
    return {
      title: 'Menu Not Found | Brew Bari',
    };
  }
  return {
    title: `${menu.restaurant.name_en} — Digital Menu`,
    description: menu.restaurant.tagline_en || 'Coffee and fresh juice, made with love.',
  };
}

async function MenuContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lang, pkg } = await searchParams;

  const menu = await getMenu(slug);
  if (!menu) {
    notFound();
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value;
  const initialLocale = (lang === 'bn' || (!lang && cookieLocale === 'bn')) ? 'bn' : 'en';
  const packageOverride = pkg ? Number(pkg) : undefined;

  return (
    <MenuClient
      menu={menu}
      initialLocale={initialLocale}
      packageOverride={packageOverride}
    />
  );
}

export default function GuestMenuPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-12 w-48 bg-line rounded-2xl" />
          <div className="h-[50px] w-full bg-line rounded-full" />
          <div className="h-40 w-full bg-line rounded-3xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-line rounded-3xl" />
            <div className="aspect-square bg-line rounded-3xl" />
          </div>
        </div>
      }
    >
      <MenuContent {...props} />
    </Suspense>
  );
}
