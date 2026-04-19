'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Banknote,
  Camera,
  Check,
  ChevronsUpDown,
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from '@zxing/library'
import PrintableReceipt from '@/components/printable-reciept'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ApiReceipt } from '@/lib/api/mappers'
import { useListCategoriesQuery } from '@/redux/api/categories-api'
import { useListProductsQuery } from '@/redux/api/products-api'
import { useCreateReceiptMutation } from '@/redux/api/receipts-api'
import { useCreateCustomerMutation, useListCustomersQuery } from '@/redux/api/customers-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

type CartLine = {
  productId: string
  name: string
  sku: string
  barcode?: string
  imageUrl?: string
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

  const walkInName = 'Walk-in'

  const skip = !isAuthenticated || !currentShop
  const { data: products = [], isFetching: isLoadingProducts } = useListProductsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip },
  )

  const searchRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const productsRef = useRef<any[]>([])

  useEffect(() => {
    productsRef.current = products
  }, [products])

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [customerName, setCustomerName] = useState(walkInName)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('idle')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<ApiReceipt | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    if (customerName.trim()) return
    setCustomerName(walkInName)
    setSelectedCustomerId(null)
  }, [customerName, walkInName])

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])
  const { data: categoryItems = [] } = useListCategoriesQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: customers = [] } = useListCustomersQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createReceipt, { isLoading: isCheckingOut }] = useCreateReceiptMutation()
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation()

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
    const taxRateBps = Number(settings?.taxRateBps ?? 800)
    const safeTaxRateBps = Number.isFinite(taxRateBps) && taxRateBps >= 0 ? taxRateBps : 0
    const taxAmount = (subtotal * safeTaxRateBps) / 10000
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total, count: lines.reduce((sum, l) => sum + l.qty, 0) }
  }, [cart, settings?.taxRateBps])

  const canCheckout = !!currentShop && totals.count > 0 && !isCheckingOut && checkoutStep !== 'processing'

  const customersByNameLower = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    for (const c of customers) {
      const id = String((c as any)?.id ?? '')
      const n = String((c as any)?.name ?? '').trim()
      if (!id || !n) continue
      map.set(n.toLowerCase(), { id, name: n })
    }
    return map
  }, [customers])

  const customerNames = useMemo(
    () => Array.from(customersByNameLower.values()).map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [customersByNameLower],
  )

  const addByCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim()
      if (!code) return false

      const codeLower = code.toLowerCase()
      const match =
        productsRef.current.find((p) => (p.sku ?? '').trim().toLowerCase() === codeLower) ??
        productsRef.current.find((p) => (p.barcode ?? '').trim().toLowerCase() === codeLower)

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
    [toast],
  )

  const stopScanner = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (!scannerOpen) return
    stopScanner()
    setIsCameraStarting(true)

    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      const videoDevices = await codeReader.listVideoInputDevices()
      if (!videoDevices || videoDevices.length === 0) {
        throw new Error('No camera found. Please ensure camera permissions are granted.')
      }

      // Prefer back camera
      const backCamera = videoDevices.find((d) => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      )
      const deviceId = backCamera?.deviceId ?? videoDevices[0].deviceId

      // Check if it's still open before continuing
      if (!scannerOpen) {
        stopScanner()
        return
      }

      if (!videoRef.current) {
        // Wait a bit for the video element to be mounted
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      if (!videoRef.current) {
        throw new Error('Video element not ready')
      }

      await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        setIsCameraStarting(false)
        if (result) {
          const code = result.getText()
          const added = addByCode(code)
          if (added) {
            setScannerOpen(false)
            stopScanner()
            // Using a small timeout to ensure UI updates before focusing
            setTimeout(() => searchRef.current?.focus(), 50)
          }
        }
        if (err && !(err instanceof NotFoundException) && !(err instanceof ChecksumException) && !(err instanceof FormatException)) {
          // Only log serious errors
          console.error('Scanner error:', err)
        }
      })
    } catch (err) {
      console.error('Start scanner catch:', err)
      setIsCameraStarting(false)
      toast({
        title: 'Camera unavailable',
        description: err instanceof Error ? err.message : 'Unable to start camera scanner',
        variant: 'destructive',
      })
      setScannerOpen(false)
    }
  }, [addByCode, stopScanner, toast, scannerOpen])

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner()
      return
    }
    startScanner()
    return () => stopScanner()
  }, [scannerOpen, startScanner, stopScanner])

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
          imageUrl: product.imageUrl,
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
    setCustomerName(walkInName)
    setSelectedCustomerId(null)
  }

  const beginCheckout = () => {
    if (!canCheckout) return
    setCheckoutStep('payment')
  }

  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    if (!currentShop) return
    setPaymentMethod(method)
    setCheckoutStep('processing')

    const trimmedCustomerName = customerName.trim()
    const finalCustomerName = trimmedCustomerName ? trimmedCustomerName : walkInName
    const customerId =
      finalCustomerName.toLowerCase() === walkInName.toLowerCase() ? null : selectedCustomerId ? selectedCustomerId : null

    const taxCents = Math.round(totals.taxAmount * 100)
    const items = Object.values(cart).map((l) => ({
      productId: l.productId,
      qty: l.qty,
      name: l.name,
      unitPriceCents: Math.round(l.unitPrice * 100),
      lineTotalCents: Math.round(l.unitPrice * 100) * l.qty,
    }))

    try {
      const result = await createReceipt({
        shopId: currentShop.id,
        input: {
          items,
          customerId,
          customerName: finalCustomerName,
          paymentMethod: method,
          taxCents,
        },
      }).unwrap()

      const receiptId = (result as any).id || (result as any).localId || 'unknown'

      setLastReceipt({
        id: receiptId,
        shopId: currentShop.id,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.qty,
          unitPrice: i.unitPriceCents / 100,
          lineTotal: i.lineTotalCents / 100,
        })),
        subtotal: totals.subtotal,
        tax: totals.taxAmount,
        discount: 0,
        total: totals.total,
        paymentMethod: method,
        customerId,
        customerName: finalCustomerName,
        cashierId: user?.id || null,
        cashierName: user?.name || null,
        status: 'completed',
        createdAt: new Date().toISOString(),
        date: new Date().toISOString(),
        source: 'pos',
      } as any)
      setReceiptOpen(false)
      setCheckoutStep('complete')
      setCustomerName(walkInName)
      setCart({})

      toast({
        title: 'Sale completed',
        description: `Receipt ${receiptId.slice(-8).toUpperCase()} • ${formatMoney(totals.total)}`,
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
            {scannerOpen ? (
              <button
                onClick={() => setScannerOpen(false)}
                className="h-10 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                type="button"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close Scanner</span>
              </button>
            ) : (
              <button
                onClick={() => setScannerOpen(true)}
                disabled={!currentShop}
                className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                type="button"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </button>
            )}
          </div>

          {scannerOpen ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="relative flex-1 rounded-xl border border-border bg-black overflow-hidden shadow-sm">
                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-white text-sm font-medium">Starting camera...</p>
                  </div>
                )}
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-48 border-2 border-primary/50 rounded-lg bg-primary/5 shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-sm" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="inline-block px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                    Center the barcode within the frame
                  </p>
                </div>
              </div>
              <div className="p-4 bg-card border border-border rounded-xl shadow-sm">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Alternative: Type barcode manually</p>
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
                    className="pl-9 h-11"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
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
                        className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary/40 hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 45vw, (max-width: 1280px) 30vw, 18vw"
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          )}

                          {outOfStock ? (
                            <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                              Out of stock
                            </div>
                          ) : null}
                        </div>

                        <p className="text-sm font-semibold text-card-foreground leading-snug">{product.name}</p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[11px] font-mono text-muted-foreground">
                            {product.sku ? product.sku : 'No SKU'}
                          </span>
                          {inCart > 0 ? (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              In cart {inCart}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex items-end justify-between gap-2">
                          <p className="text-base font-bold text-primary tabular-nums">{formatMoney(product.price)}</p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">{Number(product.quantity ?? 0)} left</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>

        {(totals.count > 0 || checkoutStep !== 'idle') && (
          <div className="w-[340px] shrink-0 bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden animate-in slide-in-from-right duration-300">
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
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                    >
                      <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={44} height={44} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-md border bg-background">
                            <button
                              onClick={() => setLineQty(item.productId, item.qty - 1)}
                              type="button"
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-l-sm"
                            >
                              <Minus className="w-3 h-3 text-foreground" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-card-foreground tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => setLineQty(item.productId, item.qty + 1)}
                              disabled={item.qty >= item.availableQty}
                              type="button"
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-r-sm disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3 text-foreground" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(item.productId)}
                            type="button"
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between h-11 shrink-0">
                        <span className="text-sm font-semibold text-primary tabular-nums">
                          {formatMoney(item.unitPrice * item.qty)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {item.qty} x {formatMoney(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : checkoutStep === 'payment' ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
                  <p className="text-sm font-semibold text-card-foreground mb-1">Select Payment Method</p>
                  {([
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'transfer', label: 'Transfer / Mobile', icon: Smartphone },
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
                      Customer
                    </Label>
                    <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="customerName"
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerPickerOpen}
                          className="h-9 w-full justify-between px-3"
                        >
                          <span className="truncate">{customerName.trim() ? customerName : walkInName}</span>
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search customers..."
                            value={customerQuery}
                            onValueChange={setCustomerQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup heading="Customers">
                              <CommandItem
                                value={walkInName}
                                onSelect={() => {
                                  setCustomerName(walkInName)
                                  setSelectedCustomerId(null)
                                  setCustomerQuery('')
                                  setCustomerPickerOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'size-4',
                                    customerName.trim().toLowerCase() === walkInName.toLowerCase() ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {walkInName}
                              </CommandItem>
                              {customerNames.map((n) => (
                                <CommandItem
                                  key={n}
                                  value={n}
                                  onSelect={() => {
                                    const hit = customersByNameLower.get(n.toLowerCase())
                                    setCustomerName(hit?.name ?? n)
                                    setSelectedCustomerId(hit?.id ?? null)
                                    setCustomerQuery('')
                                    setCustomerPickerOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'size-4',
                                      customerName.trim().toLowerCase() === n.toLowerCase() ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {n}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {(() => {
                              const q = customerQuery.trim()
                              if (!q) return null
                              const lower = q.toLowerCase()
                              if (lower === walkInName.toLowerCase()) return null
                              if (customersByNameLower.has(lower)) return null
                              return (
                                <CommandGroup heading="Actions">
                                  <CommandItem
                                    value={`__create__${q}`}
                                    disabled={!currentShop || isCreatingCustomer}
                                    onSelect={async () => {
                                      if (!currentShop) return
                                      try {
                                        const created = await createCustomer({ shopId: currentShop.id, input: { name: q } }).unwrap()
                                        const createdName = String((created as any)?.name ?? q).trim() || q
                                        setCustomerName(createdName)
                                        setSelectedCustomerId(String((created as any)?.id ?? '') || null)
                                        setCustomerQuery('')
                                        setCustomerPickerOpen(false)
                                        toast({ title: 'Customer created', description: createdName })
                                      } catch (err: any) {
                                        toast({
                                          title: 'Error',
                                          description:
                                            err?.data?.error ??
                                            err?.data?.message ??
                                            (err instanceof Error ? err.message : 'Failed to create customer'),
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                  >
                                    <Plus className="size-4" />
                                    Create “{q}”
                                  </CommandItem>
                                </CommandGroup>
                              )
                            })()}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
        )}
      </div>

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
                if (lastReceipt) setShowReceipt(true)
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
          customerName={lastReceipt.customerName ? String(lastReceipt.customerName) : walkInName}
          cashierName={user?.name ? String(user.name) : undefined}
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
