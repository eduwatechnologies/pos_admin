'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cog,
  Folder,
  History,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  Shield,
  SlidersHorizontal,
  ShoppingCart,
  Store,
  Truck,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { SyncStatus } from './sync-status'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useShop } from '@/context/shop-context'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { currentShop } = useShop()
  const [isOpen, setIsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { data: settings } = useGetSettingsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !user || !currentShop }
  )

  const rolePermissions = settings?.rolePermissions ?? {}
  const canUse = (key: string) => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((rolePermissions as any)?.[roleKey]?.[key])
  }

  useEffect(() => {
    const root = document.documentElement
    if (!user) {
      root.style.removeProperty('--sidebar-width')
      return
    }
    root.style.setProperty('--sidebar-width', collapsed ? '68px' : '240px')
    return () => {
      root.style.removeProperty('--sidebar-width')
    }
  }, [collapsed, user])

  useEffect(() => {
    if (pathname.startsWith('/settings')) setSettingsOpen(true)
  }, [pathname])

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const groups = [
    {
      label: 'Main',
      items: [{ href: '/dashboard', label: 'Dashboard', icon: BarChart3, perm: 'dashboard' }],
    },
    {
      label: 'Sales',
      items: [
        { href: '/terminal', label: 'Terminal', icon: ShoppingCart, perm: 'terminal' },
        { href: '/receipts', label: 'Sales', icon: Receipt, perm: 'receipts' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { href: '/analytics', label: 'Analytics', icon: PieChart, perm: 'analytics' },
        { href: '/reports', label: 'Reports', icon: BarChart3, perm: 'analytics' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { href: '/inventory', label: 'Inventory', icon: Package, perm: 'inventory' },
        { href: '/categories', label: 'Categories', icon: Folder, perm: 'inventory' },
        { href: '/purchases', label: 'Purchases', icon: ClipboardList, perm: 'inventory' },
        { href: '/suppliers', label: 'Suppliers', icon: Truck, perm: 'inventory' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses', label: 'Expenses', icon: CircleDollarSign, perm: 'analytics' },
        { href: '/supplier-bills', label: 'Supplier Bills', icon: FileText, perm: 'inventory' },
      ],
    },
    {
      label: 'People',
      items: [
        { href: '/customers', label: 'Customers', icon: User, perm: 'customers' },
        { href: '/employees', label: 'Employees', icon: Users, perm: 'employees' },
      ],
    },
    {
      label: 'Admin',
      items: [{ href: '/audit', label: 'Audit Log', icon: History, perm: 'settings' }],
    },
  ] as const

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-background border"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-[220px]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-50 size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent transition-colors',
            collapsed && 'translate-x-1',
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo area */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Store className="size-4" />
          </div>
          {!collapsed ? (
            <span className="text-sidebar-accent-foreground font-semibold text-lg tracking-tight">Kounter</span>
          ) : null}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {groups.map((group) => {
            const visible = group.items.filter((item) => (item.perm ? canUse(item.perm) : true))
            if (visible.length === 0) return null
            return (
              <div key={group.label} className="space-y-1">
                <span
                  className={cn(
                    'mb-1.5 block px-3 pt-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60',
                    collapsed && 'sr-only',
                  )}
                >
                  {group.label}
                </span>
                {visible.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  )
                })}
              </div>
            )
          })}

          {(() => {
            const canManageStores = user.role === 'admin' || user.role === 'super_admin'
            const showSettings = canUse('settings')
            if (!showSettings && !canManageStores) return null

            return (
              <div className="space-y-1">
                <span
                  className={cn(
                    'mb-1.5 block px-3 pt-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60',
                    collapsed && 'sr-only',
                  )}
                >
                  Settings
                </span>

                {canManageStores ? (
                  <Link
                    href="/stores"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive('/stores')
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Store className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? <span className="truncate">Stores</span> : null}
                  </Link>
                ) : null}

                {showSettings ? (
                  collapsed ? (
                    <Link
                      href="/settings/general"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        pathname.startsWith('/settings')
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                      aria-label="Settings"
                    >
                      <Settings className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? <span className="truncate">Settings</span> : null}
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen((v) => !v)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname.startsWith('/settings')
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Settings className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate flex-1 text-left">Settings</span>
                        <ChevronRight className={cn('h-4 w-4 transition-transform', settingsOpen && 'rotate-90')} />
                      </button>

                      {settingsOpen ? (
                        <div className="pl-10 space-y-1">
                          {[
                            { href: '/settings/general', label: 'General', icon: SlidersHorizontal },
                            { href: '/settings/permissions', label: 'Roles', icon: Shield },
                            { href: '/settings/system', label: 'System', icon: Cog },
                          ].map((sub) => {
                            const active = isActive(sub.href)
                            const SubIcon = sub.icon
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                  active
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                )}
                              >
                                <SubIcon className="h-4 w-4 shrink-0" />
                                {sub.label}
                              </Link>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                ) : null}
              </div>
            )
          })()}
        </nav>

        <div className="border-t border-sidebar-border p-2 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed ? <span>Sign Out</span> : null}
          </button>
        </div>

        {/* Sync Status */}
        {/* <SyncStatus /> */}
      </aside>
    </>
  )
}

