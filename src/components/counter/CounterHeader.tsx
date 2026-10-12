'use client';

import React from 'react';
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
    <header className="w-full bg-white border-b border-[#F0DFCB] px-4 md:px-6 py-3 md:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#6B4226] text-[#F2C27D] flex items-center justify-center font-extrabold text-[15px] shrink-0 shadow-xs">
          BB
        </div>
        <div>
          <h1 className="text-[17px] font-extrabold text-[#24170F] tracking-tight leading-tight">
            Brew Bari · Counter
          </h1>
          <p className="text-[12px] text-[#6F5A4B] font-medium">
            Package {packageLevel} · {tableCount} tables
          </p>
        </div>

        {/* Live Indicator */}
        <div
          data-testid="connection-indicator"
          className={`h-7 px-3 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 transition-colors ${
            isLive
              ? 'bg-[#E7F3EC] text-[#1F5C3F]'
              : 'bg-[#FEF3D6] text-[#8C5D08]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-[#2F9E6B] animate-pulse' : 'bg-[#E69D00]'
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
          className="h-10 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF7EE] active:scale-97 transition-all"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-[#2F9E6B]" />
              <span className="hidden sm:inline">Sound on</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-[#8C7767]" />
              <span className="hidden sm:inline">Sound off</span>
            </>
          )}
        </button>

        <button
          type="button"
          data-testid="open-sold-out-button"
          onClick={onOpenSoldOut}
          className="h-10 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF7EE] hover:text-[#24170F] active:scale-97 transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-[#8A5A37]" />
          <span>Sold out items</span>
        </button>

        {isAdmin && (
          <Link
            href="/staff/admin"
            data-testid="admin-link-button"
            className="h-10 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF7EE] hover:text-[#24170F] active:scale-97 transition-all"
          >
            <Settings className="w-4 h-4 text-[#8A5A37]" />
            <span>Admin</span>
          </Link>
        )}

        <button
          type="button"
          data-testid="staff-logout-button"
          onClick={onLogout}
          className="h-10 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF0EE] hover:text-[#CE2C31] hover:border-[#FCD2CD] active:scale-97 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
