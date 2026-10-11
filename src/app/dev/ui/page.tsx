'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Chip } from '@/components/ui/chip'
import { QtyStepper } from '@/components/ui/qty-stepper'
import { StatusPill } from '@/components/ui/status-pill'
import { PrepPill } from '@/components/ui/prep-pill'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ItemCardSkeleton } from '@/components/menu/ItemCardSkeleton'
import { formatTaka } from '@/lib/money'
import { features } from '@/lib/features'
import { useT, I18nProvider } from '@/lib/i18n'
import { Bell } from 'lucide-react'

function DevUiContent() {
  const [qty, setQty] = useState(2)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeChip, setActiveChip] = useState('hot')
  const { locale, setLocale, t } = useT()

  return (
    <div className="min-h-screen bg-bg text-ink p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-brand">Dev Preview</span>
        <h1 className="text-2xl font-extrabold">Design System Foundation (T0.3)</h1>
        <p className="text-sm text-ink-2">Brew Bari tokens, typography, and UI primitives</p>
      </div>

      {/* Language Switcher */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">Locale & Money</h2>
        <div className="flex gap-2 items-center">
          <Button
            variant={locale === 'en' ? 'brand' : 'secondary'}
            size="sm"
            onClick={() => setLocale('en')}
          >
            English
          </Button>
          <Button
            variant={locale === 'bn' ? 'brand' : 'secondary'}
            size="sm"
            onClick={() => setLocale('bn')}
          >
            বাংলা
          </Button>
        </div>
        <div className="text-sm space-y-1">
          <div>Sample Price (EN): <span className="font-bold">{formatTaka(250, 'en')}</span>, Thousand: <span className="font-bold">{formatTaka(1250, 'en')}</span></div>
          <div>Sample Price (BN): <span className="font-bold font-bengali">{formatTaka(250, 'bn')}</span>, Thousand: <span className="font-bold font-bengali">{formatTaka(1250, 'bn')}</span></div>
          <div>Dictionary test: <span className="font-bold">{t.common.appName}</span> — {t.menu.searchPlaceholder}</div>
        </div>
      </section>

      {/* Buttons */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary Accent</Button>
          <Button variant="brand">
            <Bell className="w-4 h-4" />
            Call Waiter (Brand)
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="bar">52px Bar Button</Button>
        </div>
      </section>

      {/* Chips */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">Category Chips (40px)</h2>
        <div className="flex flex-wrap gap-2">
          <Chip
            emoji="⚡"
            active={activeChip === 'quick'}
            onClick={() => setActiveChip('quick')}
          >
            Quick
          </Chip>
          <Chip
            emoji="☕"
            active={activeChip === 'hot'}
            onClick={() => setActiveChip('hot')}
          >
            Hot Coffee
          </Chip>
          <Chip
            emoji="🧊"
            active={activeChip === 'cold'}
            onClick={() => setActiveChip('cold')}
          >
            Iced Coffee
          </Chip>
          <Chip
            emoji="🍰"
            active={activeChip === 'dessert'}
            onClick={() => setActiveChip('dessert')}
          >
            Desserts
          </Chip>
        </div>
      </section>

      {/* Badges & Prep Pills */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">Badges & Prep Pills (22px)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="bestseller">BESTSELLER</Badge>
          <Badge variant="new">NEW</Badge>
          <Badge variant="seasonal">SEASONAL</Badge>
          <Badge variant="soldout">SOLD OUT</Badge>
          <PrepPill prepMinutes={1} locale={locale} />
          <PrepPill prepMinutes={4} locale={locale} />
          <PrepPill prepMinutes={10} locale={locale} />
        </div>
      </section>

      {/* Status Pills */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">Status Pills</h2>
        <div className="flex flex-wrap gap-2">
          <StatusPill status="pending" />
          <StatusPill status="calling" />
          <StatusPill status="order_placed" />
          <StatusPill status="preparing" />
          <StatusPill status="ready" />
          <StatusPill status="served" />
          <StatusPill status="bill_requested" />
          <StatusPill status="closed" />
        </div>
      </section>

      {/* QtyStepper & Drawer */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">QtyStepper & BottomSheet</h2>
        <div className="flex items-center gap-4">
          <QtyStepper value={qty} onChange={setQty} />
          <Button onClick={() => setSheetOpen(true)}>Open Bottom Sheet</Button>
        </div>

        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Sample Bottom Sheet"
          description="Vaul drawer on mobile, centered modal dialog on desktop"
          footer={
            <Button
              variant="primary"
              size="bar"
              className="w-full"
              onClick={() => setSheetOpen(false)}
            >
              Confirm ({qty} items)
            </Button>
          }
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-ink-2">
              This drawer complies with the design system: 28px rounded corners, grab handle, and responsive behavior.
            </p>
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl">
              <span className="font-medium text-sm">Quantity:</span>
              <QtyStepper value={qty} onChange={setQty} />
            </div>
          </div>
        </BottomSheet>
      </section>

      {/* ItemCard Skeleton */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-3">
        <h2 className="text-base font-bold">ItemCard Skeleton</h2>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <ItemCardSkeleton />
          <ItemCardSkeleton />
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="p-4 bg-surface rounded-2xl border border-line space-y-2 text-xs">
        <h2 className="text-base font-bold">Feature Matrix</h2>
        <div>P1: {JSON.stringify(features(1))}</div>
        <div>P2: {JSON.stringify(features(2))}</div>
        <div>P3: {JSON.stringify(features(3))}</div>
      </section>
    </div>
  )
}

export default function DevUiPage() {
  return (
    <I18nProvider>
      <DevUiContent />
    </I18nProvider>
  )
}
