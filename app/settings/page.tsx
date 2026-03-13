'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    address: '',
    phone: '',
    currency: 'NGN',
  })
  const [initial, setInitial] = useState(form)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user || user.role !== 'admin' || !currentShop) return
      try {
        const settings = await api.settings.get(currentShop.id)
        if (cancelled) return
        setForm(settings)
        setInitial(settings)
      } catch (err) {
        if (cancelled) return
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load settings',
          variant: 'destructive',
        })
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, toast, user])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  const handleSave = async () => {
    if (!currentShop) return
    setIsSaving(true)
    try {
      const updated = await api.settings.update(currentShop.id, form)
      setForm(updated)
      setInitial(updated)
      toast({ title: 'Success', description: 'Settings saved' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || user.role !== 'admin') {
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
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Admin Role</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      Access to all features
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      Manage inventory
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      Manage employees
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      View analytics
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      System settings
                    </li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Cashier Role</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2"></span>
                      View products
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2"></span>
                      Create receipts
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2"></span>
                      View own sales
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2"></span>
                      Dashboard overview
                    </li>
                  </ul>
                </div>
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
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
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
