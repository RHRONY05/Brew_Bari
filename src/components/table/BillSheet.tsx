'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Info } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { getBillRpc, requestBillRpc } from '@/lib/table/rpc';
import { getDeviceId } from '@/lib/device-id';
import { formatTaka } from '@/lib/money';
import type { BillResult } from '@/lib/schemas';

interface BillSheetProps {
  token: string;
  tableNumber: number;
  isOpen: boolean;
  locale: 'en' | 'bn';
  onRequestBillComplete?: () => void;
  onClose: () => void;
}

function BillSheetContent({
  token,
  tableNumber,
  locale,
  onRequestBillComplete,
  onClose,
}: Omit<BillSheetProps, 'isOpen'>) {
  const [bill, setBill] = useState<BillResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    let active = true;
    getBillRpc(token)
      .then((res) => {
        if (active && res.data) {
          setBill(res.data);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleRequestBill = async () => {
    setIsRequesting(true);
    try {
      const deviceId = getDeviceId();
      const res = await requestBillRpc(token, deviceId);
      if (res.data) {
        toast.success(
          locale === 'bn' ? 'বিল চাওয়া হয়েছে!' : 'Bill requested!'
        );
        if (onRequestBillComplete) {
          onRequestBillComplete();
        } else {
          onClose();
        }
      } else if (res.error) {
        toast.error(res.error.message);
      }
    } catch {
      toast.error(locale === 'bn' ? 'একটি সমস্যা হয়েছে' : 'Something went wrong');
    } finally {
      setIsRequesting(false);
    }
  };

  const subtitle =
    locale === 'bn'
      ? `ব্রু বাড়ি · টেবিল ${tableNumber}`
      : `Brew Bari · Table ${tableNumber}`;

  return (
    <div className="flex flex-col gap-4 pb-6" data-testid="bill-sheet">
      <div className="text-[13px] font-semibold text-[#6F5A4B] -mt-2">{subtitle}</div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-[#8C7767] animate-pulse">
            {locale === 'bn' ? 'বিল লোড হচ্ছে…' : 'Loading bill…'}
          </div>
        ) : !bill || !bill.lines || bill.lines.length === 0 ? (
          <div className="py-12 text-center text-[#8C7767]">
            <p className="font-semibold">
              {locale === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি।' : 'No confirmed orders yet.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Bill Receipt Card */}
            <div className="p-4 rounded-2xl bg-[#FFF7EE] border border-[#F0DFCB] flex flex-col gap-2.5">
              {/* Order items */}
              {bill.lines.map((it, idx) => (
                <div key={idx} className="flex justify-between items-baseline gap-2 text-[14px]">
                  <span className="text-[#24170F]">
                    <span className="font-bold">{it.quantity}×</span>{' '}
                    {locale === 'bn' && it.name_bn ? it.name_bn : it.name_en}
                  </span>
                  <span className="font-bold text-[#24170F] tabular-nums shrink-0">
                    {formatTaka(it.line_total, locale)}
                  </span>
                </div>
              ))}

              <div className="border-t border-dashed border-[#E3CDB2] my-1" />

              {/* Subtotal */}
              <div className="flex justify-between text-[13.5px] text-[#6F5A4B]">
                <span>{locale === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                <span className="font-semibold tabular-nums">
                  {formatTaka(bill.subtotal, locale)}
                </span>
              </div>

              {/* Service Charge */}
              {bill.service_charge > 0 && (
                <div className="flex justify-between text-[13.5px] text-[#6F5A4B]">
                  <span>
                    {locale === 'bn'
                      ? `সার্ভিস চার্জ (${bill.service_charge_percent}%)`
                      : `Service Charge (${bill.service_charge_percent}%)`}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatTaka(bill.service_charge, locale)}
                  </span>
                </div>
              )}

              {/* VAT */}
              <div className="flex justify-between text-[13.5px] text-[#6F5A4B]">
                <span>
                  {locale === 'bn'
                    ? `ভ্যাট (${bill.vat_percent}%)`
                    : `VAT (${bill.vat_percent}%)`}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatTaka(bill.vat, locale)}
                </span>
              </div>

              <div className="border-t border-dashed border-[#E3CDB2] my-1" />

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-base font-extrabold text-[#24170F]">
                  {locale === 'bn' ? 'সর্বমোট' : 'Total'}
                </span>
                <span className="text-2xl font-extrabold text-[#24170F] tracking-tight tabular-nums">
                  {formatTaka(bill.total, locale)}
                </span>
              </div>
            </div>

            {/* Payment Hint */}
            <div className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-[#6F5A4B] px-1">
              <Info className="w-4 h-4 text-[#8A5A37] shrink-0 mt-0.5 stroke-[2]" />
              <span>
                {locale === 'bn'
                  ? 'কাউন্টারে বা ওয়েটারকে বিল পরিশোধ করুন — নগদ, কার্ড, বিকাশ বা নগদ প্রযোজ্য।'
                  : 'Pay at the counter or to your waiter — cash, card, bKash or Nagad.'}
              </span>
            </div>

            {/* Request Bill Button */}
            <div className="pt-2 border-t border-[#F6E9DA]">
              <button
                type="button"
                data-testid="request-bill-button"
                disabled={isRequesting}
                onClick={handleRequestBill}
                className="w-full h-13 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[16px] flex items-center justify-center gap-2 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_14px_rgba(227,166,81,0.35)] disabled:opacity-50"
              >
                <Receipt className="w-5 h-5 stroke-[2]" />
                <span>
                  {locale === 'bn' ? 'বিল আনতে বলুন' : 'Request bill'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
  );
}

export function BillSheet({
  token,
  tableNumber,
  isOpen,
  locale,
  onRequestBillComplete,
  onClose,
}: BillSheetProps) {
  const title = locale === 'bn' ? 'আপনার বিল' : 'Your bill';

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={title}>
      {isOpen && (
        <BillSheetContent
          token={token}
          tableNumber={tableNumber}
          locale={locale}
          onRequestBillComplete={onRequestBillComplete}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  );
}
