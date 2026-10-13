'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { PLATFORM_THEME } from '@/themes';
import { ThemeStyle } from '@/themes/ThemeStyle';
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

  return (
    <main className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 selection:bg-accent selection:text-ink">
      <ThemeStyle theme={PLATFORM_THEME} />
      <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-[0_12px_36px_rgb(var(--shadow-rgb)/0.08)] p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative w-20 h-20 shrink-0">
            <Image
              src={PLATFORM_THEME.assets.logo}
              alt="Menuwala logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-ink tracking-tight">
              Menuwala · Staff portal
            </h1>
            <p className="text-[13.5px] text-ink-2 font-medium mt-0.5">
              Live Counter Board & Management Console
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            data-testid="login-error-alert"
            className="p-3.5 rounded-2xl bg-danger-soft border border-danger-soft flex items-start gap-2.5 text-[13px] font-semibold text-danger"
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
              className="text-[13px] font-bold text-ink flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-brand-muted" />
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
              placeholder="you@restaurant.com"
              className="w-full h-12 px-4 rounded-2xl border border-line bg-bg text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-password"
              className="text-[13px] font-bold text-ink flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-brand-muted" />
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
              className="w-full h-12 px-4 rounded-2xl border border-line bg-bg text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          <button
            type="submit"
            data-testid="staff-login-button"
            disabled={isLoading}
            className="w-full h-13 mt-2 rounded-full bg-accent text-ink font-extrabold text-[15.5px] flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-[0_4px_14px_rgb(var(--accent-rgb)/0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
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

      </div>
    </main>
  );
}
