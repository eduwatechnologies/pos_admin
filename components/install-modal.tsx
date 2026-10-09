'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Chrome,
  Download,
  Globe,
  MonitorSmartphone,
  Share2,
  Smartphone,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInstallModal } from '@/components/install-modal-context'
import { cn } from '@/lib/utils'

type Platform = 'chrome-desktop' | 'safari-desktop' | 'safari-ios' | 'chrome-android' | 'edge-desktop' | 'other'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isMac = /mac os x/.test(ua)
  const isAndroid = /android/.test(ua)
  const isSafari = /safari/.test(ua) && !/chrome|chromium|crios|edg|opr\//.test(ua)
  const isEdge = /edg\//.test(ua)
  const isChrome = (/chrome|chromium|crios/.test(ua)) && !isEdge

  if (isIOS && isSafari) return 'safari-ios'
  if (isAndroid && isChrome) return 'chrome-android'
  if (isMac && isSafari) return 'safari-desktop'
  if (isEdge && !isAndroid && !isIOS) return 'edge-desktop'
  if (isChrome && !isAndroid && !isIOS) return 'chrome-desktop'
  return 'other'
}

type PlatformMeta = {
  id: Platform
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  steps: string[]
  canNativePrompt: boolean
}

const PLATFORMS: Record<Platform, PlatformMeta> = {
  'chrome-desktop': {
    id: 'chrome-desktop',
    label: 'Chrome (Desktop)',
    hint: 'Install as a desktop app',
    icon: Chrome,
    canNativePrompt: true,
    steps: [
      'Click Install App below to launch the native browser prompt',
      'In the Chrome confirmation, click Install',
      'Kounter opens in its own window and pins to your taskbar',
    ],
  },
  'edge-desktop': {
    id: 'edge-desktop',
    label: 'Microsoft Edge',
    hint: 'Install as an Edge app',
    icon: Chrome,
    canNativePrompt: true,
    steps: [
      'Click Install App below to launch the native browser prompt',
      'In the Edge confirmation, click Install',
      'Choose whether to pin Kounter to your taskbar or Start menu',
    ],
  },
  'safari-desktop': {
    id: 'safari-desktop',
    label: 'Safari (macOS)',
    hint: 'Add to the Dock via the menu bar',
    icon: Globe,
    canNativePrompt: false,
    steps: [
      'In the Safari menu bar, click File → Add to Dock…',
      'Name the app "Kounter POS" and click Add',
      'Launch it from the Dock like any native Mac app',
    ],
  },
  'safari-ios': {
    id: 'safari-ios',
    label: 'Safari (iPhone / iPad)',
    hint: 'Add to Home Screen',
    icon: Smartphone,
    canNativePrompt: false,
    steps: [
      'Tap the Share button (square with upward arrow) in Safari',
      'Scroll down and tap Add to Home Screen',
      'Name it "Kounter POS" and tap Add',
      'Open it from your Home Screen for full-screen offline mode',
    ],
  },
  'chrome-android': {
    id: 'chrome-android',
    label: 'Chrome (Android)',
    hint: 'Install to your home screen',
    icon: Smartphone,
    canNativePrompt: true,
    steps: [
      'Tap Install App below to launch the Chrome prompt',
      'Tap Install in the bottom sheet',
      'Kounter installs to your home screen and app drawer',
    ],
  },
  other: {
    id: 'other',
    label: 'Other browser',
    hint: 'Look for Install or Add to Home Screen',
    icon: MonitorSmartphone,
    canNativePrompt: false,
    steps: [
      'Open your browser menu (⋮ or …)',
      'Look for Install app, Add to Home Screen, or Create shortcut',
      'Confirm the action and launch like a native app',
    ],
  },
}

type StepListProps = { platform: PlatformMeta }

