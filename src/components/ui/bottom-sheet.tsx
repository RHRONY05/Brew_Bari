'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/utils'

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  trigger?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerPrimitive.Trigger asChild>{trigger}</DrawerPrimitive.Trigger>}
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity" />
        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-[28px] bg-surface outline-none shadow-2xl',
            'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-[520px] md:max-h-[85vh] md:rounded-[28px]',
            className
          )}
        >
          {/* Grab handle for touch drag (hidden on desktop) */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line shrink-0 md:hidden" />

          {title && (
            <div className="px-6 pt-4 pb-2 border-b border-line shrink-0">
              <DrawerPrimitive.Title className="text-lg font-bold text-ink">
                {title}
              </DrawerPrimitive.Title>
              {description && (
                <DrawerPrimitive.Description className="text-xs text-ink-2 mt-0.5">
                  {description}
                </DrawerPrimitive.Description>
              )}
            </div>
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
            {children}
          </div>

          {/* Sticky footer */}
          {footer && (
            <div className="border-t border-line bg-surface/90 backdrop-blur-sm p-4 shrink-0 rounded-b-[28px]">
              {footer}
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}
