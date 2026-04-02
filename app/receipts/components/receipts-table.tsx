'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Receipt } from '@/lib/types'
import { Eye, Printer, Share2, Search } from 'lucide-react'

interface ReceiptsTableProps {
  receipts: Receipt[]
  onView: (receipt: Receipt) => void
  onPrint: (receipt: Receipt) => void
  onShare: (receipt: Receipt) => void
}

export function ReceiptsTable({ receipts, onView, onPrint, onShare }: ReceiptsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchesSearch = 
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesPayment = paymentFilter === 'all' || r.paymentMethod === paymentFilter
      return matchesSearch && matchesPayment
    })
  }, [receipts, searchTerm, paymentFilter])

  const paymentMethods = ['all', ...Array.from(new Set(receipts.map(r => r.paymentMethod)))]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt ID or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {paymentMethods.map(method => (
            <button
              key={method}
              onClick={() => setPaymentFilter(method)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                paymentFilter === method
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {method === 'all' ? 'All Payment Methods' : method}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipts ({filteredReceipts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map(receipt => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-sm">{receipt.id}</TableCell>
                    <TableCell className="text-sm">
                      {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-sm">{receipt.customerName || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{receipt.cashierName || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {money.format(receipt.total)}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{String(receipt.status ?? 'paid')}</TableCell>
                    <TableCell className="text-sm capitalize">{receipt.paymentMethod}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(receipt)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrint(receipt)}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onShare(receipt)}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
