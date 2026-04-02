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

  const { data: receipts = [], error } = useListReceiptsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )
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
