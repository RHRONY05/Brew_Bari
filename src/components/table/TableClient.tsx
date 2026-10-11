'use client';

import React, { useState } from 'react';
import type { MenuData } from '@/lib/menu/data';
import type { TableContextResult } from '@/lib/schemas';
import { TableProvider, useTable } from './TableProvider';
import { TableStatusSheet } from './TableStatusSheet';
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
    table,
    session,
    requests,
    packageTier,
    activeStatusText,
    callWaiter,
  } = useTable();

  const [isStatusOpen, setIsStatusOpen] = useState(false);

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
      />


      {/* Table status sheet */}
      <TableStatusSheet
        tableNumber={table.number}
        requests={requests}
        isOpen={isStatusOpen}
        locale={initialLocale}
        onCallWaiter={() => callWaiter()}
        onClose={() => setIsStatusOpen(false)}
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
