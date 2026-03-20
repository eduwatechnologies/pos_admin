'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Folder,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  ShoppingCart,
  Store,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { SyncStatus } from './sync-status'
import { useEffect, useState } from 'react'
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

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const commonNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/terminal', label: 'Terminal', icon: ShoppingCart },
    { href: '/receipts', label: 'Receipts', icon: Receipt },
    { href: '/analytics', label: 'Analytics', icon: PieChart },
  ]

  const adminNavItems = [
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/categories', label: 'Categories', icon: Folder },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

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
          collapsed ? 'w-[68px]' : 'w-[240px]',
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
            <span className="text-sidebar-accent-foreground font-semibold text-lg tracking-tight">BillScan</span>
          ) : null}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <span
            className={cn(
              'mb-2 block px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60',
              collapsed && 'sr-only',
            )}
          >
            Main
          </span>
          {commonNavItems.map((item) => {
            const key =
              item.href === '/dashboard'
                ? 'dashboard'
                : item.href === '/terminal'
                  ? 'terminal'
                  : item.href === '/receipts'
                    ? 'receipts'
                    : item.href === '/analytics'
                      ? 'analytics'
                      : ''
            if (key && !canUse(key)) return null
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
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

          {(() => {
            const visibleManage = adminNavItems.filter((item) => {
              if (item.href === '/settings') return user.role === 'admin' || user.role === 'super_admin'
              const key =
                item.href === '/inventory' || item.href === '/categories'
                  ? 'inventory'
                  : item.href === '/employees'
                    ? 'employees'
                    : ''
              return key ? canUse(key) : true
            })

            if (visibleManage.length === 0) return null

            return (
              <>
                <div className="pt-4" />
                <span
                  className={cn(
                    'mb-2 block px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60',
                    collapsed && 'sr-only',
                  )}
                >
                  Manage
                </span>
                {visibleManage.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
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
              </>
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
