import { describe, it, expect } from 'vitest';
import { parseErrorCode, getErrorMessage, ERROR_MESSAGES } from '@/lib/errors';

describe('errors parsing and localization', () => {
  it('parses error codes with detail suffix', () => {
    const parsed = parseErrorCode('ITEM_SOLD_OUT:123e4567-e89b-12d3-a456-426614174000');
    expect(parsed.code).toBe('ITEM_SOLD_OUT');
    expect(parsed.detail).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('parses error codes without suffix', () => {
    const parsed = parseErrorCode('TABLE_NOT_FOUND');
    expect(parsed.code).toBe('TABLE_NOT_FOUND');
    expect(parsed.detail).toBeNull();
  });

  it('falls back to UNKNOWN for unrecognized formats', () => {
    const parsed = parseErrorCode('some random error from server');
    expect(parsed.code).toBe('UNKNOWN');
    expect(parsed.detail).toBeNull();
  });

  it('provides both English and Bengali messages for all registered error codes', () => {
    const codes = Object.keys(ERROR_MESSAGES);
    expect(codes.length).toBeGreaterThan(5);

    for (const code of codes) {
      expect(ERROR_MESSAGES[code].en).toBeTruthy();
      expect(ERROR_MESSAGES[code].bn).toBeTruthy();
    }
  });

  it('formats error messages with item replacement', () => {
    const enMsg = getErrorMessage('ITEM_SOLD_OUT:123', 'en', 'Cappuccino');
    expect(enMsg).toBe('Sorry, Cappuccino just sold out.');

    const bnMsg = getErrorMessage('ITEM_SOLD_OUT:123', 'bn', 'ক্যাপুচিনো');
    expect(bnMsg).toBe('দুঃখিত, ক্যাপুচিনো এইমাত্র শেষ হয়ে গেছে।');
  });

  it('falls back to generic message on unknown code', () => {
    const msgEn = getErrorMessage('RANDOM_UNKNOWN_CODE', 'en');
    expect(msgEn).toBe('Something went wrong. Please try again.');

    const msgBn = getErrorMessage('RANDOM_UNKNOWN_CODE', 'bn');
    expect(msgBn).toBe('কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।');
  });
});
