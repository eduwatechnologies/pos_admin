'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar, TopNav } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useGetBillingSubscriptionQuery, useListBillingPlansQuery } from '@/redux/api/billing-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function BillingBanner() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentShop } = useShop()
  const skip = !user || !currentShop

  const { data: subscription } = useGetBillingSubscriptionQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: plans = [] } = useListBillingPlansQuery({ shopId: currentShop?.id ?? '' }, { skip })

  if (!user || !currentShop) return null

  const now = Date.now()
  const endMs = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : 0
  const daysLeft = endMs ? Math.ceil((endMs - now) / (24 * 60 * 60 * 1000)) : null

  const plan = subscription?.planId ? plans.find((p) => p.id === subscription.planId) ?? null : null
  const planLabel = plan ? `${plan.name} (${plan.currency} ${plan.priceMonthly}/month)` : subscription ? 'Trial' : 'No subscription'

  const status = subscription?.status ?? 'none'
  const show =
    status === 'none' ||
    status === 'past_due' ||
    status === 'canceled' ||
    (status === 'active' && typeof daysLeft === 'number' && daysLeft <= 5)

  if (!show) return null

  const tone =
    status === 'active'
      ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
      : status === 'past_due' || status === 'canceled'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'

  const title =
    status === 'active'
      ? `Subscription ends in ${Math.max(0, daysLeft ?? 0)} day(s)`
      : status === 'past_due'
        ? 'Subscription past due'
        : status === 'canceled'
          ? 'Subscription canceled'
          : 'Subscription required'

  const description =
    status === 'active'
      ? `Current: ${planLabel}. Renew to avoid interruption.`
      : status === 'past_due'
        ? `Current: ${planLabel}. Please renew to keep selling.`
        : status === 'canceled'
          ? `Current: ${planLabel}. Please subscribe to continue.`
          : 'Choose a plan to activate billing for this store.'

  return (
    <div className="px-4 md:px-8 pt-4">
      <div className={`rounded-xl border px-4 py-3 ${tone}`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-sm opacity-90">{description}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => router.push('/settings/system')}>
              Upgrade / Renew
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [navLayout, setNavLayout] = useState<'sidebar' | 'topbar'>('sidebar')

  const { data: subscription } = useGetBillingSubscriptionQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !user || !currentShop },
  )

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
    const read = () => {
      const saved = window.localStorage.getItem('nav_layout')
      setNavLayout(saved === 'topbar' ? 'topbar' : 'sidebar')
    }
    if (typeof window === 'undefined') return
    read()
    window.addEventListener('nav_layout_changed', read as any)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('nav_layout_changed', read as any)
      window.removeEventListener('storage', read)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    if (!currentShop) return
    if (user.role === 'super_admin') return

    if (pathname.startsWith('/terminal')) {
      const graceMs = 3 * 24 * 60 * 60 * 1000
      const now = Date.now()
      const status = subscription?.status ?? 'none'
      const endMs = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : 0
      const withinGrace = status === 'past_due' && endMs && now < endMs + graceMs
      const allowed = status === 'active' || withinGrace

      if (!allowed && pathname !== '/settings/system') {
        setIsNavigating(true)
        router.push('/settings/system')
        return
      }
    }
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
      {user ? (
        navLayout === 'sidebar' ? (
          <Sidebar />
        ) : (
          <div className="md:hidden">
            <Sidebar />
          </div>
        )
      ) : null}
      <main className={`min-h-screen ${user && navLayout === 'sidebar' ? 'md:ml-[var(--sidebar-width)]' : ''}`}>
        <TopHeader />
        <BillingBanner />
        {user && navLayout === 'topbar' ? (
          <>
            <TopNav />
            <div className="h-10" />
          </>
        ) : null}
        {children}
      </main>
    </>
  )
}
