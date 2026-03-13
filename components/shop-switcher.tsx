'use client'

import { useState } from 'react'
import { useShop } from '@/context/shop-context'
import { Building2, ChevronDown } from 'lucide-react'

export function ShopSwitcher() {
  const { currentShop, shops, setCurrentShop } = useShop()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentShop) return null

  return (
    <div className="px-6 py-3 border-b border-border">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-opacity-80 transition-colors text-sidebar-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <span className="text-sm font-medium truncate">{currentShop.name}</span>
          </div>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
            {shops.map(shop => (
              <button
                key={shop.id}
                onClick={() => {
                  setCurrentShop(shop)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  shop.id === currentShop.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-foreground'
                } ${shop.id === shops[0]?.id ? 'rounded-t-lg' : ''} ${
                  shop.id === shops[shops.length - 1]?.id ? 'rounded-b-lg' : ''
                }`}
              >
                <div className="font-medium">{shop.name}</div>
                <div className="text-xs opacity-75">{shop.location}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
