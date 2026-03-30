'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { History, Search } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useListAuditLogsQuery } from '@/redux/api/audit-api'

export default function AuditPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')

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
    const q = searchTerm.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((l) => {
      const hay = [l.action, l.entityType, l.entityId ?? '', l.userId ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [logs, searchTerm])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-2">System activity for this shop</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-[300px] rounded-lg pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {l.occurredAt instanceof Date && !Number.isNaN(l.occurredAt.getTime()) ? l.occurredAt.toLocaleString() : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-card-foreground">
                      <span className="inline-flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {l.entityType} {l.entityId ? `(${l.entityId})` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{l.userId ?? '-'}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {l.metadata ? JSON.stringify(l.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

