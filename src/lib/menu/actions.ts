'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { menuPath } from '@/lib/site-urls';

export async function revalidateMenuAction(restaurantId: string | undefined, slug: string) {
  try {
    if (restaurantId) {
      (revalidateTag as any)(`menu:${restaurantId}`, 'max');
    }
    (revalidateTag as any)(`menu-slug:${slug}`, 'max');
    (revalidateTag as any)(`menu-data-${slug}`, 'max');
  } catch (e) {
    console.error('revalidateTag error:', e);
  }

  try {
    revalidatePath(menuPath(slug), 'page');
    revalidatePath('/[slug]', 'page');
  } catch (e) {
    console.error('revalidatePath error:', e);
  }
}
