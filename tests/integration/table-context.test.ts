import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

// Polyfill WebSocket for Node 20
if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}


// Helper to ensure .env.local variables are loaded in test runner
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = process.env.TEST_STAFF_ADMIN_EMAIL;
const adminPassword = process.env.TEST_STAFF_ADMIN_PASSWORD;

describe('T1.5 Integration: Table Context and RLS', () => {
  let table99Token: string;
  let staffClient: ReturnType<typeof createClient<Database>>;
  let anonClient: ReturnType<typeof createClient<Database>>;

  beforeAll(async () => {
    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();
    expect(adminEmail).toBeDefined();
    expect(adminPassword).toBeDefined();

    anonClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
    staffClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!);

    // Authenticate staff client
    const { data: authData, error: authError } = await staffClient.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    expect(authError).toBeNull();
    expect(authData.session).toBeDefined();

    // Query table 99 as staff
    const { data: tableData, error: tableError } = await staffClient
      .from('tables')
      .select('id, number, qr_token')
      .eq('number', 99)
      .single();

    expect(tableError).toBeNull();
    expect(tableData).toBeDefined();
    expect(tableData?.qr_token).toBeDefined();
    table99Token = tableData!.qr_token;
  });

  afterAll(async () => {
    // Clean up any session created for table 99
    if (staffClient && table99Token) {
      const { data: table } = await staffClient
        .from('tables')
        .select('id')
        .eq('number', 99)
        .single();

      if (table) {
        await staffClient
          .from('table_sessions')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('table_id', table.id)
          .eq('status', 'open');
      }
    }
  });

  it('RLS: anon select on tables returns empty array (not exposed)', async () => {
    const { data, error } = await anonClient.from('tables').select('*');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('RPC: anon get_table_context on table 99 returns session and restaurant context', async () => {
    const { data, error } = await anonClient.rpc('get_table_context', {
      p_token: table99Token,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Cast as object
    const result = data as {
      restaurant_slug: string;
      package: number;
      table: { id: string; number: number };
      session: { id: string; status: string } | null;
    };

    expect(result.restaurant_slug).toBe('brew-bari');
    expect(result.package).toBe(3);
    expect(result.table.number).toBe(99);
    expect(result.session).toBeDefined();
    expect(['pending', 'open']).toContain(result.session?.status);
  });
});

