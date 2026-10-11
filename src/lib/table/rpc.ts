import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { parseErrorCode, getErrorMessage } from '@/lib/errors';
import {
  Cart,
  type CartLineType,
  type TableContextResult,
  type SessionStatusResult,
  type BillResult,
  type SessionJson,
} from '@/lib/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';

export type RpcResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; detail: string | null; message: string } };

function handleError(err: unknown): RpcResult<never> {
  const rawMsg = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'GENERIC';
  const parsed = parseErrorCode(rawMsg);
  const userMsg = getErrorMessage(parsed.code);
  return {
    data: null,
    error: {
      code: parsed.code,
      detail: parsed.detail,
      message: userMsg,
    },
  };
}

export async function getTableContext(
  token: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<TableContextResult>> {
  const sb = client ?? getSupabaseBrowserClient();
  const { data, error } = await sb.rpc('get_table_context', {
    p_token: token,
  });

  if (error) {
    return handleError(error);
  }

  return { data: data as unknown as TableContextResult, error: null };
}

export async function getSessionStatus(
  token: string,
  sessionId: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<SessionStatusResult>> {
  const sb = client ?? getSupabaseBrowserClient();
  const { data, error } = await sb.rpc('get_session_status', {
    p_token: token,
    p_session_id: sessionId,
  });

  if (error) {
    return handleError(error);
  }

  return { data: data as unknown as SessionStatusResult, error: null };
}

export async function callWaiter(
  token: string,
  deviceId: string,
  items: CartLineType[] = [],
  note?: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<{ request_id: string; duplicate: boolean; session: SessionJson }>> {
  const sb = client ?? getSupabaseBrowserClient();

  const validatedCart = Cart.safeParse(items);
  if (!validatedCart.success) {
    return handleError(new Error('CART_TOO_LARGE'));
  }

  const { data, error } = await sb.rpc('call_waiter', {
    p_token: token,
    p_device_id: deviceId,
    p_items: validatedCart.data as unknown as Json,
    p_note: note || undefined,
  });

  if (error) {
    return handleError(error);
  }

  return {
    data: data as unknown as { request_id: string; duplicate: boolean; session: SessionJson },
    error: null,
  };
}

export async function placeOrder(
  token: string,
  deviceId: string,
  items: CartLineType[],
  note?: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<{ request_id: string; duplicate: boolean; session: SessionJson }>> {
  const sb = client ?? getSupabaseBrowserClient();

  if (!items || items.length === 0) {
    return handleError(new Error('EMPTY_CART'));
  }

  const validatedCart = Cart.safeParse(items);
  if (!validatedCart.success) {
    return handleError(new Error('CART_TOO_LARGE'));
  }

  const { data, error } = await sb.rpc('place_order', {
    p_token: token,
    p_device_id: deviceId,
    p_items: validatedCart.data as unknown as Json,
    p_note: note || undefined,
  });

  if (error) {
    return handleError(error);
  }

  return {
    data: data as unknown as { request_id: string; duplicate: boolean; session: SessionJson },
    error: null,
  };
}

export async function requestBill(
  token: string,
  deviceId: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<{ request_id: string; duplicate: boolean; session: SessionJson }>> {
  const sb = client ?? getSupabaseBrowserClient();

  const { data, error } = await sb.rpc('request_bill', {
    p_token: token,
    p_device_id: deviceId,
  });

  if (error) {
    return handleError(error);
  }

  return {
    data: data as unknown as { request_id: string; duplicate: boolean; session: SessionJson },
    error: null,
  };
}

export async function getBill(
  token: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<BillResult>> {
  const sb = client ?? getSupabaseBrowserClient();

  const { data, error } = await sb.rpc('get_bill', {
    p_token: token,
  });

  if (error) {
    return handleError(error);
  }

  return { data: data as unknown as BillResult, error: null };
}

export async function submitFeedback(
  token: string,
  rating: number,
  comment?: string,
  client?: SupabaseClient<Database>
): Promise<RpcResult<{ ok: boolean }>> {
  const sb = client ?? getSupabaseBrowserClient();

  if (!rating || rating < 1 || rating > 5) {
    return handleError(new Error('BAD_RATING'));
  }

  const { data, error } = await sb.rpc('submit_feedback', {
    p_token: token,
    p_rating: rating,
    p_comment: comment || undefined,
  });

  if (error) {
    return handleError(error);
  }

  return { data: data as unknown as { ok: boolean }, error: null };
}
