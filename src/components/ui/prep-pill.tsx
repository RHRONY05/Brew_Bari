import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/money'

export interface PrepPillProps {
  prepMinutes?: number | null
  locale?: Locale
  className?: string
}

export function formatPrepTime(minutes: number, locale: Locale = 'en'): string {
  if (minutes <= 1) {
    return locale === 'bn' ? 'এখনই রেডি' : 'Ready now'
  }
  const digits = locale === 'bn'
    ? new Intl.NumberFormat('bn-BD').format(minutes)
    : minutes.toString()
  return locale === 'bn' ? `~${digits} মিনিট` : `~${digits} min`
}

export function PrepPill({ prepMinutes, locale = 'en', className }: PrepPillProps) {
  if (prepMinutes == null || prepMinutes <= 0) return null

  const isReadyNow = prepMinutes <= 1
  const label = formatPrepTime(prepMinutes, locale)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold tracking-tight h-[22px]',
        isReadyNow
          ? 'bg-success-soft text-success'
          : 'bg-bg text-ink-2 border border-line',
        className
      )}
    >
      <Clock className="w-3 h-3 stroke-[2.2] shrink-0" />
      <span>{label}</span>
    </div>
  )
}
