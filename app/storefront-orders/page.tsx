'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useShop } from '@/context/shop-context'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useListOnlineOrdersQuery, useUpdateOnlineOrderStatusMutation, type ApiOnlineOrder } from '@/redux/api/receipts-api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Eye, ChevronDown, ChevronUp } from 'lucide-react'

const orderStatusOptions = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'completed',
  'canceled',
] as const

type OrderStatusFilter = typeof orderStatusOptions[number] | 'all'

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getOrderStatusBadgeVariant(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
    case 'confirmed':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case 'preparing':
      return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
    case 'ready_for_pickup':
      return 'bg-purple-100 text-purple-700 hover:bg-purple-100'
    case 'completed':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'canceled':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
    default:
      return ''
  }
}

export default function StorefrontOrdersPage() {
  const { isAuthenticated } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()

  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [detailOrder, setDetailOrder] = useState<ApiOnlineOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const queryArgs = useMemo(() => {
    const args: { shopId: string; orderStatus?: string; q?: string } = {
      shopId: currentShop?.id ?? '',
    }
    if (statusFilter !== 'all') args.orderStatus = statusFilter
    if (debouncedSearch) args.q = debouncedSearch
    return args
  }, [currentShop?.id, statusFilter, debouncedSearch])

  const { data: orders = [], isLoading, isError } = useListOnlineOrdersQuery(queryArgs, {
    skip: !isAuthenticated || !currentShop,
  })

  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOnlineOrderStatusMutation()

  const ordered = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  )

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openDetail = (order: ApiOnlineOrder) => {
    setDetailOrder(order)
    setDetailOpen(true)
  }

  const handleStatusChange = async (orderId: string, value: string) => {
    if (!currentShop) return
    if (!orderId) return

    try {
      await updateOrderStatus({ shopId: currentShop.id, orderId, orderStatus: value }).unwrap()
      setSelectedStatus((prev) => ({ ...prev, [orderId]: value }))
      toast({ title: 'Order updated', description: 'The storefront order status has been saved.' })
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.data?.error ?? 'Could not update the order status.',
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, phone, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            All
          </button>
          {orderStatusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Online orders</CardTitle>
          <Badge variant="secondary">{ordered.length} total</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">Failed to load storefront orders.</p>
          ) : ordered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No online orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Order date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordered.map((order) => {
                    const value = selectedStatus[order.id] ?? order.orderStatus
                    const isExpanded = expandedRows[order.id] === true
                    return (
                      <Fragment key={order.id}>
                        <TableRow className="align-top">
                          <TableCell className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(order.id)}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="font-mono text-xs font-medium">{order.orderNumber}</div>
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="font-medium">{order.customerName ?? 'Guest customer'}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.customerPhone ?? 'No phone'}
                              {order.customerEmail ? ` • ${order.customerEmail}` : ''}
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="space-y-1">
                              {order.items.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No items</span>
                              ) : (
                                order.items.slice(0, 2).map((item, idx) => (
                                  <div key={`${order.id}-${idx}`} className="text-xs">
                                    {item.name} × {item.qty}
                                  </div>
                                ))
                              )}
                              {order.items.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{order.items.length - 2} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-3 font-medium">{formatCurrency(order.totalCents)}</TableCell>
                          <TableCell className="p-3 text-xs uppercase">{order.paymentMethod}</TableCell>
                          <TableCell className="p-3 text-xs">{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="p-3">
                            <Badge className={getOrderStatusBadgeVariant(order.orderStatus)}>
                              {order.orderStatus.replace(/_/g, ' ')}
                            </Badge>
                            <select
                              value={value}
                              onChange={(event) =>
                                setSelectedStatus((prev) => ({ ...prev, [order.id]: event.target.value }))
                              }
                              className="mt-2 w-full rounded-md border bg-background px-2 py-1 text-xs"
                            >
                              {orderStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="p-3 text-right">
                            <div className="flex flex-col gap-2 items-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetail(order)}
                                className="gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(order.id, selectedStatus[order.id] ?? order.orderStatus)
                                }
                                disabled={
                                  isUpdating ||
                                  (selectedStatus[order.id] ?? order.orderStatus) === order.orderStatus
                                }
                              >
                                Save
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${order.id}-expanded`} className="bg-muted/30">
                            <TableCell colSpan={9} className="p-4">
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Order number</p>
                                    <p className="font-mono">{order.orderNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Paid at</p>
                                    <p>{formatDate(order.paidAt)}</p>
                                  </div>
                                  {order.notes && (
                                    <div className="md:col-span-2">
                                      <p className="text-sm font-medium text-muted-foreground">Customer notes</p>
                                      <p className="text-sm">{order.notes}</p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Items</h4>
                                  <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Product</TableHead>
                                          <TableHead className="text-right">Qty</TableHead>
                                          <TableHead className="text-right">Unit price</TableHead>
                                          <TableHead className="text-right">Line total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {order.items.map((item, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell className="text-right">{item.qty}</TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(item.unitPriceCents)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(item.lineTotalCents)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                                <div className="space-y-2 border-t pt-4 max-w-sm ml-auto">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(order.subtotalCents)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(order.taxCents)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.totalCents)}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {detailOrder.orderNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Order date</p>
                    <p className="font-medium">{formatDate(detailOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid at</p>
                    <p className="font-medium">{formatDate(detailOrder.paidAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment method</p>
                    <p className="font-medium capitalize">{detailOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order status</p>
                    <Badge className={getOrderStatusBadgeVariant(detailOrder.orderStatus)}>
                      {detailOrder.orderStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{detailOrder.customerName ?? 'Guest customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <div className="text-sm">
                      <div>{detailOrder.customerPhone ?? 'No phone'}</div>
                      {detailOrder.customerEmail && <div>{detailOrder.customerEmail}</div>}
                    </div>
                  </div>
                </div>

                {detailOrder.notes && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Customer notes</p>
                    <p className="mt-1 text-sm">{detailOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailOrder.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPriceCents)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.lineTotalCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4 max-w-sm ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(detailOrder.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(detailOrder.taxCents)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(detailOrder.totalCents)}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
