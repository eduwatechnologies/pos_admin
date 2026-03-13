'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ReceiptsTable } from './components/receipts-table'
import { ReceiptDetailModal } from './components/receipt-detail-modal'
import { Receipt } from '@/lib/types'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'

export default function ReceiptsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated || !currentShop) return
      setIsLoading(true)
      try {
        const items = await api.receipts.list(currentShop.id)
        if (!cancelled) setReceipts(items)
      } catch (err) {
        if (cancelled) return
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load receipts',
          variant: 'destructive',
        })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, currentShop, toast])

  if (!isAuthenticated) {
    return null
  }

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setModalOpen(true)
  }

  const handlePrint = (receipt: Receipt) => {
    // Mock print functionality
    console.log('[v0] Printing receipt:', receipt.id)
    toast({
      title: 'Success',
      description: `Receipt ${receipt.id} sent to printer`,
    })
    // In a real app, this would open a print dialog
    window.print?.()
  }

  const handleShare = (receipt: Receipt) => {
    // Mock share functionality
    console.log('[v0] Sharing receipt:', receipt.id)
    toast({
      title: 'Success',
      description: `Receipt ${receipt.id} shared via email and WhatsApp`,
    })
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <p className="text-muted-foreground mt-2">View and manage sales receipts</p>
      </div>

      <ReceiptsTable
        receipts={receipts}
        onView={handleView}
        onPrint={handlePrint}
        onShare={handleShare}
      />

      <ReceiptDetailModal
        receipt={selectedReceipt}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onPrint={handlePrint}
        onShare={handleShare}
      />
    </div>
  )
}
