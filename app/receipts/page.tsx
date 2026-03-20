'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ReceiptsTable } from './components/receipts-table'
import { ReceiptDetailModal } from './components/receipt-detail-modal'
import { Receipt } from '@/lib/types'
import { useShop } from '@/context/shop-context'
import { useListReceiptsQuery } from '@/redux/api/receipts-api'

export default function ReceiptsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const { data: receipts = [], error } = useListReceiptsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: 'Failed to load receipts',
      variant: 'destructive',
    })
  }, [error, toast])

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
      {/* <div>
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <p className="text-muted-foreground mt-2">View and manage sales receipts</p>
      </div> */}

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
