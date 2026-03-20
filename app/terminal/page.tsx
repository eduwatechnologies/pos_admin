'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  Camera,
  Check,
  CreditCard,
  Minus,
  Plus,
  Receipt,
  ScanBarcode,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PrintableReceipt from '@/components/printable-reciept'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ApiReceipt } from '@/lib/api/mappers'
import { useListCategoriesQuery } from '@/redux/api/categories-api'
import { useListProductsQuery } from '@/redux/api/products-api'
import { useCreateReceiptMutation } from '@/redux/api/receipts-api'

type CartLine = {
  productId: string
  name: string
  sku: string
  barcode?: string
  unitPrice: number
  availableQty: number
  qty: number
}

function formatMoney(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(safe)
}

type CheckoutStep = 'idle' | 'payment' | 'processing' | 'complete'

export default function TerminalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const { currentShop } = useShop()

  const searchRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('idle')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<ApiReceipt | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: products = [], isFetching: isLoadingProducts } = useListProductsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip },
  )
  const { data: categoryItems = [] } = useListCategoriesQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createReceipt, { isLoading: isCheckingOut }] = useCreateReceiptMutation()

  const categories = useMemo(() => {
    const set = new Set<string>()
    set.add('General')
    for (const c of categoryItems) set.add(c.name)
    for (const p of products) set.add(p.category ?? 'General')

    const all = Array.from(set).filter((c) => c && c !== 'All')
    const rest = all.filter((c) => c !== 'General').sort((a, b) => a.localeCompare(b))
    return ['All', 'General', ...rest]
  }, [categoryItems, products])

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory('All')
  }, [activeCategory, categories])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'All' || (p.category ?? 'General') === activeCategory
      if (!matchesCategory) return false
      if (!q) return true
      const name = (p.name ?? '').toLowerCase()
      const sku = (p.sku ?? '').toLowerCase()
      const barcode = (p.barcode ?? '').toLowerCase()
      return name.includes(q) || sku.includes(q) || barcode.includes(q)
    })
  }, [activeCategory, products, search])

  const totals = useMemo(() => {
    const lines = Object.values(cart)
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
    const taxAmount = subtotal * 0.08
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total, count: lines.reduce((sum, l) => sum + l.qty, 0) }
  }, [cart])

  const canCheckout = !!currentShop && totals.count > 0 && !isCheckingOut && checkoutStep !== 'processing'

  const addByCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim()
      if (!code) return false

      const codeLower = code.toLowerCase()
      const match =
        products.find((p) => (p.sku ?? '').trim().toLowerCase() === codeLower) ??
        products.find((p) => (p.barcode ?? '').trim().toLowerCase() === codeLower)

      if (!match) return false

      setCart((prev) => {
        const existing = prev[match.id]
        const availableQty = Number(match.quantity ?? 0)
        const nextQty = Math.min(availableQty, (existing?.qty ?? 0) + 1)
        if (availableQty <= 0 || nextQty <= 0) return prev
        return {
          ...prev,
          [match.id]: {
            productId: match.id,
            name: match.name,
            sku: match.sku ?? '',
            barcode: match.barcode,
            unitPrice: Number(match.price ?? 0),
            availableQty,
            qty: nextQty,
          },
        }
      })

      toast({
        title: 'Added to cart',
        description: match.sku ? `${match.name} • ${match.sku}` : match.name,
      })
      return true
    },
    [products, toast],
  )

  const stopScanner = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    stopScanner()

    const BarcodeDetectorCtor = (globalThis as any).BarcodeDetector as
      | (new (args?: any) => { detect: (image: any) => Promise<Array<{ rawValue?: string }>> })
      | undefined

    if (!BarcodeDetectorCtor) {
      toast({
        title: 'Scanner not supported',
        description: 'Use a hardware barcode scanner or type the code in the search box.',
        variant: 'destructive',
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      const detector = new BarcodeDetectorCtor({
        formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a', 'upc_e'],
      })

      const loop = async () => {
        if (!videoRef.current) return
        try {
          const results = await detector.detect(videoRef.current)
          const code = results?.[0]?.rawValue ? String(results[0].rawValue) : ''
          if (code) {
            const added = addByCode(code)
            if (added) {
              setScannerOpen(false)
              stopScanner()
              searchRef.current?.focus()
              return
            }
          }
        } catch {}
        rafRef.current = requestAnimationFrame(loop)
      }

      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      toast({
        title: 'Camera unavailable',
        description: err instanceof Error ? err.message : 'Unable to start camera scanner',
        variant: 'destructive',
      })
    }
  }, [addByCode, stopScanner, toast])

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner()
      return
    }
    startScanner()
    return () => stopScanner()
  }, [scannerOpen, startScanner, stopScanner])

  const printReceipt = useCallback((receipt: ApiReceipt) => {
    const w = window.open('', '_blank', 'width=420,height=700')
    if (!w) return

    const lines = receipt.items
      .map(
        (i) => `
          <tr>
            <td style="padding:6px 0; border-bottom:1px dashed #ddd;">
              <div style="font-weight:600;">${String(i.productName ?? '')}</div>
              <div style="color:#555; font-size:12px;">${i.quantity} × ${formatMoney(i.unitPrice)}</div>
            </td>
            <td style="padding:6px 0; border-bottom:1px dashed #ddd; text-align:right; white-space:nowrap;">
              ${formatMoney(i.subtotal)}
            </td>
          </tr>
        `,
      )
      .join('')

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Receipt ${receipt.id}</title>
        </head>
        <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:16px; color:#111;">
          <div style="max-width:360px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:12px;">
              <div style="font-weight:800; font-size:18px;">Receipt</div>
              <div style="color:#555; font-size:12px;">${new Date(receipt.date).toLocaleString()}</div>
              <div style="color:#555; font-size:12px;">${receipt.id}</div>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tbody>
                ${lines}
              </tbody>
            </table>
            <div style="margin-top:12px; border-top:1px solid #eee; padding-top:12px; font-size:14px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#555;">Subtotal</span>
                <span>${formatMoney(receipt.subtotal)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#555;">Tax</span>
                <span>${formatMoney(receipt.tax)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px;">
                <span>Total</span>
                <span>${formatMoney(receipt.total)}</span>
              </div>
              <div style="margin-top:10px; color:#555; font-size:12px;">
                Payment: ${String(receipt.paymentMethod ?? '')}
              </div>
            </div>
          </div>
          <script>
            window.onload = () => { window.focus(); window.print(); };
          </script>
        </body>
      </html>
    `

    w.document.open()
    w.document.write(html)
    w.document.close()
  }, [])

  const addToCart = (product: (typeof products)[number]) => {
    setCart((prev) => {
      const existing = prev[product.id]
      const availableQty = Number(product.quantity ?? 0)
      const nextQty = Math.min(availableQty, (existing?.qty ?? 0) + 1)
      if (availableQty <= 0 || nextQty <= 0) return prev

      return {
        ...prev,
        [product.id]: {
          productId: product.id,
          name: product.name,
          sku: product.sku ?? '',
          barcode: product.barcode,
          unitPrice: Number(product.price ?? 0),
          availableQty,
          qty: nextQty,
        },
      }
    })
  }

  const setLineQty = (productId: string, nextQty: number) => {
    setCart((prev) => {
      const line = prev[productId]
      if (!line) return prev
      const clamped = Math.max(0, Math.min(line.availableQty, Math.floor(nextQty)))
      if (clamped === 0) {
        const { [productId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: { ...line, qty: clamped } }
    })
  }

  const removeLine = (productId: string) => {
    setCart((prev) => {
      if (!prev[productId]) return prev
      const { [productId]: _removed, ...rest } = prev
      return rest
    })
  }

  const clearCart = () => {
    setCart({})
    setCheckoutStep('idle')
    setPaymentMethod('cash')
    setLastReceipt(null)
    setReceiptOpen(false)
    setShowReceipt(false)
  }

  const beginCheckout = () => {
    if (!canCheckout) return
    setCheckoutStep('payment')
  }

  const handlePayment = async (method: 'cash' | 'card' | 'digital') => {
    if (!currentShop) return
    setPaymentMethod(method)
    setCheckoutStep('processing')

    const taxCents = Math.round(totals.taxAmount * 100)
    const items = Object.values(cart).map((l) => ({
      productId: l.productId,
      qty: l.qty,
      name: l.name,
      unitPriceCents: Math.round(l.unitPrice * 100),
    }))

    try {
      const receipt = await createReceipt({
        shopId: currentShop.id,
        input: {
          items,
          customerName: customerName.trim() ? customerName.trim() : undefined,
          paymentMethod: method,
          taxCents,
        },
      }).unwrap()

      setLastReceipt(receipt)
      setReceiptOpen(false)
      setCheckoutStep('complete')
      setCustomerName('')
      setCart({})

      toast({
        title: 'Sale completed',
        description: `Receipt ${receipt.id} • ${formatMoney(receipt.total)}`,
      })
    } catch (err) {
      setCheckoutStep('payment')
      toast({
        title: 'Checkout failed',
        description: err instanceof Error ? err.message : 'Unable to complete the sale',
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        {/* <div className="text-lg font-semibold">POS Terminal</div> */}
        {/* <div className="text-sm text-muted-foreground">
          {currentShop ? `Shop: ${currentShop.name}` : 'Select a shop to start'}
          {user ? ` • Cashier: ${user.name}` : ''}
        </div> */}
      </div>

      <div className="flex gap-4 h-[calc(100vh-7rem)] animate-fade-in">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const added = addByCode(search)
                  if (added) setSearch('')
                }}
                placeholder="Scan barcode or search products..."
                className="h-10 w-full pl-10 pr-4 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              disabled={!currentShop}
              className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              type="button"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>

          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
            {isLoadingProducts ? (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No products found.</div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart[product.id]?.qty ?? 0
                const outOfStock = Number(product.quantity ?? 0) <= 0
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={!currentShop || outOfStock}
                    type="button"
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 hover:shadow-md transition-all group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-grey-300 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-card-foreground leading-tight mb-1 truncate">{product.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">
                      {product.sku ? product.sku : 'No SKU'}
                      {inCart > 0 ? ` • In cart: ${inCart}` : ''}
                    </p>
                    <p className="text-base font-bold text-primary">{formatMoney(product.price)}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="w-[340px] shrink-0 bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="font-semibold text-card-foreground text-sm">Current Sale</span>
              {totals.count > 0 && (
                <span className="bg-primary text-primary-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {totals.count}
                </span>
              )}
            </div>
            {totals.count > 0 && checkoutStep === 'idle' && (
              <button onClick={clearCart} className="text-xs text-destructive hover:underline" type="button">
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {checkoutStep === 'idle' ? (
              totals.count === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ScanBarcode className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No items in cart</p>
                  <p className="text-xs mt-1">Scan or tap products to add</p>
                </div>
              ) : (
                Object.values(cart).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLineQty(item.productId, item.qty - 1)}
                        type="button"
                        className="w-6 h-6 rounded-md bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3 text-foreground" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-card-foreground tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => setLineQty(item.productId, item.qty + 1)}
                        disabled={item.qty >= item.availableQty}
                        type="button"
                        className="w-6 h-6 rounded-md bg-secondary hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3 text-foreground" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-card-foreground w-20 text-right tabular-nums">
                      {formatMoney(item.unitPrice * item.qty)}
                    </span>
                    <button
                      onClick={() => removeLine(item.productId)}
                      type="button"
                      className="w-6 h-6 rounded-md hover:bg-destructive/10 flex items-center justify-center transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))
              )
            ) : checkoutStep === 'payment' ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
                <p className="text-sm font-semibold text-card-foreground mb-1">Select Payment Method</p>
                {([
                  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'digital', label: 'Mobile Payment', icon: Smartphone },
                ] as const).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handlePayment(method.id)}
                    disabled={isCheckingOut}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <method.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-card-foreground">{method.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => setCheckoutStep('idle')}
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground mt-2"
                >
                  ← Back to cart
                </button>
              </div>
            ) : checkoutStep === 'processing' ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm font-medium text-card-foreground">Processing payment...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-card-foreground">Payment Successful</p>
                <p className="text-sm text-muted-foreground text-center">
                  {formatMoney(lastReceipt ? lastReceipt.total : totals.total)} via{' '}
                  {paymentMethod === 'card' ? 'Card' : paymentMethod === 'cash' ? 'Cash' : 'Mobile'}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    disabled={!lastReceipt}
                    className="h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    New Sale
                  </button>
                </div>
              </div>
            )}
          </div>

          {totals.count > 0 && (checkoutStep === 'idle' || checkoutStep === 'payment') ? (
            <div className="border-t border-border px-4 py-3 space-y-2">
              {checkoutStep === 'idle' ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="customerName" className="text-xs text-muted-foreground">
                    Customer (optional)
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="h-9"
                  />
                </div>
              ) : null}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (8%)</span>
                <span className="tabular-nums">{formatMoney(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-card-foreground pt-1 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(totals.total)}</span>
              </div>

              {checkoutStep === 'idle' ? (
                <button
                  onClick={beginCheckout}
                  disabled={!canCheckout}
                  type="button"
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  Charge {formatMoney(totals.total)}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Barcode scanner</DialogTitle>
            <DialogDescription>Point the camera at the barcode. If unsupported, use a hardware scanner.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border bg-black">
              <video ref={videoRef} className="aspect-video w-full" muted playsInline />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const added = addByCode(search)
                  if (added) {
                    setSearch('')
                    setScannerOpen(false)
                  } else {
                    toast({
                      title: 'Not found',
                      description: `No product matches "${search.trim()}"`,
                      variant: 'destructive',
                    })
                  }
                }}
                placeholder="Type SKU / barcode and press Enter"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScannerOpen(false)}>
              <X className="size-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>{lastReceipt ? `Receipt ${lastReceipt.id}` : 'No receipt'}</DialogDescription>
          </DialogHeader>
          {lastReceipt ? (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(lastReceipt.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatMoney(lastReceipt.tax)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-extrabold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(lastReceipt.total)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Paid with {String(lastReceipt.paymentMethod ?? paymentMethod)} • {new Date(lastReceipt.date).toLocaleString()}
                </div>
              </div>

              <div className="max-h-[240px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[72px] text-right">Qty</TableHead>
                      <TableHead className="w-[96px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastReceipt.items.map((i) => (
                      <TableRow key={`${i.productId}-${i.productName}`}>
                        <TableCell className="min-w-0">
                          <div className="truncate text-sm font-semibold">{i.productName}</div>
                          <div className="text-xs text-muted-foreground">{formatMoney(i.unitPrice)}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{i.quantity}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">{formatMoney(i.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (lastReceipt) printReceipt(lastReceipt)
              }}
              disabled={!lastReceipt}
            >
              <Receipt className="size-4" />
              Print
            </Button>
            <Button
              type="button"
              onClick={() => {
                setReceiptOpen(false)
                clearCart()
                setCheckoutStep('idle')
              }}
            >
              <Check className="size-4" />
              New sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showReceipt && lastReceipt ? (
        <PrintableReceipt
          items={lastReceipt.items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice }))}
          subtotal={lastReceipt.subtotal}
          tax={lastReceipt.tax}
          total={lastReceipt.total}
          paymentMethod={String(lastReceipt.paymentMethod ?? paymentMethod)}
          currency="NGN"
          storeName={currentShop?.name ?? undefined}
          storeLines={[
            currentShop?.address || currentShop?.location || undefined,
            currentShop?.phone ? `Tel: ${currentShop.phone}` : undefined,
          ].filter(Boolean) as string[]}
          transactionId={lastReceipt.id}
          date={new Date(lastReceipt.date)}
          onClose={() => setShowReceipt(false)}
        />
      ) : null}
    </div>
  )
}
