'use client'

import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react'
import { Shop, ShopContextType } from '@/lib/types'
import { useAuth } from './auth-context'
import { useListShopsQuery } from '@/redux/api/shops-api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { setCurrentShopId } from '@/redux/features/shops/shops-slice'

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const currentShopId = useAppSelector((s) => s.shops.currentShopId)

  const { data: shops = [] } = useListShopsQuery(undefined, { skip: !isAuthenticated })

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setCurrentShopId(null))
      return
    }

    if (shops.length === 0) return

    const storedId = localStorage.getItem('current_shop_id')
    const preferredId = currentShopId ?? storedId
    const next = (preferredId ? shops.find((s) => s.id === preferredId) : undefined) ?? shops[0] ?? null

    if (next && next.id !== currentShopId) {
      dispatch(setCurrentShopId(next.id))
    }
    if (next) localStorage.setItem('current_shop_id', next.id)
  }, [currentShopId, dispatch, isAuthenticated, shops])

  const currentShop = useMemo(() => {
    if (!currentShopId) return null
    return shops.find((s) => s.id === currentShopId) ?? null
  }, [currentShopId, shops])

  const setCurrentShop = useCallback((shop: Shop) => {
    localStorage.setItem('current_shop_id', shop.id)
    dispatch(setCurrentShopId(shop.id))
  }, [dispatch])

  const addShop = useCallback((_shop: Shop) => {}, [])

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
