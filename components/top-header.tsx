'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, LogOut } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { ShopSwitcherInline } from '@/components/shop-switcher-inline'
import { useShop } from '@/context/shop-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGetBillingSubscriptionQuery } from '@/redux/api/billing-api'

function getTitleFromPath(pathname: string) {
  if (pathname.startsWith('/employees/performance')) return 'Employee Performance'
  if (pathname.startsWith('/employees')) return 'Employees'
  if (pathname.startsWith('/inventory')) return 'Inventory'
  if (pathname.startsWith('/terminal')) return 'POS Terminal'
  if (pathname.startsWith('/receipts')) return 'Receipts'
  if (pathname.startsWith('/analytics')) return 'Analytics'
  if (pathname.startsWith('/stores')) return 'Stores'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/dashboard')) return 'Kounter Dashboard'
  return 'Kounter POS'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function TopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { currentShop } = useShop()
  const [billingOpen, setBillingOpen] = useState(false)
  const [navLayout, setNavLayout] = useState<'sidebar' | 'topbar'>('sidebar')

  const isAuthed = Boolean(user)
  const skipBilling = !isAuthed || !currentShop
  const { data: subscription } = useGetBillingSubscriptionQuery({ shopId: currentShop?.id ?? '' }, { skip: skipBilling })

  const title = getTitleFromPath(pathname)
  const unreadCount = 2

  const billingStatus = subscription?.status ?? 'none'
  const badgeVariant = billingStatus === 'active' ? 'secondary' : billingStatus === 'none' ? 'destructive' : 'destructive'
  const badgeLabel =
    billingStatus === 'active' ? 'Subscribed' : billingStatus === 'past_due' ? 'Past due' : billingStatus === 'canceled' ? 'Canceled' : 'Subscribe'

  const canPrompt = useMemo(() => {
    if (!isAuthed) return false
    if (!currentShop) return false
    if (pathname.startsWith('/settings/system')) return false
    if (billingStatus === 'active') return false
    return true
  }, [billingStatus, currentShop, isAuthed, pathname])

  useEffect(() => {
    if (!canPrompt) return
    if (typeof window === 'undefined') return
    const key = `subscription_prompt_${currentShop?.id ?? ''}`
    const already = sessionStorage.getItem(key)
    if (already) return
    sessionStorage.setItem(key, '1')
    setBillingOpen(true)
  }, [canPrompt, currentShop?.id])

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('nav_layout')
    setNavLayout(saved === 'topbar' ? 'topbar' : 'sidebar')
  }, [user])

  if (!user) return null

  const setLayout = (next: 'sidebar' | 'topbar') => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('nav_layout', next)
    window.dispatchEvent(new Event('nav_layout_changed'))
    setNavLayout(next)
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 pl-16 md:pl-6">
        <div className="flex min-w-0 items-center gap-3">
        
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <ShopSwitcherInline />}
          {currentShop ? (
            <button
              type="button"
              onClick={() => setBillingOpen(true)}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant={badgeVariant as any}>{badgeLabel}</Badge>
            </button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold leading-none text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5">
                <div className="text-sm font-semibold">Notifications</div>
                <div className="text-xs text-muted-foreground">Latest updates from your POS system</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Low stock alert</span>
                <span className="text-xs text-muted-foreground">2 products are below reorder level</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Sync completed</span>
                <span className="text-xs text-muted-foreground">Last sync finished successfully</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="justify-center text-sm text-primary"
              >
                View dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setLayout('sidebar')
                }}
                className={navLayout === 'sidebar' ? 'font-medium' : undefined}
              >
                Navigation: Sidebar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setLayout('topbar')
                }}
                className={navLayout === 'topbar' ? 'font-medium' : undefined}
              >
                Navigation: Top bar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  router.push('/auth/login')
                }}
                className="gap-2"
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription</DialogTitle>
            <DialogDescription>
              {billingStatus === 'active'
                ? 'This store subscription is active.'
                : 'This store needs an active subscription to continue. Go to System Settings to pay with Paystack.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBillingOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setBillingOpen(false)
                router.push('/settings/system')
              }}
            >
              Go to Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
