import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink hover:bg-accent-strong shadow-sm active:bg-accent-strong',
        secondary:
          'bg-surface border border-line text-ink hover:bg-surface-2 active:bg-surface-2',
        brand:
          'bg-brand text-brand-ink hover:opacity-95 shadow-sm active:opacity-90',
        outline:
          'border border-line bg-transparent hover:bg-surface-2 text-ink',
        ghost:
          'hover:bg-surface-2 text-ink',
        danger:
          'bg-danger text-white hover:opacity-90',
      },
      size: {
        default: 'h-11 px-5 py-2 min-h-[44px]',
        bar: 'h-[52px] px-6 text-base min-h-[52px]',
        sm: 'h-9 px-3 text-xs min-h-[36px]',
        icon: 'h-11 w-11 p-0 rounded-full min-h-[44px] min-w-[44px]',
        iconSm: 'h-9 w-9 p-0 rounded-full min-h-[36px] min-w-[36px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
