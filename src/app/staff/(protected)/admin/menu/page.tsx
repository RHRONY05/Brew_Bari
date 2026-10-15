'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { processImageFile, uploadMenuImage } from '@/lib/storage';
import { revalidateMenuAction } from '@/lib/menu/actions';
import { useStaffRestaurant } from '@/components/staff/StaffRestaurantContext';
import type { Database } from '@/types/database';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Minus,
  Upload,
  AlertCircle,
  Loader2,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { CategoryIcon, CATEGORY_ICON_PRESETS } from '@/components/ui/category-icon';
import { VenueIcon } from '@/themes/ThemeContext';
import { ItemOptions } from '@/lib/schemas';

type MenuItemRow = Database['public']['Tables']['menu_items']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface OptionChoiceEditor {
  id: string;
  name_en: string;
  name_bn?: string;
  price_delta: number;
  description_en?: string;
  description_bn?: string;
  compare_delta?: number | null;
  heat?: number | null;
}

interface OptionGroupEditor {
  id: string;
  name_en: string;
  name_bn?: string;
  type: 'single' | 'multi';
  required: boolean;
  display?: 'list' | 'cards' | 'chips' | '';
  show_if?: { group: string; choice: string } | null;
  choices: OptionChoiceEditor[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

function normalizeOptions(raw: unknown): OptionGroupEditor[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((g: any, gIdx: number) => {
    const groupId = slugify(g.id || g.name_en || g.title) || `group-${gIdx + 1}`;
    const name_en = g.name_en || g.title || '';
    const name_bn = g.name_bn || '';
    const type = g.type === 'multiple' || g.type === 'multi' ? 'multi' : 'single';
    const required = g.required ?? true;
    const display = g.display || '';
    const show_if =
      g.show_if?.group && g.show_if?.choice
        ? { group: g.show_if.group, choice: g.show_if.choice }
        : null;

    const choices: OptionChoiceEditor[] = Array.isArray(g.choices)
      ? g.choices.map((c: any, cIdx: number) => {
          const choiceId = slugify(c.id || c.name_en || c.title) || `choice-${cIdx + 1}`;
          const cNameEn = c.name_en || c.title || '';
          const cNameBn = c.name_bn || '';
          const priceDelta = Number(c.price_delta !== undefined ? c.price_delta : (c.price ?? 0));
          return {
            id: choiceId,
            name_en: cNameEn,
            name_bn: cNameBn,
            price_delta: priceDelta,
            description_en: c.description_en || '',
            description_bn: c.description_bn || '',
            compare_delta:
              c.compare_delta !== undefined && c.compare_delta !== null
                ? Number(c.compare_delta)
                : null,
            heat: c.heat !== undefined && c.heat !== null ? Number(c.heat) : null,
          };
        })
      : [];

    return {
      id: groupId,
      name_en,
      name_bn,
      type,
      required,
      display,
      show_if,
      choices,
    };
  });
}

const AVAILABLE_TAGS = ['Hot', 'Iced', 'Bestseller', 'New', 'Seasonal', 'Veg', 'pairs-well'];

export default function AdminMenuPage() {
  const { restaurant } = useStaffRestaurant();
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
  const [newCatIcon, setNewCatIcon] = useState('☕');

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
      await revalidateMenuAction(restaurantId, restaurant.slug);
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
      spice_level: null,
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

    // Clean up and validate options using Zod schema
    let formattedOptions: any[] = [];
    if (currentOptions.length > 0) {
      const cleaned = currentOptions.map((g, gIdx) => {
        const groupId = slugify(g.id || g.name_en) || `group-${gIdx + 1}`;
        const choices = (g.choices || []).map((c, cIdx) => {
          const choiceId = slugify(c.id || c.name_en) || `choice-${cIdx + 1}`;
          const choiceObj: any = {
            id: choiceId,
            name_en: (c.name_en || '').trim(),
            price_delta: Number(c.price_delta || 0),
          };
          if (c.name_bn?.trim()) choiceObj.name_bn = c.name_bn.trim();
          if (c.description_en?.trim()) choiceObj.description_en = c.description_en.trim();
          if (c.description_bn?.trim()) choiceObj.description_bn = c.description_bn.trim();
          if (
            c.compare_delta !== undefined &&
            c.compare_delta !== null &&
            Number(c.compare_delta) > Number(c.price_delta || 0)
          ) {
            choiceObj.compare_delta = Number(c.compare_delta);
          }
          if (
            c.heat !== undefined &&
            c.heat !== null &&
            Number(c.heat) >= 1 &&
            Number(c.heat) <= 4
          ) {
            choiceObj.heat = Number(c.heat);
          }
          return choiceObj;
        });

        const groupObj: any = {
          id: groupId,
          name_en: (g.name_en || '').trim(),
          type: g.type === 'multi' ? 'multi' : 'single',
          required: Boolean(g.required),
          choices,
        };
        if (g.name_bn?.trim()) groupObj.name_bn = g.name_bn.trim();
        if (g.display && ['list', 'cards', 'chips'].includes(g.display)) {
          groupObj.display = g.display;
        }
        if (g.show_if?.group && g.show_if?.choice) {
          groupObj.show_if = {
            group: g.show_if.group,
            choice: g.show_if.choice,
          };
        }
        return groupObj;
      });

      const parsed = ItemOptions.safeParse(cleaned);
      if (!parsed.success) {
        const err = parsed.error.issues.map((e) => e.message).join('; ');
        setErrorMessage(`Invalid options: ${err}`);
        return;
      }
      formattedOptions = parsed.data;
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
            name_en: editingItem.name_en.trim(),
            name_bn: editingItem.name_bn?.trim() || '',
            category_id: editingItem.category_id,
            price: Number(editingItem.price),
            compare_at_price: editingItem.compare_at_price ? Number(editingItem.compare_at_price) : null,
            prep_minutes: Number(editingItem.prep_minutes || 5),
            description_en: editingItem.description_en || '',
            description_bn: editingItem.description_bn || '',
            tags: editingItem.tags || [],
            options: formattedOptions as any,
            spice_level: editingItem.spice_level !== undefined ? editingItem.spice_level : null,
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
          name_en: editingItem.name_en.trim(),
          name_bn: editingItem.name_bn?.trim() || '',
          category_id: editingItem.category_id,
          price: Number(editingItem.price),
          compare_at_price: editingItem.compare_at_price ? Number(editingItem.compare_at_price) : null,
          prep_minutes: Number(editingItem.prep_minutes || 5),
          description_en: editingItem.description_en || '',
          description_bn: editingItem.description_bn || '',
          tags: editingItem.tags || [],
          options: formattedOptions as any,
          spice_level: editingItem.spice_level !== undefined ? editingItem.spice_level : null,
          is_available: Boolean(editingItem.is_available ?? true),
          is_active: true,
          image_url: editingItem.image_url || null,
        });

        if (error) throw error;
      }

