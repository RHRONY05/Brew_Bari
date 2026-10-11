'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Bell, Coffee } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { CartItem } from '@/lib/cart/store';
import { getCartTotals } from '@/lib/cart/store';
import { formatTaka } from '@/lib/money';
import { pick } from '@/lib/i18n';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';


interface CartSheetProps {
  items: CartItem[];
  isOpen: boolean;
  locale: 'en' | 'bn';
  tableNumber?: number | null;
  packageTier?: number;
  kitchenNote: string;
  soldOutItemIds?: string[];
  isPlacingOrder?: boolean;
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
  onKitchenNoteChange,
  onUpdateQuantity,
  onPlaceOrder,
  onCallWaiter,
  onClose,
}: CartSheetProps) {
  const { count, subtotal } = getCartTotals(items);
  const hasSoldOut = items.some((line) => soldOutItemIds.includes(line.item.id));

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
          <div className="text-[13px] font-semibold text-[#6F5A4B]">{subtitle}</div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-16 h-16 rounded-full bg-[#FBEBD7] flex items-center justify-center text-[#B98A5E]">
              <Coffee className="w-8 h-8 stroke-[1.4]" />
            </div>
            <div className="font-bold text-[16px] text-[#24170F]">
              {locale === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
            </div>
            <div className="text-[13px] text-[#8C7767]">
              {locale === 'bn'
                ? 'মেন্যু থেকে পছন্দের আইটেম যোগ করুন'
                : 'Add delicious drinks and bites from the menu'}
            </div>
          </div>
        ) : (
          /* Cart lines list */
          <div className="flex flex-col divide-y divide-[#F6E9DA] max-h-[46vh] overflow-y-auto no-scrollbar pr-1">
            {items.map((line) => {
              const itemName = pick(line.item, 'name', locale);
              const choicesText = formatChoicesSummary(line);

              return (
                <div key={line.id} className="py-3.5 flex gap-3 items-center">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-2xl bg-[#FBEBD7] flex items-center justify-center overflow-hidden shrink-0 text-[#B98A5E]">
                    {line.item.image_url ? (
                      <Image
                        src={line.item.image_url}
                        alt={itemName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Coffee className="w-8 h-8 stroke-[1.4]" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-[15px] text-[#24170F] truncate">
                        {itemName}
                      </span>
                      <span className="font-extrabold text-[15px] text-[#24170F] tabular-nums">
                        {formatTaka(line.lineTotal, locale)}
                      </span>
                    </div>

                    {soldOutItemIds.includes(line.item.id) && (
                      <span
                        data-testid={`sold-out-badge-${line.item.id}`}
                        className="inline-block px-2 py-0.5 rounded-md bg-[#FCE8E6] text-[#C5221F] text-[11px] font-extrabold w-fit my-0.5"
                      >
                        {locale === 'bn' ? 'শেষ হয়ে গেছে' : 'Sold out'}
                      </span>
                    )}

                    {choicesText && (
                      <span className="text-[12.5px] leading-snug text-[#6F5A4B] line-clamp-1">
                        {choicesText}
                      </span>
                    )}

                    {line.note && (
                      <span className="text-[11.5px] italic text-[#8C7767] line-clamp-1">
                        &quot;{line.note}&quot;
                      </span>
                    )}

                    {/* Stepper + Unit Price */}
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[12px] font-medium text-[#8C7767]">
                        {formatTaka(line.unitPrice, locale)}{' '}
                        {locale === 'bn' ? 'প্রতিটি' : 'each'}
                      </span>

                      <div className="flex items-center gap-1 bg-[#FFF7EE] rounded-full p-0.5 border border-[#F0DFCB]">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${itemName}`}
                          onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-white text-[#24170F] flex items-center justify-center shadow-xs"
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
                          className="w-8 h-8 rounded-full bg-white text-[#24170F] flex items-center justify-center shadow-xs"
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
            {/* Kitchen note input */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#F0DFCB]/50">
              <label htmlFor="kitchen-note" className="text-[13px] font-bold text-[#24170F]">
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
                    ? 'যেমন: কফির সাথে ব্রাউনি একসাথে দিন'
                    : 'e.g. bring the brownie with the coffee'
                }
                className="w-full h-11 px-3.5 rounded-xl border border-[#F0DFCB] bg-[#FFF7EE] text-[13.5px] text-[#24170F] placeholder:text-[#8C7767] focus:outline-none focus:ring-1 focus:ring-[#6B4226]"
              />
            </div>

            {/* Subtotal & tax notice */}
            <div className="pt-2">
              <div className="flex justify-between items-baseline text-[15.5px]">
                <span className="font-semibold text-[#6F5A4B]">
                  {locale === 'bn' ? 'সাবটোটাল' : 'Subtotal'}
                </span>
                <span className="font-extrabold text-[#24170F] text-lg tabular-nums">
                  {formatTaka(subtotal, locale)}
                </span>
              </div>
              <div className="text-[12px] text-[#8C7767] mt-0.5">
                {locale === 'bn'
                  ? 'ভ্যাট বিলে যোগ করা হবে। ক্যাফে কর্তৃক দাম নিশ্চিত।'
                  : 'VAT is added on the bill. Prices are confirmed by the café.'}
              </div>
            </div>

            {/* Sold out alert */}
            {hasSoldOut && (
              <div
                data-testid="sold-out-alert"
                className="p-3 rounded-2xl bg-[#FFF0EE] border border-[#FCD2CD] text-[13px] font-semibold text-[#CE2C31]"
              >
                {locale === 'bn'
                  ? 'কিছু আইটেম শেষ হয়ে গেছে। অর্ডার দিতে সেগুলো কার্ট থেকে বাদ দিন।'
                  : 'Some items just sold out. Please remove them to proceed.'}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F6E9DA]">
              {/* Place Order CTA */}
              {onPlaceOrder && (
                <button
                  type="button"
                  data-testid="place-order-button"
                  disabled={hasSoldOut || isPlacingOrder}
                  onClick={onPlaceOrder}
                  className="w-full h-13 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[16px] flex items-center justify-center gap-2 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_14px_rgba(227,166,81,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                </button>
              )}

              {/* Call waiter instead CTA */}
              {onCallWaiter && (
                <button
                  type="button"
                  data-testid="call-waiter-secondary-button"
                  onClick={onCallWaiter}
                  className="w-full h-11 rounded-full border border-[#F0DFCB] bg-white text-[#6B4226] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#FFF7EE] active:scale-98 transition-all"
                >
                  <Bell className="w-4 h-4 stroke-[2]" />
                  <span>
                    {locale === 'bn' ? 'বরং ওয়েটার ডাকুন' : 'Call waiter instead'}
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
