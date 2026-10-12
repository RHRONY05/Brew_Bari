'use client';

import React from 'react';
import { Coffee, Volume2 } from 'lucide-react';
import { playChime, requestWakeLock } from '@/lib/audio';

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
      className="fixed inset-0 z-50 bg-[#24170F]/70 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-[#F2C27D]"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col items-center text-center gap-5 border border-[#F0DFCB] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-[#6B4226] text-[#F2C27D] flex items-center justify-center shadow-xs">
          <Coffee className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-[#24170F] tracking-tight">
            Start Shift
          </h2>
          <p className="text-[14px] text-[#6F5A4B] font-medium leading-relaxed">
            Welcome to the live counter board. Tap below to unlock order chimes and keep the screen active.
          </p>
        </div>

        <button
          type="button"
          data-testid="start-shift-button"
          onClick={handleStart}
          className="w-full h-13 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[16px] flex items-center justify-center gap-2 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_16px_rgba(227,166,81,0.35)]"
        >
          <Volume2 className="w-5 h-5 stroke-[2.5]" />
          <span>Start shift</span>
        </button>

        <p className="text-[12px] text-[#8C7767] font-medium">
          Keep this screen open. You’ll hear a sound for every request.
        </p>
      </div>
    </div>
  );
}
