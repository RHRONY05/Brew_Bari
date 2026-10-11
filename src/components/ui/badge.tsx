import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider h-[22px]',
  {
    variants: {
      variant: {
        bestseller: 'bg-accent text-accent-ink',
        new: 'bg-success text-white',
        seasonal: 'bg-brand text-brand-ink',
        soldout: 'bg-danger text-white',
        surface2: 'bg-surface-2 text-ink-2',
        outline: 'border border-line text-ink-2',
        warning: 'bg-warning text-white',
        info: 'bg-info-soft text-[#22508F]',
      },
    },
    defaultVariants: {
      variant: 'bestseller',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
