'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from '@/lib/types'

interface RecentReceiptsProps {
  receipts: Receipt[]
}

export function RecentReceipts({ receipts }: RecentReceiptsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map(receipt => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-mono text-sm">{receipt.id}</TableCell>
                  <TableCell className="text-sm">
                    {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-sm">{receipt.customerName || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{receipt.items.length}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${receipt.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{receipt.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
