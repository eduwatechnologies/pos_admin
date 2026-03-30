'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetSettingsQuery,
  useUpdateRoleMutation,
  useUpdateSettingsMutation,
} from '@/redux/api/settings-api'
import { useEffect, useMemo, useState } from 'react'

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Access overview and KPIs' },
  { key: 'terminal', label: 'Terminal', description: 'Create sales and scan items' },
  { key: 'customers', label: 'Customers', description: 'Manage customer directory' },
  { key: 'receipts', label: 'Receipts', description: 'View and manage transactions' },
  { key: 'analytics', label: 'Analytics', description: 'View reports and trends' },
  { key: 'inventory', label: 'Inventory', description: 'Manage products and stock' },
  { key: 'employees', label: 'Employees', description: 'Manage staff accounts' },
  { key: 'settings', label: 'Settings', description: 'Change shop and system configuration' },
] as const

type PermissionKey = (typeof PERMISSIONS)[number]['key']
type RolePermissionsState = Record<string, Record<PermissionKey, boolean>>

type PermissionsForm = {
  rolePermissions: RolePermissionsState
}

export default function SettingsPermissionsPage() {
  const { user } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()

  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [newRoleKey, setNewRoleKey] = useState('')
  const [renamingRoleKey, setRenamingRoleKey] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [form, setForm] = useState<PermissionsForm>({
    rolePermissions: {
      admin: {
        dashboard: true,
        terminal: true,
        customers: true,
        receipts: true,
        analytics: true,
        inventory: true,
        employees: true,
        settings: true,
      },
      cashier: {
        dashboard: true,
        terminal: true,
        customers: false,
        receipts: true,
        analytics: false,
        inventory: false,
        employees: false,
        settings: false,
      },
    },
  })
  const [initial, setInitial] = useState(form)

  const skip = !user || !currentShop
  const { data: loadedSettings, error } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()
  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation()
  const [deleteRole, { isLoading: isDeletingRole }] = useDeleteRoleMutation()

  useEffect(() => {
    if (!loadedSettings) return
    const next: PermissionsForm = {
      rolePermissions: (loadedSettings.rolePermissions ?? {}) as RolePermissionsState,
    }
    setForm(next)
    setInitial(next)
  }, [loadedSettings])

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: (error as any)?.data?.error ?? (error as any)?.data?.message ?? 'Failed to load settings',
      variant: 'destructive',
    })
  }, [error, toast])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  const isRoleBusy = isSaving || isCreatingRole || isUpdatingRole || isDeletingRole

  const handleCreateRole = async () => {
    if (!currentShop) return
    if (isDirty) {
      toast({
        title: 'Save first',
        description: 'Save role permission changes before creating a new role.',
        variant: 'destructive',
      })
      return
    }

    const raw = newRoleKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!raw) {
      toast({ title: 'Invalid role', description: 'Role name is required', variant: 'destructive' })
      return
    }
    if (raw === 'admin' || raw === 'super_admin' || raw === 'cashier') {
      toast({ title: 'Invalid role', description: 'This role name is reserved', variant: 'destructive' })
      return
    }

    try {
      const res = await createRole({ shopId: currentShop.id, roleKey: raw }).unwrap()
      const next: PermissionsForm = { rolePermissions: res.rolePermissions as RolePermissionsState }
      setForm(next)
      setInitial(next)
      setNewRoleKey('')
      setCreateRoleOpen(false)
      toast({ title: 'Role created', description: raw })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ??
          (err as any)?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to create role'),
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!currentShop) return
    try {
      const updated = await updateSettings({ shopId: currentShop.id, input: { rolePermissions: form.rolePermissions } }).unwrap()
      const next: PermissionsForm = { rolePermissions: (updated.rolePermissions ?? {}) as RolePermissionsState }
      setForm(next)
      setInitial(next)
      toast({ title: 'Success', description: 'Settings saved' })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to save settings'),
        variant: 'destructive',
      })
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Role permissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Define what each role can access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">Create roles, then switch off features you don’t want that role to use.</div>
            <Button type="button" variant="outline" disabled={!currentShop || isRoleBusy} onClick={() => setCreateRoleOpen(true)}>
              Add Role
            </Button>
          </div>

          <Dialog
            open={createRoleOpen}
            onOpenChange={(open) => {
              setCreateRoleOpen(open)
              if (!open) setNewRoleKey('')
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Role</DialogTitle>
                <DialogDescription>Create a new role. All permissions start enabled by default.</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role name</label>
                <input
                  type="text"
                  placeholder="e.g. manager"
                  value={newRoleKey}
                  onChange={(e) => setNewRoleKey(e.target.value)}
                  className="h-10 w-full px-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!currentShop || isRoleBusy}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isRoleBusy}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleCreateRole} disabled={!currentShop || isRoleBusy}>
                  {isCreatingRole ? 'Adding…' : 'Create role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                const roleDesc =
                  roleKey === 'admin' ? 'Full access. Always enabled to avoid locking you out.' : 'Toggle what this role can use.'

                const setPermission = (perm: PermissionKey, value: boolean) => {
                  setForm((prev) => ({
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
                  setForm((prev) => ({
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
                            <Badge variant={roleKey === 'admin' ? 'default' : 'secondary'}>
                              {enabledCount}/{PERMISSIONS.length}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">{roleDesc}</CardDescription>
                        </div>

                        {roleKey !== 'admin' ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button type="button" size="sm" variant="outline" onClick={() => setAll(true)} disabled={isRoleBusy}>
                              Enable all
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setAll(false)} disabled={isRoleBusy}>
                              Disable all
                            </Button>

                            {roleKey !== 'cashier' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (!currentShop) return
                                  if (isDirty) {
                                    toast({
                                      title: 'Save first',
                                      description: 'Save role permission changes before renaming a role.',
                                      variant: 'destructive',
                                    })
                                    return
                                  }
                                  setRenamingRoleKey(roleKey)
                                  setRenameValue(roleKey)
                                }}
                                disabled={!currentShop || isRoleBusy}
                              >
                                Rename
                              </Button>
                            ) : null}

                            {roleKey !== 'cashier' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (!currentShop) return
                                  if (isDirty) {
                                    toast({
                                      title: 'Save first',
                                      description: 'Save role permission changes before deleting a role.',
                                      variant: 'destructive',
                                    })
                                    return
                                  }
                                  deleteRole({ shopId: currentShop.id, roleKey })
                                    .unwrap()
                                    .then((res) => {
                                      const next: PermissionsForm = { rolePermissions: res.rolePermissions as RolePermissionsState }
                                      setForm(next)
                                      setInitial(next)
                                      toast({ title: 'Role deleted', description: roleLabel })
                                    })
                                    .catch((err) => {
                                      toast({
                                        title: 'Error',
                                        description:
                                          (err as any)?.data?.error ??
                                          (err as any)?.data?.message ??
                                          (err instanceof Error ? err.message : 'Failed to delete role'),
                                        variant: 'destructive',
                                      })
                                    })
                                }}
                                disabled={!currentShop || isRoleBusy}
                              >
                                {isDeletingRole ? 'Deleting…' : 'Delete'}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {renamingRoleKey === roleKey ? (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-9 w-full sm:w-[220px] px-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={!currentShop || isRoleBusy}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (!currentShop) return
                                const next = renameValue.trim().toLowerCase().replace(/\s+/g, '_')
                                updateRole({ shopId: currentShop.id, roleKey, input: { roleKey: next } })
                                  .unwrap()
                                  .then((res) => {
                                    const nextForm: PermissionsForm = { rolePermissions: res.rolePermissions as RolePermissionsState }
                                    setForm(nextForm)
                                    setInitial(nextForm)
                                    setRenamingRoleKey(null)
                                    setRenameValue('')
                                    toast({ title: 'Role renamed' })
                                  })
                                  .catch((err) => {
                                    toast({
                                      title: 'Error',
                                      description:
                                        (err as any)?.data?.error ??
                                        (err as any)?.data?.message ??
                                        (err instanceof Error ? err.message : 'Failed to rename role'),
                                      variant: 'destructive',
                                    })
                                  })
                              }}
                              disabled={!currentShop || isRoleBusy}
                            >
                              {isUpdatingRole ? 'Saving…' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRenamingRoleKey(null)
                                setRenameValue('')
                              }}
                              disabled={!currentShop || isRoleBusy}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {PERMISSIONS.map((p, idx) => {
                        const checked = Boolean(form.rolePermissions?.[roleKey]?.[p.key])
                        const disabled = roleKey === 'admin' || isRoleBusy
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
                                <Switch checked={checked} disabled={disabled} onCheckedChange={(v) => setPermission(p.key, v)} />
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
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
