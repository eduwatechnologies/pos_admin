'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Receipt } from '@/lib/types'
import { Printer, Share2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ReceiptDetailModalProps {
  receipt: Receipt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrint: (receipt: Receipt) => void
  onShare: (receipt: Receipt) => void
  onRefund?: (receipt: Receipt, reason: string) => void
  canRefund?: boolean
  isRefunding?: boolean
}

export function ReceiptDetailModal({
  receipt,
  open,
  onOpenChange,
  onPrint,
  onShare,
  onRefund,
  canRefund,
  isRefunding,
}: ReceiptDetailModalProps) {
  if (!receipt) return null
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' })
  const [refundReason, setRefundReason] = useState<string>('')

  useEffect(() => {
    if (!open) setRefundReason('')
  }, [open])

  useEffect(() => {
    setRefundReason('')
  }, [receipt?.id])

  const isRefunded = String(receipt.status ?? '').toLowerCase() === 'refunded'
  const refundDisabled = !onRefund || !canRefund || isRefunded || !refundReason.trim() || isRefunding

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
          <DialogDescription>{receipt.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">
                {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{receipt.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cashier</p>
              <p className="font-medium">{receipt.cashierName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{receipt.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{String(receipt.status ?? 'paid')}</p>
            </div>
            {isRefunded ? (
              <div>
                <p className="text-sm text-muted-foreground">Refunded At</p>
                <p className="font-medium">
                  {receipt.refundedAt ? `${receipt.refundedAt.toLocaleDateString()} ${receipt.refundedAt.toLocaleTimeString()}` : '—'}
                </p>
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="overflow-x-auto">
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
                  {receipt.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{money.format(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{money.format(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money.format(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{money.format(receipt.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{money.format(receipt.total)}</span>
            </div>
          </div>

          {isRefunded ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-sm font-medium">Refunded</div>
              <div className="mt-1 text-sm text-muted-foreground">{receipt.refundReason ? receipt.refundReason : 'No reason provided'}</div>
            </div>
          ) : onRefund ? (
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm font-medium">Refund</div>
              <div className="mt-1 text-sm text-muted-foreground">This will mark the receipt as refunded and return items to stock.</div>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Refund reason"
                disabled={!canRefund || Boolean(isRefunding)}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  variant="destructive"
                  disabled={refundDisabled}
                  onClick={() => onRefund(receipt, refundReason.trim())}
                >
                  {isRefunding ? 'Refunding…' : 'Refund Receipt'}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Notes */}
          {receipt.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{receipt.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onPrint(receipt)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={() => onShare(receipt)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
