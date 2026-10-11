'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface LanguageToggleProps {
  locale: 'en' | 'bn';
  onLocaleChange?: (locale: 'en' | 'bn') => void;
}

export function LanguageToggle({ locale, onLocaleChange }: LanguageToggleProps) {
  const router = useRouter();

  const handleSelect = (nextLocale: 'en' | 'bn') => {
    if (nextLocale === locale) return;

    // Set cookie for 1 year
    document.cookie = `lang=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    if (onLocaleChange) {
      onLocaleChange(nextLocale);
    }

    // Refresh to re-render server components with new locale
    router.refresh();
  };

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="seg inline-flex items-center bg-[#FBEBD7] rounded-full p-[3px]"
    >
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => handleSelect('en')}
        className={`h-[34px] min-w-[44px] px-2.5 rounded-full text-[13px] font-bold transition-all ${
          locale === 'en'
            ? 'bg-white text-[#24170F] shadow-[0_2px_6px_rgba(107,66,38,0.15)]'
            : 'text-[#6F5A4B] hover:text-[#24170F]'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === 'bn'}
        onClick={() => handleSelect('bn')}
        className={`h-[34px] min-w-[44px] px-2.5 rounded-full text-[13px] font-bold transition-all ${
          locale === 'bn'
            ? 'bg-white text-[#24170F] shadow-[0_2px_6px_rgba(107,66,38,0.15)] font-["Hind_Siliguri"]'
            : 'text-[#6F5A4B] hover:text-[#24170F] font-["Hind_Siliguri"]'
        }`}
      >
        বাং
      </button>
    </div>
  );
}
