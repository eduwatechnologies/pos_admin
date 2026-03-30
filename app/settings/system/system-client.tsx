'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import {
  useGetBillingSubscriptionQuery,
  useInitializePaystackMutation,
  useListBillingPlansQuery,
  useVerifyPaystackMutation,
} from '@/redux/api/billing-api'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/redux/api/settings-api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type SystemForm = {
  currency: string
}

export default function SettingsSystemClient() {
  const { user } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const skip = !user || !currentShop
  const { data: loadedSettings, error } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation()

  const { data: plans = [], error: plansError } = useListBillingPlansQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: subscription, error: subscriptionError } = useGetBillingSubscriptionQuery(
    { shopId: currentShop?.id ?? '' },
    { skip },
  )
  const [initializePaystack, { isLoading: isInitializing }] = useInitializePaystackMutation()
  const [verifyPaystack, { isLoading: isVerifying }] = useVerifyPaystackMutation()

  const [form, setForm] = useState<SystemForm>({ currency: 'NGN' })
  const [initial, setInitial] = useState(form)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  useEffect(() => {
    if (!loadedSettings) return
    const next: SystemForm = { currency: loadedSettings.currency ?? 'NGN' }
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

  useEffect(() => {
    if (!plansError) return
    toast({
      title: 'Error',
      description: (plansError as any)?.data?.error ?? (plansError as any)?.data?.message ?? 'Failed to load billing plans',
      variant: 'destructive',
    })
  }, [plansError, toast])

  useEffect(() => {
    if (!subscriptionError) return
    toast({
      title: 'Error',
      description:
        (subscriptionError as any)?.data?.error ?? (subscriptionError as any)?.data?.message ?? 'Failed to load subscription',
      variant: 'destructive',
    })
  }, [subscriptionError, toast])

  useEffect(() => {
    if (selectedPlanId) return
    if (!plans.length) return
    setSelectedPlanId(plans[0].id)
  }, [plans, selectedPlanId])

  useEffect(() => {
    if (!currentShop) return
    const ref = searchParams.get('reference') ?? searchParams.get('trxref')
    if (!ref) return

    ;(async () => {
      try {
        await verifyPaystack({ shopId: currentShop.id, reference: ref }).unwrap()
        toast({ title: 'Payment verified', description: 'Your subscription has been updated.' })
      } catch (err) {
        toast({
          title: 'Payment verification failed',
          description:
            (err as any)?.data?.error ??
            (err as any)?.data?.message ??
            (err instanceof Error ? err.message : 'Unable to verify payment'),
          variant: 'destructive',
        })
      } finally {
        router.replace('/settings/system')
      }
    })()
  }, [currentShop, router, searchParams, toast, verifyPaystack])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  const handleSave = async () => {
    if (!currentShop) return
    try {
      const updated = await updateSettings({ shopId: currentShop.id, input: form }).unwrap()
      const next: SystemForm = { currency: updated.currency ?? 'NGN' }
      setForm(next)
      setInitial(next)
      toast({ title: 'Success', description: 'Settings saved' })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ??
          (err as any)?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to save settings'),
        variant: 'destructive',
      })
    }
  }

  if (!user) return null

  const activePlan = plans.find((p) => p.id === subscription?.planId) ?? null

  const handlePay = async () => {
    if (!currentShop) return
    if (!selectedPlanId) return
    try {
      const redirectUrl = `${window.location.origin}/settings/system`
      const resp = await initializePaystack({ shopId: currentShop.id, planId: selectedPlanId, redirectUrl }).unwrap()
      if (resp.authorizationUrl) window.location.href = resp.authorizationUrl
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to start payment'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">System configuration.</p>
      </div>

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
              onChange={(e) => setForm({ currency: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isSaving}
            >
              <option value="NGN">NGN (₦)</option>
            </select>
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
          <CardTitle>Billing (Paystack)</CardTitle>
          <CardDescription>Pay for this store subscription using Paystack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm">
              <span className="font-medium">Status: </span>
              <span>{subscription?.status ?? 'none'}</span>
            </div>
            {subscription?.currentPeriodEnd ? (
              <div className="text-sm">
                <span className="font-medium">Renews/Ends: </span>
                <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            ) : null}
            {activePlan ? (
              <div className="text-sm">
                <span className="font-medium">Current Plan: </span>
                <span>
                  {activePlan.name} ({activePlan.currency} {activePlan.priceMonthly}/month)
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Choose Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!currentShop || isInitializing || isVerifying || !plans.length}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.currency} {p.priceMonthly}/month
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={handlePay} disabled={!currentShop || !selectedPlanId || isInitializing || isVerifying}>
              {isVerifying ? 'Verifying…' : isInitializing ? 'Redirecting…' : 'Pay with Paystack'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
