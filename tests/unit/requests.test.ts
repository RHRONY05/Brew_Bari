import { describe, it, expect } from 'vitest';
import { canTransition, getTableTileState, getGuestStatusLabel } from '@/lib/requests';

describe('requests utility and state machine', () => {
  describe('canTransition', () => {
    it('allows valid transitions for call_waiter', () => {
      expect(canTransition('call_waiter', 'new', 'acknowledged')).toBe(true);
      expect(canTransition('call_waiter', 'new', 'done')).toBe(true);
      expect(canTransition('call_waiter', 'new', 'cancelled')).toBe(true);
      expect(canTransition('call_waiter', 'acknowledged', 'done')).toBe(true);
    });

    it('rejects invalid transitions for call_waiter', () => {
      expect(canTransition('call_waiter', 'done', 'new')).toBe(false);
      expect(canTransition('call_waiter', 'cancelled', 'done')).toBe(false);
      expect(canTransition('call_waiter', 'new', 'preparing')).toBe(false);
    });

    it('allows valid order lifecycle transitions', () => {
      expect(canTransition('order', 'new', 'acknowledged')).toBe(true);
      expect(canTransition('order', 'acknowledged', 'preparing')).toBe(true);
      expect(canTransition('order', 'preparing', 'ready')).toBe(true);
      expect(canTransition('order', 'ready', 'done')).toBe(true);
      expect(canTransition('order', 'acknowledged', 'cancelled')).toBe(true);
    });

    it('rejects backward order lifecycle transitions', () => {
      expect(canTransition('order', 'ready', 'preparing')).toBe(false);
      expect(canTransition('order', 'done', 'ready')).toBe(false);
      expect(canTransition('order', 'new', 'ready')).toBe(false);
    });
  });

  describe('getTableTileState priority order', () => {
    it('returns idle if no session or closed', () => {
      expect(getTableTileState(null, [])).toBe('idle');
      expect(getTableTileState('closed', [{ type: 'call_waiter', status: 'new' }])).toBe('idle');
    });

    it('prioritizes bill_open above order_new and call_open', () => {
      const state = getTableTileState('open', [
        { type: 'call_waiter', status: 'new' },
        { type: 'order', status: 'new' },
        { type: 'bill', status: 'acknowledged' },
      ]);
      expect(state).toBe('bill_open');
    });

    it('prioritizes order_new above call_open', () => {
      const state = getTableTileState('open', [
        { type: 'call_waiter', status: 'new' },
        { type: 'order', status: 'new' },
      ]);
      expect(state).toBe('order_new');
    });

    it('prioritizes call_open above plain session_open', () => {
      const state = getTableTileState('open', [
        { type: 'call_waiter', status: 'acknowledged' },
      ]);
      expect(state).toBe('call_open');
    });

    it('returns session_pending if pending with no open requests', () => {
      const state = getTableTileState('pending', []);
      expect(state).toBe('session_pending');
    });

    it('returns session_open if open with no requests or only closed requests', () => {
      const state = getTableTileState('open', [
        { type: 'call_waiter', status: 'done' },
        { type: 'order', status: 'done' },
      ]);
      expect(state).toBe('session_open');
    });
  });

  describe('getGuestStatusLabel', () => {
    it('returns special label for call_waiter acknowledged', () => {
      expect(getGuestStatusLabel('call_waiter', 'acknowledged', 'en')).toBe('Waiter coming');
      expect(getGuestStatusLabel('call_waiter', 'acknowledged', 'bn')).toBe('ওয়েটার আসছেন');
    });

    it('returns standard status labels in en and bn', () => {
      expect(getGuestStatusLabel('order', 'preparing', 'en')).toBe('Preparing');
      expect(getGuestStatusLabel('order', 'preparing', 'bn')).toBe('তৈরি হচ্ছে');

      expect(getGuestStatusLabel('order', 'ready', 'en')).toBe('Ready');
      expect(getGuestStatusLabel('order', 'ready', 'bn')).toBe('রেডি');
    });
  });
});
