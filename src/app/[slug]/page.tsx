import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getMenu } from '@/lib/menu/data';
import { MenuClient } from '@/components/menu/MenuClient';
import { getTheme } from '@/themes';
import { ThemeStyle } from '@/themes/ThemeStyle';
import { MenuSkeleton } from '@/components/menu/MenuSkeleton';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; pkg?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);
  if (!menu) {
    return { title: 'Menu not found' };
  }
  return {
    title: `${menu.restaurant.name_en} — Menu`,
    description: menu.restaurant.tagline_en || `Digital menu of ${menu.restaurant.name_en}`,
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
  // ?pkg= lets a salesperson preview another package; never for package-locked restaurants
  const packageOverride = pkg && !menu.restaurant.package_locked ? Number(pkg) : undefined;

  return (
    <>
      <ThemeStyle theme={getTheme(menu.restaurant.theme_key)} />
      <MenuClient
        menu={menu}
        initialLocale={initialLocale}
        packageOverride={packageOverride}
      />
    </>
  );
}

export default function GuestMenuPage(props: PageProps) {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuContent {...props} />
    </Suspense>
  );
}
