'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { SyncStatus } from './sync-status'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const commonNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/receipts', label: 'Receipts', icon: Receipt },
    { href: '/analytics', label: 'Analytics', icon: PieChart },
  ]

  const adminNavItems = [
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const navItems = [
    ...commonNavItems,
    ...(user.role === 'admin' ? adminNavItems : []),
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
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="flex h-14 items-center px-6 border-b border-sidebar-border">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold text-sidebar-foreground">POS</h1>
            <span className="text-xs text-sidebar-foreground/80">Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Sync Status */}
        <SyncStatus />
      </aside>
    </>
  )
}
