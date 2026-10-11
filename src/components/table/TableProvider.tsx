'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { callWaiterRpc, getSessionStatusRpc, placeOrderRpc } from '@/lib/table/rpc';
import { getDeviceId } from '@/lib/device-id';
import { getErrorMessage } from '@/lib/errors';
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


  // Active status summary for floating pill
  const activeStatusText = React.useMemo(() => {
    const activeOrder = requests.find(
      (r) => r.type === 'order' && ['new', 'acknowledged', 'preparing', 'ready'].includes(r.status)
    );
    if (activeOrder) {
      if (activeOrder.status === 'new') {
        return locale === 'bn' ? 'অর্ডার গ্রহণ করা হয়েছে' : 'Order received';
      }
      if (activeOrder.status === 'preparing') {
        return locale === 'bn' ? 'অর্ডার তৈরি হচ্ছে' : 'Order preparing';
      }
      if (activeOrder.status === 'ready') {
        return locale === 'bn' ? 'অর্ডার প্রস্তুত' : 'Order ready';
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

    return null;
  }, [requests, locale]);

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
          await refreshStatus();
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
    [token, locale, nudgeCount, refreshStatus]
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
          toast.success(
            locale === 'bn' ? 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!' : 'Order placed successfully!'
          );
          await refreshStatus();
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
    [token, locale, refreshStatus]
  );

  // Polling logic per 04-API.md
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const hasActiveRequests = requests.some((r) =>
      ['new', 'acknowledged', 'preparing', 'ready'].includes(r.status)
    );

    const interval = hasActiveRequests ? 5000 : 30000;

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
