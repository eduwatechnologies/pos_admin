'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateShopMutation, useListShopsQuery } from '@/redux/api/shops-api'

export default function StoresPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const { setCurrentShop } = useShop()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated
  const { data: shops = [], error } = useListShopsQuery(undefined, { skip })
  const [createShop, { isLoading: isCreating }] = useCreateShopMutation()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: (error as any)?.data?.error ?? (error as any)?.data?.message ?? 'Failed to load stores',
      variant: 'destructive',
    })
  }, [error, toast])

  const canCreate = useMemo(() => name.trim().length > 0, [name])

  if (!user) return null

  const canManageStores = user.role === 'admin' || user.role === 'super_admin'

  if (!canManageStores) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground mt-2">You do not have access to manage stores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground mt-2">Create and manage your stores.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{shops.length} total</Badge>
          <Button
            onClick={() => {
              setName('')
              setCurrency('NGN')
              setBusinessName('')
              setAddress('')
              setPhone('')
              setOpen(true)
            }}
          >
            New store
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Stores</CardTitle>
          <CardDescription>Stores you have access to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Currency</th>
                  <th className="py-2 pr-4">ID</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s.id} className="border-b border-border">
                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                    <td className="py-3 pr-4">{s.currency ?? 'NGN'}</td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No stores yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (!isCreating ? setOpen(v) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Store</DialogTitle>
            <DialogDescription>Create a new store, then continue to subscription payment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ikeja Branch" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="NGN" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business name (optional)</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Kounter" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 080..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address (optional)</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 12 Allen Avenue" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isCreating} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canCreate || isCreating}
              onClick={async () => {
                try {
                  const shop = await createShop({
                    name: name.trim(),
                    currency: currency.trim() || undefined,
                    businessName: businessName.trim() || undefined,
                    address: address.trim() || undefined,
                    phone: phone.trim() || undefined,
                  }).unwrap()
                  setOpen(false)
                  setCurrentShop(shop)
                  router.push('/settings/system')
                } catch (err) {
                  toast({
                    title: 'Error',
                    description:
                      (err as any)?.data?.error ??
                      (err as any)?.data?.message ??
                      (err instanceof Error ? err.message : 'Failed to create store'),
                    variant: 'destructive',
                  })
                }
              }}
            >
              {isCreating ? 'Creating…' : 'Create and Subscribe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
