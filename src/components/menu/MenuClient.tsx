'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Search, Info, Coffee } from 'lucide-react';
import type { MenuData, MenuItem, Offer } from '@/lib/menu/data';

import { ItemCard } from './ItemCard';
import { CategoryNav } from './CategoryNav';
import { OfferCarousel } from './OfferCarousel';
import { LanguageToggle } from './LanguageToggle';
import { CafeInfoSheet } from './CafeInfoSheet';
import { ItemDetailSheet } from './ItemDetailSheet';
import { ActionBar } from './ActionBar';
import { CartSheet } from './CartSheet';
import { sortForGuest, quickPicks } from '@/lib/menu/sort';
import { pick } from '@/lib/i18n';
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

  const restaurantName = pick(menu.restaurant, 'name', locale);
  const tagline = pick(menu.restaurant, 'tagline', locale);

  return (
    <div className="min-h-screen bg-[#FFF7EE] text-[#24170F] font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#F2C27D] selection:text-[#24170F] pb-24">
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Header */}
        <header className="p-4 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#6B4226] text-[#F2C27D] font-extrabold text-[17px] tracking-tight flex items-center justify-center shrink-0 shadow-sm">
              BB
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-2xl leading-tight tracking-tight text-[#24170F] truncate">
                {restaurantName}
              </h1>
              {tagline && (
                <p className="text-[13px] text-[#6F5A4B] leading-snug truncate">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle locale={locale} onLocaleChange={setLocale} />
            <button
              type="button"
              aria-label="Café info"
              onClick={() => setIsInfoOpen(true)}
              className="w-11 h-11 rounded-full bg-white text-[#6B4226] shadow-[0_6px_20px_rgba(107,66,38,0.1)] flex items-center justify-center hover:bg-[#FFF7EE] active:scale-95 transition-all"
            >
              <Info className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </header>

        {/* Table context indicator if scanning QR */}
        {tableContext?.tableNumber && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="h-8 px-3 rounded-full bg-[#6B4226] text-[#FFF7EE] text-[13px] font-bold flex items-center gap-1.5 shadow-xs">
              <Coffee className="w-4 h-4 stroke-[2]" />
              <span>
                {locale === 'bn' ? `টেবিল ${tableContext.tableNumber}` : `Table ${tableContext.tableNumber}`}
              </span>
            </div>
            <span className="text-[12px] font-medium text-[#6F5A4B]">
              {locale === 'bn' ? 'আপনার টেবিল সংযুক্ত' : 'Table connected'}
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="h-[50px] rounded-full bg-white border border-[#F0DFCB] shadow-xs px-4 flex items-center gap-2.5 text-[#8C7767] focus-within:border-[#6B4226] focus-within:ring-1 focus-within:ring-[#6B4226] transition-all">
            <Search className="w-[18px] h-[18px] stroke-[2.2] text-[#8C7767] shrink-0" />
            <input
              id="search-menu"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === 'bn'
                  ? 'কফি, জুস, স্ন্যাকস খুঁজুন…'
                  : 'Search coffee, juice, bites…'
              }
              className="flex-1 bg-transparent text-[15px] font-medium text-[#24170F] placeholder:text-[#8C7767] outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#8C7767] hover:text-[#24170F] px-1"
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
            locale={locale}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Main Content Sections */}
        <main className="p-4 flex flex-col gap-7">
          {/* SEARCH RESULTS VIEW */}
          {filteredItems !== null ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-[#24170F] flex items-center gap-2">
                <span>{locale === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}</span>
                <span className="text-sm font-semibold text-[#8C7767]">
                  ({filteredItems.length})
                </span>
              </h2>

              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-[#8C7767]">
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
              {/* Quick Picks Section */}
              {hasQuick && (
                <section
                  id="section-quick"
                  ref={(el) => {
                    sectionRefs.current['quick'] = el;
                  }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-extrabold text-[#24170F] tracking-tight">
                      {locale === 'bn' ? 'ঝটপট · ৫ মিনিটে তৈরি' : 'Quick · ready in ≤5 min'}
                    </h2>
                    <span className="text-[13px] font-bold text-[#8C7767]">
                      {quickItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                </section>
              )}

              {/* Category Sections */}
              {menu.categories.map((cat) => {
                const catItems = menu.items.filter((it) => it.category_id === cat.id);
                if (catItems.length === 0) return null; // hide empty categories

                const sortedCatItems = sortForGuest(catItems);
                const catTitle = pick(cat, 'name', locale);

                return (
                  <section
                    key={cat.id}
                    id={`section-${cat.id}`}
                    ref={(el) => {
                      sectionRefs.current[cat.id] = el;
                    }}
                    className="flex flex-col gap-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-extrabold text-[#24170F] tracking-tight">
                        {catTitle}
                      </h2>
                      <span className="text-[13px] font-bold text-[#8C7767]">
                        {sortedCatItems.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {sortedCatItems.map((item) => (
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
                  </section>
                );
              })}
            </>
          )}

          {/* Footer */}
          <footer className="pt-6 pb-2 text-center text-[12px] leading-relaxed text-[#8C7767] border-t border-[#F0DFCB]/60">
            <div>
              {menu.restaurant.address || 'GEC Circle, Chattogram'} ·{' '}
              {pick(menu.restaurant, 'opening_hours', locale) ||
                menu.restaurant.opening_hours_en ||
                'Every day 9 AM – 11 PM'}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-[#B98A5E]">
              Powered by Brew Bari
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
  );
}

