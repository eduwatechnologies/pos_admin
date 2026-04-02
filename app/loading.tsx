import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div className="text-sm font-medium text-card-foreground">Loading…</div>
      </div>
    </div>
  )
}

