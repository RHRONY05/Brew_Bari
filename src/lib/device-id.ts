const DEVICE_ID_KEY = 'brew_bari_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length <= 64) {
      return existing;
    }

    const uuid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const generated = `dev_${uuid}`.substring(0, 64);
    window.localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return 'dev_fallback';
  }
}
