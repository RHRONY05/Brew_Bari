import { describe, it, expect } from 'vitest'
import { features } from '@/lib/features'

describe('features(pkg) matrix', () => {
  it('correctly reports P1 (Menu only)', () => {
    expect(features(1)).toEqual({
      tableQr: false,
      cart: false,
      callWaiter: false,
      counter: false,
      placeOrder: false,
      orderStatus: false,
      requestBill: false,
      feedback: false,
      socialLinks: false,
    })
  })

  it('correctly reports P2 (Table service with Call Waiter)', () => {
    expect(features(2)).toEqual({
      tableQr: true,
      cart: true,
      callWaiter: true,
      counter: true,
      placeOrder: false,
      orderStatus: false,
      requestBill: false,
      feedback: false,
      socialLinks: false,
    })
  })

  it('correctly reports P3 (Full order, bill & review)', () => {
    expect(features(3)).toEqual({
      tableQr: true,
      cart: true,
      callWaiter: true,
      counter: true,
      placeOrder: true,
      orderStatus: true,
      requestBill: true,
      feedback: true,
      socialLinks: true,
    })
  })
})
