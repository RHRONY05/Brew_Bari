'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { playChime } from '@/lib/audio';
import { getTableTileState, canTransition, type TableTileState } from '@/lib/requests';
import type { RequestType, RequestStatus } from '@/lib/schemas';
import { StartShiftOverlay } from '@/components/counter/StartShiftOverlay';
import { CounterHeader } from '@/components/counter/CounterHeader';
import { TableGrid } from '@/components/counter/TableGrid';
import { TableTile, type TableItem } from '@/components/counter/TableTile';
import { RequestCard, type ServiceRequestData } from '@/components/counter/RequestCard';
import { SoldOutDialog, type MenuItemAvailability } from '@/components/counter/SoldOutDialog';
import { TableDrawer, type TableSessionData } from '@/components/counter/TableDrawer';
import { Coffee, ChevronDown, ChevronUp } from 'lucide-react';

function getTimeAgo(isoString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 45) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function getElapsedSince(isoString?: string): string {
  if (!isoString) return '—';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 45) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}

export default function CounterBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTest = searchParams.get('showTest') === '1';

  // State
  const [shiftStarted, setShiftStarted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem('bb_shift_started'));
    }
    return false;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [packageLevel, setPackageLevel] = useState<string>('P3');

  const [tables, setTables] = useState<TableItem[]>([]);
  const [sessions, setSessions] = useState<TableSessionData[]>([]);
  const [requests, setRequests] = useState<ServiceRequestData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemAvailability[]>([]);

  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'orders' | 'bills'>('all');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isSoldOutOpen, setIsSoldOutOpen] = useState<boolean>(false);
  const [showDoneToday, setShowDoneToday] = useState<boolean>(false);

  // Re-render tick for live time-ago updating
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Check shift started from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const started = sessionStorage.getItem('bb_shift_started');
      if (!started) {
        setShiftStarted(false);
      }
    }
  }, []);

  const handleStartShift = () => {
    setShiftStarted(true);
    setSoundEnabled(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bb_shift_started', 'true');
    }
  };

  // Fetch all counter board data
  const fetchData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    // 1. Get staff info & restaurant id
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data: staffMember } = await supabase
      .from('staff')
      .select('restaurant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!staffMember) return;

    setIsAdmin(staffMember.role === 'admin');
    const rid = staffMember.restaurant_id;
    setRestaurantId(rid);

    // Get restaurant settings
    const { data: rest } = await supabase
      .from('restaurants')
      .select('package')
      .eq('id', rid)
      .single();
    if (rest?.package) {
      setPackageLevel(`P${rest.package}`);
    }

    // 2. Fetch tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('id, number, label, seats, is_active')
      .eq('restaurant_id', rid)
      .order('number');

    if (tablesData) {
      setTables(tablesData);
    }

    // 3. Fetch active sessions (non-closed)
    const { data: sessionsData } = await supabase
      .from('table_sessions')
      .select('id, table_id, restaurant_id, status, opened_at, closed_at')
      .eq('restaurant_id', rid)
      .neq('status', 'closed');

    if (sessionsData) {
      setSessions(sessionsData as TableSessionData[]);
    }

    // 4. Fetch requests (active + recent done)
    const { data: requestsData } = await supabase
      .from('service_requests')
      .select('*, request_items(*), tables(number, label), table_sessions(status)')
      .eq('restaurant_id', rid)
      .order('created_at', { ascending: false })
      .limit(50);

    if (requestsData) {
      const formatted: ServiceRequestData[] = requestsData.map((r: any) => {
        let items: any[] = [];
        if (r.request_items && Array.isArray(r.request_items)) {
          items = r.request_items.map((it: any) => {
            let optSummary = '';
            if (Array.isArray(it.options)) {
              optSummary = it.options
                .map((o: any) => o.choice_en || o.choice_bn || (typeof o === 'string' ? o : ''))
                .filter(Boolean)
                .join(', ');
            } else if (it.selected_options && typeof it.selected_options === 'object') {
              optSummary = Object.values(it.selected_options).flat().join(', ');
            }
            return {
              id: it.id,
              name: it.name_en || it.name_bn || it.item_name_en || 'Item',
              quantity: it.quantity,
              optionsSummary: optSummary,
              price: it.line_total ?? it.unit_price ?? it.price_at_order ?? 0,
            };
          });
        }
        return {
          id: r.id,
          restaurant_id: r.restaurant_id,
          session_id: r.session_id,
          table_id: r.table_id,
          type: r.type,
          status: r.status,
          nudge_count: r.nudge_count || 0,
          note: r.note,
          created_at: r.created_at,
          order_number: r.order_number,
          total_amount: r.total_amount,
          items,
          table_number: r.tables?.number || 0,
          session_status: r.table_sessions?.status,
        };
      });
      setRequests(formatted);
    }

    // 5. Fetch menu items for sold out dialog
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('id, category_id, name_en, name_bn, price, is_available, categories(name_en)')
      .eq('restaurant_id', rid)
      .order('name_en');

    if (menuData) {
      const mappedItems: MenuItemAvailability[] = menuData.map((m: any) => ({
        id: m.id,
        category_id: m.category_id,
        category_name: m.categories?.name_en || 'Other',
        name_en: m.name_en,
        name_bn: m.name_bn,
        price: m.price,
        is_available: m.is_available,
      }));
      setMenuItems(mappedItems);
    }
  }, [router]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription setup
  useEffect(() => {
    if (!restaurantId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('counter-board-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (soundEnabled) {
              playChime();
            }
          } else if (payload.eventType === 'UPDATE') {
            const oldNudge = (payload.old as any)?.nudge_count || 0;
            const newNudge = (payload.new as any)?.nudge_count || 0;
            if (newNudge > oldNudge && soundEnabled) {
              playChime();
            }
          }
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_sessions',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // Visibility & online handlers
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    const handleOnline = () => {
      setIsLive(true);
      fetchData();
    };
    const handleOffline = () => {
      setIsLive(false);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [restaurantId, soundEnabled, fetchData]);

  // Filtered tables (hide table 99 unless showTest is true)
  const displayTables = useMemo(() => {
    return tables.filter((t) => showTest || t.number !== 99);
  }, [tables, showTest]);

  // Map each table to its TileState
  const tablesWithState = useMemo(() => {
    return displayTables.map((table) => {
      const activeSession = sessions.find((s) => s.table_id === table.id);
      const activeReqs = requests.filter(
        (r) =>
          (r.table_id === table.id || (activeSession && r.session_id === activeSession.id)) &&
          !['done', 'cancelled'].includes(r.status)
      );

      const state: TableTileState = getTableTileState(
        activeSession?.status as any,
        activeReqs.map((r) => ({ type: r.type, status: r.status }))
      );

      return {
        table,
        state,
        elapsedTime: getElapsedSince(activeSession?.opened_at),
      };
    });
  }, [displayTables, sessions, requests]);

  // Filter active requests
  const activeRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        (showTest || r.table_number !== 99) &&
        !['done', 'cancelled'].includes(r.status)
    );
  }, [requests, showTest]);

  const doneTodayRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        (showTest || r.table_number !== 99) &&
        ['done', 'cancelled'].includes(r.status)
    );
  }, [requests, showTest]);

  // Filter tabs counts & items
  const counts = useMemo(() => {
    return {
      all: activeRequests.length,
      calls: activeRequests.filter((r) => r.type === 'call_waiter').length,
      orders: activeRequests.filter((r) => r.type === 'order').length,
      bills: activeRequests.filter((r) => r.type === 'bill').length,
    };
  }, [activeRequests]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'calls') return activeRequests.filter((r) => r.type === 'call_waiter');
    if (activeTab === 'orders') return activeRequests.filter((r) => r.type === 'order');
    if (activeTab === 'bills') return activeRequests.filter((r) => r.type === 'bill');
    return activeRequests;
  }, [activeRequests, activeTab]);

  // Request state transition handler
  const handleTransition = async (request: ServiceRequestData, nextStatus: RequestStatus) => {
    const supabase = getSupabaseBrowserClient();

    // Special case 1: unverified table approval on "Approve & send"
    if (request.session_status === 'pending' && nextStatus === 'acknowledged') {
      await supabase
        .from('table_sessions')
        .update({ status: 'open' })
        .eq('id', request.session_id);
    }

    // Special case 2: "Paid & close table" closes the session
    if (request.type === 'bill' && nextStatus === 'done') {
      await supabase
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', request.session_id);
    }

    // Update the request status
    await supabase
      .from('service_requests')
      .update({ status: nextStatus })
      .eq('id', request.id);

    // Refresh state
    await fetchData();
  };

  // S3 Table Drawer handlers
  const handleApproveSession = async (sessionId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('table_sessions')
      .update({ status: 'open' })
      .eq('id', sessionId);
    await fetchData();
  };

  const handleOpenTableManually = async (tableId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('table_sessions').insert({
      table_id: tableId,
      restaurant_id: restaurantId,
      status: 'open',
    });
    await fetchData();
  };

  const handleCloseTable = async (sessionId: string) => {
    const supabase = getSupabaseBrowserClient();
    // Close the session
    await supabase
      .from('table_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Also close any open requests for this session
    await supabase
      .from('service_requests')
      .update({ status: 'done' })
      .eq('session_id', sessionId)
      .not('status', 'in', '(done,cancelled)');

    await fetchData();
  };

  // Toggle availability
  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    const supabase = getSupabaseBrowserClient();
    // Optimistic update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_available: !currentStatus } : i))
    );

    await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', itemId);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/staff/login');
  };

  // Get active session for selected table
  const selectedTableSession = useMemo(() => {
    if (!selectedTable) return null;
    return sessions.find((s) => s.table_id === selectedTable.id) || null;
  }, [selectedTable, sessions]);

  return (
    <div className="w-full min-h-screen bg-[#FFF7EE] text-[#24170F] flex flex-col selection:bg-[#F2C27D]">
      {/* Start Shift Overlay */}
      {!shiftStarted && <StartShiftOverlay onStartShift={handleStartShift} />}

      {/* Header */}
      <CounterHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenSoldOut={() => setIsSoldOutOpen(true)}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        tableCount={displayTables.length}
        packageLevel={packageLevel}
        isLive={isLive}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Mobile Horizontal Table Strip (visible on mobile < 1024px) */}
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[14px] font-extrabold text-[#24170F]">Tables</span>
            <span className="text-[11.5px] text-[#6F5A4B] font-semibold">Tap for details</span>
          </div>
          <div
            aria-label="Tables"
            className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none"
          >
            {tablesWithState.map(({ table, state }) => (
              <TableTile
                key={table.id}
                table={table}
                state={state}
                isCompact
                onClick={() => setSelectedTable(table)}
              />
            ))}
          </div>
        </div>

        {/* Desktop Split Layout (≥ 1024px) / Mobile Stacked Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Desktop Table Grid (hidden on mobile, visible lg:flex) */}
          <div className="hidden lg:flex w-[380px] shrink-0 sticky top-6">
            <TableGrid
              tables={tablesWithState}
              onSelectTable={(t) => setSelectedTable(t)}
              className="w-full bg-white p-5 rounded-3xl border border-[#F0DFCB] shadow-xs"
            />
          </div>

          {/* Right: Request Feed */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <h2 className="text-[18px] font-extrabold text-[#24170F] mr-2 shrink-0">
                Requests
              </h2>
              <button
                type="button"
                data-testid="filter-tab-all"
                onClick={() => setActiveTab('all')}
                className={`h-9.5 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#24170F] text-[#FFF7EE] border-[#24170F]'
                    : 'bg-white text-[#24170F] border-[#F0DFCB] hover:bg-[#FFF7EE]'
                }`}
              >
                <span>All</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FBEBD7] text-[#24170F] text-[11px] font-extrabold flex items-center justify-center">
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                data-testid="filter-tab-calls"
                onClick={() => setActiveTab('calls')}
                className={`h-9.5 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                  activeTab === 'calls'
                    ? 'bg-[#24170F] text-[#FFF7EE] border-[#24170F]'
                    : 'bg-white text-[#24170F] border-[#F0DFCB] hover:bg-[#FFF7EE]'
                }`}
              >
                <span>Calls</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FBEBD7] text-[#24170F] text-[11px] font-extrabold flex items-center justify-center">
                  {counts.calls}
                </span>
              </button>

              <button
                type="button"
                data-testid="filter-tab-orders"
                onClick={() => setActiveTab('orders')}
                className={`h-9.5 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#24170F] text-[#FFF7EE] border-[#24170F]'
                    : 'bg-white text-[#24170F] border-[#F0DFCB] hover:bg-[#FFF7EE]'
                }`}
              >
                <span>Orders</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FBEBD7] text-[#24170F] text-[11px] font-extrabold flex items-center justify-center">
                  {counts.orders}
                </span>
              </button>

              <button
                type="button"
                data-testid="filter-tab-bills"
                onClick={() => setActiveTab('bills')}
                className={`h-9.5 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                  activeTab === 'bills'
                    ? 'bg-[#24170F] text-[#FFF7EE] border-[#24170F]'
                    : 'bg-white text-[#24170F] border-[#F0DFCB] hover:bg-[#FFF7EE]'
                }`}
              >
                <span>Bills</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FBEBD7] text-[#24170F] text-[11px] font-extrabold flex items-center justify-center">
                  {counts.bills}
                </span>
              </button>
            </div>

            {/* Requests Cards List */}
            {filteredRequests.length === 0 ? (
              <div
                data-testid="empty-requests-state"
                className="w-full bg-white rounded-3xl p-12 border border-[#F0DFCB] flex flex-col items-center justify-center text-center gap-3 shadow-2xs"
              >
                <div className="w-14 h-14 rounded-full bg-[#FFF7EE] flex items-center justify-center text-[#8A5A37]">
                  <Coffee className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] font-extrabold text-[#24170F]">
                  All calm ☕
                </h3>
                <p className="text-[13.5px] text-[#6F5A4B] font-medium max-w-sm">
                  New requests and orders will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    timeAgoText={getTimeAgo(req.created_at)}
                    onTransition={handleTransition}
                    onViewBill={(tNum) => {
                      const t = tables.find((tb) => tb.number === tNum);
                      if (t) setSelectedTable(t);
                    }}
                    isMobile={false}
                  />
                ))}
              </div>
            )}

            {/* Collapsible Done Today Section */}
            {doneTodayRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#F0DFCB]">
                <button
                  type="button"
                  onClick={() => setShowDoneToday((s) => !s)}
                  className="flex items-center gap-2 text-[13px] font-bold text-[#8C7767] hover:text-[#24170F] transition-colors"
                >
                  <span>Completed requests ({doneTodayRequests.length})</span>
                  {showDoneToday ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showDoneToday && (
                  <div className="mt-3 flex flex-col gap-2.5 opacity-75">
                    {doneTodayRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white/80 p-3.5 rounded-2xl border border-[#F0DFCB] flex items-center justify-between text-[13px]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-[#6F5A4B]">
                            Table {req.table_number}
                          </span>
                          <span className="font-bold text-[#24170F] capitalize">
                            {req.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#8C7767]">
                          {req.status} · {getTimeAgo(req.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* S3 Table Drawer */}
      <TableDrawer
        table={selectedTable}
        session={selectedTableSession}
        requests={requests}
        isOpen={Boolean(selectedTable)}
        onClose={() => setSelectedTable(null)}
        onApproveSession={handleApproveSession}
        onOpenTableManually={handleOpenTableManually}
        onCloseTable={handleCloseTable}
      />

      {/* Sold Out Quick Dialog */}
      <SoldOutDialog
        isOpen={isSoldOutOpen}
        onClose={() => setIsSoldOutOpen(false)}
        items={menuItems}
        onToggleAvailability={handleToggleAvailability}
      />
    </div>
  );
}
