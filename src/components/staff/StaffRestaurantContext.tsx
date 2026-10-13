'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getTheme, type Theme } from '@/themes'
import { ThemeStyle } from '@/themes/ThemeStyle'
import { ThemeProvider } from '@/themes/ThemeContext'
import type { Tables } from '@/types/database'

export type StaffRole = 'admin' | 'counter'

interface StaffRestaurantValue {
  restaurant: Tables<'restaurants'>
  role: StaffRole
  theme: Theme
  /** Logo to show: the restaurant's own upload, else the theme's default. */
  logo: string
}

const StaffRestaurantContext = createContext<StaffRestaurantValue | null>(null)

/**
 * Loads the logged-in staff member's restaurant (staff -> restaurant), applies its theme,
 * and redirects to login if there is no user or no staff row. Wraps every /staff page
 * except login.
 */
export function StaffRestaurantProvider({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const router = useRouter()
  const [value, setValue] = useState<StaffRestaurantValue | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/staff/login')
        return
      }
      const { data: staffMember } = await supabase
        .from('staff')
        .select('role, restaurant_id')
        .eq('user_id', user.id)
        .single()
      if (!staffMember) {
        router.replace('/staff/login')
        return
      }
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', staffMember.restaurant_id)
        .single()
      if (!restaurant || cancelled) return
      const theme = getTheme(restaurant.theme_key)
      setValue({
        restaurant,
        role: staffMember.role,
        theme,
        logo: restaurant.logo_url || theme.assets.logo,
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!value) return <>{fallback}</>

  return (
    <StaffRestaurantContext.Provider value={value}>
      <ThemeStyle theme={value.theme} />
      <ThemeProvider value={value.theme}>{children}</ThemeProvider>
    </StaffRestaurantContext.Provider>
  )
}

export function useStaffRestaurant(): StaffRestaurantValue {
  const ctx = useContext(StaffRestaurantContext)
  if (!ctx) throw new Error('useStaffRestaurant must be used inside StaffRestaurantProvider')
  return ctx
}
