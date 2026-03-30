'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AlertCircle, Edit2, Filter, Package, Search, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InventoryTableProps {
  products: Product[]
  onAdd?: () => void
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void | Promise<void>
  disableActions?: boolean
}

const statusStyles: Record<string, { label: string; className: string }> = {
  active: { label: 'In Stock', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  low_stock: { label: 'Low Stock', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive' },
}

export function InventoryTable({ products, onAdd, onEdit, onDelete, disableActions }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const filteredProducts = useMemo(() => {
    const searched = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    if (!filterLowStock) return searched
    return searched.filter((p) => p.quantity <= p.reorderLevel)
  }, [filterLowStock, products, searchTerm])

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= p.reorderLevel)
  }, [products])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-[260px] rounded-lg pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setFilterLowStock((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            {filterLowStock ? 'Low stock' : 'Filter'}
          </Button>
        </div>
        <Button type="button" className="h-9 gap-2 rounded-lg" onClick={onAdd} disabled={!onAdd || disableActions}>
          Add Product
        </Button>
      </div>

      {lowStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockProducts.length} product(s) are running low on stock
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  SKU
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Stock
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="w-24 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => {
                const statusKey =
                  product.quantity === 0 ? 'out_of_stock' : product.quantity <= product.reorderLevel ? 'low_stock' : 'active'
                const status = statusStyles[statusKey]
                return (
                  <tr key={product.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Link
                          href={`/inventory/${product.id}`}
                          className="text-sm font-medium text-card-foreground hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground">{product.sku}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{product.category}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">
                      {money.format(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-card-foreground">{product.quantity}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', status.className)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md hover:bg-secondary"
                          onClick={() => onEdit(product)}
                          disabled={disableActions}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md hover:bg-secondary"
                          onClick={() => onDelete(product.id)}
                          disabled={disableActions}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