      await revalidateMenuAction(restaurantId, restaurant.slug);
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
        icon: newCatIcon || '☕',
        sort_order: categories.length + 1,
        is_active: true,
      });

      if (error) throw error;
      setNewCatEn('');
      setNewCatBn('');
      setNewCatIcon('☕');
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
  const currentOptions: OptionGroupEditor[] = normalizeOptions(editingItem?.options);

  const handleAddOptionGroup = () => {
    const count = currentOptions.length + 1;
    const newGroup: OptionGroupEditor = {
      id: `size-${count}`,
      name_en: 'Size',
      name_bn: 'সাইজ',
      required: true,
      type: 'single',
      display: '',
      show_if: null,
      choices: [
        { id: 'regular', name_en: 'Regular', name_bn: 'রেগুলার', price_delta: 0 },
        { id: 'large', name_en: 'Large', name_bn: 'লার্জ', price_delta: 60 },
      ],
    };
    setEditingItem((prev) =>
      prev ? { ...prev, options: [...currentOptions, newGroup] as any } : null
    );
  };

  const handleRemoveOptionGroup = (index: number) => {
    const removedId = currentOptions[index]?.id;
    const updated = currentOptions
      .filter((_, idx) => idx !== index)
      .map((g) => {
        // Clear show_if if it referenced the removed group
        if (g.show_if?.group === removedId) {
          return { ...g, show_if: null };
        }
        return g;
      });
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleUpdateGroup = (index: number, patch: Partial<OptionGroupEditor>) => {
    const updated = [...currentOptions];
    updated[index] = { ...updated[index], ...patch };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleAddChoice = (groupIndex: number) => {
    const updated = [...currentOptions];
    const cCount = updated[groupIndex].choices.length + 1;
    updated[groupIndex] = {
      ...updated[groupIndex],
      choices: [
        ...updated[groupIndex].choices,
        {
          id: `choice-${cCount}`,
          name_en: 'New option',
          price_delta: 30,
        },
      ],
    };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleRemoveChoice = (groupIndex: number, choiceIndex: number) => {
    const updated = [...currentOptions];
    const choices = updated[groupIndex].choices.filter((_, idx) => idx !== choiceIndex);
    updated[groupIndex] = { ...updated[groupIndex], choices };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  const handleUpdateChoice = (
    groupIndex: number,
    choiceIndex: number,
    patch: Partial<OptionChoiceEditor>
  ) => {
    const updated = [...currentOptions];
    const choices = [...updated[groupIndex].choices];
    choices[choiceIndex] = {
      ...choices[choiceIndex],
      ...patch,
    };
    updated[groupIndex] = { ...updated[groupIndex], choices };
    setEditingItem((prev) => (prev ? { ...prev, options: updated as any } : null));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
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
            <h1 className="text-[24px] font-extrabold text-ink tracking-tight">Menu</h1>
            <p className="text-[13px] text-ink-2 font-medium">
              Changes show on the guest menu right after saving.
            </p>
          </div>
          <button
            type="button"
            data-testid="add-item-button"
            onClick={handleAddNewItem}
            className="h-11 px-5 rounded-full bg-accent text-ink text-[14px] font-extrabold flex items-center gap-1.5 shadow-xs hover:bg-accent-strong active:scale-98 transition-all"
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
            className={`h-9 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              selectedCatId === 'all'
                ? 'bg-brand border-brand text-bg'
                : 'border-line bg-white text-ink hover:bg-bg'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
            <span>All · {items.length}</span>
          </button>
          {categories.map((cat) => {
            const count = items.filter((it) => it.category_id === cat.id).length;
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`h-9 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-brand border-brand text-bg'
                    : 'border-line bg-white text-ink hover:bg-bg'
                }`}
              >
                <CategoryIcon
                  icon={cat.icon}
                  name={cat.name_en}
                  themeKey={restaurant?.theme_key}
                  className={`w-4 h-4 stroke-[2.2] shrink-0 ${isSelected ? 'text-accent' : 'text-brand'}`}
                />
                <span>{cat.name_en} · {count}</span>
              </button>
            );
          })}
          <button
            type="button"
            data-testid="add-category-button"
            onClick={() => setIsCatModalOpen(true)}
            className="h-9 px-3.5 rounded-full border border-dashed border-line bg-white text-ink-2 text-[13px] font-bold whitespace-nowrap flex items-center gap-1.5 hover:bg-bg transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
            <span>Category</span>
          </button>
        </div>

        {/* Items List Card */}
        <div className="bg-white rounded-[20px] shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.08)] overflow-hidden border border-line/40">
          <div className="flex justify-between px-4 py-2.5 text-[11.5px] font-extrabold tracking-wider uppercase text-ink-3 border-b border-line-soft">
            <span>Item</span>
            <span>Price · Available</span>
          </div>

          <div className="divide-y divide-line-soft">
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
                    isSelected ? 'bg-bg' : 'hover:bg-surface-subtle'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-surface-2 text-brand-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VenueIcon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-bold text-ink truncate">
                      <span data-testid="item-name-en">{item.name_en}</span>{' '}
                      {item.name_bn && (
                        <span className="font-normal text-ink-2">· {item.name_bn}</span>
                      )}
                    </div>
                    <div
                      className={`text-[12px] font-semibold truncate ${
                        isAvailable ? 'text-ink-2' : 'text-danger'
                      }`}
                    >
                      {subText}
                    </div>
                  </div>

                  {/* Price */}
                  <span className="text-[15px] font-extrabold text-ink font-mono shrink-0">
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
                        ? 'bg-success justify-end'
                        : 'bg-line justify-start'
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
                    className="w-9 h-9 rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink flex items-center justify-center shrink-0 transition-all"
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
          className="w-full xl:w-[420px] shrink-0 bg-white rounded-[20px] shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.08)] p-5 flex flex-col gap-4 border border-line/60 sticky top-4 z-40"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-line-soft">
            <h2 className="text-[18px] font-extrabold text-ink">
              {editingItem.id ? `Edit · ${editingItem.name_en || 'Item'}` : 'Add New Item'}
            </h2>
            <button
              type="button"
              onClick={handleCloseEditor}
              className="w-8 h-8 rounded-full text-ink-2 hover:bg-bg flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div
              data-testid="editor-error-alert"
              className="p-3 bg-danger-soft text-danger rounded-xl text-[13px] font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo upload */}
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 text-brand-muted flex items-center justify-center shrink-0 overflow-hidden relative">
              {editingItem.image_url ? (
                <img
                  src={editingItem.image_url}
                  alt="Item preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <VenueIcon className="w-8 h-8" />
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
                className="h-9 px-3.5 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bg active:scale-98 transition-all w-fit"
              >
                <Upload className="w-3.5 h-3.5 text-brand-muted" />
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
              <span className="text-[11.5px] text-ink-3">
                Square WebP cropped automatically
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="ne" className="text-[12px] font-bold text-ink-2">
                Name (English)
              </label>
              <input
                id="ne"
                data-testid="item-name-en-input"
                value={editingItem.name_en || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name_en: e.target.value })}
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink focus:outline-brand-muted"
                placeholder="e.g. Americano"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nb" className="text-[12px] font-bold text-ink-2">
                Name (বাংলা)
              </label>
              <input
                id="nb"
                data-testid="item-name-bn-input"
                value={editingItem.name_bn || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name_bn: e.target.value })}
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink focus:outline-brand-muted"
                placeholder="e.g. আমেরিকান"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="pr" className="text-[12px] font-bold text-ink-2">
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
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-bold text-ink focus:outline-brand-muted"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="wp" className="text-[12px] font-bold text-ink-2">
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
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink focus:outline-brand-muted"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="ca" className="text-[12px] font-bold text-ink-2">
                Category
              </label>
              <select
                id="ca"
                data-testid="item-category-select"
                value={editingItem.category_id || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value })}
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink focus:outline-brand-muted bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="spice" className="text-[12px] font-bold text-ink-2">
                Spice level (chili heat rating)
              </label>
              <select
                id="spice"
                data-testid="item-spice-level-select"
                value={editingItem.spice_level ?? ''}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    spice_level: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink focus:outline-brand-muted bg-white"
              >
                <option value="">None (not spicy / regular)</option>
                <option value="1">1 - Mild 🌶️</option>
                <option value="2">2 - Medium 🌶️🌶️</option>
                <option value="3">3 - Hot 🌶️🌶️🌶️</option>
                <option value="4">4 - Naga hot 🌶️🌶️🌶️🌶️</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="pt" className="text-[12px] font-bold text-ink-2">
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
                  className="w-10 h-10 rounded-xl border border-line bg-white text-ink flex items-center justify-center hover:bg-bg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 h-10 rounded-xl bg-bg flex items-center justify-center font-bold text-[15px] text-ink">
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
                  className="w-10 h-10 rounded-xl border border-line bg-white text-ink flex items-center justify-center hover:bg-bg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[11.5px] text-ink-2 mt-0.5">
                {(editingItem.prep_minutes || 5) <= 1
                  ? 'Guests see: Ready now'
                  : (editingItem.prep_minutes || 5) <= 5
                  ? 'Guests see: ~X min · Listed under Quick'
                  : 'Guests see: ~X min'}
              </span>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="de" className="text-[12px] font-bold text-ink-2">
                Description (English)
              </label>
              <input
                id="de"
                data-testid="item-desc-en-input"
                value={editingItem.description_en || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description_en: e.target.value })
                }
                className="h-10 rounded-xl border border-line px-3 text-[14px] text-ink focus:outline-brand-muted"
                placeholder="e.g. Espresso meets rich steamed milk."
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="db" className="text-[12px] font-bold text-ink-2">
                Description (বাংলা)
              </label>
              <input
                id="db"
                data-testid="item-desc-bn-input"
                value={editingItem.description_bn || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description_bn: e.target.value })
                }
                className="h-10 rounded-xl border border-line px-3 text-[14px] text-ink focus:outline-brand-muted"
                placeholder="ঐতিহ্যবাহী কফি"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-ink-2">Tags</label>
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
                        ? 'bg-accent border-accent text-ink'
                        : 'bg-white border-line text-ink-2 hover:bg-bg'
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
              <label className="text-[12px] font-bold text-ink-2">Options &amp; Add-ons</label>
              <button
                type="button"
                data-testid="add-option-group-button"
                onClick={handleAddOptionGroup}
                className="text-[12px] font-bold text-brand-muted hover:underline"
              >
                + Add group
              </button>
            </div>

            {currentOptions.map((group, gIdx) => (
              <div
                key={group.id || gIdx}
                data-testid={`option-group-card-${gIdx}`}
                className="border border-line rounded-xl p-3 bg-surface-subtle flex flex-col gap-2.5 shadow-2xs"
              >
                {/* Group titles & remove */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      data-testid={`option-group-title-${gIdx}`}
                      value={group.name_en}
                      onChange={(e) =>
                        handleUpdateGroup(gIdx, {
                          name_en: e.target.value,
                          id: group.id || slugify(e.target.value),
                        })
                      }
                      className="h-8 rounded-lg border border-line px-2 text-[13px] font-bold text-ink bg-white"
                      placeholder="Group title (e.g. Size, Milk)"
                    />
                    <input
                      data-testid={`option-group-title-bn-${gIdx}`}
                      value={group.name_bn || ''}
                      onChange={(e) => handleUpdateGroup(gIdx, { name_bn: e.target.value })}
                      className="h-8 rounded-lg border border-line px-2 text-[13px] font-medium text-ink bg-white"
                      placeholder="বাংলা নাম (ঐচ্ছিক)"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove option group ${group.name_en || gIdx + 1}`}
                    onClick={() => handleRemoveOptionGroup(gIdx)}
                    className="w-7 h-7 rounded-md text-danger hover:bg-danger-soft flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Group Controls: Slug ID, Type, Display, Required */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 items-center text-[11.5px]">
                  <input
                    data-testid={`option-group-id-${gIdx}`}
                    value={group.id}
                    onChange={(e) => handleUpdateGroup(gIdx, { id: slugify(e.target.value) })}
                    className="h-7.5 rounded-md border border-line px-2 text-[11px] font-mono text-ink-2 bg-white"
                    placeholder="slug-id"
                    title="Group identifier slug"
                  />
                  <select
                    data-testid={`option-group-type-${gIdx}`}
                    value={group.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'single' | 'multi';
                      const patch: Partial<OptionGroupEditor> = { type: newType };
                      if (newType === 'multi' && group.display === 'cards') {
                        patch.display = '';
                      }
                      handleUpdateGroup(gIdx, patch);
                    }}
                    className="h-7.5 rounded-md border border-line px-1.5 font-bold text-ink bg-white"
                  >
                    <option value="single">Single (radio)</option>
                    <option value="multi">Multiple (checkbox)</option>
                  </select>
                  <select
                    data-testid={`option-group-display-${gIdx}`}
                    value={group.display || ''}
                    onChange={(e) =>
                      handleUpdateGroup(gIdx, {
                        display: e.target.value as any,
                      })
                    }
                    className="h-7.5 rounded-md border border-line px-1.5 font-bold text-ink bg-white"
                  >
                    <option value="">Display: Default</option>
                    <option value="cards">Display: Cards (max 3)</option>
                    <option value="list">Display: List</option>
                    <option value="chips">Display: Chips</option>
                  </select>
                  <label className="flex items-center gap-1.5 font-bold text-ink cursor-pointer select-none px-1">
                    <input
                      data-testid={`option-group-required-${gIdx}`}
                      type="checkbox"
                      checked={group.required}
                      onChange={(e) => handleUpdateGroup(gIdx, { required: e.target.checked })}
                      className="rounded accent-brand w-3.5 h-3.5"
                    />
                    <span>Required</span>
                  </label>
                </div>

                {/* Conditional Visibility (show_if): only available if there are earlier groups */}
                {gIdx > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-white/70 p-2 rounded-lg border border-line/60">
                    <span className="font-bold text-ink-2 shrink-0">Show conditionally:</span>
                    <select
                      data-testid={`option-group-show-if-group-${gIdx}`}
                      value={group.show_if?.group || ''}
                      onChange={(e) => {
                        const pGroup = e.target.value;
                        if (!pGroup) {
                          handleUpdateGroup(gIdx, { show_if: null });
                        } else {
                          const parentGroupObj = currentOptions
                            .slice(0, gIdx)
                            .find((og) => og.id === pGroup);
                          const firstChoiceId = parentGroupObj?.choices[0]?.id || '';
                          handleUpdateGroup(gIdx, {
                            show_if: { group: pGroup, choice: firstChoiceId },
                          });
                        }
                      }}
                      className="h-7 rounded border border-line px-1.5 font-semibold text-ink bg-white flex-1"
                    >
                      <option value="">Always visible (no parent)</option>
                      {currentOptions.slice(0, gIdx).map((og) => (
                        <option key={og.id} value={og.id}>
                          If [{og.name_en || og.id}] is...
                        </option>
                      ))}
                    </select>
                    {group.show_if?.group && (
                      <select
                        data-testid={`option-group-show-if-choice-${gIdx}`}
                        value={group.show_if.choice}
                        onChange={(e) =>
                          handleUpdateGroup(gIdx, {
                            show_if: { group: group.show_if!.group, choice: e.target.value },
                          })
                        }
                        className="h-7 rounded border border-line px-1.5 font-semibold text-ink bg-white flex-1"
                      >
                        {currentOptions
                          .find((og) => og.id === group.show_if?.group)
                          ?.choices.map((c) => (
                            <option key={c.id} value={c.id}>
                              Choice: {c.name_en || c.id}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Choices List */}
                <div className="flex flex-col gap-2 pt-1 border-t border-line/50">
                  {group.choices.map((choice, cIdx) => (
                    <div
                      key={choice.id || cIdx}
                      data-testid={`choice-card-${gIdx}-${cIdx}`}
                      className="bg-white p-2 rounded-lg border border-line/60 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          data-testid={`choice-name-en-${gIdx}-${cIdx}`}
                          value={choice.name_en}
                          onChange={(e) =>
                            handleUpdateChoice(gIdx, cIdx, {
                              name_en: e.target.value,
                              id: choice.id || slugify(e.target.value),
                            })
                          }
                          className="h-7.5 rounded-md border border-line px-2 text-[12px] font-semibold text-ink bg-white flex-1"
                          placeholder="Choice (e.g. Regular)"
                        />
                        <input
                          data-testid={`choice-name-bn-${gIdx}-${cIdx}`}
                          value={choice.name_bn || ''}
                          onChange={(e) => handleUpdateChoice(gIdx, cIdx, { name_bn: e.target.value })}
                          className="h-7.5 rounded-md border border-line px-2 text-[12px] font-normal text-ink bg-white w-24"
                          placeholder="বাংলা (ঐচ্ছিক)"
                        />
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="text-[11px] text-ink-2 font-bold">+৳</span>
                          <input
                            data-testid={`choice-price-${gIdx}-${cIdx}`}
                            type="number"
                            value={choice.price_delta}
                            onChange={(e) =>
                              handleUpdateChoice(gIdx, cIdx, { price_delta: Number(e.target.value) })
                            }
                            className="w-14 h-7.5 rounded-md border border-line px-1 text-[12px] font-bold text-ink bg-white text-right"
                          />
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove choice ${choice.name_en || cIdx + 1}`}
                          data-testid={`delete-choice-${gIdx}-${cIdx}`}
                          onClick={() => handleRemoveChoice(gIdx, cIdx)}
                          className="w-6 h-6 rounded text-ink-3 hover:text-danger flex items-center justify-center shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtext, compare price, and heat row */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <input
                          data-testid={`choice-desc-en-${gIdx}-${cIdx}`}
                          value={choice.description_en || ''}
                          onChange={(e) =>
                            handleUpdateChoice(gIdx, cIdx, { description_en: e.target.value })
                          }
                          className="h-6 rounded border border-line px-1.5 text-[11px] text-ink-2 bg-surface-subtle flex-1 min-w-[120px]"
                          placeholder="Subtext (e.g. + Fries & drink)"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-ink-3">Was +৳</span>
                          <input
                            data-testid={`choice-compare-${gIdx}-${cIdx}`}
                            type="number"
                            value={choice.compare_delta ?? ''}
                            onChange={(e) =>
                              handleUpdateChoice(gIdx, cIdx, {
                                compare_delta: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            placeholder="200"
                            className="w-12 h-6 rounded border border-line px-1 text-[11px] text-ink bg-surface-subtle text-right"
                            title="Compare at price delta (must be > price delta)"
                          />
                        </div>
                        <select
                          data-testid={`choice-heat-${gIdx}-${cIdx}`}
                          value={choice.heat ?? ''}
                          onChange={(e) =>
                            handleUpdateChoice(gIdx, cIdx, {
                              heat: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-6 rounded border border-line px-1 text-[11px] font-medium text-ink bg-surface-subtle shrink-0"
                        >
                          <option value="">No heat</option>
                          <option value="1">🌶️ Mild (1)</option>
                          <option value="2">🌶️🌶️ Medium (2)</option>
                          <option value="3">🌶️🌶️🌶️ Hot (3)</option>
                          <option value="4">🌶️🌶️🌶️🌶️ Naga (4)</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddChoice(gIdx)}
                    className="text-[11.5px] font-bold text-brand-muted hover:underline self-start mt-0.5"
                  >
                    + Add choice
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-line-soft mt-1">
            <button
              type="button"
              data-testid="save-item-button"
              disabled={isSaving}
              onClick={handleSaveItem}
              className="flex-1 h-11 rounded-full bg-accent text-ink text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-xs hover:bg-accent-strong active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
            <button
              type="button"
              data-testid="cancel-item-button"
              onClick={handleCloseEditor}
              className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[14px] font-bold hover:bg-bg active:scale-98 transition-all"
            >
              Cancel
            </button>
            {editingItem.id && (
              <button
                type="button"
                data-testid="delete-item-button"
                onClick={handleDeleteItem}
                className="w-11 h-11 rounded-full border border-danger-soft bg-danger-soft/40 text-danger flex items-center justify-center hover:bg-danger-soft active:scale-98 transition-all shrink-0"
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
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-line">
            <div className="flex justify-between items-center">
              <h3 className="text-[17px] font-extrabold text-ink">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="w-8 h-8 rounded-full text-ink-2 hover:bg-bg flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-ink-2">Name (English)</label>
                <input
                  data-testid="cat-name-en-input"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink"
                  placeholder="e.g. Bakery"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-ink-2">Name (বাংলা)</label>
                <input
                  data-testid="cat-name-bn-input"
                  value={newCatBn}
                  onChange={(e) => setNewCatBn(e.target.value)}
                  className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink"
                  placeholder="e.g. বেকারি"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-ink-2">Category Icon</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_ICON_PRESETS.map((preset) => {
                    const isSelected = newCatIcon === preset.icon;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setNewCatIcon(preset.icon)}
                        className={`h-8 px-2.5 rounded-lg border text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-brand text-bg border-brand shadow-xs'
                            : 'bg-white border-line text-ink hover:bg-bg'
                        }`}
                      >
                        <CategoryIcon icon={preset.icon} name={preset.label} className="w-3.5 h-3.5 shrink-0" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                data-testid="save-category-button"
                onClick={handleSaveCategory}
                className="flex-1 h-11 rounded-full bg-accent text-ink text-[14px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all"
              >
                Create category
              </button>
              <button
                type="button"
                data-testid="cancel-category-button"
                onClick={() => setIsCatModalOpen(false)}
                className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg"
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
