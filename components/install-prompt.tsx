'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __kounterInstallPrompt?: BeforeInstallPromptEvent | null
  }
}

type DismissConfig = {
  reminderUntil: number | 'never'
}

const DISMISS_KEY = 'kounter-install-dismissed-until'

let deferredPrompt: BeforeInstallPromptEvent | null = null
let isStandalone = false
const listeners: Set<() => void> = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

function setPrompt(p: BeforeInstallPromptEvent | null) {
  deferredPrompt = p
  if (typeof window !== 'undefined') {
    window.__kounterInstallPrompt = p
  }
  notify()
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

export function useInstallPrompt() {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      isStandalone = true
      return
    }

    const rerender = () => setTick((t) => t + 1)
    listeners.add(rerender)

    if (deferredPrompt) {
      return () => listeners.delete(rerender)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const standaloneHandler = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        isStandalone = true
        notify()
      }
    }
    window.addEventListener('appinstalled', standaloneHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', standaloneHandler)
      listeners.delete(rerender)
    }
  }, [])

  const install = useCallback(async () => {
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? window.__kounterInstallPrompt : null)
    if (!prompt) return false

    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        setPrompt(null)
        isStandalone = true
        notify()
        return true
      }
      return false
    } catch (err) {
      console.error('[InstallPrompt] install error:', err)
      return false
    }
  }, [])

  return {
    install,
    isAvailable: !!deferredPrompt,
    isStandalone,
  }
}

export function useInstallModalController(autoShowDelayMs: number = 4000) {
  const [isOpen, setIsOpen] = useState(false)
  const { isAvailable, isStandalone } = useInstallPrompt()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isOpen) return
    if (isStandalone) return
    if (!isAvailable) return

    const dismissed = readDismiss()
    if (isDismissed(dismissed)) return

    const t = window.setTimeout(() => setIsOpen(true), autoShowDelayMs)
    return () => window.clearTimeout(t)
  }, [autoShowDelayMs, isAvailable, isOpen, isStandalone])

  return { isOpen, setIsOpen, open, close }
}
