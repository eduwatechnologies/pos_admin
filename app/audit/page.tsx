'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit3,
  History,
  Info,
  LogIn,
  LogOut,
  PlusCircle,
  RotateCcw,
  Search,
  Trash2,
  User,
  Users,
  Package,
  Folder,
  Receipt,
  Settings,
} from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useListAuditLogsQuery } from '@/redux/api/audit-api'
import { cn } from '@/lib/utils'

const getActionStyles = (action: string) => {
  const a = action.toLowerCase()
  if (a.includes('create') || a.includes('add') || a.includes('register')) {
    return {
      icon: PlusCircle,
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
    }
  }
  if (a.includes('delete') || a.includes('remove') || a.includes('void')) {
    return {
      icon: Trash2,
      className: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
    }
  }
  if (a.includes('update') || a.includes('edit')) {
    return {
      icon: Edit3,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
    }
  }
  if (a.includes('refund')) {
    return {
      icon: RotateCcw,
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
    }
  }
  if (a.includes('login')) {
    return {
      icon: LogIn,
      className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400',
    }
  }
  if (a.includes('logout')) {
    return {
      icon: LogOut,
      className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
    }
  }
  return {
    icon: History,
    className: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted dark:bg-muted/20',
  }
}

const getEntityIcon = (type: string) => {
  const t = type.toLowerCase()
  if (t.includes('product') || t.includes('inventory')) return Package
  if (t.includes('customer')) return User
  if (t.includes('employee') || t.includes('user')) return Users
  if (t.includes('category')) return Folder
  if (t.includes('receipt') || t.includes('sale')) return Receipt
  if (t.includes('shop') || t.includes('settings')) return Settings
  return Info
}

export default function AuditPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: logs = [], error } = useListAuditLogsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load audit logs', variant: 'destructive' })
  }, [error, toast])

  if (!isAuthenticated) return null

  const canView = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.settings)
  }, [settings?.rolePermissions, user])

  const filtered = useMemo(() => {
    let result = logs

    if (actionFilter) {
      result = result.filter((l) => l.action.toLowerCase().includes(actionFilter.toLowerCase()))
    }

    const q = searchTerm.trim().toLowerCase()
    if (!q) return result

    return result.filter((l) => {
      const hay = [l.action, l.entityType, l.entityId ?? '', l.userId ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [logs, searchTerm, actionFilter])

  const actionTypes = [
    { label: 'All', value: null, color: 'bg-muted' },
    { label: 'Created', value: 'create', color: 'bg-emerald-500' },
    { label: 'Updated', value: 'update', color: 'bg-blue-500' },
    { label: 'Deleted', value: 'delete', color: 'bg-rose-500' },
    { label: 'Refunds', value: 'refund', color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-2">System activity for this shop</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs by action, entity, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl pl-9 md:w-[400px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actionTypes.map((t) => (
              <button
                key={t.label}
                onClick={() => setActionFilter(t.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  actionFilter === t.value
                    ? `${t.color} border-transparent text-white shadow-sm scale-105`
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t.value && <div className={cn('size-1.5 rounded-full bg-white')} />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => {
                const { icon: ActionIcon, className: actionClass } = getActionStyles(l.action)
                const EntityIcon = getEntityIcon(l.entityType)

                return (
                  <tr key={l.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {l.occurredAt instanceof Date && !Number.isNaN(l.occurredAt.getTime())
                        ? l.occurredAt.toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={cn('capitalize py-1 px-2.5 font-medium', actionClass)}>
                        <ActionIcon className="mr-1.5 h-3.5 w-3.5" />
                        {l.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <EntityIcon className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-card-foreground capitalize">{l.entityType}</div>
                          {l.entityId && (
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight opacity-70">
                              ID: {l.entityId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="size-4" />
                        </div>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]" title={l.userId}>
                          {l.userId ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {l.metadata && Object.keys(l.metadata).length > 0 ? (
                        <div
                          className="max-w-[250px] truncate text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50 font-mono"
                          title={JSON.stringify(l.metadata)}
                        >
                          {JSON.stringify(l.metadata)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No audit logs found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  )
}

