import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">Sales Pitch Demo</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1 text-white">Brew Bari (ব্রিউ বাড়ি)</h1>
          <p className="text-sm text-neutral-400 mt-2">
            Modern QR Menu & Table-Service platform for restaurants & cafés.
          </p>
        </div>

        <div className="grid gap-3 text-left">
          <Link
            href="/m/brew-bari"
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 transition-colors block"
          >
            <div className="font-semibold text-white">Guest Menu (P1)</div>
            <div className="text-xs text-neutral-400">Public shop menu, category browsing & offers</div>
          </Link>

          <Link
            href="/t/test-table-99"
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 transition-colors block"
          >
            <div className="font-semibold text-white">Table Experience (P2 / P3)</div>
            <div className="text-xs text-neutral-400">Order from table, call waiter, request bill</div>
          </Link>

          <Link
            href="/staff/counter"
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 transition-colors block"
          >
            <div className="font-semibold text-white">Counter Board</div>
            <div className="text-xs text-neutral-400">Live order queue with realtime audio chime</div>
          </Link>

          <Link
            href="/staff/admin"
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 transition-colors block"
          >
            <div className="font-semibold text-white">Admin Dashboard</div>
            <div className="text-xs text-neutral-400">Menu management, QR printing, package switches</div>
          </Link>
        </div>
      </div>
    </main>
  )
}
