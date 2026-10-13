'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { callWaiterRpc, getSessionStatusRpc, placeOrderRpc } from '@/lib/table/rpc';
import { getDeviceId } from '@/lib/device-id';
import { getErrorMessage } from '@/lib/errors';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { playChime } from '@/lib/audio';
import { useTheme } from '@/themes/ThemeContext';
import type { TableContextResult, SessionRequestJson, SessionStatus } from '@/lib/schemas';
import type { CartLineType } from '@/lib/schemas';

export interface TableContextType {
  token: string;
  table: { id: string; number: number };
  session: { id: string; status: SessionStatus } | null;
  requests: SessionRequestJson[];
  packageTier: number;
  isCallingWaiter: boolean;
  isPlacingOrder: boolean;
  nudgeCount: number;
  activeStatusText: string | null;
  callWaiter: (items?: CartLineType[], note?: string) => Promise<boolean>;
  placeOrder: (
    items: CartLineType[],
    note?: string
  ) => Promise<{ success: boolean; soldOutItemId?: string; message?: string }>;
  refreshStatus: () => Promise<void>;
}

const TableContext = createContext<TableContextType | null>(null);

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return ctx;
}

interface TableProviderProps {
  token: string;
  initialContext: TableContextResult;
  locale?: 'en' | 'bn';
  children: React.ReactNode;
}

