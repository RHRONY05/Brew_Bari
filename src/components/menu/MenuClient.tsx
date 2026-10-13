'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Search, Info, Coffee, UtensilsCrossed, ChevronLeft, ChevronRight, SlidersHorizontal, Zap } from 'lucide-react';
import { getTheme } from '@/themes';
import { ThemeProvider } from '@/themes/ThemeContext';
import type { MenuData, MenuItem, Offer } from '@/lib/menu/data';

import { ItemCard } from './ItemCard';
import { CategoryNav } from './CategoryNav';
import { CategorySection } from './CategorySection';
import { OfferCarousel } from './OfferCarousel';
import { DealsRow } from './DealsRow';
import { LanguageToggle } from './LanguageToggle';
import { CafeInfoSheet } from './CafeInfoSheet';
import { ItemDetailSheet } from './ItemDetailSheet';
import { ActionBar } from './ActionBar';
import { CartSheet } from './CartSheet';
import { sortForGuest, quickPicks } from '@/lib/menu/sort';
import { pick } from '@/lib/i18n';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';
import {
  addToCart,
  updateCartQuantity,
  getCartTotals,
  loadCartFromStorage,
  saveCartToStorage,
  type CartItem,
} from '@/lib/cart/store';

interface MenuClientProps {
  menu: MenuData;
  initialLocale?: 'en' | 'bn';
  tableContext?: {
    tableNumber: number;
    sessionId?: string | null;
  } | null;
  packageOverride?: number;
  activeStatusText?: string | null;
  onCallWaiter?: () => void;
  onOpenStatus?: () => void;
  onPlaceOrder?: (
    items: CartItem[],
    kitchenNote: string,
    onSuccess: () => void
  ) => Promise<{ soldOutItemId?: string } | void>;
}

