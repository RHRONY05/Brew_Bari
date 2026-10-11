export type ParsedError = {
  code: string;
  detail: string | null;
};

export function parseErrorCode(rawMessage: string): ParsedError {
  const match = rawMessage.match(/^([A-Z_]+)(?::(.+))?$/);
  if (!match) {
    return { code: 'UNKNOWN', detail: null };
  }
  return {
    code: match[1],
    detail: match[2] ?? null,
  };
}

export type Locale = 'en' | 'bn';

export const ERROR_MESSAGES: Record<string, { en: string; bn: string }> = {
  TABLE_NOT_FOUND: {
    en: "This QR code isn't valid anymore. Please ask a staff member.",
    bn: 'এই QR কোডটি আর কাজ করছে না। অনুগ্রহ করে স্টাফকে জানান।',
  },
  SESSION_NOT_FOUND: {
    en: 'Your table session has ended.',
    bn: 'আপনার টেবিল সেশন শেষ হয়েছে।',
  },
  NO_ACTIVE_SESSION: {
    en: "Your table isn't open. Please call a waiter.",
    bn: 'আপনার টেবিলটি চালু নেই। ওয়েটার ডাকুন।',
  },
  FEATURE_NOT_IN_PACKAGE: {
    en: "This option isn't available here.",
    bn: 'এই সুবিধাটি এখানে নেই।',
  },
  RATE_LIMITED: {
    en: 'Too many requests. Please wait a moment.',
    bn: 'অনেক বেশি অনুরোধ। একটু অপেক্ষা করুন।',
  },
  EMPTY_CART: {
    en: 'Your cart is empty.',
    bn: 'আপনার কার্ট খালি।',
  },
  CART_TOO_LARGE: {
    en: "That's a big order! Please call a waiter.",
    bn: 'অনেক বড় অর্ডার! ওয়েটার ডাকুন।',
  },
  ITEM_NOT_FOUND: {
    en: 'An item in your cart is no longer on the menu.',
    bn: 'কার্টের একটি আইটেম আর মেনুতে নেই।',
  },
  ITEM_SOLD_OUT: {
    en: 'Sorry, {item} just sold out.',
    bn: 'দুঃখিত, {item} এইমাত্র শেষ হয়ে গেছে।',
  },
  BAD_QUANTITY: {
    en: 'Please check your choices for {item}.',
    bn: '{item} এর অপশনগুলো আবার দেখুন।',
  },
  OPTION_REQUIRED: {
    en: 'Please check your choices for {item}.',
    bn: '{item} এর অপশনগুলো আবার দেখুন।',
  },
  OPTION_INVALID: {
    en: 'Please check your choices for {item}.',
    bn: '{item} এর অপশনগুলো আবার দেখুন।',
  },
  BAD_RATING: {
    en: 'Please pick 1 to 5 stars.',
    bn: '১ থেকে ৫ স্টার দিন।',
  },
  GENERIC: {
    en: 'Something went wrong. Please try again.',
    bn: 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।',
  },
};

export function getErrorMessage(
  rawOrCode: string,
  locale: Locale = 'en',
  itemName?: string
): string {
  const { code } = parseErrorCode(rawOrCode);
  const template = ERROR_MESSAGES[code]?.[locale] ?? ERROR_MESSAGES.GENERIC[locale];
  const itemReplacement = itemName || (locale === 'bn' ? 'আইটেমটি' : 'this item');
  return template.replace('{item}', itemReplacement);
}
