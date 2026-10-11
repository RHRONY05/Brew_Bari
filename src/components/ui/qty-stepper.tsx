import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QtyStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
  disabled?: boolean
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  className,
  disabled = false,
}: QtyStepperProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value < max) {
      onChange(value + 1)
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-between h-10 rounded-full bg-surface border border-line px-1 min-w-[108px] select-none',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min || disabled}
        aria-label="Decrease quantity"
        className="flex items-center justify-center w-8 h-8 rounded-full text-ink hover:bg-surface-2 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <span className="font-bold text-sm text-ink px-2 tabular-nums">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max || disabled}
        aria-label="Increase quantity"
        className="flex items-center justify-center w-8 h-8 rounded-full text-ink hover:bg-surface-2 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  )
}
