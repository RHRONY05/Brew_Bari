'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { processImageFile, uploadMenuImage } from '@/lib/storage';
import { revalidateMenuAction } from '@/lib/menu/actions';
import type { Database } from '@/types/database';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

type OfferRow = Database['public']['Tables']['offers']['Row'];

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [offers, setOffers] = useState<OfferRow[]>([]);

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<OfferRow> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const rid = staffMember.restaurant_id;
    setRestaurantId(rid);

    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .eq('restaurant_id', rid)
      .order('sort_order', { ascending: true });

    if (offersData) {
      setOffers(offersData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle active
  const handleToggleActive = async (offer: OfferRow) => {
    const nextVal = !offer.is_active;
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, is_active: nextVal } : o))
    );

    const supabase = getSupabaseBrowserClient();
    await supabase.from('offers').update({ is_active: nextVal }).eq('id', offer.id);
    await revalidateMenuAction(restaurantId, 'brew-bari');
  };

  // Add new offer
  const handleAddNew = () => {
    setEditingOffer({
      restaurant_id: restaurantId,
      title_en: '',
      title_bn: '',
      badge_en: 'Special',
      badge_bn: 'বিশেষ অফার',
      subtitle_en: '',
      subtitle_bn: '',
      is_active: true,
      image_url: null,
      starts_at: null,
      ends_at: null,
      sort_order: offers.length + 1,
    });
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  // Edit existing offer
  const handleEdit = (offer: OfferRow) => {
    setEditingOffer({ ...offer });
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  // Image Upload (2:1 banner aspect ratio)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingOffer) return;

    try {
      setIsUploading(true);
      const webpBlob = await processImageFile(file, { aspectRatio: 2, maxDimension: 900 });
      const filename = `offer-${Date.now()}.webp`;
      const publicUrl = await uploadMenuImage(restaurantId, 'offers', filename, webpBlob);
      setEditingOffer((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Save offer
  const handleSave = async () => {
    if (!editingOffer) return;
    if (!editingOffer.title_en?.trim()) {
      setErrorMessage('English title is required');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const supabase = getSupabaseBrowserClient();

      if (editingOffer.id) {
        // Update
        const { error } = await supabase
          .from('offers')
          .update({
            title_en: editingOffer.title_en,
            title_bn: editingOffer.title_bn || editingOffer.title_en,
            badge_en: editingOffer.badge_en || 'Offer',
            badge_bn: editingOffer.badge_bn || 'অফার',
            subtitle_en: editingOffer.subtitle_en || '',
            subtitle_bn: editingOffer.subtitle_bn || '',
            image_url: editingOffer.image_url || null,
            is_active: Boolean(editingOffer.is_active),
            starts_at: editingOffer.starts_at || null,
            ends_at: editingOffer.ends_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOffer.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('offers').insert({
          restaurant_id: restaurantId,
          title_en: editingOffer.title_en,
          title_bn: editingOffer.title_bn || editingOffer.title_en,
          badge_en: editingOffer.badge_en || 'Offer',
          badge_bn: editingOffer.badge_bn || 'অফার',
          subtitle_en: editingOffer.subtitle_en || '',
          subtitle_bn: editingOffer.subtitle_bn || '',
          image_url: editingOffer.image_url || null,
          is_active: Boolean(editingOffer.is_active ?? true),
          starts_at: editingOffer.starts_at || null,
          ends_at: editingOffer.ends_at || null,
          sort_order: offers.length + 1,
        });

        if (error) throw error;
      }

      await revalidateMenuAction(restaurantId, 'brew-bari');
      await fetchData();
      setIsEditorOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete offer
  const handleDelete = async () => {
    if (!editingOffer?.id) return;
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('offers').delete().eq('id', editingOffer.id);
      if (error) throw error;

      await revalidateMenuAction(restaurantId, 'brew-bari');
      await fetchData();
      setIsEditorOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete offer');
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
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-[#24170F] tracking-tight">Offers</h1>
          <p className="text-[13px] text-[#6F5A4B] font-medium">
            Live offers appear in the carousel banner at the top of the guest menu.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-offer-button"
          onClick={handleAddNew}
          className="h-11 px-5 rounded-full bg-[#F2C27D] text-[#24170F] text-[14px] font-extrabold flex items-center gap-1.5 shadow-xs hover:bg-[#e0b06c] active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          New offer
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.map((offer) => {
          const isActive = Boolean(offer.is_active);
          const now = new Date().toISOString();
          let statusText = 'Live now';
          let statusBadgeClass = 'bg-[#E7F3EC] text-[#1F5C3F]';

          if (!isActive) {
            statusText = 'Paused';
            statusBadgeClass = 'bg-[#F0E6DA] text-[#6F5A4B]';
          } else if (offer.starts_at && offer.starts_at > now) {
            statusText = 'Scheduled';
            statusBadgeClass = 'bg-[#E3EDFA] text-[#22508F]';
          } else if (offer.ends_at && offer.ends_at < now) {
            statusText = 'Expired';
            statusBadgeClass = 'bg-[#FBE3E0] text-[#9A2F25]';
          }

          return (
            <article
              key={offer.id}
              data-testid={`offer-card-${offer.id}`}
              className="bg-white rounded-[22px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] overflow-hidden border border-[#F0DFCB]/60 flex flex-col transition-all hover:shadow-md"
            >
              {/* Banner Header (2:1 aspect) */}
              <div
                className={`h-36 relative overflow-hidden p-4 flex flex-col justify-between text-white transition-all ${
                  isActive ? 'bg-[#6B4226]' : 'bg-[#6B4226]/60 grayscale'
                }`}
                style={
                  offer.image_url
                    ? {
                        backgroundImage: `linear-gradient(rgba(36,23,15,0.4), rgba(36,23,15,0.75)), url(${offer.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <div className="flex justify-between items-start">
                  <span className="h-5 px-2 rounded-full bg-[#F2C27D] text-[#24170F] text-[10px] font-extrabold uppercase tracking-wider flex items-center">
                    {offer.badge_en || 'Offer'}
                  </span>
                </div>

                <div>
                  <h3 className="text-[18px] font-extrabold leading-tight text-[#FFF7EE]">
                    {offer.title_en}
                  </h3>
                  {offer.subtitle_en && (
                    <p className="text-[12px] text-[#F3E3CF] line-clamp-1 mt-0.5">
                      {offer.subtitle_en}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`h-5.5 px-2 rounded-full text-[11px] font-extrabold inline-flex items-center w-fit ${statusBadgeClass}`}
                  >
                    {statusText}
                  </span>
                  <span className="text-[11.5px] text-[#6F5A4B] font-semibold">
                    {offer.title_bn}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label={`${offer.title_en} active`}
                    data-testid={`toggle-offer-${offer.id}`}
                    onClick={() => handleToggleActive(offer)}
                    className={`w-[52px] h-[30px] rounded-full p-[3px] flex shrink-0 transition-colors cursor-pointer ${
                      isActive ? 'bg-[#2F7D57] justify-end' : 'bg-[#D9C7B4] justify-start'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Edit ${offer.title_en}`}
                    data-testid={`edit-offer-${offer.id}`}
                    onClick={() => handleEdit(offer)}
                    className="w-9 h-9 rounded-full text-[#6F5A4B] hover:bg-[#FBEBD7] flex items-center justify-center shrink-0 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Offer Editor Modal */}
      {isEditorOpen && editingOffer && (
        <div
          data-testid="offer-editor-modal"
          className="fixed inset-0 z-50 bg-[#24170F]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-[#F0DFCB] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#F6E9DA]">
              <h3 className="text-[17px] font-extrabold text-[#24170F]">
                {editingOffer.id ? `Edit · ${editingOffer.title_en}` : 'New Offer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full text-[#6F5A4B] hover:bg-[#FFF7EE] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FBE3E0] text-[#9A2F25] rounded-xl text-[13px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Banner preview & upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[#6F5A4B]">Banner Image (2:1)</label>
              <div
                className="h-32 rounded-2xl bg-[#FBEBD7] border border-[#F0DFCB] flex items-center justify-center overflow-hidden relative"
                style={
                  editingOffer.image_url
                    ? {
                        backgroundImage: `url(${editingOffer.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {!editingOffer.image_url && (
                  <span className="text-[12px] text-[#8C7767] font-semibold">
                    No image uploaded
                  </span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              <label className="h-8.5 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] text-[12.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FFF7EE] active:scale-98 transition-all w-fit mt-1">
                <Upload className="w-3.5 h-3.5 text-[#8A5A37]" />
                Upload 2:1 banner image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Title (English)</label>
                <input
                  data-testid="offer-title-en-input"
                  value={editingOffer.title_en || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, title_en: e.target.value })
                  }
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
                  placeholder="e.g. Morning Combo"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Title (বাংলা)</label>
                <input
                  data-testid="offer-title-bn-input"
                  value={editingOffer.title_bn || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, title_bn: e.target.value })
                  }
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
                  placeholder="e.g. সকালের কম্বো"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#6F5A4B]">Badge (English)</label>
                  <input
                    value={editingOffer.badge_en || ''}
                    onChange={(e) =>
                      setEditingOffer({ ...editingOffer, badge_en: e.target.value })
                    }
                    className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[13px] font-semibold text-[#24170F]"
                    placeholder="e.g. Save ৳50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#6F5A4B]">Badge (বাংলা)</label>
                  <input
                    value={editingOffer.badge_bn || ''}
                    onChange={(e) =>
                      setEditingOffer({ ...editingOffer, badge_bn: e.target.value })
                    }
                    className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[13px] font-semibold text-[#24170F]"
                    placeholder="e.g. ৳৫০ ছাড়"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Subtitle (English)</label>
                <input
                  value={editingOffer.subtitle_en || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, subtitle_en: e.target.value })
                  }
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[13px] font-semibold text-[#24170F]"
                  placeholder="e.g. Cappuccino + Croissant"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Subtitle (বাংলা)</label>
                <input
                  value={editingOffer.subtitle_bn || ''}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, subtitle_bn: e.target.value })
                  }
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[13px] font-semibold text-[#24170F]"
                  placeholder="e.g. ক্যাপুচিনো + ক্রোসাঁ"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#F6E9DA] mt-1">
              <button
                type="button"
                data-testid="save-offer-button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 h-11 rounded-full bg-[#F2C27D] text-[#24170F] text-[15px] font-extrabold flex items-center justify-center shadow-xs hover:bg-[#e0b06c] active:scale-98 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save offer'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="h-11 px-4 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[13px] font-bold hover:bg-[#FFF7EE]"
              >
                Cancel
              </button>
              {editingOffer.id && (
                <button
                  type="button"
                  data-testid="delete-offer-button"
                  onClick={handleDelete}
                  className="w-11 h-11 rounded-full border border-[#FBE3E0] bg-[#FBE3E0]/40 text-[#B83B30] flex items-center justify-center hover:bg-[#FBE3E0] active:scale-98 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
