'use client';

import React, { useState } from 'react';
import { Star, Heart, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { submitFeedbackRpc } from '@/lib/table/rpc';

interface ReviewSheetProps {
  token: string;
  isOpen: boolean;
  locale: 'en' | 'bn';
  googleReviewUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  onClose: () => void;
}

const RATING_WORDS = {
  en: ['', 'Not good', 'Could be better', 'Okay', 'Good', 'Loved it'],
  bn: ['', 'ভালো নয়', 'আরও ভালো হতে পারত', 'মোটামুটি', 'ভালো', 'দারুণ লাগল'],
};

export function ReviewSheet({
  token,
  isOpen,
  locale,
  googleReviewUrl = 'https://g.page/r/brewbari/review',
  facebookUrl = 'https://facebook.com/brewbari',
  instagramUrl = 'https://instagram.com/brewbari',
  onClose,
}: ReviewSheetProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitFeedbackRpc(token, rating, comment.trim() || undefined);
      if (res.data) {
        setIsSubmitted(true);

        // Copy comment to clipboard automatically if present per US-23
        if (comment.trim()) {
          try {
            await navigator.clipboard.writeText(comment.trim());
            toast.success(
              locale === 'bn'
                ? 'আপনার মন্তব্য ক্লিপবোর্ডে কপি করা হয়েছে!'
                : 'Comment copied to clipboard!'
            );
          } catch {
            // ignore clipboard errors
          }
        }
      } else if (res.error) {
        toast.error(res.error.message);
      }
    } catch {
      toast.error(locale === 'bn' ? 'একটি সমস্যা হয়েছে' : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = locale === 'bn' ? 'মতামত ও রিভিউ' : 'Feedback & Review';

  return (
    <BottomSheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} title={title}>
      <div className="flex flex-col gap-4 pb-6" data-testid="review-sheet">
        {!isSubmitted ? (
          /* Feedback Form */
          <div className="flex flex-col items-center gap-3 text-center pt-2">
            <h2 className="text-2xl font-extrabold text-[#24170F] tracking-tight">
              {locale === 'bn' ? 'কেমন ছিল আপনার অভিজ্ঞতা?' : 'How was your visit?'}
            </h2>
            <p className="text-[14px] text-[#6F5A4B] max-w-xs leading-snug">
              {locale === 'bn'
                ? 'আপনার মূল্যবান মতামত সরাসরি ক্যাফে মালিকের কাছে পৌঁছে যাবে।'
                : 'Your feedback goes straight to the owner.'}
            </p>

            {/* 5-star selector */}
            <div
              role="radiogroup"
              aria-label="Rating"
              className="flex items-center gap-1.5 my-2"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={star === rating}
                  aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                  onClick={() => setRating(star)}
                  className="w-12 h-12 flex items-center justify-center p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= rating
                        ? 'fill-[#F2C27D] text-[#E3A651]'
                        : 'fill-transparent text-[#CDB59B]'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-[14px] font-bold text-[#8A5A37] min-h-[20px]">
              {RATING_WORDS[locale][rating]}
            </div>

            {/* Comment textarea */}
            <div className="w-full flex flex-col gap-1.5 text-left pt-2">
              <label htmlFor="feedback-comment" className="text-[13px] font-bold text-[#24170F]">
                {locale === 'bn' ? 'আরও কিছু জানাতে চান? (ঐচ্ছিক)' : 'Tell us more (optional)'}
              </label>
              <textarea
                id="feedback-comment"
                rows={3}
                maxLength={280}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  locale === 'bn'
                    ? 'আপনার মতামত লিখুন…'
                    : 'Great coffee, quick service and cosy vibes!'
                }
                className="w-full p-3 rounded-2xl border border-[#F0DFCB] bg-[#FFF7EE] text-[14px] text-[#24170F] placeholder:text-[#8C7767] focus:outline-none focus:ring-1 focus:ring-[#6B4226] resize-none"
              />
            </div>

            {/* Submit and Skip buttons */}
            <div className="w-full flex flex-col gap-2 pt-3">
              <button
                type="button"
                data-testid="submit-feedback-button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full h-13 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[16px] flex items-center justify-center hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_14px_rgba(227,166,81,0.35)] disabled:opacity-50"
              >
                {locale === 'bn' ? 'মতামত পাঠান' : 'Send feedback'}
              </button>
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                className="h-10 text-[13.5px] font-bold text-[#6F5A4B] hover:text-[#24170F]"
              >
                {locale === 'bn' ? 'এড়িয়ে যান' : 'Skip'}
              </button>
            </div>
          </div>
        ) : (
          /* Thank You & Google Review (NO GATING: ALWAYS SHOWN) */
          <div className="flex flex-col items-center gap-3.5 text-center pt-3">
            <div className="w-20 h-20 rounded-full bg-[#FBEBD7] text-[#6B4226] flex items-center justify-center shadow-xs">
              <Heart className="w-10 h-10 stroke-[2] fill-[#6B4226]" />
            </div>

            <h2 className="text-2xl font-extrabold text-[#24170F] tracking-tight">
              {locale === 'bn' ? 'ধন্যবাদ!' : 'Thank you!'}
            </h2>
            <p className="text-[14px] leading-relaxed text-[#6F5A4B] max-w-xs">
              {locale === 'bn'
                ? 'গুগল ম্যাপে আপনার অভিজ্ঞতা শেয়ার করবেন? এটি আমাদের ছোট ক্যাফের জন্য অনেক সহায়ক হবে।'
                : 'Would you share your experience on Google? It really helps a small café like ours.'}
            </p>

            {comment && (
              <div className="w-full p-3.5 rounded-2xl bg-[#FFF7EE] border border-[#F0DFCB] text-left flex items-start gap-2.5 text-[12.5px] text-[#6F5A4B]">
                <Copy className="w-4 h-4 text-[#8A5A37] shrink-0 mt-0.5" />
                <span>
                  {locale === 'bn'
                    ? 'আপনার মন্তব্যটি কপি করা হয়েছে, যাতে সহজেই গুগলে পেস্ট করতে পারেন।'
                    : 'We copied your comment, so you can paste it straight into Google.'}
                </span>
              </div>
            )}

            {/* Google Review Button - ALWAYS SHOWN */}
            <div className="w-full flex flex-col gap-2.5 pt-2">
              <a
                href={googleReviewUrl || 'https://maps.google.com'}
                target="_blank"
                rel="noreferrer"
                data-testid="google-review-button"
                className="w-full h-13 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[15.5px] flex items-center justify-center gap-2.5 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-[0_4px_14px_rgba(227,166,81,0.35)]"
              >
                <Star className="w-5 h-5 fill-current" />
                <span>
                  {locale === 'bn' ? 'গুগলে রিভিউ দিন' : 'Review us on Google'}
                </span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>

              {/* Social links */}
              <div className="flex gap-2">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-11 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] text-[13.5px] font-bold flex items-center justify-center hover:bg-[#FFF7EE]"
                  >
                    Facebook
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-11 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] text-[13.5px] font-bold flex items-center justify-center hover:bg-[#FFF7EE]"
                  >
                    Instagram
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-10 text-[13.5px] font-bold text-[#6F5A4B] hover:text-[#24170F]"
              >
                {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
