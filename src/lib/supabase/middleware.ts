import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isStaffRoute =
    pathname.startsWith('/staff/counter') ||
    pathname.startsWith('/staff/admin') ||
    pathname.startsWith('/staff/(protected)')

  if (pathname === '/staff/login' || pathname === '/staff') {
    if (user) {
      const { data: staffMember } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = staffMember?.role === 'admin' ? '/staff/admin' : '/staff/counter'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }
  }

  if (isStaffRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff/login'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }

    if (pathname.startsWith('/staff/admin')) {
      const { data: staffMember } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!staffMember || staffMember.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/staff/counter'
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c))
        return redirectResponse
      }
    }
  }

  return supabaseResponse
}
