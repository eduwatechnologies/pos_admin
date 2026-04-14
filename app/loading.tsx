'use client'

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mb-8 text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
            <path d="M12 3v6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Kounter</h1>
        <p className="text-sm text-slate-500 mt-1">Point of Sale</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
        <p className="text-sm font-medium text-slate-600 animate-pulse">Loading your workspace...</p>
      </div>

      <div className="fixed bottom-8 flex items-center gap-2 text-xs text-slate-400">
        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
        <span>System ready</span>
      </div>
    </div>
  )
}
