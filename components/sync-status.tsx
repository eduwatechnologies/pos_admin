'use client'

import { useSync } from '@/context/sync-context'
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function SyncStatus() {
  const { lastSyncTime, isSyncing, syncData } = useSync()
  const [syncText, setSyncText] = useState<string>('')

  useEffect(() => {
    if (!lastSyncTime) {
      setSyncText('Not synced')
      return
    }

    const updateSyncText = () => {
      const now = new Date()
      const diff = now.getTime() - lastSyncTime.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (seconds < 60) {
        setSyncText('Just now')
      } else if (minutes < 60) {
        setSyncText(`${minutes}m ago`)
      } else if (hours < 24) {
        setSyncText(`${hours}h ago`)
      } else {
        setSyncText(lastSyncTime.toLocaleDateString())
      }
    }

    updateSyncText()
    const interval = setInterval(updateSyncText, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [lastSyncTime])

  return (
    <div className="space-y-2">
      <div className="px-4 pb-4 border-t border-sidebar-border">
        <Button
          onClick={() => syncData()}
          disabled={isSyncing}
          className="w-full gap-2 text-sm border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
          variant="outline"
          size="sm"
        >
          {isSyncing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Manual Sync
            </>
          )}
        </Button>

        <div className="mt-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-sidebar-foreground/80">
            {lastSyncTime ? (
              <>
                <Cloud size={12} className="text-green-500" />
                <span>Synced: {syncText}</span>
              </>
            ) : (
              <>
                <CloudOff size={12} className="text-red-500" />
                <span>Not synced</span>
              </>
            )}
          </div>
          <div className="text-sidebar-foreground/80">
            Auto-sync enabled
          </div>
        </div>
      </div>
    </div>
  )
}
