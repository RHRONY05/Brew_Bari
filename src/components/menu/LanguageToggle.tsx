'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface LanguageToggleProps {
  locale?: 'en' | 'bn';
  onLocaleChange?: (locale: 'en' | 'bn') => void;
  className?: string;
  size?: 'sm' | 'md';
}

function getInitialLocale(propLocale?: 'en' | 'bn'): 'en' | 'bn' {
  if (propLocale) return propLocale;
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )lang=([a-z]{2})/);
    if (match && (match[1] === 'en' || match[1] === 'bn')) {
      return match[1] as 'en' | 'bn';
    }
  }
  return 'en';
}

export function LanguageToggle({
  locale: propLocale,
  onLocaleChange,
  className = '',
  size = 'md',
}: LanguageToggleProps) {
  const router = useRouter();
  const [internalLocale, setInternalLocale] = React.useState<'en' | 'bn'>(() => getInitialLocale(propLocale));

  const activeLocale = propLocale ?? internalLocale;

  React.useEffect(() => {
    if (propLocale) {
      setInternalLocale(propLocale);
    }
  }, [propLocale]);

  const handleSelect = (nextLocale: 'en' | 'bn') => {
    if (nextLocale === activeLocale) return;

    setInternalLocale(nextLocale);
    // Set cookie for 1 year
    document.cookie = `lang=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLocale;
      document.documentElement.setAttribute('data-lang', nextLocale);
    }

    if (onLocaleChange) {
      onLocaleChange(nextLocale);
    }

    router.refresh();
  };

  const isSmall = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`seg inline-flex items-center bg-surface-2 rounded-full p-[3px] ${className}`}
    >
      <button
        type="button"
        aria-pressed={activeLocale === 'en'}
        onClick={() => handleSelect('en')}
        className={`${
          isSmall ? 'h-[28px] min-w-[36px] px-2 text-[12px]' : 'h-[34px] min-w-[44px] px-2.5 text-[13px]'
        } rounded-full font-bold transition-all cursor-pointer ${
          activeLocale === 'en'
            ? 'bg-surface text-ink shadow-[0_2px_6px_rgba(107,66,38,0.15)]'
            : 'text-ink-2 hover:text-ink'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={activeLocale === 'bn'}
        onClick={() => handleSelect('bn')}
        className={`${
          isSmall ? 'h-[28px] min-w-[36px] px-2 text-[12px]' : 'h-[34px] min-w-[44px] px-2.5 text-[13px]'
        } rounded-full font-bold transition-all cursor-pointer ${
          activeLocale === 'bn'
            ? 'bg-surface text-ink shadow-[0_2px_6px_rgba(107,66,38,0.15)] font-bengali'
            : 'text-ink-2 hover:text-ink font-bengali'
        }`}
      >
        বাং
      </button>
    </div>
  );
}
