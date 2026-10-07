'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { normalizeBaseUrl } from '@/lib/api/http'

const API_BASE = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080')

type PublicShop = {
  id: string
  name: string
  businessName: string
  address: string | null
  phone: string | null
  currency: string
  storefrontEnabled: boolean
  storefrontSlug: string | null
  storefrontDescription: string | null
  storefrontPrimaryColor: string
  storefrontBannerUrl: string | null
  storefrontDeliveryFeeCents: number
  storefrontPickupOnly: boolean
}

type PublicProduct = {
  id: string
  name: string
  category: string
  description: string | null
  imageUrl: string | null
  priceCents: number
  stockQty: number
  isActive: boolean
}

type CartItem = {
  productId: string
  name: string
  priceCents: number
  qty: number
}

const formatMoney = (cents: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((Number.isFinite(cents) ? cents : 0) / 100)

export default function StorefrontPublicPage() {
  const params = useParams<{ shopId: string }>()
  const shopId = params?.shopId ?? ''

  const [shop, setShop] = useState<PublicShop | null>(null)
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storefrontDisabled, setStorefrontDisabled] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      setError('Store not found')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      setStorefrontDisabled(false)
      try {
        const res = await fetch(`${API_BASE}/shops/${shopId}/storefront`, { method: 'GET' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 403 && String(data?.error ?? '').toLowerCase().includes('disabled')) {
            setStorefrontDisabled(true)
            setShop(data?.shop ?? null)
          } else {
            throw new Error(data?.error ?? 'Failed to load storefront')
          }
          return
        }
        setShop(data?.shop ?? null)
        setProducts(Array.isArray(data?.products) ? data.products : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load storefront')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [shopId])

  const addToCart = (product: PublicProduct) => {
    setSuccess(null)
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, qty: Math.min(item.qty + 1, Math.max(product.stockQty, 1)) }
            : item,
        )
      }
      return [...current, { productId: product.id, name: product.name, priceCents: product.priceCents, qty: 1 }]
    })
  }

  const updateQty = (productId: string, nextQty: number) => {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, qty: Math.max(0, nextQty) } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const subtotalCents = cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
  const totalCents = subtotalCents + (shop?.storefrontDeliveryFeeCents ?? 0)

  const handleCheckout = async () => {
    if (!shop || cart.length === 0) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const orderPayload = {
        customerName: customerName.trim() || 'Guest Customer',
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod: 'cash',
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          unitPriceCents: item.priceCents,
        })),
      }

      const res = await fetch(`${API_BASE}/shops/${shopId}/storefront/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error ?? 'Unable to place order')
      }

      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setSuccess(`Order placed successfully. Reference: ${data?.orderId ?? 'created'}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="ml-3">Loading storefront…</span>
        </div>
      </div>
    )
  }

  if (storefrontDisabled || !shop) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Card>
          <div className="space-y-3 p-6" style={{ background: shop?.storefrontPrimaryColor || '#0f172a', color: '#fff' }}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Storefront preview</p>
            <h1 className="text-3xl font-bold leading-tight">
              {shop?.businessName || shop?.name || 'Storefront not active'}
            </h1>
            {(shop?.storefrontDescription || shop?.address) ? (
              <div className="space-y-1 text-sm opacity-90">
                {shop?.storefrontDescription ? <p>{shop.storefrontDescription}</p> : null}
                {shop?.address ? <p>{shop.address}</p> : null}
              </div>
            ) : null}
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="space-y-1">
                <p className="font-semibold">Storefront is disabled for this shop.</p>
                <p className="opacity-90">
                  Go to{' '}
                  <a
                    href="/settings/general"
                    className="font-medium underline underline-offset-2 hover:opacity-80"
                  >
                    Settings → General
                  </a>
                  , turn on <span className="font-semibold">Enable storefront</span>, and click{' '}
                  <span className="font-semibold">Save Changes</span>.
                </p>
                {shop?.phone ? (
                  <p className="opacity-90">
                    Contact: <span className="font-medium">{shop.phone}</span>
                  </p>
                ) : null}
              </div>
            </div>
            {error && !storefrontDisabled ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div
        className="overflow-hidden rounded-2xl border border-border shadow-sm"
        style={{ background: shop.storefrontPrimaryColor, color: '#fff' }}
      >
        {shop.storefrontBannerUrl ? <img src={shop.storefrontBannerUrl} alt={shop.name} className="h-56 w-full object-cover" /> : null}
        <div className="space-y-3 p-6">
          <p className="text-sm uppercase tracking-[0.2em] opacity-80">Storefront</p>
          <h1 className="text-3xl font-bold">{shop.businessName || shop.name}</h1>
          {shop.storefrontDescription ? <p className="max-w-2xl text-sm opacity-90">{shop.storefrontDescription}</p> : null}
          {shop.address ? <p className="text-sm opacity-80">{shop.address}</p> : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products</h2>
            <span className="text-sm text-muted-foreground">{products.length} items</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
                </div>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatMoney(product.priceCents, shop.currency)}</span>
                    <span className="text-xs text-muted-foreground">{product.stockQty} in stock</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description ?? 'Freshly stocked product.'}</p>
                  <Button className="w-full" onClick={() => addToCart(product)}>
                    Add to cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
              <CardDescription>{cart.length} item(s) selected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(item.priceCents, shop.currency)}</p>
                      </div>
                      <p className="font-semibold">{formatMoney(item.priceCents * item.qty, shop.currency)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => updateQty(item.productId, item.qty - 1)}>
                          -
                        </Button>
                        <span className="min-w-6 text-center text-sm">{item.qty}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQty(item.productId, item.qty + 1)}>
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-2 border-t pt-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotalCents, shop.currency)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{formatMoney(shop.storefrontDeliveryFeeCents ?? 0, shop.currency)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(totalCents, shop.currency)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />

              <Button className="w-full" onClick={handleCheckout} disabled={submitting || cart.length === 0}>
                {submitting ? 'Placing order…' : 'Place order'}
              </Button>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
