'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Minus, Plus, Clock, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { MenuItem } from '@/lib/menu/data';
import type { OptionGroup } from '@/lib/schemas';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';
import {
  calculateItemPrice,
  validateOptionRequirements,
  formatSelectedChoicesForCart,
  cleanSelections,
  activeGroups,
  type SelectedOptions,
} from '@/lib/menu/options';
import { formatTaka } from '@/lib/money';
import { formatPrepTime } from '@/lib/menu/sort';
import { pick } from '@/lib/i18n';
import { VenueIcon, useTheme } from '@/themes/ThemeContext';
import { SPICE_WORDS } from '@/components/menu/ItemCard';

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
    let isActive = true;
    if (group.show_if) {
      const parentSel = initial[group.show_if.group];
      isActive =
        parentSel === group.show_if.choice ||
        (Array.isArray(parentSel) && parentSel.includes(group.show_if.choice));
    }
    if (isActive) {
      if (group.required && group.type === 'single' && group.choices.length > 0) {
        initial[group.id] = group.choices[0].id;
      } else if (group.type === 'multi') {
        initial[group.id] = [];
      }
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
  const theme = useTheme();
  const isBold = theme.layout.itemCard === 'bold';

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
    setSelected((prev) => {
      const updated = {
        ...prev,
        [groupId]: choiceId,
      };
      return cleanSelections(optionGroups, updated);
    });
  };

  const toggleMultiChoice = (groupId: string, choiceId: string) => {
    setSelected((prev) => {
      const current = (prev[groupId] as string[]) || [];
      const updated = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return cleanSelections(optionGroups, {
        ...prev,
        [groupId]: updated,
      });
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

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const tagBadgeText = (() => {
    if (tags.includes('new')) return locale === 'bn' ? 'নতুন' : 'New';
    if (tags.includes('bestseller')) return locale === 'bn' ? 'জনপ্রিয়' : 'Bestseller';
    if (tags.includes('seasonal')) return locale === 'bn' ? 'মৌসুমি' : 'Seasonal';
    if (tags.includes('veg')) return locale === 'bn' ? 'ভেজ' : 'Veg';
    if (tags.length > 0) return tags[0].toUpperCase();
    return null;
  })();

  const activeGroupList = activeGroups(optionGroups, selected);
  const activeGroupIds = new Set(activeGroupList.map((g) => g.id));

  const isMeal = Boolean(
    (selected['meal'] && selected['meal'] === 'meal') ||
    Object.values(selected).some((val) => val === 'meal')
  );

  let addLabel = locale === 'bn' ? 'অর্ডারে যোগ করুন' : 'Add to cart';
  if (isMeal) {
    addLabel = locale === 'bn' ? 'মিল যোগ করুন' : 'Add meal';
  } else if (theme.key === 'brew-bari') {
    addLabel = locale === 'bn' ? 'যোগ করুন' : 'Add';
  }

  return (
    <div className="flex flex-col gap-4 pb-6" data-testid="item-detail-sheet">
      {/* Item Hero / Image */}
      <div
        className={`relative ${
          isBold ? 'h-[220px] rounded-[22px]' : 'h-[180px] rounded-2xl'
        } bg-surface-2 flex items-center justify-center overflow-hidden text-brand-muted`}
      >
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

        {/* Tag badge top left */}
        {tagBadgeText && (
          <span className="absolute top-3 left-3 bg-accent text-accent-ink text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
            {tagBadgeText}
          </span>
        )}

        {/* Close button top right */}
        <button
          type="button"
          aria-label={locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 text-ink shadow-[0_4px_12px_rgba(43,21,16,0.15)] flex items-center justify-center hover:bg-white active:scale-95 transition-all z-10"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Title, Base Price, Description, Prep & Spice Chips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline gap-2">
          <h2 className="font-display text-[24px] font-extrabold text-ink tracking-tight leading-tight">
            {name}
          </h2>
          <span className="text-[18px] font-extrabold text-ink tabular-nums ml-auto shrink-0">
            {formatTaka(item.price, locale)}
          </span>
        </div>
        {desc && <p className="text-[13.5px] leading-relaxed text-ink-2">{desc}</p>}

        {/* Prep & Spice chips row */}
        <div className="flex gap-2 flex-wrap items-center pt-1">
          {item.prep_minutes !== null && item.prep_minutes !== undefined && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-line text-ink text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-2xs">
              <Clock className="w-3.5 h-3.5 stroke-[2.2] text-brand-muted shrink-0" />
              <span>{formatPrepTime(item.prep_minutes, locale)}</span>
            </span>
          )}
          {item.spice_level !== null && item.spice_level !== undefined && item.spice_level > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-line text-brand text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-2xs">
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M17 3c-.6 1-.5 2 .2 2.7C14 6 11 9 9.5 13 8 16.8 5.5 19 3 20c4.5 1.3 10.3.2 13.9-4 2.6-3 3.5-6.5 2.6-9.2.9-.4 1.4-1.1 1.5-2-.9.4-1.9.3-2.6-.3C18 4 17.5 3.6 17 3z" />
              </svg>
              <span>
                {SPICE_WORDS[locale][item.spice_level] ||
                  (locale === 'bn' ? 'ঝাল' : 'Spicy')}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Option Groups */}
      {optionGroups.map((group) => {
        const isActive = activeGroupIds.has(group.id);
        if (!isActive) return null;

        const groupName = pick(group, 'name', locale);
        const isMissing = missingGroupIds.includes(group.id);

        const displayMode =
          group.display ||
          (group.type === 'multi' && theme.key !== 'brew-bari' ? 'multi-tiles' : 'pills');

        return (
          <fieldset
            key={group.id}
            className="border-0 m-0 p-0 flex flex-col gap-2 pt-2 border-t border-line/60 animate-group-reveal motion-reduce:animate-none"
          >
            <legend className="flex justify-between items-baseline w-full mb-1">
              <span className="text-[15px] font-bold text-ink">{groupName}</span>
              {group.required ? (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isMissing ? 'bg-danger text-white' : 'bg-surface-2 text-brand-dark'
                  }`}
                >
                  {locale === 'bn' ? 'আবশ্যক' : 'Required'}
                </span>
              ) : (
                <span className="text-[12px] font-medium text-ink-2">
                  {group.type === 'single'
                    ? locale === 'bn'
                      ? 'ঐচ্ছিক · ১টি বাছুন'
                      : 'Optional · pick 1'
                    : locale === 'bn'
                      ? 'যেকোনো'
                      : 'Pick any'}
                </span>
              )}
            </legend>

            {/* Cards display */}
            {displayMode === 'cards' && (
              <div className="grid grid-cols-2 gap-2.5">
                {group.choices.map((choice) => {
                  const choiceName = pick(choice, 'name', locale);
                  const choiceDesc = pick(choice, 'description', locale);
                  const isSelected = selected[group.id] === choice.id;
                  const hasSave =
                    choice.compare_delta !== undefined &&
                    choice.compare_delta > choice.price_delta;
                  const saveAmount = hasSave
                    ? choice.compare_delta! - choice.price_delta
                    : 0;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSingleChoice(group.id, choice.id)}
                      className={`relative flex flex-col items-start gap-0.5 text-left p-3.5 rounded-2xl min-h-[96px] transition-all ${
                        isSelected
                          ? 'bg-white border-2 border-brand shadow-[0_6px_16px_rgba(210,41,28,0.15)]'
                          : 'bg-white border-[1.5px] border-line hover:border-brand/40'
                      }`}
                    >
                      {hasSave && (
                        <span className="absolute -top-2.5 right-2.5 bg-accent text-accent-ink text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs pointer-events-none uppercase tracking-wider">
                          {locale === 'bn'
                            ? `সাশ্রয় ${formatTaka(saveAmount, 'bn')}`
                            : `SAVE ${formatTaka(saveAmount, 'en')}`}
                        </span>
                      )}
                      <span className="font-bold text-[14px] text-ink">{choiceName}</span>
                      {choiceDesc && (
                        <span className="text-[12px] text-ink-2 leading-tight">
                          {choiceDesc}
                        </span>
                      )}
                      <span className="font-bold text-[13px] mt-auto pt-1.5 text-ink flex items-center gap-1.5">
                        +{formatTaka(choice.price_delta, locale)}
                        {choice.compare_delta !== undefined && (
                          <span className="line-through text-ink-3 font-medium text-[12px]">
                            {formatTaka(choice.compare_delta, locale)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Chips display (with chilis) */}
            {displayMode === 'chips' && (
              <div
                className={`grid gap-2 ${
                  group.choices.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'
                }`}
              >
                {group.choices.map((choice) => {
                  const choiceName = pick(choice, 'name', locale);
                  const isSelected = selected[group.id] === choice.id;
                  const heatCount = choice.heat ?? 0;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSingleChoice(group.id, choice.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 min-h-[60px] rounded-[14px] text-[12.5px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand text-brand-ink border-2 border-brand shadow-sm'
                          : 'bg-white text-ink border-[1.5px] border-line hover:border-brand/40'
                      }`}
                    >
                      {heatCount > 0 && (
                        <span className="flex items-center gap-0.5" aria-hidden="true">
                          {Array.from({ length: heatCount }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                isSelected ? 'fill-current' : 'fill-brand'
                              }`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M17 3c-.6 1-.5 2 .2 2.7C14 6 11 9 9.5 13 8 16.8 5.5 19 3 20c4.5 1.3 10.3.2 13.9-4 2.6-3 3.5-6.5 2.6-9.2.9-.4 1.4-1.1 1.5-2-.9.4-1.9.3-2.6-.3C18 4 17.5 3.6 17 3z" />
                            </svg>
                          ))}
                        </span>
                      )}
                      <span>{choiceName}</span>
                      {choice.price_delta > 0 && (
                        <span
                          className={`text-[11px] font-bold ${
                            isSelected ? 'opacity-90' : 'text-ink-2'
                          }`}
                        >
                          +{formatTaka(choice.price_delta, locale)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* List display (radio list) */}
            {displayMode === 'list' && (
              <div className="flex flex-col gap-2">
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
                      className={`w-full flex items-center gap-3 min-h-[48px] px-3.5 bg-white rounded-[14px] text-left text-[14px] font-medium text-ink transition-all ${
                        isSelected
                          ? 'border-2 border-brand shadow-2xs'
                          : 'border-[1.5px] border-line hover:border-brand/40'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full box-border shrink-0 transition-all ${
                          isSelected
                            ? 'border-[6px] border-brand'
                            : 'border-2 border-[#CDB2A2]'
                        }`}
                      />
                      <span className="flex-1 text-ink">{choiceName}</span>
                      {choice.price_delta > 0 && (
                        <span className="font-semibold text-[13px] text-ink-2">
                          +{formatTaka(choice.price_delta, locale)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multi tiles display */}
            {displayMode === 'multi-tiles' && (
              <div className="grid grid-cols-2 gap-2">
                {group.choices.map((choice) => {
                  const choiceName = pick(choice, 'name', locale);
                  const isSelected = (
                    (selected[group.id] as string[]) || []
                  ).includes(choice.id);

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleMultiChoice(group.id, choice.id)}
                      className={`flex items-center gap-2.5 min-h-[52px] px-3 bg-white rounded-[14px] text-left text-[13.5px] font-medium text-ink transition-all ${
                        isSelected
                          ? 'border-2 border-brand shadow-2xs'
                          : 'border-[1.5px] border-line hover:border-brand/40'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-[6px] box-border shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-brand text-brand-ink border-0'
                            : 'bg-white border-2 border-[#CDB2A2]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.2]" />}
                      </span>
                      <span className="flex-1 flex flex-col leading-tight">
                        <span className="text-ink">{choiceName}</span>
                        {choice.price_delta > 0 && (
                          <span className="text-[12px] font-semibold text-ink-2">
                            +{formatTaka(choice.price_delta, locale)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pills display (Brew Bari fallback) */}
            {displayMode === 'pills' && (
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
                        <span
                          className={`text-[12px] font-extrabold opacity-80 ${
                            isSelected ? 'text-accent' : 'text-ink-2'
                          }`}
                        >
                          +{formatTaka(choice.price_delta, locale)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}

      {/* Special instructions note */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-line/60">
        <label htmlFor="special-note" className="text-[13.5px] font-bold text-ink">
          {isBold
            ? locale === 'bn'
              ? 'রান্নাঘরের জন্য বিশেষ অনুরোধ (ঐচ্ছিক)'
              : 'Note for the kitchen (optional)'
            : locale === 'bn'
              ? 'বিশেষ অনুরোধ (ঐচ্ছিক)'
              : 'Special instructions (optional)'}
        </label>
        <textarea
          id="special-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isBold
              ? locale === 'bn'
                ? 'যেমন: পেঁয়াজ ছাড়া, বেশি ভাজা…'
                : 'e.g. no onion, well done…'
              : locale === 'bn'
                ? 'যেমন: কম চিনি, বেশি গরম…'
                : 'e.g. less sweet, extra hot…'
          }
          className="w-full p-3 rounded-[14px] border border-line bg-white text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />
      </div>

      {/* Bottom Bar: Stepper + Add Button */}
      {canAdd && (
        <div className="pt-3 border-t border-line flex items-center gap-3">
          {isBold ? (
            <>
              {/* Grill Ghar Bold Stepper */}
              <div
                role="group"
                aria-label={locale === 'bn' ? 'পরিমাণ' : 'Quantity'}
                className="flex items-center bg-white border border-line rounded-[16px] h-[54px]"
              >
                <button
                  type="button"
                  aria-label={locale === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-[54px] border-0 bg-transparent text-ink flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4 stroke-[2.6]" />
                </button>
                <span className="min-w-[24px] text-center font-bold text-[16px] tabular-nums text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={locale === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                  disabled={quantity >= 20}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="w-11 h-[54px] border-0 bg-transparent text-ink flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.6]" />
                </button>
              </div>

              {/* Grill Ghar Bold Add Button */}
              <button
                type="button"
                data-testid="item-sheet-add-button"
                disabled={!isValid}
                onClick={handleAdd}
                className="flex-1 h-[54px] rounded-[16px] bg-brand text-brand-ink flex items-center justify-between px-5 font-bold text-[15px] shadow-[0_8px_20px_rgba(210,41,28,0.3)] hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span>{addLabel}</span>
                <span className="tabular-nums">{formatTaka(totalPrice, locale)}</span>
              </button>
            </>
          ) : (
            <>
              {/* Brew Bari Stepper */}
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

              {/* Brew Bari Add Button */}
              <button
                type="button"
                data-testid="item-sheet-add-button"
                disabled={!isValid}
                onClick={handleAdd}
                className="flex-1 h-12 rounded-full bg-accent text-ink text-[15px] font-extrabold flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-[0_4px_12px_rgb(var(--accent-rgb)/0.3)]"
              >
                <span>{addLabel}</span>
                <span>·</span>
                <span className="tabular-nums">{formatTaka(totalPrice, locale)}</span>
              </button>
            </>
          )}
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
