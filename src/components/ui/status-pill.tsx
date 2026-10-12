import * as React from 'react'
import {
  Bell,
  Clock,
  CheckCircle2,
  Receipt,
  Coffee,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ServiceStatus =
  | 'pending'
  | 'calling'
  | 'order_placed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'bill_requested'
  | 'cancelled'
  | 'closed'

export interface StatusPillProps {
  status: ServiceStatus
  label?: string
  className?: string
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  switch (status) {
    case 'pending':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pending-soft text-warning',
            className
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{label || 'Unverified'}</span>
        </span>
      )
    case 'calling':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning animate-pulse',
            className
          )}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{label || 'Waiter Called'}</span>
        </span>
      )
    case 'order_placed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-danger-soft text-danger',
            className
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{label || 'Order Placed'}</span>
        </span>
      )
    case 'preparing':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning',
            className
          )}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{label || 'Preparing'}</span>
        </span>
      )
    case 'ready':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-success-soft text-success',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{label || 'Ready'}</span>
        </span>
      )
    case 'served':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-success-soft text-success',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{label || 'Served'}</span>
        </span>
      )
    case 'bill_requested':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-info-soft text-info',
            className
          )}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{label || 'Bill Requested'}</span>
        </span>
      )
    case 'cancelled':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-ink-3',
            className
          )}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{label || 'Cancelled'}</span>
        </span>
      )
    case 'closed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-ink-2',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{label || 'Closed'}</span>
        </span>
      )
    default:
      return null
  }
}
