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
import { useListEmployeesQuery } from '@/redux/api/employees-api'

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

  const { data: remoteReceipts = [], error } = useListReceiptsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  const { data: employees = [] } = useListEmployeesQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  const cashierNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of employees as any[]) {
      const id = String((e as any)?.id ?? '')
      const name = String((e as any)?.name ?? '').trim()
      if (id && name) map.set(id, name)
    }
    return map
  }, [employees])

  const receipts = useMemo(() => {
    const mapped = (remoteReceipts as any[]).map((r) => {
      const cashierId = String(r?.cashierId ?? '')
      const cashierName =
        (r?.cashierName ? String(r.cashierName) : undefined) ??
        (r?.cashier?.name ? String(r.cashier.name) : undefined) ??
        (cashierId ? cashierNameById.get(cashierId) : undefined)

      return {
        id: String(r?.id ?? ''),
        date: r?.date ? new Date(r.date) : new Date(),
        customerId: r?.customerId ? String(r.customerId) : undefined,
        customerName: r?.customerName ? String(r.customerName) : undefined,
        items: Array.isArray(r?.items) ? r.items : [],
        subtotal: Number(r?.subtotal ?? 0),
        tax: Number(r?.tax ?? 0),
        total: Number(r?.total ?? 0),
        paymentMethod: String(r?.paymentMethod ?? ''),
        status: r?.status ? String(r.status) : undefined,
        refundedAt: r?.refundedAt ? new Date(r.refundedAt) : undefined,
        refundReason: r?.refundReason ? String(r.refundReason) : undefined,
        cashierId,
        cashierName,
        shopId: r?.shopId ? String(r.shopId) : undefined,
        notes: r?.notes ? String(r.notes) : undefined,
      } satisfies Receipt
    })

    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [cashierNameById, remoteReceipts])

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

  const storeName = currentShop?.name ?? undefined
  const storeLines = useMemo(() => {
    const lines = [
      currentShop?.address || currentShop?.location || undefined,
      currentShop?.phone ? `Tel: ${currentShop.phone}` : undefined,
    ].filter(Boolean) as string[]
    return lines.length ? lines : undefined
  }, [currentShop?.address, currentShop?.location, currentShop?.phone])

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
          customerName={printReceipt.customerName ? printReceipt.customerName : 'Walk-in'}
          currency="NGN"
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
