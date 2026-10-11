import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  emoji?: string | React.ReactNode
}

export function Chip({
  className,
  active = false,
  emoji,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold transition-all whitespace-nowrap active:scale-95',
        active
          ? 'bg-brand text-brand-ink shadow-sm'
          : 'bg-surface text-ink border border-line hover:bg-surface-2',
        className
      )}
      {...props}
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      <span>{children}</span>
    </button>
  )
}
