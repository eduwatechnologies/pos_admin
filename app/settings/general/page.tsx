'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  storefrontEnabled: boolean
  storefrontSlug: string
  storefrontDescription: string
  storefrontPrimaryColor: string
  storefrontBannerUrl: string
  storefrontDeliveryFeeCents: string
  storefrontPickupOnly: boolean
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
    storefrontEnabled: false,
    storefrontSlug: '',
    storefrontDescription: '',
    storefrontPrimaryColor: '#0f172a',
    storefrontBannerUrl: '',
    storefrontDeliveryFeeCents: '0',
    storefrontPickupOnly: true,
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
      storefrontEnabled: loadedSettings.storefrontEnabled === true,
      storefrontSlug: loadedSettings.storefrontSlug ?? '',
      storefrontDescription: loadedSettings.storefrontDescription ?? '',
      storefrontPrimaryColor: loadedSettings.storefrontPrimaryColor ?? '#0f172a',
      storefrontBannerUrl: loadedSettings.storefrontBannerUrl ?? '',
      storefrontDeliveryFeeCents: String(Number(loadedSettings.storefrontDeliveryFeeCents ?? 0) / 100),
      storefrontPickupOnly: loadedSettings.storefrontPickupOnly !== false,
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

  const publicStorefrontUrl = useMemo(() => {
    if (!currentShop?.id) return null
    const base =
      (typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin)
        : (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''))
        .replace(/\/+$/, '')
    const slug = String(form.storefrontSlug ?? '').trim()
    if (slug) return `${base}/shop/${encodeURIComponent(slug)}`
    return `${base}/store/${encodeURIComponent(currentShop.id)}`
  }, [currentShop?.id, form.storefrontSlug])

  async function copyStorefrontUrl() {
    if (!publicStorefrontUrl) return
    try {
      await navigator.clipboard.writeText(publicStorefrontUrl)
      toast({ title: 'Link copied', description: publicStorefrontUrl })
    } catch {
      toast({ title: 'Copy failed', description: publicStorefrontUrl, variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!currentShop) return
    try {
      const taxRatePercent = Number(form.taxRatePercent)
      const safePercent = Number.isFinite(taxRatePercent) && taxRatePercent >= 0 ? taxRatePercent : 0
      const taxRateBps = Math.round(safePercent * 100)

      const deliveryFeeCents = Number(form.storefrontDeliveryFeeCents)
      const safeDeliveryFeeCents = Number.isFinite(deliveryFeeCents) && deliveryFeeCents >= 0 ? Math.round(deliveryFeeCents * 100) : 0

      const updated = await updateSettings({
        shopId: currentShop.id,
        input: {
          name: form.name,
          businessName: form.businessName,
          address: form.address,
          phone: form.phone,
          taxRateBps,
          allowNegativeStock: form.allowNegativeStock,
          storefrontEnabled: form.storefrontEnabled,
          storefrontSlug: form.storefrontSlug.trim() || null,
          storefrontDescription: form.storefrontDescription.trim() || null,
          storefrontPrimaryColor: form.storefrontPrimaryColor,
          storefrontBannerUrl: form.storefrontBannerUrl.trim() || null,
          storefrontDeliveryFeeCents: safeDeliveryFeeCents,
          storefrontPickupOnly: form.storefrontPickupOnly,
        },
      }).unwrap()
      const next: GeneralForm = {
        name: updated.name ?? '',
        businessName: updated.businessName ?? '',
        address: updated.address ?? '',
        phone: updated.phone ?? '',
        taxRatePercent: String(Number(updated.taxRateBps ?? 0) / 100),
        allowNegativeStock: updated.allowNegativeStock === true,
        storefrontEnabled: updated.storefrontEnabled === true,
        storefrontSlug: updated.storefrontSlug ?? '',
        storefrontDescription: updated.storefrontDescription ?? '',
        storefrontPrimaryColor: updated.storefrontPrimaryColor ?? '#0f172a',
        storefrontBannerUrl: updated.storefrontBannerUrl ?? '',
        storefrontDeliveryFeeCents: String(Number(updated.storefrontDeliveryFeeCents ?? 0) / 100),
        storefrontPickupOnly: updated.storefrontPickupOnly !== false,
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

      <Card>
        <CardHeader>
          <CardTitle>Storefront</CardTitle>
          <CardDescription>Turn your shop into a public storefront for online orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Enable storefront</div>
              <div className="text-xs text-muted-foreground">Allow customers to browse products and place online orders.</div>
            </div>
            <Switch
              checked={form.storefrontEnabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, storefrontEnabled: v }))}
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            {form.storefrontEnabled ? (
              <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 mt-px">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div className="space-y-0.5">
                  <div className="font-semibold">Storefront is live</div>
                  <div className="opacity-90">
                    {loadedSettings?.storefrontEnabled === true
                      ? 'Settings saved. The link below works for customers.'
                      : 'Toggle saved above. Click "Save Changes" to publish the link and open the public page.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 mt-px">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="space-y-0.5">
                  <div className="font-semibold">Storefront is turned off</div>
                  <div className="opacity-90">Toggle "Enable storefront" above and click Save Changes to open your public store to customers.</div>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Public storefront link</div>
                <div className="text-xs text-muted-foreground">
                  {form.storefrontEnabled
                    ? 'Share this link with customers so they can browse and place orders online.'
                    : 'Link preview shown below. Enable + Save to unlock it for customers.'}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={publicStorefrontUrl ?? ''}
                className="flex-1 bg-muted/40 font-mono text-xs"
                aria-label="Public storefront URL"
                onFocus={(e) => e.currentTarget.select()}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyStorefrontUrl}
                  disabled={!publicStorefrontUrl}
                >
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!publicStorefrontUrl || !currentShop?.id) return
                    window.open(`/store/${encodeURIComponent(currentShop.id)}`, '_blank', 'noopener,noreferrer')
                  }}
                  disabled={!currentShop?.id}
                >
                  Preview (admin)
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!publicStorefrontUrl) return
                    window.open(publicStorefrontUrl, '_blank', 'noopener,noreferrer')
                  }}
                  disabled={!publicStorefrontUrl}
                >
                  Open public page
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Storefront slug</label>
            <input
              type="text"
              placeholder="mystore"
              value={form.storefrontSlug}
              onChange={(e) => setForm((prev) => ({ ...prev, storefrontSlug: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Storefront description</label>
            <textarea
              rows={4}
              placeholder="Tell shoppers about your products and pickup terms"
              value={form.storefrontDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, storefrontDescription: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary color</label>
              <input
                type="color"
                value={form.storefrontPrimaryColor}
                onChange={(e) => setForm((prev) => ({ ...prev, storefrontPrimaryColor: e.target.value }))}
                className="h-11 w-full rounded-lg border border-input bg-background p-1"
                disabled={!currentShop || isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery fee (NGN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.storefrontDeliveryFeeCents}
                onChange={(e) => setForm((prev) => ({ ...prev, storefrontDeliveryFeeCents: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!currentShop || isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Banner image URL</label>
            <input
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={form.storefrontBannerUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, storefrontBannerUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Pickup only</div>
              <div className="text-xs text-muted-foreground">Disable delivery if you only offer pickup.</div>
            </div>
            <Switch
              checked={form.storefrontPickupOnly}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, storefrontPickupOnly: v }))}
              disabled={!currentShop || isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