export function TopNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { currentShop } = useShop()
  const { data: settings } = useGetSettingsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !user || !currentShop }
  )
  if (!user) return null

  const rolePermissions = settings?.rolePermissions ?? {}
  const canUse = (key: string) => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((rolePermissions as any)?.[roleKey]?.[key])
  }

  const groups = [
    {
      label: 'Main',
      items: [{ href: '/dashboard', label: 'Dashboard', icon: BarChart3, perm: 'dashboard' }],
    },
    {
      label: 'Sales',
      items: [
        { href: '/terminal', label: 'Terminal', icon: ShoppingCart, perm: 'terminal' },
        { href: '/receipts', label: 'Sales', icon: Receipt, perm: 'receipts' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { href: '/analytics', label: 'Analytics', icon: PieChart, perm: 'analytics' },
        { href: '/reports', label: 'Reports', icon: BarChart3, perm: 'analytics' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { href: '/inventory', label: 'Inventory', icon: Package, perm: 'inventory' },
        { href: '/categories', label: 'Categories', icon: Folder, perm: 'inventory' },
        { href: '/purchases', label: 'Purchases', icon: ClipboardList, perm: 'inventory' },
        { href: '/suppliers', label: 'Suppliers', icon: Truck, perm: 'inventory' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/expenses', label: 'Expenses', icon: CircleDollarSign, perm: 'analytics' },
        { href: '/supplier-bills', label: 'Supplier Bills', icon: FileText, perm: 'inventory' },
      ],
    },
    {
      label: 'People',
      items: [
        { href: '/customers', label: 'Customers', icon: User, perm: 'customers' },
        { href: '/employees', label: 'Employees', icon: Users, perm: 'employees' },
      ],
    },
    {
      label: 'Admin',
      items: [{ href: '/audit', label: 'Audit Log', icon: History, perm: 'settings' }],
    },
  ] as const

  const isActive = (href: string) => pathname.startsWith(href)
  const items = groups.flatMap((g) => g.items.filter((i) => (i.perm ? canUse(i.perm) : true)))

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const recalcOverflow = () => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setShowLeft(scrollLeft > 2)
    setShowRight(scrollLeft + clientWidth < scrollWidth - 2)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    recalcOverflow()
    const onScroll = () => recalcOverflow()
    el.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => recalcOverflow()
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="sticky top-14 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex items-center gap-2 overflow-x-auto px-4 py-2 scroll-smooth"
        >
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {showLeft ? (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent" />
        ) : null}
        {showRight ? (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
        ) : null}

        <div className="absolute inset-y-0 left-1 flex items-center">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-200)}
            className={cn(
              'h-7 w-7 rounded-md border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors',
              showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-1 flex items-center">
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(200)}
            className={cn(
              'h-7 w-7 rounded-md border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors',
              showRight ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
