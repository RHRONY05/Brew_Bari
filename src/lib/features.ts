export type PackageTier = 1 | 2 | 3

export function features(pkg: PackageTier) {
  return {
    tableQr: pkg >= 2,
    cart: pkg >= 2,
    callWaiter: pkg >= 2,
    counter: pkg >= 2,
    placeOrder: pkg >= 3,
    orderStatus: pkg >= 3,
    requestBill: pkg >= 3,
    feedback: pkg >= 3,
    socialLinks: pkg >= 3,
  } as const
}
