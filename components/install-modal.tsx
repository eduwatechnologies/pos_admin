'use client'

import { useCallback, useState } from 'react'
import { useInstallModal } from '@/components/install-modal-context'
import { Download, CheckCircle2, Sparkles, Smartphone, Monitor, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InstallModalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { isOpen, setIsOpen, isStandalone, isAvailable } = useInstallModal()
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = useCallback(async () => {
    setIsInstalling(true)
    try {
      const prompt = typeof window !== 'undefined' ? window.__kounterInstallPrompt : null
      if (!prompt) return
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setIsOpen(false)
    } catch { } finally { setIsInstalling(false) }
  }, [setIsOpen])

  const handleDismiss = (never = false) => {
    try { localStorage.setItem('kounter-install-dismissed-until', never ? 'never' : String(Date.now() + 86400000)) } catch { }
    onOpenChange(false)
  }

  const handleClose = () => onOpenChange(false)

  if (!open) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  }

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    width: '100%', maxWidth: '380px', maxHeight: '90vh', overflow: 'auto',
  }

  if (isStandalone) {
    return (
      <div style={overlayStyle} onClick={handleClose}>
        <div style={contentStyle} onClick={e => e.stopPropagation()} className="p-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Already Installed</h2>
          <p className="text-sm text-muted-foreground mb-6">You're running Kounter POS as a standalone app.</p>
          <Button onClick={handleClose} className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()} className="p-6">
        <div className="text-center pb-4">
          <div className="mx-auto mb-4 flex size-18 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center"><Sparkles className="size-5 text-primary-foreground" /></div>
          </div>
          <h2 className="text-xl font-bold mb-1">Install Kounter POS</h2>
          <p className="text-sm text-muted-foreground">Get a faster, native app experience with offline support.</p>
        </div>
        <div className="space-y-3 py-4 border-y border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary"><Smartphone className="size-5" /></div>
            <div><p className="font-medium text-sm">Works completely offline</p><p className="text-xs text-muted-foreground">Sell even when internet is down</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-emerald/10 text-emerald"><Monitor className="size-5" /></div>
            <div><p className="font-medium text-sm">Native app experience</p><p className="text-xs text-muted-foreground">No browser chrome, full-screen POS</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-amber/10 text-amber"><WifiOff className="size-5" /></div>
            <div><p className="font-medium text-sm">Data syncs automatically</p><p className="text-xs text-muted-foreground">Queued sales sync when back online</p></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="ghost" className="w-full sm:w-auto justify-center" onClick={() => handleDismiss(false)}>Remind me tomorrow</Button>
          {/* <Button variant="ghost" className="w-full sm:w-auto justify-center" onClick={() => handleDismiss(true)}>Don't ask again</Button> */}
          <Button onClick={handleInstall} disabled={!isAvailable || isInstalling} className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary flex-1">
            {isInstalling ? (<> <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Installing… </>) : (<> <Download className="size-4" /> Install App </>)}</Button>
        </div>
      </div>
    </div>
  )
}