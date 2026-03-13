'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Shop, ShopContextType } from '@/lib/types'
import { api } from '@/lib/api/client'
import { useAuth } from './auth-context'

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated) {
        setShops([])
        setCurrentShopState(null)
        return
      }

      try {
        const loaded = await api.shops.list()
        if (cancelled) return
        setShops(loaded)

        const storedId = localStorage.getItem('current_shop_id')
        const next =
          (storedId ? loaded.find(s => s.id === storedId) : undefined) ??
          loaded[0] ??
          null
        setCurrentShopState(next)
        if (next) localStorage.setItem('current_shop_id', next.id)
      } catch {
        if (cancelled) return
        setShops([])
        setCurrentShopState(null)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const setCurrentShop = useCallback((shop: Shop) => {
    setCurrentShopState(shop)
    localStorage.setItem('current_shop_id', shop.id)
  }, [])

  const addShop = useCallback((shop: Shop) => {
    setShops(prev => [...prev, shop])
  }, [])

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        shops,
        setCurrentShop,
        addShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}
