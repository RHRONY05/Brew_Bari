'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Star, Loader2, MessageSquareQuote, RefreshCw } from 'lucide-react';

interface FeedbackItem {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  session_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  tables?: {
    number: number;
    label: string | null;
  } | null;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderStars(rating: number) {
  return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
}

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  const fetchFeedback = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: staffMember } = await supabase
      .from('staff')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .single();

    if (!staffMember) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*, tables(number, label)')
      .eq('restaurant_id', staffMember.restaurant_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeedbackList(data as unknown as FeedbackItem[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchFeedback();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('admin-feedback-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => {
          fetchFeedback(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeedback]);

  // Statistics
  const { avgRating, totalCount, distribution, maxCount } = useMemo(() => {
    const total = feedbackList.length;
    if (total === 0) {
      return {
        avgRating: 0,
        totalCount: 0,
        distribution: [5, 4, 3, 2, 1].map((n) => ({ star: n, count: 0 })),
        maxCount: 1,
      };
    }

    const sum = feedbackList.reduce((acc, f) => acc + f.rating, 0);
    const avg = Math.round((sum / total) * 10) / 10;

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackList.forEach((f) => {
      if (counts[f.rating] !== undefined) {
        counts[f.rating]++;
      }
    });

    const dist = [5, 4, 3, 2, 1].map((n) => ({
      star: n,
      count: counts[n] || 0,
    }));

    const max = Math.max(...dist.map((d) => d.count), 1);

    return {
      avgRating: avg,
      totalCount: total,
      distribution: dist,
      maxCount: max,
    };
  }, [feedbackList]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] lg:text-[26px] font-extrabold text-ink tracking-tight">
            Feedback
          </h1>
          <p className="text-[12.5px] lg:text-[13.5px] text-ink-2 mt-0.5">
            Private ratings from guests after their bill. Last 30 days.
          </p>
        </div>
        <button
          onClick={() => fetchFeedback()}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line text-xs font-bold text-ink-2 hover:bg-white active:scale-95 transition-all shadow-2xs"
          title="Refresh feedback"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-[20px] p-12 flex flex-col items-center justify-center text-center shadow-xs border border-line/60">
          <Loader2 className="w-8 h-8 text-brand-muted animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink-2">Loading customer feedback...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Summary Card */}
          <section
            aria-label="Summary"
            className="bg-white rounded-[20px] p-5 shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.06)] border border-line/40 lg:col-span-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line-soft mb-4">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-2">
                  Rating Overview
                </h2>
                <span className="text-xs font-semibold text-ink-3">
                  {totalCount} {totalCount === 1 ? 'rating' : 'ratings'}
                </span>
              </div>

              <div className="flex items-center gap-5 sm:gap-6 lg:flex-col lg:items-center text-center mb-6">
                <div className="shrink-0 text-center">
                  <div className="text-[44px] lg:text-[52px] font-extrabold text-ink tracking-tight leading-none">
                    {totalCount > 0 ? avgRating.toFixed(1) : '—'}
                  </div>
                  <div
                    role="img"
                    aria-label={`${avgRating} out of 5 stars`}
                    className="flex gap-1 justify-center text-accent-strong mt-2"
                  >
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          starIdx <= Math.round(avgRating)
                            ? 'fill-accent-strong text-accent-strong'
                            : 'text-accent-strong/40'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-ink-2 mt-1.5 font-medium">
                    {totalCount > 0 ? `${totalCount} verified reviews` : 'No reviews yet'}
                  </div>
                </div>

                {/* Bars distribution */}
                <div className="flex-1 w-full flex flex-col gap-2">
                  {distribution.map((d) => {
                    const widthPercent =
                      maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;
                    return (
                      <div
                        key={d.star}
                        className="flex items-center gap-2 text-xs font-bold text-ink-2"
                      >
                        <span className="w-3 text-right">{d.star}</span>
                        <Star className="w-3 h-3 text-accent-strong fill-accent-strong shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-line-soft overflow-hidden">
                          <div
                            className="h-full bg-accent-strong rounded-full transition-all duration-300"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <span className="w-5 text-right font-medium text-ink-3">
                          {d.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-bg rounded-xl p-3 text-[11.5px] text-ink-2 font-medium leading-relaxed border border-line/60">
              💡 Feedback collected here is 100% private. Guests can also post their review directly to Google.
            </div>
          </section>

          {/* Recent Feedback Feed Card */}
          <section
            aria-label="Recent feedback"
            className="bg-white rounded-[20px] p-5 shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.06)] border border-line/40 lg:col-span-2"
          >
            <div className="flex items-center justify-between pb-3 border-b border-line-soft mb-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-2">
                Recent Guest Comments
              </h2>
              <span className="text-xs text-ink-3">Newest first</span>
            </div>

            {feedbackList.length === 0 ? (
              <div className="py-16 text-center text-ink-3">
                <MessageSquareQuote className="w-10 h-10 mx-auto text-ink-3 mb-3" />
                <p className="text-sm font-bold text-ink">No feedback received yet</p>
                <p className="text-xs text-ink-2 mt-1 max-w-sm mx-auto">
                  When guests submit ratings and comments on their bill, they will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line-soft">
                {feedbackList.map((item) => {
                  const tableNumber = item.tables?.number;
                  const tableLabel = item.tables?.label;
                  const metaText = tableNumber
                    ? `Table ${tableNumber}${tableLabel ? ` (${tableLabel})` : ''} · ${timeAgo(item.created_at)}`
                    : timeAgo(item.created_at);

                  return (
                    <article
                      key={item.id}
                      className="py-3.5 first:pt-2 last:pb-1 flex flex-col gap-1.5"
                      data-testid={`feedback-item-${item.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[14px] font-extrabold text-warning tracking-wider"
                          aria-label={`${item.rating} out of 5 stars`}
                        >
                          {renderStars(item.rating)}
                        </span>
                        <span className="text-[11.5px] font-semibold text-ink-3">
                          {metaText}
                        </span>
                      </div>
                      {item.comment ? (
                        <p className="text-[14px] leading-relaxed text-ink font-medium break-words">
                          {item.comment}
                        </p>
                      ) : (
                        <p className="text-[13px] text-ink-3 italic">
                          (No written comment provided)
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
