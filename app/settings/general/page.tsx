'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/redux/api/settings-api'
import { useEffect, useMemo, useState } from 'react'

type GeneralForm = {
  name: string
  businessName: string
  address: string
  phone: string
  taxRatePercent: string
  allowNegativeStock: boolean
}

export default function SettingsGeneralPage() {
  const { user } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()

  const skip = !user || !currentShop
  const { data: loadedSettings, error } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()

  const [form, setForm] = useState<GeneralForm>({
    name: '',
    businessName: '',
    address: '',
    phone: '',
    taxRatePercent: '8',
    allowNegativeStock: false,
  })
  const [initial, setInitial] = useState(form)

  useEffect(() => {
    if (!loadedSettings) return
    const taxRateBps = Number(loadedSettings.taxRateBps ?? 0)
    const taxRatePercent = (Number.isFinite(taxRateBps) ? taxRateBps : 0) / 100
    const next: GeneralForm = {
      name: loadedSettings.name ?? '',
      businessName: loadedSettings.businessName ?? '',
      address: loadedSettings.address ?? '',
      phone: loadedSettings.phone ?? '',
      taxRatePercent: String(taxRatePercent),
      allowNegativeStock: loadedSettings.allowNegativeStock === true,
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

  const handleSave = async () => {
    if (!currentShop) return
    try {
      const taxRatePercent = Number(form.taxRatePercent)
      const safePercent = Number.isFinite(taxRatePercent) && taxRatePercent >= 0 ? taxRatePercent : 0
      const taxRateBps = Math.round(safePercent * 100)

      const updated = await updateSettings({
        shopId: currentShop.id,
        input: {
          name: form.name,
          businessName: form.businessName,
          address: form.address,
          phone: form.phone,
          taxRateBps,
          allowNegativeStock: form.allowNegativeStock,
        },
      }).unwrap()
      const next: GeneralForm = {
        name: updated.name ?? '',
        businessName: updated.businessName ?? '',
        address: updated.address ?? '',
        phone: updated.phone ?? '',
        taxRatePercent: String(Number(updated.taxRateBps ?? 0) / 100),
        allowNegativeStock: updated.allowNegativeStock === true,
      }
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
              onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Shop Name</label>
            <input
              type="text"
              placeholder="Enter shop name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <input
              type="text"
              placeholder="Enter address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tax rate (%)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="100"
              value={form.taxRatePercent}
              onChange={(e) => setForm((prev) => ({ ...prev, taxRatePercent: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Allow negative stock</div>
              <div className="text-xs text-muted-foreground">If enabled, checkout can sell even when stock is low.</div>
            </div>
            <Switch
              checked={form.allowNegativeStock}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, allowNegativeStock: v }))}
              disabled={!currentShop || isSaving}
            />
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