export function TableProvider({
  token,
  initialContext,
  locale = 'en',
  children,
}: TableProviderProps) {
  const [table] = useState(initialContext.table);
  const [session, setSession] = useState<{ id: string; status: SessionStatus } | null>(
    initialContext.session ? { id: initialContext.session.id, status: initialContext.session.status } : null
  );
  const [requests, setRequests] = useState<SessionRequestJson[]>(
    initialContext.session?.requests ?? []
  );
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);

  const sessionIdRef = useRef(session?.id);

  useEffect(() => {
    sessionIdRef.current = session?.id;
  }, [session?.id]);


  const theme = useTheme();

  // Active status summary for floating pill
  const activeStatusText = React.useMemo(() => {
    const latestOrder = requests.find((r) => r.type === 'order');
    if (latestOrder && latestOrder.status !== 'cancelled') {
      if (latestOrder.status === 'new') {
        return locale === 'bn' ? 'অর্ডার জমা দেওয়া হয়েছে' : 'Order submitted';
      }
      if (latestOrder.status === 'acknowledged') {
        return locale === 'bn' ? 'অর্ডার অনুমোদিত হয়েছে' : 'Order approved';
      }
      if (latestOrder.status === 'preparing') {
        if (theme?.copy?.statusPreparing) {
          return theme.copy.statusPreparing[locale] ?? (locale === 'bn' ? 'গ্রিলে চলছে' : 'On the grill');
        }
        return locale === 'bn' ? 'অর্ডার তৈরি হচ্ছে' : 'Order preparing';
      }
      if (latestOrder.status === 'ready') {
        return locale === 'bn' ? 'অর্ডার প্রস্তুত' : 'Order ready';
      }
      if (latestOrder.status === 'done') {
        return locale === 'bn' ? 'অর্ডার পরিবেশন করা হয়েছে' : 'Order served';
      }
    }

    const activeCall = requests.find(
      (r) => r.type === 'call_waiter' && ['new', 'acknowledged'].includes(r.status)
    );
    if (activeCall) {
      return activeCall.status === 'acknowledged'
        ? locale === 'bn'
          ? 'ওয়েটার আসছেন'
          : 'Waiter coming'
        : locale === 'bn'
          ? 'ওয়েটার ডাকা হয়েছে'
          : 'Waiter called';
    }

    const activeBill = requests.find(
      (r) => r.type === 'bill' && ['new', 'acknowledged'].includes(r.status)
    );
    if (activeBill) {
      return locale === 'bn' ? 'বিল চাওয়া হয়েছে' : 'Bill requested';
    }

    return null;
  }, [requests, locale, theme]);

  // Refresh status RPC
  const refreshStatus = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    const res = await getSessionStatusRpc(token, currentSessionId);
    if (res.data) {
      const liveSession = res.data.session;
      if (liveSession) {
        setSession({ id: liveSession.id, status: liveSession.status });
        setRequests(liveSession.requests);
      }
    }
  }, [token]);

  // Call waiter handler
  const callWaiter = useCallback(
    async (items?: CartLineType[], note?: string): Promise<boolean> => {
      setIsCallingWaiter(true);
      try {
        const deviceId = getDeviceId();
        const res = await callWaiterRpc(token, deviceId, items, note);

        if (res.error) {
          const errMsg = getErrorMessage(res.error.code, locale);
          toast.error(errMsg);
          return false;
        }

        if (res.data) {
          if (res.data.session) {
            setSession({ id: res.data.session.id, status: res.data.session.status });
            setRequests(res.data.session.requests);
            sessionIdRef.current = res.data.session.id;
          }
          if (res.data.duplicate) {
            setNudgeCount((n) => n + 1);
            toast.info(
              locale === 'bn'
                ? `ওয়েটারকে আবার জানানো হয়েছে (${nudgeCount + 1}বার)`
                : `Waiter notified again (x${nudgeCount + 1})`
            );
          } else {
            toast.success(
              locale === 'bn' ? 'ওয়েটার ডাকা হয়েছে!' : 'Waiter called!'
            );
          }
          return true;
        }
        return false;
      } catch {
        toast.error(locale === 'bn' ? 'একটি সমস্যা হয়েছে' : 'Something went wrong');
        return false;
      } finally {
        setIsCallingWaiter(false);
      }
    },
    [token, locale, nudgeCount]
  );

  // Place order handler
  const placeOrder = useCallback(
    async (
      items: CartLineType[],
      note?: string
    ): Promise<{ success: boolean; soldOutItemId?: string; message?: string }> => {
      setIsPlacingOrder(true);
      try {
        const deviceId = getDeviceId();
        const res = await placeOrderRpc(token, deviceId, items, note);

        if (res.error) {
          if (res.error.code === 'ITEM_SOLD_OUT') {
            return {
              success: false,
              soldOutItemId: res.error.detail || undefined,
              message: res.error.message,
            };
          }
          const errMsg = getErrorMessage(res.error.code, locale);
          toast.error(errMsg);
          return { success: false, message: errMsg };
        }

        if (res.data) {
          if (res.data.session) {
            setSession({ id: res.data.session.id, status: res.data.session.status });
            setRequests(res.data.session.requests);
            sessionIdRef.current = res.data.session.id;
          }
          toast.success(
            locale === 'bn'
              ? 'অর্ডার সফলভাবে জমা দেওয়া হয়েছে! অনুমোদনের অপেক্ষায়...'
              : 'Order submitted! Awaiting staff confirmation...'
          );
          return { success: true };
        }

        return { success: false };
      } catch {
        toast.error(locale === 'bn' ? 'একটি সমস্যা হয়েছে' : 'Something went wrong');
        return { success: false };
      } finally {
        setIsPlacingOrder(false);
      }
    },
    [token, locale]
  );

  // Watch for status changes to notify customer with toast & chime
  const prevStatusesRef = useRef<Record<string, string>>({});
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (initialLoadRef.current) {
      requests.forEach((r) => {
        prevStatusesRef.current[r.id] = r.status;
      });
      if (requests.length > 0) {
        initialLoadRef.current = false;
      }
      return;
    }

    requests.forEach((r) => {
      const prev = prevStatusesRef.current[r.id];
      if (prev && prev !== r.status) {
        if (r.type === 'order') {
          if (r.status === 'acknowledged') {
            toast.success(
              locale === 'bn'
                ? 'আপনার অর্ডার অনুমোদিত হয়েছে! ☕'
                : 'Order approved & accepted by staff! ☕'
            );
            playChime();
          } else if (r.status === 'preparing') {
            const prepText = theme?.copy?.statusPreparing
              ? locale === 'bn'
                ? `আপনার অর্ডার ${theme.copy.statusPreparing.bn}! 🔥`
                : `Your order is ${theme.copy.statusPreparing.en.toLowerCase()}! 🔥`
              : locale === 'bn'
                ? 'আপনার অর্ডার তৈরি হচ্ছে! ☕'
                : 'Your order is being prepared! ☕';
            toast.info(prepText);
            playChime();
          } else if (r.status === 'ready') {
            toast.success(locale === 'bn' ? 'আপনার অর্ডার প্রস্তুত! 🎉' : 'Your order is ready! 🎉');
            playChime();
          } else if (r.status === 'done') {
            toast.success(locale === 'bn' ? 'অর্ডার পরিবেশন করা হয়েছে! ✨' : 'Order served! Enjoy your brew! ✨');
            playChime();
          } else if (r.status === 'cancelled') {
            toast.error(
              locale === 'bn'
                ? 'আপনার অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে স্টাফের সাথে কথা বলুন।'
                : 'Your order was cancelled. Please speak with staff for details.'
            );
            playChime();
          }
        } else if (r.type === 'call_waiter') {
          if (r.status === 'acknowledged') {
            toast.info(locale === 'bn' ? 'ওয়েটার আসছেন!' : 'A staff member is on the way!');
            playChime();
          } else if (r.status === 'cancelled') {
            toast.info(locale === 'bn' ? 'ওয়েটার কল বাতিল করা হয়েছে।' : 'Waiter call was cancelled.');
            playChime();
          }
        } else if (r.type === 'bill') {
          if (r.status === 'acknowledged') {
            toast.info(locale === 'bn' ? 'বিল প্রস্তুত হচ্ছে!' : 'Bill request acknowledged!');
            playChime();
          } else if (r.status === 'done') {
            toast.success(locale === 'bn' ? 'বিল পরিশোধ সম্পন্ন হয়েছে! ধন্যবাদ।' : 'Bill settled! Thank you.');
            playChime();
          } else if (r.status === 'cancelled') {
            toast.info(locale === 'bn' ? 'বিল রিকোয়েস্ট বাতিল করা হয়েছে।' : 'Bill request was cancelled.');
            playChime();
          }
        }
      }
      prevStatusesRef.current[r.id] = r.status;
    });
  }, [requests, locale, theme.copy.statusPreparing]);

  // Realtime channel subscription for instant status update broadcasts
  useEffect(() => {
    if (!table?.id) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`table-${table.id}`);
    channel
      .on('broadcast', { event: 'status_changed' }, () => {
        refreshStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table?.id, refreshStatus]);

  // Polling logic per 04-API.md: 2s while active requests exist, 10s otherwise
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const hasActiveRequests = requests.some((r) =>
      ['new', 'acknowledged', 'preparing', 'ready'].includes(r.status)
    );

    const interval = hasActiveRequests ? 2000 : 10000;

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await refreshStatus();
    };

    timer = setInterval(poll, interval);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshStatus();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [requests, refreshStatus]);

  const value: TableContextType = {
    token,
    table,
    session,
    requests,
    packageTier: initialContext.package,
    isCallingWaiter,
    isPlacingOrder,
    nudgeCount,
    activeStatusText,
    callWaiter,
    placeOrder,
    refreshStatus,
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}
