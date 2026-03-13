'use client'

import React from 'react'
import { Building2, ChevronDown } from 'lucide-react'

import { useShop } from '@/context/shop-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ShopSwitcherInline() {
  const { currentShop, shops, setCurrentShop } = useShop()

  if (!currentShop) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl">
          <Building2 className="size-4" />
          <span className="max-w-[110px] truncate text-sm font-medium sm:max-w-[160px]">{currentShop.name}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {shops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="text-sm font-medium">{shop.name}</span>
            <span className="text-xs text-muted-foreground">{shop.location}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
