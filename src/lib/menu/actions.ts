'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { menuPath } from '@/lib/site-urls';

export async function revalidateMenuAction(restaurantId: string | undefined, slug: string) {
  try {
    const tagRevalidate = revalidateTag as unknown as (tag: string, profile?: string) => void;
    if (restaurantId) {
      tagRevalidate(`menu:${restaurantId}`, 'max');
    }
    tagRevalidate(`menu-slug:${slug}`, 'max');
    tagRevalidate(`menu-data-${slug}`, 'max');
  } catch (e) {
    console.error('revalidateTag error:', e);
  }

  try {
    revalidatePath(menuPath(slug), 'page');
    revalidatePath(`/${slug}`, 'page');
    revalidatePath(`/${slug}/t/[token]`, 'page');
    revalidatePath('/[slug]', 'page');
    revalidatePath('/[slug]/t/[token]', 'page');
  } catch (e) {
    console.error('revalidatePath error:', e);
  }
}
