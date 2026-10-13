// Public URLs for restaurants. Every QR code and shareable link is built here so the
// URL scheme (/<slug>, /<slug>/t/<token>) lives in one place.

/**
 * Base URL to put inside QR codes. When the admin is on localhost, QR codes still point
 * at production (NEXT_PUBLIC_PRODUCTION_URL) so printed cards keep working.
 */
export function qrBaseUrl(): string {
  const production = process.env.NEXT_PUBLIC_PRODUCTION_URL?.replace(/\/$/, '')
  if (typeof window === 'undefined') {
    return production || process.env.NEXT_PUBLIC_SITE_URL || ''
  }
  const origin = window.location.origin
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')
  return isLocal && production ? production : origin
}

export function menuPath(slug: string): string {
  return `/${slug}`
}

export function tablePath(slug: string, token: string): string {
  return `/${slug}/t/${token}`
}

export function menuUrl(base: string, slug: string): string {
  return `${base}${menuPath(slug)}`
}

export function tableUrl(base: string, slug: string, token: string): string {
  return `${base}${tablePath(slug, token)}`
}
