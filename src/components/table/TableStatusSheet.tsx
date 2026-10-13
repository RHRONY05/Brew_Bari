'use client';

import React from 'react';
import {
  Check,
  Bell,
  Receipt,
  Star,
  XCircle,
  X,
  Flame,
  Plus,
  Clock,
  UtensilsCrossed,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { SessionRequestJson } from '@/lib/schemas';
import { formatTaka } from '@/lib/money';
import { useTheme } from '@/themes/ThemeContext';

interface TableStatusSheetProps {
  tableNumber: number;
  requests: SessionRequestJson[];
  isOpen: boolean;
  locale: 'en' | 'bn';
  onCallWaiter?: () => void;
  onViewBill?: () => void;
  onLeaveReview?: () => void;
  onClose: () => void;
}

const STEP_LABELS = {
  en: ['Received', 'Preparing', 'Ready', 'Served'],
  bn: ['গৃহীত', 'তৈরি হচ্ছে', 'প্রস্তুত', 'পরিবেশিত'],
};

function getStepIndex(status: string): number {
  switch (status) {
    case 'new':
      return 1;
    case 'acknowledged':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
      return 3;
    case 'done':
      return 4;
    default:
      return 1;
  }
}

function getHeroStageIndex(status: string): number {
  switch (status) {
    case 'new':
      return 0;
    case 'acknowledged':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
      return 3;
    case 'done':
      return 4;
    default:
      return 0;
  }
}

export function TableStatusSheet({
  tableNumber,
  requests,
  isOpen,
  locale,
  onCallWaiter,
  onViewBill,
  onLeaveReview,
  onClose,
}: TableStatusSheetProps) {
  const theme = useTheme();
  const isHero = theme.layout.statusCard === 'hero';

  const title = locale === 'bn' ? `টেবিল ${tableNumber}` : `Table ${tableNumber}`;
  const subtitle =
    locale === 'bn'
      ? 'এখানে আপডেট স্বয়ংক্রিয়ভাবে দেখা যাবে'
      : 'Updates appear here automatically';

  const orderRequests = requests.filter((r) => r.type === 'order');
  const waiterCalls = requests.filter((r) => r.type === 'call_waiter');

  const latestOrder = orderRequests[0];
  const heroStage = latestOrder ? getHeroStageIndex(latestOrder.status) : 0;

  const formatSentTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const HERO_STAGES = [
    {
      id: 'new',
      label: locale === 'bn' ? 'গৃহীত' : 'Received',
      hint: locale === 'bn' ? 'কাউন্টারে আপনার অর্ডার পৌঁছেছে' : 'The counter has your order',
      title: locale === 'bn' ? 'অর্ডার গৃহীত' : 'Order received',
      sub: locale === 'bn' ? 'কাউন্টার অনুমোদনের অপেক্ষায়' : 'Waiting for the counter',
      icon: Clock,
    },
    {
      id: 'acknowledged',
      label: locale === 'bn' ? 'অনুমোদিত' : 'Accepted',
      hint: locale === 'bn' ? 'স্টাফ নিশ্চিত করেছেন' : 'Staff confirmed it',
      title: locale === 'bn' ? 'অর্ডার অনুমোদিত' : 'Order accepted',
      sub: locale === 'bn' ? 'এরপর গ্রিলে যাচ্ছে' : 'Going to the grill next',
      icon: Check,
    },
    {
      id: 'preparing',
      label: theme.copy.statusPreparing?.[locale] ?? (locale === 'bn' ? 'গ্রিলে চলছে' : 'On the grill'),
      hint: locale === 'bn' ? 'রান্না চলছে, ~৮ মিনিট' : 'Cooking now, ~8 min',
      title: theme.copy.statusPreparing?.[locale] ?? (locale === 'bn' ? 'গ্রিলে চলছে' : 'On the grill'),
      sub: locale === 'bn' ? 'প্রায় ৮ মিনিট বাকি' : 'About 8 min left',
      icon: Flame,
    },
    {
      id: 'ready',
      label: locale === 'bn' ? 'প্রস্তুত' : 'Ready',
      hint: locale === 'bn' ? 'আপনার টেবিলে আসছে' : 'Coming to your table',
      title: locale === 'bn' ? 'প্রস্তুত!' : 'Ready!',
      sub: locale === 'bn' ? 'ওয়েটার নিয়ে আসছেন' : 'A waiter is bringing it',
      icon: Bell,
    },
    {
      id: 'done',
      label: locale === 'bn' ? 'পরিবেশিত' : 'Served',
      hint: locale === 'bn' ? 'খাবার উপভোগ করুন' : 'Enjoy your meal',
      title: locale === 'bn' ? 'খাবার উপভোগ করুন' : 'Enjoy your meal',
      sub: locale === 'bn' ? 'যেকোনো সময় আরও অর্ডার করতে পারেন' : 'Tap "Order more" anytime',
      icon: UtensilsCrossed,
    },
  ];

  const currentHeroStage = HERO_STAGES[heroStage] || HERO_STAGES[0];
  const HeroStageIcon = currentHeroStage.icon;
  const progressPercent = `${Math.round(((heroStage + 1) / HERO_STAGES.length) * 100)}%`;

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={title}>
      <div className="flex flex-col gap-4 pb-6" data-testid="table-status-sheet">
        <div className="text-[13px] font-semibold text-ink-2 -mt-2">{subtitle}</div>

        {requests.length === 0 ? (
          <div className="py-10 text-center text-ink-3">
            <p className="font-semibold">
              {locale === 'bn'
                ? 'এখনও কোনো অর্ডার বা ওয়েটার রিকোয়েস্ট নেই।'
                : 'No orders or waiter requests yet.'}
            </p>
          </div>
        ) : isHero && latestOrder ? (
          /* -------------------------------------------------------------------------
           * HERO VARIANT (Grill Ghar / fast-food hero card & 5-step vertical stepper)
           * ------------------------------------------------------------------------- */
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {/* Big live status card */}
            <div
              data-testid="hero-status-card"
              className="bg-ink text-brand-ink rounded-[24px] p-4.5 sm:p-5 flex flex-col gap-3.5 shadow-[0_14px_30px_rgba(var(--ink-rgb)/0.3)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-[18px] bg-accent text-accent-ink flex items-center justify-center shrink-0">
                  <HeroStageIcon className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[12px] text-brand-ink/80 font-medium">
                    {locale === 'bn'
                      ? `অর্ডার #${orderRequests.length}${latestOrder.created_at ? ` · পাঠানো হয়েছে ${formatSentTime(latestOrder.created_at)}` : ''}`
                      : `Order #${orderRequests.length}${latestOrder.created_at ? ` · sent ${formatSentTime(latestOrder.created_at)}` : ''}`}
                  </span>
                  <span className="font-heading font-extrabold text-[22px] leading-tight text-brand-ink truncate">
                    {currentHeroStage.title}
                  </span>
                  <span className="text-[13px] text-accent font-semibold truncate">
                    {currentHeroStage.sub}
                  </span>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="h-2 rounded-full bg-white/15 overflow-hidden"
              >
                <div
                  className="h-2 bg-accent rounded-full transition-all duration-500"
                  style={{ width: progressPercent }}
                />
              </div>
            </div>

            {/* Stepper */}
            {latestOrder.status === 'cancelled' ? (
              <div className="rounded-xl bg-danger-soft/60 border border-danger/20 p-3 text-[12.5px] text-danger font-medium flex items-center gap-2.5">
                <XCircle className="w-4 h-4 shrink-0 text-danger stroke-[2.2]" />
                <span>
                  {locale === 'bn'
                    ? 'এই অর্ডারটি স্টাফ দ্বারা বাতিল করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে স্টাফের সাথে কথা বলুন।'
                    : 'This order was cancelled by staff. Please speak with staff for details.'}
                </span>
              </div>
            ) : (
              <ol
                aria-label={locale === 'bn' ? 'অর্ডারের অগ্রগতি' : 'Order progress'}
                className="flex flex-col px-1 pt-1"
              >
                {HERO_STAGES.map((st, i) => {
                  const done = i < heroStage || (i === heroStage && heroStage === 4);
                  const now = i === heroStage;
                  return (
                    <li
                      key={st.id}
                      aria-current={now ? 'step' : undefined}
                      className="flex gap-3.5 min-h-[52px]"
                    >
                      <div className="flex flex-col items-center w-7">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            done
                              ? 'bg-brand text-brand-ink'
                              : now
                                ? 'bg-accent text-accent-ink shadow-[0_0_0_6px_rgba(var(--accent-rgb)/0.28)]'
                                : 'bg-surface border-2 border-line'
                          }`}
                        >
                          {done && <Check className="w-3.5 h-3.5 stroke-[3.2]" />}
                        </span>
                        {i < HERO_STAGES.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={`w-[3px] flex-1 min-h-[22px] rounded-full my-0.5 ${
                              i < heroStage ? 'bg-brand' : 'bg-line'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5 pb-3">
                        <span
                          className={`text-[15px] ${
                            now
                              ? 'font-bold text-ink'
                              : done
                                ? 'font-semibold text-ink'
                                : 'font-medium text-ink-3'
                          }`}
                        >
                          {st.label}
                        </span>
                        <span className="text-[12px] text-ink-2">{st.hint}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Order summary */}
            {latestOrder.subtotal !== undefined && latestOrder.subtotal > 0 && (
              <div className="bg-white border border-line rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2">
                <div className="flex justify-between items-baseline text-[14px]">
                  <span className="text-ink-2 font-medium">
                    {locale === 'bn' ? `অর্ডার #${orderRequests.length}` : `Order #${orderRequests.length}`}
                  </span>
                  <span className="font-semibold text-ink tabular-nums">
                    {formatTaka(latestOrder.subtotal, locale)}
                  </span>
                </div>
                <div className="border-t border-dashed border-line pt-2 flex justify-between items-baseline font-extrabold text-[15px] text-ink">
                  <span>{locale === 'bn' ? 'মোট অর্ডার' : 'Order total'}</span>
                  <span className="tabular-nums">{formatTaka(latestOrder.subtotal, locale)}</span>
                </div>
              </div>
            )}

            {/* Waiter calls list in hero view */}
            {waiterCalls.map((call) => {
              const isComing = call.status === 'acknowledged';
              const isCancelled = call.status === 'cancelled';
              const isDone = call.status === 'done';

              return (
                <div
                  key={call.id}
                  className="p-3 rounded-2xl bg-white border border-line shadow-xs flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCancelled
                        ? 'bg-danger-soft text-danger'
                        : isComing
                        ? 'bg-success-soft text-success'
                        : isDone
                        ? 'bg-surface-2 text-ink-3'
                        : 'bg-surface-2 text-brand'
                    }`}
                  >
                    {isCancelled ? (
                      <X className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Bell className="w-4 h-4 stroke-[2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink flex items-center gap-2">
                      <span>
                        {isCancelled
                          ? locale === 'bn'
                            ? 'ওয়েটার কল বাতিল'
                            : 'Waiter call cancelled'
                          : isDone
                          ? locale === 'bn'
                            ? 'ওয়েটার উপস্থিত হয়েছেন'
                            : 'Waiter attended'
                          : isComing
                          ? locale === 'bn'
                            ? 'ওয়েটার আসছেন'
                            : 'Waiter coming'
                          : locale === 'bn'
                            ? 'ওয়েটার ডাকা হয়েছে'
                            : 'Waiter called'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* -------------------------------------------------------------------------
           * STANDARD VARIANT (Brew Bari / café horizontal stepper)
           * ------------------------------------------------------------------------- */
          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto no-scrollbar pr-1">
            {/* Orders */}
            {orderRequests.map((order, idx) => {
              const currentStep = getStepIndex(order.status);
              const orderNum = orderRequests.length - idx;
              const labels = STEP_LABELS[locale];

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white border border-line shadow-xs flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[15.5px] text-ink">
                        {locale === 'bn' ? `অর্ডার #${orderNum}` : `Order #${orderNum}`}
                      </span>
                      {order.status === 'new' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-danger-soft text-danger">
                          {locale === 'bn' ? 'জমা দেওয়া হয়েছে (অপেক্ষমাণ)' : 'Submitted · Pending'}
                        </span>
                      )}
                      {order.status === 'acknowledged' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-warning-soft text-warning">
                          {locale === 'bn' ? 'অনুমোদিত · সারিবদ্ধ' : 'Approved · In queue'}
                        </span>
                      )}
                      {order.status === 'preparing' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-surface-2 text-brand-muted animate-pulse">
                          {locale === 'bn' ? 'তৈরি হচ্ছে ☕' : 'Preparing ☕'}
                        </span>
                      )}
                      {order.status === 'ready' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-success-soft text-success">
                          {locale === 'bn' ? 'প্রস্তুত 🎉' : 'Ready 🎉'}
                        </span>
                      )}
                      {order.status === 'done' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-success-soft text-success">
                          {locale === 'bn' ? 'পরিবেশিত ✅' : 'Served ✅'}
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-danger-soft text-danger">
                          {locale === 'bn' ? 'বাতিল করা হয়েছে ✕' : 'Cancelled ✕'}
                        </span>
                      )}
                    </div>
                    <span className="text-[12.5px] font-bold text-ink-3 tabular-nums shrink-0">
                      {order.subtotal ? formatTaka(order.subtotal, locale) : ''}
                    </span>
                  </div>

                  {order.status === 'cancelled' ? (
                    <div className="rounded-xl bg-danger-soft/60 border border-danger/20 p-3 text-[12.5px] text-danger font-medium flex items-center gap-2.5">
                      <XCircle className="w-4 h-4 shrink-0 text-danger stroke-[2.2]" />
                      <span>
                        {locale === 'bn'
                          ? 'এই অর্ডারটি স্টাফ দ্বারা বাতিল করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে স্টাফের সাথে কথা বলুন।'
                          : 'This order was cancelled by staff. Please speak with staff for details.'}
                      </span>
                    </div>
                  ) : (
                    /* 4-step Progress Stepper */
                    <div className="flex items-start pt-1">
                      {[1, 2, 3, 4].map((step) => {
                        const isComplete = currentStep > step;
                        const isCurrent = currentStep === step;
                        const label =
                          step === 1 && order.status === 'acknowledged'
                            ? locale === 'bn'
                              ? 'অনুমোদিত'
                              : 'Approved'
                            : labels[step - 1];

                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all ${
                                  isComplete
                                    ? 'bg-success text-white'
                                    : isCurrent
                                      ? 'bg-brand text-bg ring-2 ring-brand/30'
                                      : 'bg-surface-2 text-ink-3'
                                }`}
                              >
                                {isComplete ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step}
                              </span>
                              <span
                                className={`text-[11px] font-bold text-center leading-tight truncate w-full px-0.5 ${
                                  isCurrent
                                    ? 'text-ink'
                                    : isComplete
                                      ? 'text-success'
                                      : 'text-ink-3'
                                }`}
                              >
                                {label}
                              </span>
                            </div>

                            {step < 4 && (
                              <span
                                className={`h-[3px] flex-1 mt-3 rounded-full transition-all ${
                                  currentStep > step ? 'bg-success' : 'bg-line'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Waiter calls */}
            {waiterCalls.map((call) => {
              const isComing = call.status === 'acknowledged';
              const isCancelled = call.status === 'cancelled';
              const isDone = call.status === 'done';

              return (
                <div
                  key={call.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-xs flex items-center gap-3"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      isCancelled
                        ? 'bg-danger-soft text-danger'
                        : isComing
                        ? 'bg-success-soft text-success'
                        : isDone
                        ? 'bg-surface-2 text-ink-3'
                        : 'bg-surface-2 text-brand'
                    }`}
                  >
                    {isCancelled ? (
                      <X className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Bell className="w-5 h-5 stroke-[2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-[15px] text-ink flex items-center gap-2">
                      <span>
                        {isCancelled
                          ? locale === 'bn'
                            ? 'ওয়েটার কল বাতিল'
                            : 'Waiter call cancelled'
                          : isDone
                          ? locale === 'bn'
                            ? 'ওয়েটার উপস্থিত হয়েছেন'
                            : 'Waiter attended'
                          : isComing
                          ? locale === 'bn'
                            ? 'ওয়েটার আসছেন'
                            : 'Waiter coming'
                          : locale === 'bn'
                            ? 'ওয়েটার ডাকা হয়েছে'
                            : 'Waiter called'}
                      </span>
                      {isCancelled && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-danger-soft text-danger">
                          {locale === 'bn' ? 'বাতিল ✕' : 'Cancelled ✕'}
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] font-medium text-ink-2">
                      {isCancelled
                        ? locale === 'bn'
                          ? 'স্টাফ এই কলটি বাতিল করেছেন'
                          : 'Staff cancelled this request'
                        : isDone
                        ? locale === 'bn'
                          ? 'কল সম্পন্ন হয়েছে'
                          : 'Request completed'
                        : isComing
                        ? locale === 'bn'
                          ? 'স্টাফ আপনার ডাক দেখেছেন'
                          : 'Staff acknowledged your call'
                        : locale === 'bn'
                          ? 'কাউন্টারে বার্তা পৌঁছেছে'
                          : 'Counter alerted'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-line-soft">
          {isHero ? (
            /* Hero variant action buttons */
            <>
              <div className="flex gap-2.5">
                {onCallWaiter && (
                  <button
                    type="button"
                    data-testid="status-call-waiter-button"
                    onClick={onCallWaiter}
                    className="flex-1 h-[54px] rounded-2xl border-[1.5px] border-ink bg-white text-ink font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-surface-2 active:scale-98 transition-all cursor-pointer"
                  >
                    <Bell className="w-4.5 h-4.5 stroke-[2]" />
                    <span>{locale === 'bn' ? 'ওয়েটার ডাকুন' : 'Call waiter'}</span>
                  </button>
                )}

                <button
                  type="button"
                  data-testid="status-order-more-button"
                  onClick={onClose}
                  className="flex-1 h-[54px] rounded-2xl bg-brand text-brand-ink font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-brand-muted active:scale-98 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[2.4]" />
                  <span>{locale === 'bn' ? 'আরও অর্ডার করুন' : 'Order more'}</span>
                </button>
              </div>

              {onViewBill && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    data-testid="status-request-bill-link"
                    onClick={onViewBill}
                    className="bg-transparent border-0 text-brand-dark font-semibold text-[14px] underline hover:text-brand transition-colors cursor-pointer py-1"
                  >
                    {locale === 'bn' ? 'বিল চান' : 'Request the bill'}
                  </button>
                </div>
              )}

              {onLeaveReview && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    data-testid="leave-review-button"
                    onClick={onLeaveReview}
                    className="w-full h-11 rounded-full border border-line bg-bg text-brand-muted font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-surface-2 active:scale-98 transition-all"
                  >
                    <Star className="w-4 h-4 fill-current stroke-[1.5]" />
                    <span>{locale === 'bn' ? 'মতামত বা রিভিউ দিন' : 'Leave feedback or review'}</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Standard variant action buttons */
            <>
              <div className="flex gap-2">
                {onViewBill && (
                  <button
                    type="button"
                    onClick={onViewBill}
                    className="flex-1 h-12 rounded-full border border-line bg-white text-ink font-bold text-[14.5px] flex items-center justify-center gap-2 hover:bg-bg active:scale-98 transition-all"
                  >
                    <Receipt className="w-4 h-4 stroke-[2]" />
                    <span>{locale === 'bn' ? 'বিল দেখুন' : 'View bill'}</span>
                  </button>
                )}

                {onCallWaiter && (
                  <button
                    type="button"
                    onClick={onCallWaiter}
                    className="flex-1 h-12 rounded-full bg-brand text-bg font-bold text-[14.5px] flex items-center justify-center gap-2 hover:bg-brand-dark active:scale-98 transition-all shadow-sm"
                  >
                    <Bell className="w-4 h-4 stroke-[2]" />
                    <span>{locale === 'bn' ? 'ওয়েটার ডাকুন' : 'Call waiter'}</span>
                  </button>
                )}
              </div>

              {onLeaveReview && (
                <button
                  type="button"
                  data-testid="leave-review-button"
                  onClick={onLeaveReview}
                  className="w-full h-11 rounded-full border border-line bg-bg text-brand-muted font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-surface-2 active:scale-98 transition-all"
                >
                  <Star className="w-4 h-4 fill-current stroke-[1.5]" />
                  <span>{locale === 'bn' ? 'মতামত বা রিভিউ দিন' : 'Leave feedback or review'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
