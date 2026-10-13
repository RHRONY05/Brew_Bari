import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { tablePath } from '@/lib/site-urls'
import type { Database } from '@/types/database'

// Old table QR codes were printed as /t/<token>. Look up the restaurant and send the
// guest to /<slug>/t/<token>. Unknown tokens fall through to the 404 page.
async function redirectLegacyTableLink(request: NextRequest): Promise<NextResponse | null> {
  const match = request.nextUrl.pathname.match(/^\/t\/([^/]+)\/?$/)
  if (!match) return null

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const token = decodeURIComponent(match[1])
  const { data: slug } = await supabase.rpc('resolve_table_slug', { p_token: token })
  if (!slug) return null

  const url = request.nextUrl.clone()
  url.pathname = tablePath(slug, token)
  return NextResponse.redirect(url, 308)
}

export async function proxy(request: NextRequest) {
  const legacy = await redirectLegacyTableLink(request)
  if (legacy) return legacy

  // Only staff pages use the Supabase auth session; guest pages are anonymous.
  if (request.nextUrl.pathname.startsWith('/staff')) {
    return await updateSession(request)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, icons
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
