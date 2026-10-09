'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type InstallModalContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  setIsOpen: (open: boolean) => void
}

const InstallModalContext = createContext<InstallModalContextValue | null>(null)

const DISMISS_KEY = 'kounter-install-dismissed-until'

type DismissConfig = {
  reminderUntil: number | 'never'
}

function readDismiss(): DismissConfig | null {
  try {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(DISMISS_KEY) : null
    if (!raw) return null
    if (raw === 'never') return { reminderUntil: 'never' }
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    return { reminderUntil: n }
  } catch {
    return null
  }
}

function isDismissed(cfg: DismissConfig | null): boolean {
  if (!cfg) return false
  if (cfg.reminderUntil === 'never') return true
  return Date.now() < cfg.reminderUntil
}

export function InstallModalProvider({
  children,
  autoShowDelayMs = 4000,
}: {
  children: React.ReactNode
  autoShowDelayMs?: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setBootstrapped(true)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    const handler = () => {
      const nextStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      if (nextStandalone) setIsStandalone(true)
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      window.__kounterInstallPrompt = e as any
      setIsAvailable(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    const check = () => {
      setIsAvailable(!!window.__kounterInstallPrompt)
    }
    const tId = window.setTimeout(check, 100)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.clearTimeout(tId)
    }
  }, [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (typeof window === 'undefined' || !bootstrapped) return
    if (isOpen) return
    if (isStandalone) return
    if (!isAvailable) return

    const dismissed = readDismiss()
    if (isDismissed(dismissed)) return

    const t = window.setTimeout(() => setIsOpen(true), autoShowDelayMs)
    return () => window.clearTimeout(t)
  }, [autoShowDelayMs, bootstrapped, isAvailable, isOpen, isStandalone])

  const value: InstallModalContextValue = {
    isOpen,
    open,
    close,
    setIsOpen,
  }

  return (
    <InstallModalContext.Provider value={value}>{children}</InstallModalContext.Provider>
  )
}

export function useInstallModal() {
  const ctx = useContext(InstallModalContext)
  if (!ctx) {
    throw new Error('useInstallModal must be used within InstallModalProvider')
  }
  return ctx
}
