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
import { cn } from '@/lib/utils'

function getTitleFromPath(pathname: string) {
  if (pathname.startsWith('/supplier-bills')) return 'Supplier Bills'
  if (pathname.startsWith('/suppliers')) return 'Suppliers'
  if (pathname.startsWith('/purchases')) return 'Purchases'
  if (pathname.startsWith('/expenses')) return 'Expenses'
  if (pathname.startsWith('/audit')) return 'Audit Log'
  if (pathname.startsWith('/reports')) return 'Reports'
  if (pathname.startsWith('/employees/performance')) return 'Employee Performance'
  if (pathname.startsWith('/employees')) return 'Employees'
  if (pathname.startsWith('/inventory')) return 'Inventory'
  if (pathname.startsWith('/categories')) return 'Categories'
  if (pathname.startsWith('/customers')) return 'Customers'
  if (pathname.startsWith('/terminal')) return 'POS Terminal'
  if (pathname.startsWith('/receipts')) return 'Receipts'
  if (pathname.startsWith('/analytics')) return 'Analytics'
  if (pathname.startsWith('/stores')) return 'Stores'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/dashboard')) return 'Kounter Dashboard'
  return 'Kounter POS'
}

type PageHeaderMeta = {
  title: string
  description?: string
}

function getPageHeaderFromPath(pathname: string): PageHeaderMeta | null {
  if (pathname === '/dashboard') {
    return { title: 'Dashboard', description: 'Sales overview and key performance metrics.' }
  }
  if (pathname === '/analytics') {
    return { title: 'Analytics', description: 'Detailed sales insights and performance metrics' }
  }
  if (pathname === '/reports') {
    return { title: 'Reports', description: 'Sales and finance report summary.' }
  }
  if (pathname === '/inventory') {
    return { title: 'Inventory', description: 'Manage your products and stock levels' }
  }
  if (pathname === '/categories') {
    return { title: 'Categories', description: 'Organize your products by category' }
  }
  if (pathname === '/customers') {
    return { title: 'Customers', description: 'Manage your customer directory' }
  }
  if (pathname === '/employees') {
    return { title: 'Employees', description: 'Manage your team members' }
  }
  if (pathname === '/employees/performance') {
    return { title: 'Employee Performance', description: 'Sales performance across all employees' }
  }
  if (pathname === '/receipts') {
    return { title: 'Receipts', description: 'View and manage sales receipts' }
  }
  if (pathname === '/stores') {
    return { title: 'Stores', description: 'Create and manage your stores.' }
  }
  if (pathname === '/suppliers') {
    return { title: 'Suppliers', description: 'Manage your suppliers' }
  }
  if (pathname === '/supplier-bills') {
    return { title: 'Supplier Bills', description: 'Track supplier bills and payments' }
  }
  if (pathname === '/purchases') {
    return { title: 'Purchases', description: 'Record purchases and update stock' }
  }
  if (pathname === '/expenses') {
    return { title: 'Expenses', description: 'Record and manage expenses' }
  }
  if (pathname === '/audit') {
    return { title: 'Audit Log', description: 'System activity for this shop' }
  }
  if (pathname === '/settings/system') {
    return { title: 'Settings', description: 'System configuration.' }
  }
  if (pathname === '/settings/general') {
    return { title: 'Settings', description: 'General business information.' }
  }
  if (pathname === '/settings/permissions') {
    return { title: 'Settings', description: 'Role permissions.' }
  }
  return null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'U'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function PageHeader({ className }: { className?: string }) {
  const pathname = usePathname()
  const meta = getPageHeaderFromPath(pathname)
  if (!meta) return null

  return (
    <div className={cn('px-4 md:px-8 pt-6 pb-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight">{meta.title}</h1>
          {meta.description ? <p className="text-muted-foreground mt-2">{meta.description}</p> : null}
        </div>
      </div>
    </div>
  )
}

export function TopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { currentShop } = useShop()
  const [billingOpen, setBillingOpen] = useState(false)
  const [navLayout, setNavLayout] = useState<'sidebar' | 'topbar'>(() => {
    if (typeof window === 'undefined') return 'sidebar'
    const saved = window.localStorage.getItem('nav_layout')
    return saved === 'topbar' ? 'topbar' : 'sidebar'
  })

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
    window.setTimeout(() => setBillingOpen(true), 0)
  }, [canPrompt, currentShop?.id])

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
