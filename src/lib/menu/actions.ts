'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function revalidateMenuAction(restaurantId?: string, slug: string = 'brew-bari') {
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
    revalidatePath(`/m/${slug}`, 'page');
    revalidatePath('/m/[slug]', 'page');
  } catch (e) {
    console.error('revalidatePath error:', e);
  }
}
