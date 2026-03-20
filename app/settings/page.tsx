'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/redux/api/settings-api'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Access overview and KPIs' },
  { key: 'terminal', label: 'Terminal', description: 'Create sales and scan items' },
  { key: 'receipts', label: 'Receipts', description: 'View and manage transactions' },
  { key: 'analytics', label: 'Analytics', description: 'View reports and trends' },
  { key: 'inventory', label: 'Inventory', description: 'Manage products and stock' },
  { key: 'employees', label: 'Employees', description: 'Manage staff accounts' },
  { key: 'settings', label: 'Settings', description: 'Change shop and system configuration' },
] as const

type PermissionKey = (typeof PERMISSIONS)[number]['key']
type RolePermissionsState = Record<string, Record<PermissionKey, boolean>>
type SettingsForm = {
  name: string
  businessName: string
  address: string
  phone: string
  currency: string
  rolePermissions: RolePermissionsState
}

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const { toast } = useToast()
  const [newRoleKey, setNewRoleKey] = useState('')
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    businessName: '',
    address: '',
    phone: '',
    currency: 'NGN',
    rolePermissions: {
      admin: {
        dashboard: true,
        terminal: true,
        receipts: true,
        analytics: true,
        inventory: true,
        employees: true,
        settings: true,
      },
      cashier: {
        dashboard: true,
        terminal: true,
        receipts: true,
        analytics: false,
        inventory: false,
        employees: false,
        settings: false,
      },
    },
  })
  const [initial, setInitial] = useState(form)

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  const skip = !user || (user.role !== 'admin' && user.role !== 'super_admin') || !currentShop
  const { data: loadedSettings, error } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()

  useEffect(() => {
    if (!loadedSettings) return
    setForm(loadedSettings)
    setInitial(loadedSettings)
  }, [loadedSettings])

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: 'Failed to load settings',
      variant: 'destructive',
    })
  }, [error, toast])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  const handleSave = async () => {
    if (!currentShop) return
    try {
      const updated = await updateSettings({ shopId: currentShop.id, input: form }).unwrap()
      setForm(updated)
      setInitial(updated)
      toast({ title: 'Success', description: 'Settings saved' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings',
        variant: 'destructive',
      })
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your POS system and user permissions.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Configure your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <input
                  type="text"
                  placeholder="Enter business name"
                  value={form.businessName}
                  onChange={e => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Name</label>
                <input
                  type="text"
                  placeholder="Enter shop name"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <Button onClick={handleSave} disabled={!currentShop || !isDirty || isSaving}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Define what each role can access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Create roles, then switch off features you don’t want that role to use.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New role (e.g. manager)"
                    value={newRoleKey}
                    onChange={(e) => setNewRoleKey(e.target.value)}
                    className="h-9 w-full sm:w-[220px] px-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const raw = newRoleKey.trim().toLowerCase().replace(/\s+/g, '_')
                      if (!raw || raw === 'admin' || raw === 'super_admin') return
                      setForm((prev) => {
                        if (prev.rolePermissions?.[raw]) return prev
                        const allOn = PERMISSIONS.reduce((acc, p) => {
                          acc[p.key] = true
                          return acc
                        }, {} as Record<PermissionKey, boolean>)
                        return {
                          ...prev,
                          rolePermissions: {
                            ...(prev.rolePermissions ?? {}),
                            [raw]: allOn,
                          },
                        }
                      })
                      setNewRoleKey('')
                    }}
                  >
                    Add Role
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {Object.keys(form.rolePermissions ?? {})
                  .sort((a, b) => {
                    if (a === 'admin') return -1
                    if (b === 'admin') return 1
                    if (a === 'cashier') return -1
                    if (b === 'cashier') return 1
                    return a.localeCompare(b)
                  })
                  .map((roleKey) => {
                  const enabledCount = PERMISSIONS.reduce((count, p) => {
                    return count + (form.rolePermissions?.[roleKey]?.[p.key] ? 1 : 0)
                  }, 0)

                  const roleLabel = roleKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
                  const roleDesc = roleKey === 'admin'
                    ? 'Full access. Always enabled to avoid locking you out.'
                    : 'Toggle what this role can use.'

                  const setPermission = (perm: PermissionKey, value: boolean) => {
                    setForm(prev => ({
                      ...prev,
                      rolePermissions: {
                        ...prev.rolePermissions,
                        [roleKey]: {
                          ...prev.rolePermissions[roleKey],
                          [perm]: value,
                        },
                      },
                    }))
                  }

                  const setAll = (value: boolean) => {
                    setForm(prev => ({
                      ...prev,
                      rolePermissions: {
                        ...prev.rolePermissions,
                        [roleKey]: PERMISSIONS.reduce((acc, p) => {
                          acc[p.key] = value
                          return acc
                        }, {} as Record<PermissionKey, boolean>),
                      },
                    }))
                  }

                  return (
                    <Card key={roleKey} className="border-border/60">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{roleLabel}</CardTitle>
                              <Badge variant={roleKey === 'admin' ? 'default' : 'secondary'}>{enabledCount}/{PERMISSIONS.length}</Badge>
                            </div>
                            <CardDescription className="mt-1">{roleDesc}</CardDescription>
                          </div>

                          {roleKey !== 'admin' ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Button type="button" size="sm" variant="outline" onClick={() => setAll(true)}>
                                Enable all
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setAll(false)}>
                                Disable all
                              </Button>
                              {roleKey !== 'cashier' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setForm((prev) => {
                                      const next = { ...(prev.rolePermissions ?? {}) }
                                      delete next[roleKey]
                                      return { ...prev, rolePermissions: next }
                                    })
                                  }}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        {PERMISSIONS.map((p, idx) => {
                          const checked = Boolean(form.rolePermissions?.[roleKey]?.[p.key])
                          const disabled = roleKey === 'admin'
                          return (
                            <div key={p.key}>
                              <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-accent/40">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">{p.label}</div>
                                  <div className="text-xs text-muted-foreground">{p.description}</div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="hidden sm:inline text-xs text-muted-foreground w-12 text-right">
                                    {checked ? 'On' : 'Off'}
                                  </span>
                                  <Switch checked={checked} disabled={disabled} onCheckedChange={v => setPermission(p.key, v)} />
                                </div>
                              </div>
                              {idx !== PERMISSIONS.length - 1 ? <Separator /> : null}
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSave} disabled={!currentShop || !isDirty || isSaving}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="NGN">NGN (₦)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end">
                <Button onClick={handleSave} disabled={!currentShop || !isDirty || isSaving}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
