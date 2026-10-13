import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

async function getTable99Token(): Promise<string> {
  loadEnv();
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_STAFF_ADMIN_EMAIL!,
    password: process.env.TEST_STAFF_ADMIN_PASSWORD!,
  });
  expect(error).toBeNull();
  const { data } = await supabase.from('tables').select('qr_token').eq('number', 99).single();
  return data!.qr_token;
}

// Multi-restaurant platform: home page, slug URLs, legacy redirects, no leaked credentials.
test.describe('Platform (platform.spec.ts)', () => {
  test('home lists restaurants and links to staff login, without credentials', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /QR menus/i })).toBeVisible();
    const card = page.getByTestId('restaurant-card-brew-bari');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', '/brew-bari');
    await expect(page.getByTestId('staff-login-link')).toHaveAttribute('href', '/staff/login');

    const html = await page.content();
    expect(html).not.toMatch(/Admin2026|Counter2026|CoffeeBari2026/);
  });

  test('guest menu lives at /<slug>', async ({ page }) => {
    await page.goto('/brew-bari');
    await expect(page.getByRole('heading', { level: 1, name: /Brew Bari/i })).toBeVisible();
  });

  test('old /m/<slug> URL redirects to /<slug>', async ({ page }) => {
    await page.goto('/m/brew-bari');
    await expect(page).toHaveURL(/\/brew-bari$/);
  });

  test('unknown restaurant slug shows not found', async ({ page }) => {
    // The menu streams inside Suspense, so the HTTP status is already sent (200) when
    // notFound() runs; the guest still sees the not-found page.
    await page.goto('/no-such-restaurant');
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('old /t/<token> table link redirects to /<slug>/t/<token>', async ({ request }) => {
    const token = await getTable99Token();
    const res = await request.get(`/t/${token}`, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toContain(`/brew-bari/t/${token}`);

    const unknown = await request.get('/t/legacy-token-that-does-not-exist', { maxRedirects: 0 });
    expect(unknown.status()).toBe(404);
  });

  test('staff login page has no demo quick-fill', async ({ page }) => {
    await page.goto('/staff/login');
    await expect(page.getByText('Menuwala · Staff portal')).toBeVisible();
    await expect(page.getByText(/Quick-Fill/i)).toHaveCount(0);
  });
});
