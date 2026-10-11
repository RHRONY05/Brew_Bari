import type { RequestType, RequestStatus, SessionStatus } from './schemas';

export const NEXT: Record<RequestType, Partial<Record<RequestStatus, RequestStatus[]>>> = {
  call_waiter: {
    new: ['acknowledged', 'done', 'cancelled'],
    acknowledged: ['done'],
  },
  order: {
    new: ['acknowledged', 'cancelled'],
    acknowledged: ['preparing', 'cancelled'],
    preparing: ['ready'],
    ready: ['done'],
  },
  bill: {
    new: ['acknowledged', 'done', 'cancelled'],
    acknowledged: ['done'],
  },
};

export function canTransition(
  type: RequestType,
  current: RequestStatus,
  target: RequestStatus
): boolean {
  const allowed = NEXT[type]?.[current];
  return Boolean(allowed?.includes(target));
}

export type TableTileState =
  | 'bill_open'
  | 'order_new'
  | 'call_open'
  | 'session_pending'
  | 'session_open'
  | 'idle';

export function getTableTileState(
  sessionStatus: SessionStatus | null | undefined,
  activeRequests: { type: RequestType; status: RequestStatus }[] = []
): TableTileState {
  if (!sessionStatus || sessionStatus === 'closed') {
    return 'idle';
  }

  const hasBillOpen = activeRequests.some(
    (r) => r.type === 'bill' && !['done', 'cancelled'].includes(r.status)
  );
  if (hasBillOpen) return 'bill_open';

  const hasOrderNew = activeRequests.some(
    (r) => r.type === 'order' && r.status === 'new'
  );
  if (hasOrderNew) return 'order_new';

  const hasCallOpen = activeRequests.some(
    (r) => r.type === 'call_waiter' && !['done', 'cancelled'].includes(r.status)
  );
  if (hasCallOpen) return 'call_open';

  if (sessionStatus === 'pending') {
    return 'session_pending';
  }

  if (sessionStatus === 'open') {
    return 'session_open';
  }

  return 'idle';
}

export function getGuestStatusLabel(
  type: RequestType,
  status: RequestStatus,
  locale: 'en' | 'bn' = 'en'
): string {
  if (type === 'call_waiter' && status === 'acknowledged') {
    return locale === 'bn' ? 'ওয়েটার আসছেন' : 'Waiter coming';
  }

  const labels: Record<RequestStatus, { en: string; bn: string }> = {
    new: { en: 'Received', bn: 'গ্রহণ করা হয়েছে' },
    acknowledged: { en: 'Confirmed', bn: 'নিশ্চিত' },
    preparing: { en: 'Preparing', bn: 'তৈরি হচ্ছে' },
    ready: { en: 'Ready', bn: 'রেডি' },
    done: { en: 'Served', bn: 'পরিবেশিত' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল' },
  };

  return labels[status]?.[locale] ?? status;
}
