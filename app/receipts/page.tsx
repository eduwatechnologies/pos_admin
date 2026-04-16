'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ReceiptsTable } from './components/receipts-table'
import { ReceiptDetailModal } from './components/receipt-detail-modal'
import { Receipt } from '@/lib/types'
import { useShop } from '@/context/shop-context'
import { useListReceiptsQuery, useRefundReceiptMutation } from '@/redux/api/receipts-api'
import PrintableReceipt from '@/components/printable-reciept'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useLocalReceipts } from '@/lib/offline-hooks'

export default function ReceiptsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [printReceipt, setPrintReceipt] = useState<Receipt | null>(null)
  const [printInitialAction, setPrintInitialAction] = useState<'print' | 'share' | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const { data: remoteReceipts = [], error, isLoading: isRemoteLoading } = useListReceiptsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )
  const { localReceipts, isLoading: isLocalLoading } = useLocalReceipts(currentShop?.id)

  const receipts = useMemo(() => {
    // Combine remote and local receipts, prioritizing remote if IDs match (synced)
    // Local IDs start with 'local_', remote IDs are usually UUIDs
    const map = new Map<string, Receipt>()
    
    // Add remote first
    remoteReceipts.forEach(r => map.set(r.id, r as unknown as Receipt))
    
    // Add local ones that aren't already represented by remote ones
    // Note: When synced, the local entry might still exist but the remote one should be preferred
    // If we have a local ID and it's synced, we might find a remote one with the same content
    localReceipts.forEach(l => {
      // Check if this local receipt has a remote counterpart
      // This is a bit tricky if IDs don't match, but we can look for similar data or just show both
      // For now, let's just add local ones that aren't in the remote list
      if (!map.has(l.id)) {
        map.set(l.id, l)
      }
    })

    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [remoteReceipts, localReceipts])

  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip: !isAuthenticated || !currentShop })
  const [refundReceipt, { isLoading: isRefunding }] = useRefundReceiptMutation()

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: 'Failed to load receipts',
      variant: 'destructive',
    })
  }, [error, toast])

  const storeName = String(settings?.businessName ?? '') || String(currentShop?.name ?? 'Store')
  const storeLines = useMemo(() => {
    const lines = [settings?.address ? String(settings.address) : '', settings?.phone ? String(settings.phone) : ''].filter(Boolean)
    return lines.length ? lines : undefined
  }, [settings?.address, settings?.phone])

  const canRefund = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.receipts)
  }, [settings?.rolePermissions, user])

  if (!isAuthenticated) {
    return null
  }

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setModalOpen(true)
  }

  const handlePrint = (receipt: Receipt) => {
    setPrintReceipt(receipt)
    setPrintInitialAction('print')
  }

  const handleShare = (receipt: Receipt) => {
    setPrintReceipt(receipt)
    setPrintInitialAction('share')
  }

  const handleRefund = async (receipt: Receipt, reason: string) => {
    if (!currentShop) return
    try {
      const updated = await refundReceipt({ shopId: currentShop.id, receiptId: receipt.id, input: { reason } }).unwrap()
      setSelectedReceipt(updated as unknown as Receipt)
      toast({ title: 'Success', description: 'Receipt refunded' })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to refund receipt'),
        variant: 'destructive',
      })
    }
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
        onRefund={handleRefund}
        canRefund={canRefund}
        isRefunding={isRefunding}
      />

      {printReceipt ? (
        <PrintableReceipt
          items={printReceipt.items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice }))}
          subtotal={printReceipt.subtotal}
          tax={printReceipt.tax}
          total={printReceipt.total}
          paymentMethod={String(printReceipt.paymentMethod ?? '')}
          cashierName={printReceipt.cashierName}
          customerName={printReceipt.customerName}
          storeName={storeName}
          storeLines={storeLines}
          transactionId={printReceipt.id}
          date={printReceipt.date}
          initialAction={printInitialAction}
          onClose={() => {
            setPrintReceipt(null)
            setPrintInitialAction(undefined)
          }}
        />
      ) : null}
    </div>
  )
}