export function MenuClient({
  menu,
  initialLocale = 'en',
  tableContext = null,
  packageOverride,
  activeStatusText = null,
  onCallWaiter,
  onOpenStatus,
  onPlaceOrder,
}: MenuClientProps) {

  const [locale, setLocale] = useState<'en' | 'bn'>(initialLocale);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('quick');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [kitchenNote, setKitchenNote] = useState('');
  const [soldOutItemIds, setSoldOutItemIds] = useState<string[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    return loadCartFromStorage(tableContext?.sessionId);
  });

  const packageTier = packageOverride ?? menu.restaurant.package ?? 3;
  const { count: cartCount, subtotal: cartSubtotal } = getCartTotals(cartItems);

  // Quick picks
  const quickItems = useMemo(() => {
    return quickPicks(menu.items);
  }, [menu.items]);

  const hasQuick = quickItems.length > 0;
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);
  const quickSliderRef = useRef<HTMLDivElement>(null);

  const scrollQuick = (direction: 'left' | 'right') => {
    if (!quickSliderRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    quickSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Search filtering
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    return menu.items.filter((item) => {
      const nameEn = item.name_en.toLowerCase();
      const nameBn = (item.name_bn || '').toLowerCase();
      const descEn = (item.description_en || '').toLowerCase();
      const descBn = (item.description_bn || '').toLowerCase();
      const tags = (item.tags || []).join(' ').toLowerCase();

      return (
        nameEn.includes(q) ||
        nameBn.includes(q) ||
        descEn.includes(q) ||
        descBn.includes(q) ||
        tags.includes(q)
      );
    });
  }, [searchQuery, menu.items]);

  // Section references for smooth scrolling
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    if (id === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (id === 'deals') {
      const target = document.getElementById('section-deals');
      if (target) {
        const navOffset = 64;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      return;
    }
    const target = sectionRefs.current[id];
    if (target) {
      const navOffset = 64;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item);
    setIsItemSheetOpen(true);
  };

  const handleAddToCart = (line: {
    item: MenuItem;
    quantity: number;
    choices: string[];
    note?: string;
  }) => {
    const updated = addToCart(
      cartItems,
      line.item,
      line.quantity,
      line.choices,
      line.note
    );
    setCartItems(updated);
    saveCartToStorage(tableContext?.sessionId, updated);
  };

  const handleAddUpsell = (item: MenuItem) => {
    const parsedOptions = ItemOptionsSchema.safeParse(item.options);
    const hasRequired = parsedOptions.success && parsedOptions.data.some((g) => g.required);
    if (hasRequired) {
      handleItemSelect(item);
    } else {
      handleAddToCart({
        item,
        quantity: 1,
        choices: [],
      });
    }
  };

  const handleUpdateQuantity = (lineId: string, qty: number) => {
    const updated = updateCartQuantity(cartItems, lineId, qty);
    setCartItems(updated);
    saveCartToStorage(tableContext?.sessionId, updated);

    // If an item was reduced to 0 or removed, clear its ID from soldOutItemIds
    const remainingItemIds = new Set(updated.map((ci) => ci.item.id));
    setSoldOutItemIds((prev) => prev.filter((id) => remainingItemIds.has(id)));
  };

  const handlePlaceOrder = async () => {
    if (!onPlaceOrder || isPlacingOrder || cartItems.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const res = await onPlaceOrder(cartItems, kitchenNote, () => {
        setCartItems([]);
        saveCartToStorage(tableContext?.sessionId, []);
        setKitchenNote('');
        setIsCartOpen(false);
        setSoldOutItemIds([]);
      });
      if (res?.soldOutItemId) {
        setSoldOutItemIds((prev) =>
          prev.includes(res.soldOutItemId!) ? prev : [...prev, res.soldOutItemId!]
        );
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleOfferSelect = (offer: Offer) => {
    if (offer.menu_item_id) {
      const item = menu.items.find((i) => i.id === offer.menu_item_id);
      if (item) {
        handleItemSelect(item);
        return;
      }
    }
    if (offer.category_id) {
      handleSelectCategory(offer.category_id);
    }
  };

  const theme = getTheme(menu.restaurant.theme_key);
  const VenueIcon = theme.icons.venue === 'coffee' ? Coffee : UtensilsCrossed;
  const restaurantName = pick(menu.restaurant, 'name', locale);
  const footerHours = pick(menu.restaurant, 'opening_hours', locale);
  const footerLine = [menu.restaurant.address, footerHours].filter(Boolean).join(' · ');
  const tagline = pick(menu.restaurant, 'tagline', locale);

  const hasDeals = useMemo(() => {
    return (
      theme.layout.dealsRow &&
      menu.items.some(
        (it) => it.compare_at_price != null && it.compare_at_price > it.price
      )
    );
  }, [theme.layout.dealsRow, menu.items]);

  return (
    <ThemeProvider value={theme}>
    <div
      lang={locale}
      data-lang={locale}
      className="min-h-screen bg-bg text-ink antialiased selection:bg-accent selection:text-ink pb-24"
    >
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <header className="p-4 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative w-12 h-12 shrink-0 ${
                theme.layout.itemCard === 'bold'
                  ? 'rounded-[16px] bg-brand p-2 flex items-center justify-center shadow-[0_6px_16px_rgba(var(--brand-rgb,210_41_28)/0.28)]'
                  : ''
              }`}
            >
              <Image
                src={menu.restaurant.logo_url || theme.assets.logo}
                alt={`${menu.restaurant.name_en} logo`}
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-extrabold text-[21px] sm:text-2xl leading-tight tracking-tight text-ink truncate">
                {restaurantName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {theme.layout.itemCard === 'bold' && tableContext?.tableNumber && (
                  <span className="inline-flex items-center gap-1 bg-ink text-brand-ink text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                    <VenueIcon className="w-3 h-3 stroke-[2.2]" />
                    <span>
                      {locale === 'bn'
                        ? `টেবিল ${tableContext.tableNumber}`
                        : `Table ${tableContext.tableNumber}`}
                    </span>
                  </span>
                )}
                {tagline && (
                  <p className="text-[12px] sm:text-[13px] text-ink-2 leading-snug truncate">
                    {tagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle locale={locale} onLocaleChange={setLocale} />
            <button
              type="button"
              aria-label={theme.copy.infoLabel[locale]}
              onClick={() => setIsInfoOpen(true)}
              className={`w-11 h-11 ${
                theme.layout.itemCard === 'bold'
                  ? 'rounded-[14px] border border-line'
                  : 'rounded-full'
              } bg-white text-ink shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.1)] flex items-center justify-center hover:bg-bg active:scale-95 transition-all`}
            >
              <Info className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </header>

        {/* Table context indicator if scanning QR (standard layout) */}
        {theme.layout.itemCard !== 'bold' && tableContext?.tableNumber && (
          <div className="px-4 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 px-3 rounded-full bg-brand text-bg text-[13px] font-bold flex items-center gap-1.5 shadow-xs">
                <VenueIcon className="w-4 h-4 stroke-[2]" />
                <span>
                  {locale === 'bn' ? `টেবিল ${tableContext.tableNumber}` : `Table ${tableContext.tableNumber}`}
                </span>
              </div>
              <span className="text-[12px] font-medium text-ink-2 hidden sm:inline">
                {locale === 'bn' ? 'আপনার টেবিল সংযুক্ত' : 'Table connected'}
              </span>
            </div>

            {onOpenStatus && (
              <button
                type="button"
                onClick={onOpenStatus}
                data-testid="header-track-order-button"
                className="h-8 px-3.5 rounded-full bg-surface-2 border border-line text-brand-muted text-[12px] font-extrabold flex items-center gap-1.5 hover:bg-accent hover:text-ink active:scale-95 transition-all shadow-2xs"
              >
                <span>{locale === 'bn' ? 'অর্ডার ট্র্যাকার / বিল' : 'Track Order / Bill'}</span>
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div
            className={`h-[50px] ${
              theme.layout.itemCard === 'bold' ? 'rounded-[16px]' : 'rounded-full'
            } bg-white border border-line shadow-xs px-4 flex items-center gap-2.5 text-ink-3 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all`}
          >
            <Search className="w-[18px] h-[18px] stroke-[2.2] text-ink-3 shrink-0" />
            <input
              id="search-menu"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={theme.copy.searchPlaceholder[locale]}
              className="flex-1 bg-transparent text-[15px] font-medium text-ink placeholder:text-ink-3 outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-ink-3 hover:text-ink px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Offer Carousel (shown when not searching) */}
        {!searchQuery && menu.offers.length > 0 && (
          <div className="pb-3">
            <OfferCarousel
              offers={menu.offers}
              items={menu.items}
              decoration={theme.layout.offerDecoration}
              locale={locale}
              onSelectOffer={handleOfferSelect}
            />
          </div>
        )}

        {/* Category sticky nav (shown when not searching) */}
        {!searchQuery && (
          <CategoryNav
            categories={menu.categories}
            activeCategoryId={activeCategoryId}
            hasQuickSection={hasQuick}
            hasDeals={hasDeals}
            locale={locale}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Meal Deals Row (if enabled by theme and deals exist) */}
        {!searchQuery && hasDeals && (
          <DealsRow
            items={menu.items}
            locale={locale}
            packageTier={packageTier}
            onSelect={handleItemSelect}
            onAddDirectly={handleItemSelect}
          />
        )}

        {/* Quick Picks Banner (fast food banner variant) */}
        {!searchQuery && hasQuick && theme.layout.quickPicks === 'banner' && (
          <section
            aria-label="Ready fast"
            data-testid="quick-picks-banner"
            onClick={() => {
              const friesCat = menu.categories.find(
                (c) =>
                  c.icon === 'fries' ||
                  c.name_en.toLowerCase().includes('fries') ||
                  c.name_en.toLowerCase().includes('snack')
              );
              if (friesCat) {
                handleSelectCategory(friesCat.id);
              }
            }}
            className="mx-4 mt-4 bg-ink rounded-[18px] p-3.5 sm:p-4 flex items-center gap-3 text-brand-ink cursor-pointer hover:bg-ink/95 transition-all shadow-md"
          >
            <span className="w-10 h-10 rounded-xl bg-accent text-accent-ink flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-current stroke-[2]" />
            </span>
            <div className="flex-1 flex flex-col min-w-0">
              <span className="font-bold text-[14px] leading-tight text-brand-ink">
                {theme.copy.quickBannerTitle?.[locale] ||
                  (locale === 'bn' ? 'তাড়া আছে?' : 'In a hurry?')}
              </span>
              <span className="text-[12px] text-surface-2/90 leading-tight truncate">
                {theme.copy.quickBannerSubtitle?.[locale] ||
                  (locale === 'bn'
                    ? 'ফ্রাইজ, উইংস আর শেক — ৫ মিনিটে রেডি'
                    : 'Fries, wings & shakes — ready in 5 min')}
              </span>
            </div>
            <span className="text-accent font-bold text-[13px] shrink-0 flex items-center gap-0.5">
              <span>{locale === 'bn' ? 'দেখুন' : 'See'}</span>
              <span>→</span>
            </span>
          </section>
        )}

        {/* Main Content Sections */}
        <main className="p-4 flex flex-col gap-7">
          {/* SEARCH RESULTS VIEW */}
          {filteredItems !== null ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-ink flex items-center gap-2">
                <span>{locale === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}</span>
                <span className="text-sm font-semibold text-ink-3">
                  ({filteredItems.length})
                </span>
              </h2>

              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-ink-3">
                  <p className="font-semibold">
                    {locale === 'bn'
                      ? 'কোনো আইটেম পাওয়া যায়নি।'
                      : 'No items match your search.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortForGuest(filteredItems).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      packageTier={packageTier}
                      onSelect={handleItemSelect}
                      onAddDirectly={handleItemSelect}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            /* STANDARD CATEGORIES VIEW */
            <>
              {/* Quick Picks Section (standard section layout only) */}
              {hasQuick && theme.layout.quickPicks === 'section' && (
                <section
                  id="section-quick"
                  ref={(el) => {
                    sectionRefs.current['quick'] = el;
                  }}
                  className="flex flex-col gap-3.5 scroll-mt-20"
                  data-testid="category-section-quick"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className="w-5 h-5 text-brand stroke-[2.2] fill-accent shrink-0" />
                      <h2 className="text-[17px] sm:text-[20px] font-extrabold text-ink tracking-tight truncate">
                        {locale === 'bn' ? 'ঝটপট · ৫ মিনিটে তৈরি' : 'Quick · ready in ≤5 min'}
                      </h2>
                      <span className="h-5.5 px-2.5 rounded-full bg-surface-2 text-brand-muted text-[12px] font-extrabold flex items-center justify-center shrink-0">
                        {locale === 'bn' ? `${quickItems.length}টি` : `${quickItems.length}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isQuickExpanded && quickItems.length > 2 && (
                        <div className="hidden sm:flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Previous quick items"
                            onClick={() => scrollQuick('left')}
                            className="w-7.5 h-7.5 rounded-full border border-line bg-white text-ink-2 flex items-center justify-center hover:bg-bg hover:text-ink active:scale-95 transition-all shadow-2xs cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                          </button>
                          <button
                            type="button"
                            aria-label="Next quick items"
                            onClick={() => scrollQuick('right')}
                            className="w-7.5 h-7.5 rounded-full border border-line bg-white text-ink-2 flex items-center justify-center hover:bg-bg hover:text-ink active:scale-95 transition-all shadow-2xs cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsQuickExpanded((prev) => !prev)}
                        className="h-7.5 px-2.5 rounded-full bg-surface-2 border border-line/60 text-brand-muted hover:bg-accent hover:text-ink text-[12px] font-extrabold flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        {isQuickExpanded ? (
                          <>
                            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>{locale === 'bn' ? 'স্লাইডার' : 'Slider'}</span>
                          </>
                        ) : (
                          <>
                            <span>{locale === 'bn' ? 'সবগুলো' : 'View all'}</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isQuickExpanded ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
                      {quickItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          locale={locale}
                          packageTier={packageTier}
                          onSelect={handleItemSelect}
                          onAddDirectly={handleItemSelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      ref={quickSliderRef}
                      className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2 snap-x -mx-4 px-4"
                    >
                      {quickItems.map((item) => (
                        <div key={item.id} className="w-[165px] sm:w-[185px] shrink-0 snap-start">
                          <ItemCard
                            item={item}
                            locale={locale}
                            packageTier={packageTier}
                            onSelect={handleItemSelect}
                            onAddDirectly={handleItemSelect}
                          />
                        </div>
                      ))}

                      {quickItems.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setIsQuickExpanded(true)}
                          className="w-[130px] shrink-0 snap-start rounded-3xl border-2 border-dashed border-line hover:border-brand-muted bg-white/70 hover:bg-bg p-4 flex flex-col items-center justify-center text-center gap-2 text-brand-muted transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-brand-muted font-extrabold text-[13px]">
                            +{quickItems.length}
                          </div>
                          <span className="text-[12px] font-extrabold text-ink">
                            {locale === 'bn' ? 'সবগুলো দেখুন' : 'View all'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Category Sections with Slider & Expand Controls */}
              {menu.categories.map((cat) => {
                const catItems = menu.items.filter((it) => it.category_id === cat.id);
                if (catItems.length === 0) return null; // hide empty categories
                const sortedCatItems = sortForGuest(catItems);

                return (
                  <CategorySection
                    key={cat.id}
                    category={cat}
                    items={sortedCatItems}
                    locale={locale}
                    packageTier={packageTier}
                    onSelect={handleItemSelect}
                    onAddDirectly={handleItemSelect}
                    sectionRef={(el) => {
                      sectionRefs.current[cat.id] = el;
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Footer */}
          <footer className="pt-6 pb-2 text-center text-[12px] leading-relaxed text-ink-3 border-t border-line/60">
            {footerLine && <div>{footerLine}</div>}
            <div className="mt-1 text-[11px] font-semibold text-brand-muted">
              Powered by Menuwala
            </div>
          </footer>
        </main>
      </div>

      {/* Sheets & Drawers */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={isItemSheetOpen}
        locale={locale}
        packageTier={packageTier}
        onClose={() => setIsItemSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <CafeInfoSheet
        restaurant={menu.restaurant}
        isOpen={isInfoOpen}
        locale={locale}
        onClose={() => setIsInfoOpen(false)}
      />

      <CartSheet
        items={cartItems}
        isOpen={isCartOpen}
        locale={locale}
        tableNumber={tableContext?.tableNumber}
        packageTier={packageTier}
        kitchenNote={kitchenNote}
        soldOutItemIds={soldOutItemIds}
        isPlacingOrder={isPlacingOrder}
        menuItems={menu.items}
        onAddUpsellItem={handleAddUpsell}
        onKitchenNoteChange={setKitchenNote}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={onPlaceOrder ? handlePlaceOrder : undefined}
        onCallWaiter={onCallWaiter}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Action Bar (P2 & P3) */}
      <ActionBar
        packageTier={packageTier}
        locale={locale}
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        activeStatusText={activeStatusText}
        onCallWaiter={() => {
          if (onCallWaiter) {
            onCallWaiter();
          } else {
            setIsCartOpen(true);
          }
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenStatus={onOpenStatus}
      />
    </div>
    </ThemeProvider>
  );
}

