'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { playChime, requestWakeLock } from '@/lib/audio';
import { VenueIcon } from '@/themes/ThemeContext';

interface StartShiftOverlayProps {
  onStartShift: () => void;
}

export function StartShiftOverlay({ onStartShift }: StartShiftOverlayProps) {
  const handleStart = async () => {
    playChime();
    await requestWakeLock();
    onStartShift();
  };

  return (
    <div
      data-testid="start-shift-overlay"
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-accent"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col items-center text-center gap-5 border border-line shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-brand text-accent flex items-center justify-center shadow-xs">
          <VenueIcon className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">
            Start Shift
          </h2>
          <p className="text-[14px] text-ink-2 font-medium leading-relaxed">
            Welcome to the live counter board. Tap below to unlock order chimes and keep the screen active.
          </p>
        </div>

        <button
          type="button"
          data-testid="start-shift-button"
          onClick={handleStart}
          className="w-full h-13 rounded-full bg-accent text-ink font-extrabold text-[16px] flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-[0_4px_16px_rgb(var(--accent-rgb)/0.35)]"
        >
          <Volume2 className="w-5 h-5 stroke-[2.5]" />
          <span>Start shift</span>
        </button>

        <p className="text-[12px] text-ink-3 font-medium">
          Keep this screen open. You’ll hear a sound for every request.
        </p>
      </div>
    </div>
  );
}
