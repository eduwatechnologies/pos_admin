'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectPendingCount, selectErrorCount, selectIsProcessing } from '@/redux/offline/offline-queue-slice'
import { useOnlineStatus } from '@/redux/offline/offline-hooks'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const pendingCount = useSelector(selectPendingCount)
  const errorCount = useSelector(selectErrorCount)
  const isProcessing = useSelector(selectIsProcessing)
  const [showDetails, setShowDetails] = useState(false)

  if (isOnline && pendingCount === 0 && errorCount === 0 && !isProcessing) {
    return (
      <div className="flex items-center gap-1.5" title="Online">
        <Wifi className="size-4 text-emerald-500" />
      </div>
    )
  }

  const getColor = () => {
    if (!isOnline) return 'text-red-500'
    if (isProcessing) return 'text-amber-500'
    if (errorCount > 0) return 'text-red-500'
    if (pendingCount > 0) return 'text-amber-500'
    return 'text-emerald-500'
  }

  const getTooltip = () => {
    if (!isOnline) return 'Offline - changes saved locally'
    if (isProcessing) return `Syncing... (${pendingCount} pending)`
    if (errorCount > 0) return `${errorCount} failed to sync - click to retry`
    if (pendingCount > 0) return `${pendingCount} pending sync`
    return 'Online'
  }

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 ${getColor()} hover:opacity-80 transition-opacity`}
        onClick={() => setShowDetails(!showDetails)}
        title={getTooltip()}
        aria-label={getTooltip()}
      >
        {!isOnline ? (
          <WifiOff className="size-4" />
        ) : isProcessing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : errorCount > 0 ? (
          <WifiOff className="size-4" />
        ) : (
          <Wifi className="size-4" />
        )}
        {(pendingCount > 0 || errorCount > 0) && (
          <span className="size-4 flex items-center justify-center rounded-full bg-current/20 text-[10px] font-semibold leading-none">
            {pendingCount + errorCount}
          </span>
        )}
      </button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-card shadow-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Pending</span>
              <span className="font-medium text-amber-500">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Errors</span>
              <span className="font-medium text-red-500">{errorCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Processing</span>
              <span className="font-medium">{isProcessing ? 'Yes' : 'No'}</span>
            </div>
          </div>
          {(errorCount > 0 || pendingCount > 0) && (
            <button
              className="mt-2 w-full text-xs text-primary hover:underline"
              onClick={() => setShowDetails(false)}
            >
              Click to retry failed syncs
            </button>
          )}
        </div>
      )}
    </div>
  )
}