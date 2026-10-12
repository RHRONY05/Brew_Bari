'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { processImageFile, uploadMenuImage } from '@/lib/storage';
import { revalidateMenuAction } from '@/lib/menu/actions';
import type { Database } from '@/types/database';
import {
  Plus,
  Coffee,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Minus,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type MenuItemRow = Database['public']['Tables']['menu_items']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface OptionChoice {
  title: string;
  price: number;
}

interface OptionGroup {
  id: string;
  title: string;
  required: boolean;
  type: 'single' | 'multiple';
  choices: OptionChoice[];
}

const AVAILABLE_TAGS = ['Hot', 'Iced', 'Bestseller', 'New', 'Seasonal', 'Veg'];

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItemRow> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatBn, setNewCatBn] = useState('');

  // Fetch initial data
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

    const [catRes, itemRes] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', rid)
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', rid)
        .order('sort_order', { ascending: true }),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setItems(itemRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick availability toggle
  const handleToggleAvailability = async (item: MenuItemRow) => {
    const nextVal = !item.is_available;
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, is_available: nextVal } : it))
    );

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: nextVal })
      .eq('id', item.id);

    if (error) {
      // Rollback
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, is_available: item.is_available } : it))
      );
    } else {
      await revalidateMenuAction(restaurantId, 'brew-bari');
    }
  };

  // Open editor for new item
  const handleAddNewItem = () => {
    const defaultCat = categories[0]?.id || '';
    setEditingItem({
      restaurant_id: restaurantId,
      category_id: selectedCatId === 'all' ? defaultCat : selectedCatId,
      name_en: '',
      name_bn: '',
      price: 200,
      compare_at_price: null,
      prep_minutes: 5,
      description_en: '',
      description_bn: '',
      tags: ['Hot'],
      options: [],
      is_available: true,
      is_active: true,
      image_url: null,
    });
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  // Open editor for existing item
  const handleEditItem = (item: MenuItemRow) => {
    setEditingItem({ ...item });
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  // Close editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingItem(null);
    setErrorMessage(null);
  };

  // Handle photo upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    try {
      setIsUploading(true);
      const webpBlob = await processImageFile(file, { aspectRatio: 1, maxDimension: 800 });
      const filename = `item-${Date.now()}.webp`;
      const publicUrl = await uploadMenuImage(restaurantId, 'items', filename, webpBlob);
      setEditingItem((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Save item (Insert or Update)
  const handleSaveItem = async () => {
    if (!editingItem) return;
    if (!editingItem.name_en?.trim()) {
      setErrorMessage('English name is required');
      return;
    }
    if (!editingItem.category_id) {
      setErrorMessage('Category is required');
      return;
    }
    if (!editingItem.price || editingItem.price <= 0) {
      setErrorMessage('Price must be greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const supabase = getSupabaseBrowserClient();

      if (editingItem.id) {
        // Update
        const { error } = await supabase
          .from('menu_items')
          .update({
            name_en: editingItem.name_en,
            name_bn: editingItem.name_bn || '',
            category_id: editingItem.category_id,
            price: Number(editingItem.price),
            compare_at_price: editingItem.compare_at_price ? Number(editingItem.compare_at_price) : null,
            prep_minutes: Number(editingItem.prep_minutes || 5),
            description_en: editingItem.description_en || '',
            description_bn: editingItem.description_bn || '',
            tags: editingItem.tags || [],
            options: (editingItem.options as any) || [],
            is_available: Boolean(editingItem.is_available),
            image_url: editingItem.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('menu_items').insert({
          restaurant_id: restaurantId,
          name_en: editingItem.name_en,
          name_bn: editingItem.name_bn || '',
          category_id: editingItem.category_id,
          price: Number(editingItem.price),
          compare_at_price: editingItem.compare_at_price ? Number(editingItem.compare_at_price) : null,
          prep_minutes: Number(editingItem.prep_minutes || 5),
          description_en: editingItem.description_en || '',
          description_bn: editingItem.description_bn || '',
          tags: editingItem.tags || [],
          options: (editingItem.options as any) || [],
          is_available: Boolean(editingItem.is_available ?? true),
          is_active: true,
          image_url: editingItem.image_url || null,
        });

        if (error) throw error;
      }

      await revalidateMenuAction(restaurantId, 'brew-bari');
      await fetchData();
      handleCloseEditor();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save menu item');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!editingItem?.id) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('menu_items').delete().eq('id', editingItem.id);
      if (error) throw error;

      await fetchData();
      handleCloseEditor();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete item');
    } finally {
      setIsSaving(false);
    }
  };

  // Create Category
  const handleSaveCategory = async () => {
    if (!newCatEn.trim()) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('categories').insert({
        restaurant_id: restaurantId,
        name_en: newCatEn.trim(),
        name_bn: newCatBn.trim() || newCatEn.trim(),
        sort_order: categories.length + 1,
        is_active: true,
      });

      if (error) throw error;
      setNewCatEn('');
      setNewCatBn('');
      setIsCatModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (selectedCatId === 'all') return items;
    return items.filter((it) => it.category_id === selectedCatId);
  }, [items, selectedCatId]);

  // Options groups for the item currently being edited
  const currentOptions: OptionGroup[] = useMemo(() => {
    if (!editingItem?.options || !Array.isArray(editingItem.options)) return [];
    return editingItem.options as unknown as OptionGroup[];
  }, [editingItem?.options]);

  const handleAddOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: `opt-${Date.now()}`,
      title: 'Size',
      required: true,
      type: 'single',
      choices: [
        { title: 'Regular', price: 0 },
        { title: 'Large', price: 60 },
      ],
    };
    setEditingItem((prev) =>
      prev ? { ...prev, options: [...currentOptions, newGroup] as any } : null
    );
  };

  const handleRemoveOptionGroup = (index: number) => {
    const updated = currentOptions.filter((_, idx) => idx !== index);
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleUpdateOptionGroupTitle = (index: number, title: string) => {
    const updated = [...currentOptions];
    updated[index] = { ...updated[index], title };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleUpdateChoice = (
    groupIndex: number,
    choiceIndex: number,
    field: 'title' | 'price',
    value: string | number
  ) => {
    const updated = [...currentOptions];
    const choices = [...updated[groupIndex].choices];
    choices[choiceIndex] = {
      ...choices[choiceIndex],
      [field]: field === 'price' ? Number(value) : value,
    };
    updated[groupIndex] = { ...updated[groupIndex], choices };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleAddChoice = (groupIndex: number) => {
    const updated = [...currentOptions];
    updated[groupIndex] = {
      ...updated[groupIndex],
      choices: [...updated[groupIndex].choices, { title: 'New option', price: 30 }],
    };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Items Section */}
      <section className="flex-1 min-w-0 w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold text-[#24170F] tracking-tight">Menu</h1>
            <p className="text-[13px] text-[#6F5A4B] font-medium">
              Changes show on the guest menu right after saving.
            </p>
          </div>
          <button
            type="button"
            data-testid="add-item-button"
            onClick={handleAddNewItem}
            className="h-11 px-5 rounded-full bg-[#F2C27D] text-[#24170F] text-[14px] font-extrabold flex items-center gap-1.5 shadow-xs hover:bg-[#e0b06c] active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`h-9 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap transition-all ${
              selectedCatId === 'all'
                ? 'bg-[#6B4226] border-[#6B4226] text-[#FFF7EE]'
                : 'border-[#F0DFCB] bg-white text-[#24170F] hover:bg-[#FFF7EE]'
            }`}
          >
            All · {items.length}
          </button>
          {categories.map((cat) => {
            const count = items.filter((it) => it.category_id === cat.id).length;
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`h-9 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#6B4226] border-[#6B4226] text-[#FFF7EE]'
                    : 'border-[#F0DFCB] bg-white text-[#24170F] hover:bg-[#FFF7EE]'
                }`}
              >
                {cat.name_en} · {count}
              </button>
            );
          })}
          <button
            type="button"
            data-testid="add-category-button"
            onClick={() => setIsCatModalOpen(true)}
            className="h-9 px-3.5 rounded-full border border-dashed border-[#D9C7B4] bg-white text-[#6F5A4B] text-[13px] font-bold whitespace-nowrap hover:bg-[#FFF7EE] transition-all"
          >
            + Category
          </button>
        </div>

        {/* Items List Card */}
        <div className="bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] overflow-hidden border border-[#F0DFCB]/40">
          <div className="flex justify-between px-4 py-2.5 text-[11.5px] font-extrabold tracking-wider uppercase text-[#8C7767] border-b border-[#F6E9DA]">
            <span>Item</span>
            <span>Price · Available</span>
          </div>

          <div className="divide-y divide-[#F6E9DA]">
            {filteredItems.map((item) => {
              const isSelected = editingItem?.id === item.id;
              const isAvailable = Boolean(item.is_available);
              const prep = item.prep_minutes || 5;
              const subText = isAvailable
                ? `~${prep} min${item.tags && item.tags.length > 0 ? ' · ' + item.tags.join(' · ') : ''}`
                : 'Sold out — hidden from ordering';

              return (
                <div
                  key={item.id}
                  data-testid={`menu-item-row-${item.id}`}
                  className={`flex items-center gap-3 p-3 transition-colors ${
                    isSelected ? 'bg-[#FFF7EE]' : 'hover:bg-[#FFFBF7]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-[#FBEBD7] text-[#B98A5E] flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Coffee className="w-6 h-6" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-bold text-[#24170F] truncate">
                      <span data-testid="item-name-en">{item.name_en}</span>{' '}
                      {item.name_bn && (
                        <span className="font-normal text-[#6F5A4B]">· {item.name_bn}</span>
                      )}
                    </div>
                    <div
                      className={`text-[12px] font-semibold truncate ${
                        isAvailable ? 'text-[#6F5A4B]' : 'text-[#B83B30]'
                      }`}
                    >
                      {subText}
                    </div>
                  </div>

                  {/* Price */}
                  <span className="text-[15px] font-extrabold text-[#24170F] font-mono shrink-0">
                    ৳{item.price}
                  </span>

                  {/* Availability switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAvailable}
                    aria-label={`${item.name_en} available`}
                    data-testid={`availability-switch-${item.id}`}
                    onClick={() => handleToggleAvailability(item)}
                    className={`w-[52px] h-[30px] rounded-full p-[3px] flex shrink-0 transition-colors cursor-pointer ${
                      isAvailable
                        ? 'bg-[#2F7D57] justify-end'
                        : 'bg-[#D9C7B4] justify-start'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    aria-label={`Edit ${item.name_en}`}
                    data-testid={`edit-item-${item.id}`}
                    onClick={() => handleEditItem(item)}
                    className="w-9 h-9 rounded-full text-[#6F5A4B] hover:bg-[#FBEBD7] hover:text-[#24170F] flex items-center justify-center shrink-0 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Item Editor Aside Panel (Desktop side panel / Mobile overlay) */}
      {isEditorOpen && editingItem && (
        <aside
          aria-label="Edit item"
          data-testid="item-editor-panel"
          className="w-full xl:w-[420px] shrink-0 bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 flex flex-col gap-4 border border-[#F0DFCB]/60 sticky top-4 z-40"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-[#F6E9DA]">
            <h2 className="text-[18px] font-extrabold text-[#24170F]">
              {editingItem.id ? `Edit · ${editingItem.name_en || 'Item'}` : 'Add New Item'}
            </h2>
            <button
              type="button"
              onClick={handleCloseEditor}
              className="w-8 h-8 rounded-full text-[#6F5A4B] hover:bg-[#FFF7EE] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div
              data-testid="editor-error-alert"
              className="p-3 bg-[#FBE3E0] text-[#9A2F25] rounded-xl text-[13px] font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo upload */}
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 rounded-2xl bg-[#FBEBD7] text-[#B98A5E] flex items-center justify-center shrink-0 overflow-hidden relative">
              {editingItem.image_url ? (
                <img
                  src={editingItem.image_url}
                  alt="Item preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Coffee className="w-8 h-8" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label
                htmlFor="photo-upload-input"
                className="h-9 px-3.5 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FFF7EE] active:scale-98 transition-all w-fit"
              >
                <Upload className="w-3.5 h-3.5 text-[#8A5A37]" />
                {editingItem.image_url ? 'Change photo' : 'Upload photo'}
              </label>
              <input
                id="photo-upload-input"
                data-testid="item-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <span className="text-[11.5px] text-[#8C7767]">
                Square WebP cropped automatically
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="ne" className="text-[12px] font-bold text-[#6F5A4B]">
                Name (English)
              </label>
              <input
                id="ne"
                data-testid="item-name-en-input"
                value={editingItem.name_en || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name_en: e.target.value })}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F] focus:outline-[#8A5A37]"
                placeholder="e.g. Americano"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nb" className="text-[12px] font-bold text-[#6F5A4B]">
                Name (বাংলা)
              </label>
              <input
                id="nb"
                data-testid="item-name-bn-input"
                value={editingItem.name_bn || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name_bn: e.target.value })}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F] focus:outline-[#8A5A37]"
                placeholder="e.g. আমেরিকান"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="pr" className="text-[12px] font-bold text-[#6F5A4B]">
                Price (৳)
              </label>
              <input
                id="pr"
                data-testid="item-price-input"
                type="number"
                value={editingItem.price ?? ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, price: Number(e.target.value) })
                }
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-bold text-[#24170F] focus:outline-[#8A5A37]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="wp" className="text-[12px] font-bold text-[#6F5A4B]">
                Was price (৳)
              </label>
              <input
                id="wp"
                data-testid="item-was-price-input"
                type="number"
                value={editingItem.compare_at_price ?? ''}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    compare_at_price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="optional"
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F] focus:outline-[#8A5A37]"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="ca" className="text-[12px] font-bold text-[#6F5A4B]">
                Category
              </label>
              <select
                id="ca"
                data-testid="item-category-select"
                value={editingItem.category_id || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value })}
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F] focus:outline-[#8A5A37] bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="pt" className="text-[12px] font-bold text-[#6F5A4B]">
                Prep time (minutes)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="prep-minus"
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      prep_minutes: Math.max(1, (editingItem.prep_minutes || 5) - 1),
                    })
                  }
                  className="w-10 h-10 rounded-xl border border-[#F0DFCB] bg-white text-[#24170F] flex items-center justify-center hover:bg-[#FFF7EE]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 h-10 rounded-xl bg-[#FFF7EE] flex items-center justify-center font-bold text-[15px] text-[#24170F]">
                  ~{editingItem.prep_minutes || 5} min
                </div>
                <button
                  type="button"
                  data-testid="prep-plus"
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      prep_minutes: Math.min(60, (editingItem.prep_minutes || 5) + 1),
                    })
                  }
                  className="w-10 h-10 rounded-xl border border-[#F0DFCB] bg-white text-[#24170F] flex items-center justify-center hover:bg-[#FFF7EE]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[11.5px] text-[#6F5A4B] mt-0.5">
                {(editingItem.prep_minutes || 5) <= 1
                  ? 'Guests see: Ready now'
                  : (editingItem.prep_minutes || 5) <= 5
                  ? 'Guests see: ~X min · Listed under Quick'
                  : 'Guests see: ~X min'}
              </span>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="de" className="text-[12px] font-bold text-[#6F5A4B]">
                Description (English)
              </label>
              <input
                id="de"
                data-testid="item-desc-en-input"
                value={editingItem.description_en || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description_en: e.target.value })
                }
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F] focus:outline-[#8A5A37]"
                placeholder="e.g. Espresso meets rich steamed milk."
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="db" className="text-[12px] font-bold text-[#6F5A4B]">
                Description (বাংলা)
              </label>
              <input
                id="db"
                data-testid="item-desc-bn-input"
                value={editingItem.description_bn || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description_bn: e.target.value })
                }
                className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] text-[#24170F] focus:outline-[#8A5A37]"
                placeholder="ঐতিহ্যবাহী কফি"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-[#6F5A4B]">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = editingItem.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const prev = editingItem.tags || [];
                      const updated = isSelected
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag];
                      setEditingItem({ ...editingItem, tags: updated });
                    }}
                    className={`h-7.5 px-3 rounded-full text-[12px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#F2C27D] border-[#F2C27D] text-[#24170F]'
                        : 'bg-white border-[#F0DFCB] text-[#6F5A4B] hover:bg-[#FFF7EE]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options Builder */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-bold text-[#6F5A4B]">Options &amp; Add-ons</label>
              <button
                type="button"
                data-testid="add-option-group-button"
                onClick={handleAddOptionGroup}
                className="text-[12px] font-bold text-[#8A5A37] hover:underline"
              >
                + Add group
              </button>
            </div>

            {currentOptions.map((group, gIdx) => (
              <div
                key={group.id || gIdx}
                className="border border-[#F0DFCB] rounded-xl p-3 bg-[#FFFBF7] flex flex-col gap-2"
              >
                <div className="flex justify-between items-center gap-2">
                  <input
                    value={group.title}
                    onChange={(e) => handleUpdateOptionGroupTitle(gIdx, e.target.value)}
                    className="h-8 rounded-lg border border-[#F0DFCB] px-2 text-[13px] font-bold text-[#24170F] bg-white flex-1"
                    placeholder="Group title (e.g. Size, Milk)"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionGroup(gIdx)}
                    className="w-7 h-7 rounded-md text-[#B83B30] hover:bg-[#FBE3E0] flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pl-1">
                  {group.choices.map((choice, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <input
                        value={choice.title}
                        onChange={(e) =>
                          handleUpdateChoice(gIdx, cIdx, 'title', e.target.value)
                        }
                        className="h-7.5 rounded-md border border-[#F0DFCB] px-2 text-[12px] font-semibold text-[#24170F] bg-white flex-1"
                        placeholder="Choice (e.g. Regular)"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] text-[#6F5A4B] font-bold">+৳</span>
                        <input
                          type="number"
                          value={choice.price}
                          onChange={(e) =>
                            handleUpdateChoice(gIdx, cIdx, 'price', e.target.value)
                          }
                          className="w-14 h-7.5 rounded-md border border-[#F0DFCB] px-1 text-[12px] font-bold text-[#24170F] bg-white text-right"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddChoice(gIdx)}
                    className="text-[11.5px] font-bold text-[#8A5A37] hover:underline self-start mt-0.5"
                  >
                    + Add choice
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-[#F6E9DA] mt-1">
            <button
              type="button"
              data-testid="save-item-button"
              disabled={isSaving}
              onClick={handleSaveItem}
              className="flex-1 h-11 rounded-full bg-[#F2C27D] text-[#24170F] text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-xs hover:bg-[#e0b06c] active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
            <button
              type="button"
              data-testid="cancel-item-button"
              onClick={handleCloseEditor}
              className="h-11 px-4 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[14px] font-bold hover:bg-[#FFF7EE] active:scale-98 transition-all"
            >
              Cancel
            </button>
            {editingItem.id && (
              <button
                type="button"
                data-testid="delete-item-button"
                onClick={handleDeleteItem}
                className="w-11 h-11 rounded-full border border-[#FBE3E0] bg-[#FBE3E0]/40 text-[#B83B30] flex items-center justify-center hover:bg-[#FBE3E0] active:scale-98 transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* New Category Modal */}
      {isCatModalOpen && (
        <div
          data-testid="category-modal"
          className="fixed inset-0 z-50 bg-[#24170F]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-[#F0DFCB]">
            <div className="flex justify-between items-center">
              <h3 className="text-[17px] font-extrabold text-[#24170F]">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="w-8 h-8 rounded-full text-[#6F5A4B] hover:bg-[#FFF7EE] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Name (English)</label>
                <input
                  data-testid="cat-name-en-input"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
                  placeholder="e.g. Bakery"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6F5A4B]">Name (বাংলা)</label>
                <input
                  data-testid="cat-name-bn-input"
                  value={newCatBn}
                  onChange={(e) => setNewCatBn(e.target.value)}
                  className="h-10 rounded-xl border border-[#F0DFCB] px-3 text-[14px] font-semibold text-[#24170F]"
                  placeholder="e.g. বেকারি"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                data-testid="save-category-button"
                onClick={handleSaveCategory}
                className="flex-1 h-11 rounded-full bg-[#F2C27D] text-[#24170F] text-[14px] font-extrabold hover:bg-[#e0b06c] active:scale-98 transition-all"
              >
                Create category
              </button>
              <button
                type="button"
                data-testid="cancel-category-button"
                onClick={() => setIsCatModalOpen(false)}
                className="h-11 px-4 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] text-[13px] font-bold hover:bg-[#FFF7EE]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
