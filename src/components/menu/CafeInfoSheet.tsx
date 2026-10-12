'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Wifi, MapPin, Clock, Phone, ExternalLink, Check, Copy } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { Restaurant } from '@/lib/menu/data';
import { pick } from '@/lib/i18n';

interface CafeInfoSheetProps {
  restaurant: Restaurant;
  isOpen: boolean;
  locale: 'en' | 'bn';
  onClose: () => void;
}

export function CafeInfoSheet({
  restaurant,
  isOpen,
  locale,
  onClose,
}: CafeInfoSheetProps) {
  const [copied, setCopied] = useState(false);

  const name = pick(restaurant, 'name', locale);
  const hours = pick(restaurant, 'opening_hours', locale) || restaurant.opening_hours_en || '';
  const address = restaurant.address || 'GEC Circle, Chattogram';
  const phone = restaurant.phone || '+880 1812-345678';
  const wifiName = restaurant.wifi_name || 'BrewBari_Guest';
  const wifiPass = restaurant.wifi_password || 'coffee2026';

  const handleCopyWifi = async () => {
    try {
      await navigator.clipboard.writeText(wifiPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={name}>

      <div className="flex flex-col gap-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="relative w-14 h-14 shrink-0">
            <Image
              src="/images/brand/concept-1.png"
              alt="Brew Bari Logo"
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-ink tracking-tight">{name}</h2>
            <div className="text-[13px] font-bold text-success">
              {locale === 'bn' ? 'খোলা আছে · রাত ১১টা পর্যন্ত' : 'Open now · until 11 PM'}
            </div>
          </div>
        </div>

        {/* Free Wi-Fi box */}
        {wifiName && (
          <div className="p-4 rounded-2xl bg-brand text-bg flex items-center gap-3.5 shadow-sm">
            <Wifi className="w-7 h-7 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-surface-2 font-semibold truncate">
                {locale === 'bn' ? 'ফ্রি ওয়াই-ফাই' : 'Free Wi-Fi'} · {wifiName}
              </div>
              <div className="text-[18px] font-extrabold tracking-wide text-white select-all">
                {wifiPass}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyWifi}
              className="h-9 px-3.5 rounded-full bg-accent text-ink text-[13px] font-extrabold flex items-center gap-1.5 hover:bg-accent-strong active:scale-95 transition-all shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{locale === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.2]" />
                  <span>{locale === 'bn' ? 'কপি' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Rows */}
        <div className="flex flex-col divide-y divide-line-soft text-ink">
          {/* Address */}
          <div className="py-3 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface-2 text-brand flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-ink-3">
                {locale === 'bn' ? 'ঠিকানা' : 'Address'}
              </div>
              <div className="text-[14.5px] font-bold truncate">{address}</div>
            </div>
            {restaurant.google_maps_url && (
              <a
                href={restaurant.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-full border border-line bg-white text-ink text-[12.5px] font-bold flex items-center gap-1 hover:bg-bg"
              >
                <span>{locale === 'bn' ? 'ম্যাপ' : 'Map'}</span>
                <ExternalLink className="w-3 h-3 text-ink-3" />
              </a>
            )}
          </div>

          {/* Opening hours */}
          <div className="py-3 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface-2 text-brand flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-ink-3">
                {locale === 'bn' ? 'সময়সূচি' : 'Opening hours'}
              </div>
              <div className="text-[14.5px] font-bold truncate">{hours}</div>
            </div>
          </div>

          {/* Phone */}
          <div className="py-3 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface-2 text-brand flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-ink-3">
                {locale === 'bn' ? 'ফোন' : 'Phone'}
              </div>
              <div className="text-[14.5px] font-bold truncate">{phone}</div>
            </div>
            <a
              href={`tel:${phone}`}
              className="h-8 px-3 rounded-full border border-line bg-white text-ink text-[12.5px] font-bold flex items-center hover:bg-bg"
            >
              {locale === 'bn' ? 'কল' : 'Call'}
            </a>
          </div>
        </div>

        {/* Social Links */}
        {(restaurant.facebook_url || restaurant.instagram_url) && (
          <div className="pt-2 flex flex-col gap-2">
            <div className="text-[13px] font-bold text-ink-2">
              {locale === 'bn' ? 'আমাদের সোশ্যাল মিডিয়া' : 'Follow us'}
            </div>
            <div className="flex gap-2">
              {restaurant.facebook_url && (
                <a
                  href={restaurant.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-11 rounded-full border border-line bg-white text-ink text-[13.5px] font-bold flex items-center justify-center hover:bg-bg"
                >
                  Facebook
                </a>
              )}
              {restaurant.instagram_url && (
                <a
                  href={restaurant.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-11 rounded-full border border-line bg-white text-ink text-[13.5px] font-bold flex items-center justify-center hover:bg-bg"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        )}

        {/* Close action */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full h-12 rounded-full bg-bg text-ink text-[15px] font-bold flex items-center justify-center hover:bg-surface-2 transition-colors"
        >
          {locale === 'bn' ? 'মেন্যুতে ফিরে যান' : 'Back to menu'}
        </button>
      </div>
    </BottomSheet>
  );
}
