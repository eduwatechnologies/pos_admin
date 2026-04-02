'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = useAuth()
  const { currentShop } = useShop()
  const pathname = usePathname()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [showNavigationOverlay, setShowNavigationOverlay] = useState(false)
  const navigationOverlayTimerRef = useRef<number | null>(null)

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
    setIsNavigating(false)
  }, [pathname])

  useEffect(() => {
    if (navigationOverlayTimerRef.current) {
      window.clearTimeout(navigationOverlayTimerRef.current)
      navigationOverlayTimerRef.current = null
    }
    if (!isNavigating) {
      setShowNavigationOverlay(false)
      return
    }
    navigationOverlayTimerRef.current = window.setTimeout(() => {
      setShowNavigationOverlay(true)
    }, 150)
    return () => {
      if (navigationOverlayTimerRef.current) {
        window.clearTimeout(navigationOverlayTimerRef.current)
        navigationOverlayTimerRef.current = null
      }
    }
  }, [isNavigating])

  useEffect(() => {
    const setNavigatingIfDifferentUrl = (urlLike: string | URL | null | undefined) => {
      if (!urlLike) return
      const current = new URL(window.location.href)
      const next = new URL(String(urlLike), current.href)
      if (next.origin !== current.origin) return
      if (next.pathname === current.pathname && next.search === current.search && next.hash === current.hash) return
      setIsNavigating(true)
    }

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function pushState(data, title, url) {
      setNavigatingIfDifferentUrl(url)
      return originalPushState.apply(this, [data, title, url] as any)
    } as any

    window.history.replaceState = function replaceState(data, title, url) {
      setNavigatingIfDifferentUrl(url)
      return originalReplaceState.apply(this, [data, title, url] as any)
    } as any

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return

      const target = event.target as Element | null
      if (!target) return

      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const hrefAttr = anchor.getAttribute('href')
      if (!hrefAttr || hrefAttr.startsWith('#')) return

      const current = new URL(window.location.href)
      const next = new URL(anchor.href, current.href)
      if (next.origin !== current.origin) return
      if (next.pathname === current.pathname && next.search === current.search && next.hash === current.hash) return

      setIsNavigating(true)
    }

    window.addEventListener('click', clickHandler, true)
    return () => window.removeEventListener('click', clickHandler, true)
  }, [])

  useEffect(() => {
    if (!user) return
    if (!currentShop) return
    if (user.role === 'admin' || user.role === 'super_admin') return

    const key =
      pathname.startsWith('/dashboard')
        ? 'dashboard'
        : pathname.startsWith('/terminal')
          ? 'terminal'
          : pathname.startsWith('/customers')
            ? 'customers'
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

    if (pathname !== fallback) {
      setIsNavigating(true)
      router.push(fallback)
    }
  }, [canUse, currentShop, pathname, router, user])

  return (
    <>
      <style jsx global>{`
        :root {
          --sidebar-width: 240px;
        }
      `}</style>
      {showNavigationOverlay ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div className="text-sm font-medium text-card-foreground">Loading…</div>
          </div>
        </div>
      ) : null}
      <Sidebar />
      <main className={`min-h-screen ${user ? 'md:ml-[var(--sidebar-width)]' : ''}`}>
        <TopHeader />
        {children}
      </main>
    </>
  )
}
