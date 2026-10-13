import Link from 'next/link';
import { PLATFORM_THEME } from '@/themes';
import { ThemeStyle } from '@/themes/ThemeStyle';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg text-ink p-6 flex flex-col items-center justify-center text-center gap-3">
      <ThemeStyle theme={PLATFORM_THEME} />
      <h1 className="font-heading text-2xl font-extrabold">Page not found</h1>
      <p className="text-ink-2 max-w-sm">
        This link or QR code isn&apos;t valid. If you scanned a table QR, please ask a staff member.
      </p>
      <Link
        href="/"
        className="h-11 px-5 rounded-full bg-brand text-brand-ink font-bold text-[14px] flex items-center hover:bg-brand-dark transition-colors"
      >
        Go to home
      </Link>
    </main>
  );
}
