'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check role in staff table
      const { data: staffMember } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const role = staffMember?.role;
      const target = role === 'admin' ? '/staff/admin' : '/staff/counter';
      window.location.href = target;
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string) => {
    setEmail(fillEmail);
    // Standard test account password from setup / 06-TESTING.md
    setPassword('CoffeeBari2026!');
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-[#FFF7EE] flex flex-col justify-center items-center p-4 selection:bg-[#F2C27D] selection:text-[#24170F]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#F0DFCB] shadow-[0_12px_36px_rgba(107,66,38,0.08)] p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#6B4226] text-[#F2C27D] flex items-center justify-center font-extrabold text-xl shadow-xs">
            BB
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#24170F] tracking-tight">
              Brew Bari · Staff Portal
            </h1>
            <p className="text-[13.5px] text-[#6F5A4B] font-medium mt-0.5">
              Live Counter Board & Management Console
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            data-testid="login-error-alert"
            className="p-3.5 rounded-2xl bg-[#FFF0EE] border border-[#FCD2CD] flex items-start gap-2.5 text-[13px] font-semibold text-[#CE2C31]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[2.5]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-email"
              className="text-[13px] font-bold text-[#24170F] flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#8A5A37]" />
              Staff Email
            </label>
            <input
              id="staff-email"
              data-testid="staff-email-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. counter@brewbari.com"
              className="w-full h-12 px-4 rounded-2xl border border-[#F0DFCB] bg-[#FFF7EE] text-[14.5px] text-[#24170F] placeholder:text-[#8C7767] focus:outline-none focus:ring-2 focus:ring-[#6B4226]/20 focus:border-[#6B4226] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-password"
              className="text-[13px] font-bold text-[#24170F] flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#8A5A37]" />
              Password
            </label>
            <input
              id="staff-password"
              data-testid="staff-password-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 px-4 rounded-2xl border border-[#F0DFCB] bg-[#FFF7EE] text-[14.5px] text-[#24170F] placeholder:text-[#8C7767] focus:outline-none focus:ring-2 focus:ring-[#6B4226]/20 focus:border-[#6B4226] transition-all"
            />
          </div>

          <button
            type="submit"
            data-testid="staff-login-button"
            disabled={isLoading}
            className="w-full h-13 mt-2 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[15.5px] flex items-center justify-center gap-2 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_14px_rgba(227,166,81,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill */}
        <div className="border-t border-[#F0DFCB]/60 pt-4 flex flex-col gap-2.5">
          <div className="text-[12px] font-bold text-[#8C7767] uppercase tracking-wider text-center">
            Demo Accounts Quick-Fill
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('counter@brewbari.com')}
              className="flex-1 py-2 px-3 rounded-xl border border-[#F0DFCB] bg-[#FFF7EE] text-[12.5px] font-bold text-[#6B4226] hover:bg-[#FBEBD7] transition-colors flex items-center justify-center gap-1.5"
            >
              <Coffee className="w-3.5 h-3.5 shrink-0" />
              <span>Counter Staff</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@brewbari.com')}
              className="flex-1 py-2 px-3 rounded-xl border border-[#F0DFCB] bg-[#FFF7EE] text-[12.5px] font-bold text-[#6B4226] hover:bg-[#FBEBD7] transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Admin / Owner</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
