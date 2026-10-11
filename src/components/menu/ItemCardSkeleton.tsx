import * as React from 'react'

export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface rounded-[24px] p-2.5 shadow-[0_6px_20px_rgba(107,66,38,0.08)] border border-line/40 animate-pulse">
      {/* 1:1 Image placeholder */}
      <div className="w-full aspect-square bg-surface-2 rounded-[16px] mb-2.5" />

      {/* Title lines */}
      <div className="h-4 bg-surface-2 rounded-md w-3/4 mb-1.5" />
      <div className="h-3 bg-surface-2 rounded-md w-1/2 mb-2" />

      {/* Prep pill placeholder */}
      <div className="h-[22px] w-20 bg-surface-2 rounded-full mb-3" />

      {/* Bottom row: price and button */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="h-5 w-14 bg-surface-2 rounded-md" />
        <div className="w-9 h-9 rounded-full bg-surface-2" />
      </div>
    </div>
  )
}
