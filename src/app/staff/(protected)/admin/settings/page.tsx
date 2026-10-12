'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { revalidateMenuAction } from '@/lib/menu/actions';
import type { Database } from '@/types/database';
import {
  Check,
  Building,
  Wifi,
  Share2,
  Receipt,
  Sparkles,
  Save,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type RestaurantRow = Database['public']['Tables']['restaurants']['Row'];

interface PackageDef {
  code: string;
  level: number;
  name: string;
  features: string[];
}

const PACKAGES: PackageDef[] = [
  {
    code: 'P1',
    level: 1,
    name: 'Digital menu',
    features: [
      'Menu, photos, prices, sold-out',
      'Offers & EN / বাংলা toggle',
      'One shop QR to share anywhere',
    ],
  },
  {
    code: 'P2',
    level: 2,
    name: 'Table service',
    features: [
      'Everything in Digital menu',
      'A QR code on every table',
      'Guest list + Call waiter',
      'Live counter board with sound',
    ],
  },
  {
    code: 'P3',
    level: 3,
    name: 'Premium',
    features: [
      'Everything in Table service',
      'Guests place orders & track them',
      'Request bill from the table',
      'Feedback → Google review button',
    ],
  },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [pkg, setPkg] = useState<number>(3);
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [address, setAddress] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [phone, setPhone] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [vatPercent, setVatPercent] = useState<number>(5);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(0);
  const [requireApproval, setRequireApproval] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: staffMember } = await supabase
      .from('staff')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .single();

    if (!staffMember) return;

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', staffMember.restaurant_id)
      .single();

    if (rest) {
      setRestaurant(rest);
      setPkg(Number(rest.package || 3));
      setNameEn(rest.name_en || 'Brew Bari');
      setNameBn(rest.name_bn || 'ব্রু বাড়ি');
      setTaglineEn(rest.tagline_en || '');
      setOpeningHours(rest.opening_hours_en || '');
      setAddress(rest.address || '');
      setWifiName(rest.wifi_name || '');
      setWifiPass(rest.wifi_password || '');
      setPhone(rest.phone || '');
      setMapsUrl(rest.google_maps_url || '');
      setFacebookUrl(rest.facebook_url || '');
      setInstagramUrl(rest.instagram_url || '');
      setGoogleReviewUrl(rest.google_review_url || '');
      setVatPercent(Number(rest.vat_percent ?? 5));
      setServiceChargePercent(Number(rest.service_charge_percent ?? 0));
      setRequireApproval(Boolean(rest.require_session_approval ?? true));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Instant Package Switch
  const handleSelectPackage = async (level: number) => {
    setPkg(level);
    if (!restaurant) return;

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('restaurants')
        .update({ package: level, updated_at: new Date().toISOString() })
        .eq('id', restaurant.id);

      await revalidateMenuAction(restaurant.id, restaurant.slug);
    } catch (err: any) {
      console.error('Failed to update package', err);
    }
  };

  // Save full settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from('restaurants')
        .update({
          package: pkg,
          name_en: nameEn.trim(),
          name_bn: nameBn.trim(),
          tagline_en: taglineEn.trim(),
          opening_hours_en: openingHours.trim(),
          address: address.trim(),
          wifi_name: wifiName.trim(),
          wifi_password: wifiPass.trim(),
          phone: phone.trim(),
          google_maps_url: mapsUrl.trim(),
          facebook_url: facebookUrl.trim(),
          instagram_url: instagramUrl.trim(),
          google_review_url: googleReviewUrl.trim(),
          vat_percent: vatPercent,
          service_charge_percent: serviceChargePercent,
          require_session_approval: requireApproval,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      await revalidateMenuAction(restaurant.id, restaurant.slug);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-[#24170F] tracking-tight">Settings</h1>
          <p className="text-[13px] text-[#6F5A4B] font-medium">
            Café details shown to guests, plus how table service and billing work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[13px] font-bold text-[#1F5C3F] flex items-center gap-1 bg-[#E7F3EC] px-3 py-1.5 rounded-full">
              <Check className="w-4 h-4" />
              Saved!
            </span>
          )}
          <button
            type="submit"
            data-testid="save-settings-button"
            disabled={isSaving}
            className="h-11 px-6 rounded-full bg-[#F2C27D] text-[#24170F] text-[15px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-[#e0b06c] active:scale-98 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#FBE3E0] text-[#9A2F25] rounded-xl text-[13px] font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Package Tier Picker */}
      <section
        aria-label="Package"
        className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 border border-[#F0DFCB]/60 flex flex-col gap-3"
      >
        <div className="flex flex-wrap justify-between items-baseline gap-2">
          <h2 className="text-[17px] font-extrabold text-[#24170F]">Package Level</h2>
          <span className="text-[12px] text-[#8C7767]">
            Switching takes effect immediately across all customer phones.
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Package"
          className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
        >
          {PACKAGES.map((p) => {
            const isSelected = pkg === p.level;
            return (
              <button
                key={p.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`package-card-${p.code.toLowerCase()}`}
                onClick={() => handleSelectPackage(p.level)}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#6B4226] bg-[#FFF7EE] shadow-sm ring-2 ring-[#6B4226]/10'
                    : 'border-[#F0DFCB] bg-white hover:bg-[#FFFBF7]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[12px] font-extrabold text-[#8A5A37] tracking-wider">
                    {p.code}
                  </span>
                  {isSelected && (
                    <span className="h-5 px-2 rounded-full bg-[#6B4226] text-[#FFF7EE] text-[10.5px] font-extrabold flex items-center">
                      Current
                    </span>
                  )}
                </div>

                <div className="text-[17px] font-extrabold text-[#24170F]">{p.name}</div>

                <ul className="flex flex-col gap-1 text-[12px] text-[#6F5A4B] font-semibold mt-1">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#2F7D57] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Café Info */}
        <section
          aria-label="Café info"
          className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 border border-[#F0DFCB]/60 flex flex-col gap-3.5"
        >
          <h2 className="text-[17px] font-extrabold text-[#24170F] flex items-center gap-2">
            <Building className="w-4 h-4 text-[#8A5A37]" />
            Café details
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="n1" className="text-[12px] font-bold text-[#6F5A4B]">
                Name (English)
              </label>
              <input
                id="n1"
                data-testid="settings-name-en-input"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="n2" className="text-[12px] font-bold text-[#6F5A4B]">
                Name (বাংলা)
              </label>
              <input
                id="n2"
                data-testid="settings-name-bn-input"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tg" className="text-[12px] font-bold text-[#6F5A4B]">
              Tagline
            </label>
            <input
              id="tg"
              value={taglineEn}
              onChange={(e) => setTaglineEn(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="hr" className="text-[12px] font-bold text-[#6F5A4B]">
              Opening hours
            </label>
            <input
              id="hr"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ad" className="text-[12px] font-bold text-[#6F5A4B]">
              Address
            </label>
            <input
              id="ad"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>
        </section>

        {/* Wi-Fi & Contact */}
        <section
          aria-label="Wi-Fi and contact"
          className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 border border-[#F0DFCB]/60 flex flex-col gap-3.5"
        >
          <h2 className="text-[17px] font-extrabold text-[#24170F] flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#8A5A37]" />
            Wi-Fi &amp; Contact
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="wn" className="text-[12px] font-bold text-[#6F5A4B]">
                Wi-Fi name (SSID)
              </label>
              <input
                id="wn"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="wp" className="text-[12px] font-bold text-[#6F5A4B]">
                Wi-Fi password
              </label>
              <input
                id="wp"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
              />
            </div>
          </div>
          <span className="text-[11.5px] text-[#8C7767]">
            Guests can copy the password from the Café info sheet.
          </span>

          <div className="flex flex-col gap-1">
            <label htmlFor="ph" className="text-[12px] font-bold text-[#6F5A4B]">
              Phone
            </label>
            <input
              id="ph"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="mp" className="text-[12px] font-bold text-[#6F5A4B]">
              Google Maps link
            </label>
            <input
              id="mp"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>
        </section>

        {/* Social & Reviews */}
        <section
          aria-label="Social and reviews"
          className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 border border-[#F0DFCB]/60 flex flex-col gap-3.5"
        >
          <h2 className="text-[17px] font-extrabold text-[#24170F] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#8A5A37]" />
            Social &amp; Google Reviews
          </h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="gr" className="text-[12px] font-bold text-[#6F5A4B]">
              Google review link
            </label>
            <input
              id="gr"
              data-testid="settings-google-review-url-input"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/.../review"
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
            <span className="text-[11.5px] text-[#8C7767]">
              Every guest sees this button after reviewing or paying the bill in P3.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="fb" className="text-[12px] font-bold text-[#6F5A4B]">
              Facebook page URL
            </label>
            <input
              id="fb"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ig" className="text-[12px] font-bold text-[#6F5A4B]">
              Instagram URL
            </label>
            <input
              id="ig"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F]"
            />
          </div>
        </section>

        {/* Bill & Table Service */}
        <section
          aria-label="Bill and tables"
          className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 border border-[#F0DFCB]/60 flex flex-col gap-3.5"
        >
          <h2 className="text-[17px] font-extrabold text-[#24170F] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#8A5A37]" />
            Bill &amp; Tables
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="vt" className="text-[12px] font-bold text-[#6F5A4B]">
                VAT (%)
              </label>
              <input
                id="vt"
                type="number"
                value={vatPercent}
                onChange={(e) => setVatPercent(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-bold text-[#24170F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sc" className="text-[12px] font-bold text-[#6F5A4B]">
                Service charge (%)
              </label>
              <input
                id="sc"
                type="number"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-bold text-[#24170F]"
              />
            </div>
          </div>

          <div className="flex gap-3 items-center pt-2 border-t border-[#F6E9DA] justify-between">
            <div>
              <div className="text-[14px] font-bold text-[#24170F]">
                Staff approve new table sessions
              </div>
              <div className="text-[12px] text-[#6F5A4B]">
                When on, table sessions start as unverified until approved.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={requireApproval}
              data-testid="toggle-require-approval"
              onClick={() => setRequireApproval(!requireApproval)}
              className={`w-[52px] h-[30px] rounded-full p-[3px] flex shrink-0 transition-colors cursor-pointer ${
                requireApproval ? 'bg-[#2F7D57] justify-end' : 'bg-[#D9C7B4] justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
