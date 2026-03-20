'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { User, AuthContextType } from '@/lib/types'
import { useLoginMutation, useMeQuery, useRegisterMutation } from '@/redux/api/auth-api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { clearCredentials, setCredentials } from '@/redux/features/auth/auth-slice'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toAppUser(u: { id: string; email: string; name: string; role: string; isActive: boolean }): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as any,
    status: u.isActive ? 'active' : 'inactive',
    createdAt: new Date(),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const [hasToken, setHasToken] = useState(false)

  const token = useAppSelector((s) => s.auth.token)
  const apiUser = useAppSelector((s) => s.auth.user)
  const user = useMemo(() => (apiUser ? toAppUser(apiUser) : null), [apiUser])

  const [registerTrigger, { isLoading: isRegisterLoading }] = useRegisterMutation()
  const [loginTrigger, { isLoading: isLoginLoading }] = useLoginMutation()

  useEffect(() => {
    setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
  }, [])

  const {
    data: meData,
    isFetching: isMeLoading,
    isError: isMeError,
  } = useMeQuery(undefined, { skip: !hasToken })

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: nextUser } = await loginTrigger({ email, password }).unwrap()
    localStorage.setItem('auth_token', token)
    dispatch(setCredentials({ token, user: nextUser }))
    localStorage.setItem('auth_user', JSON.stringify(toAppUser(nextUser)))
    setHasToken(true)
  }, [dispatch, loginTrigger])

  const register = useCallback(async (input: { name: string; email: string; password: string; shopName?: string; currency?: string }) => {
    const { token, user: nextUser, shop } = await registerTrigger({
      name: input.name,
      email: input.email,
      password: input.password,
      shopName: input.shopName,
      currency: input.currency,
    }).unwrap()
    localStorage.setItem('auth_token', token)
    dispatch(setCredentials({ token, user: nextUser }))
    localStorage.setItem('auth_user', JSON.stringify(toAppUser(nextUser)))
    if (shop?.id) localStorage.setItem('current_shop_id', shop.id)
    setHasToken(true)
  }, [dispatch, registerTrigger])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_shop_id')
    dispatch(clearCredentials())
    setHasToken(false)
  }, [dispatch])

  useEffect(() => {
    if (!hasToken) return

    if (meData?.user) {
      const storedToken = localStorage.getItem('auth_token') ?? ''
      if (storedToken) {
        dispatch(setCredentials({ token: storedToken, user: meData.user }))
        localStorage.setItem('auth_user', JSON.stringify(toAppUser(meData.user)))
      }
      return
    }

    if (isMeError) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      dispatch(clearCredentials())
      setHasToken(false)
    }
  }, [dispatch, hasToken, isMeError, meData?.user])

  const isLoading = isLoginLoading || isRegisterLoading || isMeLoading

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
