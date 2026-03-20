'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, TrendingUp, Package, Folder } from 'lucide-react'

interface DashboardCardsProps {
  totalSales: number
  totalTransactions: number
  averageOrderValue: number
  lowStockProducts: number
  categoriesCount?: number
}

export function DashboardCards({
  totalSales,
  totalTransactions,
  averageOrderValue,
  lowStockProducts,
  categoriesCount,
}: DashboardCardsProps) {
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' })

  const cards = [
    {
      title: 'Total Sales',
      value: money.format(totalSales),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Average Order Value',
      value: money.format(averageOrderValue),
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Low Stock Products',
      value: lowStockProducts.toString(),
      icon: Package,
      color: 'text-orange-600',
    },
    ...(typeof categoriesCount === 'number'
      ? [
          {
            title: 'Categories',
            value: categoriesCount.toString(),
            icon: Folder,
            color: 'text-sky-600',
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
