'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { MenuData } from '@/lib/menu/data';
import type { TableContextResult, CartLineType } from '@/lib/schemas';
import type { CartItem } from '@/lib/cart/store';
import { TableProvider, useTable } from './TableProvider';
import { TableStatusSheet } from './TableStatusSheet';
import { BillSheet } from './BillSheet';
import { ReviewSheet } from './ReviewSheet';
import { MenuClient } from '@/components/menu/MenuClient';

interface TableClientProps {
  token: string;
  tableContext: TableContextResult;
  menu: MenuData;
  initialLocale?: 'en' | 'bn';
}

function TableContent({
  menu,
  initialLocale = 'en',
}: {
  menu: MenuData;
  initialLocale: 'en' | 'bn';
}) {
  const {
    token,
    table,
    session,
    requests,
    packageTier,
    activeStatusText,
    callWaiter,
    placeOrder,
    refreshStatus,
  } = useTable();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // If session closes, trigger review sheet per US-23
  const prevSessionStatusRef = useRef(session?.status);
  useEffect(() => {
    if (prevSessionStatusRef.current === 'open' && session?.status === 'closed') {
      setIsReviewOpen(true);
    }
    prevSessionStatusRef.current = session?.status;
  }, [session?.status]);

  const handlePlaceOrder = async (
    cartItems: CartItem[],
    kitchenNote: string,
    onSuccess: () => void
  ) => {
    const lines: CartLineType[] = cartItems.map((ci) => ({
      item_id: ci.item.id,
      qty: ci.quantity,
      choices: ci.choices || [],
      note: ci.note || undefined,
    }));

    const result = await placeOrder(lines, kitchenNote);
    if (result.success) {
      onSuccess();
      setIsStatusOpen(true);
      return;
    }

    if (result.soldOutItemId) {
      const soldItem = menu.items.find((i) => i.id === result.soldOutItemId);
      const name = soldItem
        ? initialLocale === 'bn' && soldItem.name_bn
          ? soldItem.name_bn
          : soldItem.name_en
        : 'Item';

      toast.error(
        initialLocale === 'bn'
          ? `দুঃখিত, ${name} এইমাত্র শেষ হয়ে গেছে। কার্ট থেকে বাদ দিন।`
          : `Sorry, ${name} just sold out. Please remove it from your cart.`
      );
      return { soldOutItemId: result.soldOutItemId };
    }
  };

  return (
    <>
      <MenuClient
        menu={menu}
        initialLocale={initialLocale}
        tableContext={{
          tableNumber: table.number,
          sessionId: session?.id,
        }}
        packageOverride={packageTier}
        activeStatusText={activeStatusText}
        onCallWaiter={() => callWaiter()}
        onOpenStatus={() => setIsStatusOpen(true)}
        onPlaceOrder={packageTier >= 3 ? handlePlaceOrder : undefined}
      />

      {/* Table status sheet */}
      <TableStatusSheet
        tableNumber={table.number}
        requests={requests}
        isOpen={isStatusOpen}
        locale={initialLocale}
        onCallWaiter={() => callWaiter()}
        onViewBill={() => {
          setIsStatusOpen(false);
          setIsBillOpen(true);
        }}
        onLeaveReview={() => {
          setIsStatusOpen(false);
          setIsReviewOpen(true);
        }}
        onClose={() => setIsStatusOpen(false)}
      />

      {/* Bill sheet */}
      <BillSheet
        token={token}
        tableNumber={table.number}
        isOpen={isBillOpen}
        locale={initialLocale}
        onRequestBillComplete={() => {
          setIsBillOpen(false);
          setIsReviewOpen(true);
          refreshStatus();
        }}
        onClose={() => setIsBillOpen(false)}
      />

      {/* Review sheet */}
      <ReviewSheet
        token={token}
        isOpen={isReviewOpen}
        locale={initialLocale}
        googleReviewUrl={menu.restaurant.google_review_url || 'https://g.page/r/brewbari/review'}
        facebookUrl={menu.restaurant.facebook_url}
        instagramUrl={menu.restaurant.instagram_url}
        onClose={() => setIsReviewOpen(false)}
      />
    </>
  );
}

export function TableClient({
  token,
  tableContext,
  menu,
  initialLocale = 'en',
}: TableClientProps) {
  return (
    <TableProvider
      token={token}
      initialContext={tableContext}
      locale={initialLocale}
    >
      <TableContent menu={menu} initialLocale={initialLocale} />
    </TableProvider>
  );
}
