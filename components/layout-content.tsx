'use client'

import React, { useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { usePathname, useRouter } from 'next/navigation'

export function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = useAuth()
  const { currentShop } = useShop()
  const pathname = usePathname()
  const router = useRouter()

  const { data: settings } = useGetSettingsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !user || !currentShop }
  )

  const rolePermissions = settings?.rolePermissions ?? {}
  const canUse = useMemo(() => {
    return (key: string) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'super_admin') return true
      const roleKey = String(user.role ?? '')
      return Boolean((rolePermissions as any)?.[roleKey]?.[key])
    }
  }, [rolePermissions, user])

  useEffect(() => {
    if (!user) return
    if (!currentShop) return
    if (user.role === 'admin' || user.role === 'super_admin') return

    const key =
      pathname.startsWith('/dashboard')
        ? 'dashboard'
        : pathname.startsWith('/terminal')
          ? 'terminal'
          : pathname.startsWith('/receipts')
            ? 'receipts'
            : pathname.startsWith('/analytics')
              ? 'analytics'
              : pathname.startsWith('/inventory') || pathname.startsWith('/categories')
                ? 'inventory'
                : pathname.startsWith('/employees')
                  ? 'employees'
                  : pathname.startsWith('/settings')
                    ? 'settings'
                    : null

    if (!key) return
    if (canUse(key)) return

    const fallback =
      canUse('dashboard')
        ? '/dashboard'
        : canUse('terminal')
          ? '/terminal'
          : canUse('receipts')
            ? '/receipts'
            : '/auth/login'

    if (pathname !== fallback) router.push(fallback)
  }, [canUse, currentShop, pathname, router, user])

  return (
    <>
      <style jsx global>{`
        :root {
          --sidebar-width: 240px;
        }
      `}</style>
      <Sidebar />
      <main className={`min-h-screen ${user ? 'md:ml-[var(--sidebar-width)]' : ''}`}>
        <TopHeader />
        {children}
      </main>
    </>
  )
}
