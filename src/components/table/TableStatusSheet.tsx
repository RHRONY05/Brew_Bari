'use client';

import React from 'react';
import { Check, Bell, Receipt, Star } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { SessionRequestJson } from '@/lib/schemas';
import { formatTaka } from '@/lib/money';

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
  const title = locale === 'bn' ? `টেবিল ${tableNumber}` : `Table ${tableNumber}`;
  const subtitle =
    locale === 'bn'
      ? 'এখানে আপডেট স্বয়ংক্রিয়ভাবে দেখা যাবে'
      : 'Updates appear here automatically';

  const orderRequests = requests.filter((r) => r.type === 'order');
  const waiterCalls = requests.filter((r) => r.type === 'call_waiter');

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
        ) : (
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
                          {locale === 'bn' ? 'অপেক্ষমাণ' : 'Received'}
                        </span>
                      )}
                      {order.status === 'acknowledged' && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-warning-soft text-warning">
                          {locale === 'bn' ? 'গৃহীত · সারিবদ্ধ' : 'Accepted · In queue'}
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
                    </div>
                    <span className="text-[12.5px] font-bold text-ink-3 tabular-nums shrink-0">
                      {order.subtotal ? formatTaka(order.subtotal, locale) : ''}
                    </span>
                  </div>

                  {/* 4-step Progress Stepper */}
                  <div className="flex items-start pt-1">
                    {[1, 2, 3, 4].map((step) => {
                      const isComplete = currentStep > step;
                      const isCurrent = currentStep === step;
                      const label =
                        step === 1 && order.status === 'acknowledged'
                          ? locale === 'bn'
                            ? 'গৃহীত'
                            : 'Accepted'
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
                </div>
              );
            })}

            {/* Waiter calls */}
            {waiterCalls.map((call) => {
              const isComing = call.status === 'acknowledged';

              return (
                <div
                  key={call.id}
                  className="p-3.5 rounded-2xl bg-white border border-line shadow-xs flex items-center gap-3"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      isComing ? 'bg-success-soft text-success' : 'bg-surface-2 text-brand'
                    }`}
                  >
                    <Bell className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-[15px] text-ink">
                      {isComing
                        ? locale === 'bn'
                          ? 'ওয়েটার আসছেন'
                          : 'Waiter coming'
                        : locale === 'bn'
                          ? 'ওয়েটার ডাকা হয়েছে'
                          : 'Waiter called'}
                    </div>
                    <div className="text-[12.5px] font-medium text-ink-2">
                      {isComing
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
        </div>
      </div>
    </BottomSheet>
  );
}
