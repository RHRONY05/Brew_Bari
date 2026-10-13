'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Bell, Flame } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { CartItem } from '@/lib/cart/store';
import {
  getCartTotals,
  calculateMealSavings,
  isMealLine,
  filterCartUpsell,
} from '@/lib/cart/store';
import { formatTaka } from '@/lib/money';
import { pick } from '@/lib/i18n';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';
import { VenueIcon, useTheme } from '@/themes/ThemeContext';
import type { MenuItem } from '@/lib/menu/data';

interface CartSheetProps {
  items: CartItem[];
  isOpen: boolean;
  locale: 'en' | 'bn';
  tableNumber?: number | null;
  packageTier?: number;
  kitchenNote: string;
  soldOutItemIds?: string[];
  isPlacingOrder?: boolean;
  menuItems?: MenuItem[];
  onAddUpsellItem?: (item: MenuItem) => void;
  onKitchenNoteChange: (note: string) => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onPlaceOrder?: () => void;
  onCallWaiter?: () => void;
  onClose: () => void;
}

export function CartSheet({
  items,
  isOpen,
  locale,
  tableNumber,
  packageTier = 3,
  kitchenNote,
  soldOutItemIds = [],
  isPlacingOrder = false,
  menuItems = [],
  onAddUpsellItem,
  onKitchenNoteChange,
  onUpdateQuantity,
  onPlaceOrder,
  onCallWaiter,
  onClose,
}: CartSheetProps) {
  const theme = useTheme();
  const isBold = theme.layout.itemCard === 'bold';
  const { count, subtotal } = getCartTotals(items);
  const mealSavings = calculateMealSavings(items);
  const hasSoldOut = items.some((line) => soldOutItemIds.includes(line.item.id));
  const upsellItems = theme.layout.cartUpsell ? filterCartUpsell(menuItems, items) : [];

  const formatChoicesSummary = (item: CartItem): string => {
    if (!item.choices || item.choices.length === 0) return '';
    const parsedGroups = ItemOptionsSchema.safeParse(item.item.options);
    if (!parsedGroups.success) return '';

    const labels: string[] = [];
    for (const choiceStr of item.choices) {
      const [groupId, choiceId] = choiceStr.split(':');
      const group = parsedGroups.data.find((g) => g.id === groupId);
      const choice = group?.choices.find((c) => c.id === choiceId);
      if (choice) {
        labels.push(pick(choice, 'name', locale));
      }
    }
    return labels.join(' · ');
  };

  const title = locale === 'bn' ? 'আপনার অর্ডার' : 'Your order';
  const subtitle = tableNumber
    ? locale === 'bn'
      ? `টেবিল ${tableNumber} · ${count}টি আইটেম`
      : `Table ${tableNumber} · ${count} ${count === 1 ? 'item' : 'items'}`
    : locale === 'bn'
      ? `${count}টি আইটেম`
      : `${count} ${count === 1 ? 'item' : 'items'}`;

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={title}>
      <div className="flex flex-col gap-4 pb-6" data-testid="cart-sheet">
        {/* Header subtitle */}
        <div className="flex justify-between items-center -mt-2">
          <div className="text-[13px] font-semibold text-ink-2">{subtitle}</div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-brand-muted">
              <VenueIcon className="w-8 h-8 stroke-[1.4]" />
            </div>
            <div className="font-bold text-[16px] text-ink">
              {locale === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
            </div>
            <div className="text-[13px] text-ink-3">
              {locale === 'bn'
                ? 'মেন্যু থেকে পছন্দের আইটেম যোগ করুন'
                : 'Add delicious drinks and bites from the menu'}
            </div>
          </div>
        ) : (
          /* Cart lines list */
          <div className="flex flex-col divide-y divide-line-soft max-h-[46vh] overflow-y-auto no-scrollbar pr-1">
            {items.map((line) => {
              const itemName = pick(line.item, 'name', locale);
              const choicesText = formatChoicesSummary(line);

              return (
                <div key={line.id} className="py-3.5 flex gap-3 items-center">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center overflow-hidden shrink-0 text-brand-muted">
                    {line.item.image_url ? (
                      <Image
                        src={line.item.image_url}
                        alt={itemName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <VenueIcon className="w-8 h-8 stroke-[1.4]" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-[15px] text-ink truncate">
                          {itemName}
                        </span>
                        {isMealLine(line) && (
                          <span
                            data-testid={`meal-badge-${line.item.id}`}
                            className="px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[10px] font-extrabold uppercase tracking-wide shrink-0"
                          >
                            {locale === 'bn' ? 'মিল' : 'Meal'}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-[15px] text-ink tabular-nums">
                        {formatTaka(line.lineTotal, locale)}
                      </span>
                    </div>

                    {soldOutItemIds.includes(line.item.id) && (
                      <span
                        data-testid={`sold-out-badge-${line.item.id}`}
                        className="inline-block px-2 py-0.5 rounded-md bg-danger-soft text-danger text-[11px] font-extrabold w-fit my-0.5"
                      >
                        {locale === 'bn' ? 'শেষ হয়ে গেছে' : 'Sold out'}
                      </span>
                    )}

                    {choicesText && (
                      <span className="text-[12.5px] leading-snug text-ink-2 line-clamp-1">
                        {choicesText}
                      </span>
                    )}

                    {line.note && (
                      <span className="text-[11.5px] italic text-ink-3 line-clamp-1">
                        &quot;{line.note}&quot;
                      </span>
                    )}

                    {/* Stepper + Unit Price */}
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[12px] font-medium text-ink-3">
                        {formatTaka(line.unitPrice, locale)}{' '}
                        {locale === 'bn' ? 'প্রতিটি' : 'each'}
                      </span>

                      <div className="flex items-center gap-1 bg-bg rounded-full p-0.5 border border-line">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${itemName}`}
                          onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="w-6 text-center font-extrabold text-[13.5px] tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${itemName}`}
                          onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Goes well with slider */}
            {theme.layout.cartUpsell && upsellItems.length > 0 && (
              <section aria-labelledby="upsell-h" className="pt-2">
                <h3 id="upsell-h" className="font-bold text-[15px] text-ink pb-2.5">
                  {locale === 'bn' ? 'সাথে দারুণ মানাবে' : 'Goes well with'}
                </h3>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                  {upsellItems.map((u) => {
                    const uName = pick(u, 'name', locale);
                    return (
                      <div
                        key={u.id}
                        data-testid={`cart-upsell-item-${u.id}`}
                        className="shrink-0 w-[200px] bg-white border border-line rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xs"
                      >
                        <div className="relative w-[46px] h-[46px] rounded-xl bg-surface-2 shrink-0 flex items-center justify-center overflow-hidden text-brand-muted">
                          {u.image_url ? (
                            <Image
                              src={u.image_url}
                              alt={uName}
                              fill
                              className="object-cover"
                              sizes="46px"
                            />
                          ) : (
                            <VenueIcon className="w-5 h-5 stroke-[1.5]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col leading-tight">
                          <span className="font-semibold text-[13px] text-ink truncate">
                            {uName}
                          </span>
                          <span className="font-bold text-[13px] text-ink-2">
                            {formatTaka(u.price, locale)}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Add ${uName}`}
                          data-testid={`add-upsell-${u.id}`}
                          onClick={() => onAddUpsellItem?.(u)}
                          className="w-9 h-9 rounded-full bg-brand text-brand-ink flex items-center justify-center shrink-0 hover:bg-brand-muted active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.8]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Kitchen note input */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-line/50">
              <label htmlFor="kitchen-note" className="text-[13px] font-bold text-ink">
                {locale === 'bn' ? 'কিচেনের জন্য বিশেষ নোট' : 'Note for the kitchen'}
              </label>
              <input
                id="kitchen-note"
                type="text"
                maxLength={200}
                value={kitchenNote}
                onChange={(e) => onKitchenNoteChange(e.target.value)}
                placeholder={
                  locale === 'bn'
                    ? 'যেমন: সব একসাথে দিন'
                    : 'e.g. bring everything together'
                }
                className="w-full h-11 px-3.5 rounded-xl border border-line bg-bg text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Subtotal & tax notice */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-line flex flex-col gap-2">
              <div className="flex justify-between items-baseline text-[14px] text-ink-2">
                <span>
                  {locale === 'bn'
                    ? `সাবটোটাল · ${count}টি আইটেম`
                    : `Subtotal · ${count} ${count === 1 ? 'item' : 'items'}`}
                </span>
                <span className="font-semibold text-ink text-[15px] tabular-nums">
                  {formatTaka(subtotal, locale)}
                </span>
              </div>

              {mealSavings > 0 && (
                <div
                  data-testid="meal-savings-row"
                  className="flex justify-between items-baseline text-[14px] text-success font-semibold"
                >
                  <span>{locale === 'bn' ? 'মিলে আপনার সঞ্চয়' : 'You save with meals'}</span>
                  <span className="tabular-nums">- {formatTaka(mealSavings, locale)}</span>
                </div>
              )}

              <div className="text-[12px] text-ink-3">
                {isBold
                  ? locale === 'bn'
                    ? 'ভ্যাট ৫% বিলে যোগ করা হবে। কাউন্টারে পরিশোধ করুন।'
                    : 'VAT 5% is added on the bill. Pay at the counter.'
                  : locale === 'bn'
                    ? 'ভ্যাট বিলে যোগ করা হবে। দাম রেস্টুরেন্ট নিশ্চিত করবে।'
                    : 'VAT is added on the bill. Prices are confirmed by the restaurant.'}
              </div>
            </div>

            {/* Sold out alert */}
            {hasSoldOut && (
              <div
                data-testid="sold-out-alert"
                className="p-3 rounded-2xl bg-danger-soft border border-danger-soft text-[13px] font-semibold text-danger"
              >
                {locale === 'bn'
                  ? 'কিছু আইটেম শেষ হয়ে গেছে। অর্ডার দিতে সেগুলো কার্ট থেকে বাদ দিন।'
                  : 'Some items just sold out. Please remove them to proceed.'}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line-soft">
              {/* Place Order CTA */}
              {onPlaceOrder && (
                <button
                  type="button"
                  data-testid="place-order-button"
                  disabled={hasSoldOut || isPlacingOrder}
                  onClick={onPlaceOrder}
                  className={
                    isBold
                      ? 'w-full h-14 rounded-2xl bg-brand text-brand-ink font-bold text-[16px] flex items-center justify-between px-5 shadow-[0_10px_24px_rgba(var(--brand-rgb,210_41_28)/0.32)] hover:bg-brand-muted active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                      : 'w-full h-13 rounded-full bg-accent text-ink font-extrabold text-[16px] flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-[0_4px_14px_rgb(var(--accent-rgb)/0.35)] disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                >
                  {isBold ? (
                    <>
                      <span className="inline-flex items-center gap-2.5">
                        <Flame className="w-5 h-5 stroke-[2.2]" />
                        <span>
                          {isPlacingOrder
                            ? locale === 'bn'
                              ? 'অর্ডার দেওয়া হচ্ছে…'
                              : 'Placing order…'
                            : packageTier === 2
                              ? locale === 'bn'
                                ? 'ওয়েটার ডেকে অর্ডার দিন'
                                : 'Call waiter with order'
                              : theme.copy.placeOrder
                                ? theme.copy.placeOrder[locale]
                                : locale === 'bn'
                                  ? 'কিচেনে পাঠান'
                                  : 'Send to kitchen'}
                        </span>
                      </span>
                      {!isPlacingOrder && (
                        <span className="tabular-nums font-extrabold">{formatTaka(subtotal, locale)}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>
                        {isPlacingOrder
                          ? locale === 'bn'
                            ? 'অর্ডার দেওয়া হচ্ছে…'
                            : 'Placing order…'
                          : packageTier === 2
                            ? locale === 'bn'
                              ? 'ওয়েটার ডেকে অর্ডার দিন'
                              : 'Call waiter with order'
                            : locale === 'bn'
                              ? 'অর্ডার দিন'
                              : 'Place order'}
                      </span>
                      {!isPlacingOrder && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{formatTaka(subtotal, locale)}</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              )}

              {/* Call waiter instead CTA */}
              {onCallWaiter && (
                <button
                  type="button"
                  data-testid="call-waiter-secondary-button"
                  onClick={onCallWaiter}
                  className="w-full h-11 rounded-full border border-line bg-white text-brand font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-bg active:scale-98 transition-all"
                >
                  <Bell className="w-4 h-4 stroke-[2]" />
                  <span>
                    {locale === 'bn' ? 'বরং ওয়েটার ডাকুন' : 'Call waiter instead'}
                  </span>
                </button>
              )}

              {/* Table selection fallback if on public menu without a table */}
              {!onPlaceOrder && (
                <div className="p-3.5 rounded-2xl bg-bg border border-line text-center flex flex-col items-center gap-2 my-1">
                  <div className="text-[14px] font-extrabold text-ink">
                    {locale === 'bn' ? 'অর্ডার দিতে প্রস্তুত?' : 'Ready to place this order?'}
                  </div>
                  <p className="text-[12px] text-ink-2 leading-snug">
                    {locale === 'bn'
                      ? 'অর্ডার পাঠাতে আপনার টেবিলে রাখা কিউআর কোডটি স্ক্যান করুন।'
                      : 'You are viewing the digital menu. To send your order, scan the QR code on your table.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