function StepList({ platform }: StepListProps) {
  return (
    <ol className="space-y-3">
      {platform.steps.map((step, idx) => (
        <li key={idx} className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
          >
            {idx + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{step}</p>
        </li>
      ))}
    </ol>
  )
}

type FeatureGridProps = { isStandalone: boolean }

function FeatureGrid({ isStandalone }: FeatureGridProps) {
  const items = [
    { label: isStandalone ? 'Already installed' : 'Home screen shortcut', ok: true },
    { label: 'Offline POS terminal', ok: true },
    { label: 'Full screen, no browser chrome', ok: true },
    { label: 'Receipt printing support', ok: true },
  ]
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span className="truncate text-xs font-medium text-foreground">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

type InstallModalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstallModalDialog({ open, onOpenChange }: InstallModalDialogProps) {
  const { isOpen, setIsOpen, isStandalone, isAvailable } = useInstallModal()
  const install = async () => {
    const prompt = (typeof window !== 'undefined' ? window.__kounterInstallPrompt : null)
    if (!prompt) return false
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        setIsOpen(false)
        return true
      }
      return false
    } catch {
      return false
    }
  }
  const [isInstalling, setIsInstalling] = useState(false)
  const [installState, setInstallState] = useState<'idle' | 'success' | 'dismissed'>('idle')
  const [activeTab, setActiveTab] = useState<Platform>('chrome-desktop')
  const [remindUnit, setRemindUnit] = useState<'day' | 'week' | 'never'>('day')

  const platform = useMemo<Platform>(() => detectPlatform(), [])

  useEffect(() => {
    setActiveTab(platform)
  }, [platform, open])

  useEffect(() => {
    if (!open) {
      setIsInstalling(false)
    }
  }, [open])

  const closeReset = useCallback(() => {
    setInstallState('idle')
    setIsOpen(false)
  }, [setIsOpen])

  const handleManualClose = () => {
    if (isStandalone) {
      try {
        localStorage.setItem('kounter-install-dismissed-until', 'never')
      } catch {}
    }
    closeReset()
  }

  const handleDismiss = () => {
    try {
      const key = 'kounter-install-dismissed-until'
      if (remindUnit === 'never') {
        localStorage.setItem(key, 'never')
      } else {
        const ms = remindUnit === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        localStorage.setItem(key, String(Date.now() + ms))
      }
    } catch {}
    setInstallState('dismissed')
    closeReset()
  }

  const currentMeta = PLATFORMS[activeTab]
  const showNativeButton = currentMeta.canNativePrompt && isAvailable

  if (isStandalone) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <div className="flex-1">
              <DialogTitle>App is installed</DialogTitle>
              <DialogDescription>
                You&apos;re already running Kounter POS as a standalone app.
              </DialogDescription>
            </div>
          </DialogHeader>
          <FeatureGrid isStandalone />
          <DialogFooter>
            <Button onClick={handleManualClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-4">
          <div className="flex items-start gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src="/kounterLogo.jpeg"
                alt="Kounter logo"
                fill
                sizes="64px"
                className="object-cover"
                priority={false}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">Install Kounter POS</DialogTitle>
                <Badge variant="secondary" className="gap-1 border border-border bg-muted/50">
                  <Download className="size-3" /> PWA
                </Badge>
              </div>
              <DialogDescription>
                Install the admin console as a native-style app for faster launch, true offline
                support, and distraction-free POS terminals.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 size-8"
              onClick={handleManualClose}
              aria-label="Close install dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {installState === 'success' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="size-6 text-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Install in progress…</p>
                <p className="text-xs text-muted-foreground">
                  Follow the browser confirmation, then open Kounter from your home screen or dock.
                </p>
              </div>
            </div>
            <StepList platform={currentMeta} />
            <DialogFooter className="pt-2">
              <Button onClick={handleManualClose}>Got it</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            <FeatureGrid isStandalone={false} />

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as Platform)}
                className="w-full"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Installation steps</p>
                  {platform !== 'other' && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      Detected: {PLATFORMS[platform].label}
                    </Badge>
                  )}
                </div>
                <TabsList className="grid w-full grid-cols-3 gap-1">
                  <TabsTrigger value="chrome-desktop">
                    <Chrome className="mr-1.5 size-4" /> Desktop
                  </TabsTrigger>
                  <TabsTrigger value="safari-ios">
                    <Share2 className="mr-1.5 size-4" /> iOS
                  </TabsTrigger>
                  <TabsTrigger value="chrome-android">
                    <Smartphone className="mr-1.5 size-4" /> Android
                  </TabsTrigger>
                </TabsList>
                <div className="mt-4 hidden">
                  <TabsContent value="chrome-desktop" />
                  <TabsContent value="edge-desktop" />
                  <TabsContent value="safari-desktop" />
                  <TabsContent value="safari-ios" />
                  <TabsContent value="chrome-android" />
                  <TabsContent value="other" />
                </div>
              </Tabs>
              <div className="pt-2">
                <div className="mb-3 flex items-center gap-2">
                  <currentMeta.icon className="size-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">{currentMeta.label}</p>
                  <span className="text-xs text-muted-foreground">• {currentMeta.hint}</span>
                </div>
                <StepList platform={currentMeta} />
              </div>
            </div>

            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs',
                showNativeButton
                  ? 'border-primary/30 bg-primary/5 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground',
              )}
            >
              {showNativeButton ? (
                <>
                  <Download className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    Your browser supports one-click install. Click <span className="font-semibold text-primary">Install App</span> below to
                    trigger the native prompt.
                  </p>
                </>
              ) : (
                <>
                  <Share2 className="mt-0.5 size-4 shrink-0" />
                  <p>
                    This browser does not expose a one-click install prompt. Follow the manual steps above (look for{' '}
                    <span className="font-semibold text-foreground">Add to Home Screen</span> or{' '}
                    <span className="font-semibold text-foreground">Install app</span> in your browser menu).
                  </p>
                </>
              )}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Dismiss behavior</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'day', label: 'Remind tomorrow' },
                    { id: 'week', label: 'Remind in a week' },
                    { id: 'never', label: "Don't ask again" },
                  ] as const
                ).map((opt) => {
                  const selected = remindUnit === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRemindUnit(opt.id)}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-muted/40 text-muted-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-1 sm:justify-between">
              <Button variant="ghost" onClick={handleDismiss}>
                Dismiss
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleManualClose}>
                  Not now
                </Button>
                <Button
                  onClick={handleInstall}
                  disabled={!showNativeButton || isInstalling}
                  className="gap-1.5"
                >
                  {isInstalling ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Launching…
                    </span>
                  ) : (
                    <>
                      <Download className="size-4" /> Install App
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
