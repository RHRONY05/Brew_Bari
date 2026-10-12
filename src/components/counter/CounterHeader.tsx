'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX, AlertTriangle, Settings, LogOut, CheckCircle2 } from 'lucide-react';

interface CounterHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSoldOut: () => void;
  isAdmin: boolean;
  onLogout: () => void;
  tableCount: number;
  packageLevel?: string;
  isLive: boolean;
}

export function CounterHeader({
  soundEnabled,
  onToggleSound,
  onOpenSoldOut,
  isAdmin,
  onLogout,
  tableCount,
  packageLevel = 'P3',
  isLive,
}: CounterHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-line px-4 md:px-6 py-3 md:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src="/images/brand/concept-1.png"
            alt="Brew Bari Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
        </div>
        <div>
          <h1 className="font-heading text-[17px] font-extrabold text-ink tracking-tight leading-tight">
            Brew Bari · Counter
          </h1>
          <p className="text-[12px] text-ink-2 font-medium">
            Package {packageLevel} · {tableCount} tables
          </p>
        </div>

        {/* Live Indicator */}
        <div
          data-testid="connection-indicator"
          className={`h-7 px-3 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 transition-colors ${
            isLive
              ? 'bg-success-soft text-success'
              : 'bg-warning-soft text-warning'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-success animate-pulse' : 'bg-warning'
            }`}
          />
          <span>{isLive ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          type="button"
          data-testid="toggle-sound-button"
          onClick={onToggleSound}
          className="h-10 px-3.5 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-97 transition-all"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-success" />
              <span className="hidden sm:inline">Sound on</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-ink-3" />
              <span className="hidden sm:inline">Sound off</span>
            </>
          )}
        </button>

        <button
          type="button"
          data-testid="open-sold-out-button"
          onClick={onOpenSoldOut}
          className="h-10 px-3.5 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg hover:text-ink active:scale-97 transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-brand-muted" />
          <span>Sold out items</span>
        </button>

        {isAdmin && (
          <Link
            href="/staff/admin"
            data-testid="admin-link-button"
            className="h-10 px-3.5 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg hover:text-ink active:scale-97 transition-all"
          >
            <Settings className="w-4 h-4 text-brand-muted" />
            <span>Admin</span>
          </Link>
        )}

        <button
          type="button"
          data-testid="staff-logout-button"
          onClick={onLogout}
          className="h-10 px-3.5 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold flex items-center gap-1.5 hover:bg-danger-soft hover:text-danger hover:border-danger-soft active:scale-97 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
