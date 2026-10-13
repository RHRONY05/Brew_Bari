'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Minus, Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { MenuItem } from '@/lib/menu/data';
import type { OptionGroup } from '@/lib/schemas';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';
import {
  calculateItemPrice,
  validateOptionRequirements,
  formatSelectedChoicesForCart,
  type SelectedOptions,
} from '@/lib/menu/options';
import { formatTaka } from '@/lib/money';
import { pick } from '@/lib/i18n';
import { VenueIcon } from '@/themes/ThemeContext';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  locale: 'en' | 'bn';
  packageTier?: number;
  onClose: () => void;
  onAddToCart?: (line: {
    item: MenuItem;
    quantity: number;
    choices: string[];
    note?: string;
  }) => void;
}

function getInitialSelected(optionGroups: OptionGroup[]): SelectedOptions {
  const initial: SelectedOptions = {};
  for (const group of optionGroups) {
    if (group.required && group.type === 'single' && group.choices.length > 0) {
      initial[group.id] = group.choices[0].id;
    } else if (group.type === 'multi') {
      initial[group.id] = [];
    }
  }
  return initial;
}

interface ItemDetailContentProps {
  item: MenuItem;
  locale: 'en' | 'bn';
  packageTier: number;
  onClose: () => void;
  onAddToCart?: (line: {
    item: MenuItem;
    quantity: number;
    choices: string[];
    note?: string;
  }) => void;
}

function ItemDetailContent({
  item,
  locale,
  packageTier,
  onClose,
  onAddToCart,
}: ItemDetailContentProps) {
  // Parse option groups safely from item JSON
  const parsedGroups = ItemOptionsSchema.safeParse(item.options);
  const optionGroups: OptionGroup[] = parsedGroups.success ? parsedGroups.data : [];

  const [selected, setSelected] = useState<SelectedOptions>(() => getInitialSelected(optionGroups));
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const name = pick(item, 'name', locale);
  const desc = pick(item, 'description', locale) || '';
  const isSoldOut = !item.is_available;
  const canAdd = !isSoldOut && packageTier > 1;

  const { totalPrice } = calculateItemPrice(item.price, optionGroups, selected, quantity);
  const { isValid, missingGroupIds } = validateOptionRequirements(optionGroups, selected);

  const toggleSingleChoice = (groupId: string, choiceId: string) => {
    setSelected((prev) => ({
      ...prev,
      [groupId]: choiceId,
    }));
  };

  const toggleMultiChoice = (groupId: string, choiceId: string) => {
    setSelected((prev) => {
      const current = (prev[groupId] as string[]) || [];
      const updated = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return {
        ...prev,
        [groupId]: updated,
      };
    });
  };

  const handleAdd = () => {
    if (!isValid || !canAdd || !onAddToCart) return;
    const choices = formatSelectedChoicesForCart(optionGroups, selected);
    onAddToCart({
      item,
      quantity,
      choices,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 pb-6" data-testid="item-detail-sheet">
      {/* Item Hero / Image */}
      <div className="relative h-[180px] rounded-2xl bg-surface-2 flex items-center justify-center overflow-hidden text-brand-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 420px"
          />
        ) : (
          <VenueIcon className="w-20 h-20 stroke-[1.2]" />
        )}

        {/* Close button top right */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full bg-white/90 text-ink shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Title, Base Price, Description */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-baseline gap-2">
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">{name}</h2>
          <span className="text-lg font-extrabold text-ink tabular-nums">
            {formatTaka(item.price, locale)}
          </span>
        </div>
        {desc && <p className="text-[13.5px] leading-relaxed text-ink-2">{desc}</p>}
      </div>

      {/* Option Groups */}
      {optionGroups.map((group) => {
        const groupName = pick(group, 'name', locale);
        const isMissing = missingGroupIds.includes(group.id);

        return (
          <div key={group.id} className="flex flex-col gap-2 pt-2 border-t border-line/50">
            <div className="flex justify-between items-baseline">
              <span className="text-[14.5px] font-bold text-ink">{groupName}</span>
              {group.required ? (
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    isMissing ? 'bg-danger text-white' : 'bg-surface-2 text-brand-muted'
                  }`}
                >
                  {locale === 'bn' ? 'আবশ্যক' : 'Required'}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-ink-3">
                  {group.type === 'single'
                    ? locale === 'bn'
                      ? 'ঐচ্ছিক · ১টি বাছুন'
                      : 'Optional · pick 1'
                    : locale === 'bn'
                      ? 'ঐচ্ছিক · যেকোনো'
                      : 'Optional · any'}
                </span>
              )}
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-2">
              {group.choices.map((choice) => {
                const choiceName = pick(choice, 'name', locale);
                const isSelected =
                  group.type === 'single'
                    ? selected[group.id] === choice.id
                    : ((selected[group.id] as string[]) || []).includes(choice.id);

                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      group.type === 'single'
                        ? toggleSingleChoice(group.id, choice.id)
                        : toggleMultiChoice(group.id, choice.id)
                    }
                    className={`h-10 px-3.5 rounded-full text-[13.5px] font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-brand text-bg shadow-sm'
                        : 'bg-white border border-line text-ink hover:border-brand/40'
                    }`}
                  >
                    <span>{choiceName}</span>
                    {choice.price_delta > 0 && (
                      <span className={`text-[12px] font-extrabold opacity-80 ${isSelected ? 'text-accent' : 'text-ink-2'}`}>
                        +{formatTaka(choice.price_delta, locale)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Special instructions note */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-line/50">
        <label htmlFor="special-note" className="text-[13px] font-bold text-ink-2">
          {locale === 'bn' ? 'বিশেষ অনুরোধ (ঐচ্ছিক)' : 'Special instructions (optional)'}
        </label>
        <textarea
          id="special-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            locale === 'bn' ? 'যেমন: কম চিনি, বেশি গরম…' : 'e.g. less sweet, extra hot…'
          }
          className="w-full p-2.5 rounded-xl border border-line bg-white text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />
      </div>

      {/* Bottom Bar: Stepper + Add Button */}
      {canAdd && (
        <div className="pt-3 border-t border-line flex items-center gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-1 bg-bg rounded-full p-1 border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-surface-2 text-ink flex items-center justify-center disabled:opacity-40"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-7 text-center font-extrabold text-[15px] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= 20}
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-9 h-9 rounded-full bg-surface-2 text-ink flex items-center justify-center disabled:opacity-40"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Add Button */}
          <button
            type="button"
            data-testid="item-sheet-add-button"
            disabled={!isValid}
            onClick={handleAdd}
            className="flex-1 h-12 rounded-full bg-accent text-ink text-[15px] font-extrabold flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-[0_4px_12px_rgb(var(--accent-rgb)/0.3)]"
          >
            <span>{locale === 'bn' ? 'যোগ করুন' : 'Add'}</span>
            <span>·</span>
            <span className="tabular-nums">{formatTaka(totalPrice, locale)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ItemDetailSheet({
  item,
  isOpen,
  locale,
  packageTier = 3,
  onClose,
  onAddToCart,
}: ItemDetailSheetProps) {
  if (!item) return null;

  const name = pick(item, 'name', locale);

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={name}>
      <ItemDetailContent
        key={item.id}
        item={item}
        locale={locale}
        packageTier={packageTier}
        onClose={onClose}
        onAddToCart={onAddToCart}
      />
    </BottomSheet>
  );
}
