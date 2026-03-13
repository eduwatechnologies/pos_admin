'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { User, AuthContextType } from '@/lib/types'
import { api } from '@/lib/api/client'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toAppUser(u: { id: string; email: string; name: string; role: 'admin' | 'cashier'; isActive: boolean }): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.isActive ? 'active' : 'inactive',
    createdAt: new Date(),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { token, user: apiUser } = await api.auth.login(email, password)
      localStorage.setItem('auth_token', token)

      const appUser = toAppUser(apiUser)
      setUser(appUser)
      localStorage.setItem('auth_user', JSON.stringify(appUser))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_shop_id')
  }, [])

  // Restore user from localStorage on mount
  React.useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      setIsLoading(true)
      try {
        const { user: apiUser } = await api.auth.me()
        if (cancelled) return
        const appUser = toAppUser(apiUser)
        setUser(appUser)
        localStorage.setItem('auth_user', JSON.stringify(appUser))
      } catch {
        if (cancelled) return
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
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
