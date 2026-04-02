import { baseApi } from '@/redux/api/base-api'
import type { SupplierBill, SupplierBillItem, SupplierBillPayment } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapBillItem(raw: any): SupplierBillItem {
  return {
    productId: raw?.productId ? String(raw.productId) : undefined,
    description: String(raw?.description ?? ''),
    qty: Number(raw?.qty ?? 0),
    unitCost: Number(raw?.unitCostCents ?? 0) / 100,
    subtotal: Number(raw?.lineTotalCents ?? 0) / 100,
  }
}

function mapBillPayment(raw: any): SupplierBillPayment {
  return {
    amount: Number(raw?.amountCents ?? 0) / 100,
    method: String(raw?.method ?? ''),
    paidAt: toDate(raw?.paidAt),
    reference: raw?.reference ? String(raw.reference) : undefined,
    notes: raw?.notes ? String(raw.notes) : undefined,
    createdByUserId: raw?.createdByUserId ? String(raw.createdByUserId) : undefined,
  }
}

function mapBill(raw: any, shopId: string): SupplierBill {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    supplierId: String(raw?.supplierId ?? ''),
    reference: String(raw?.reference ?? ''),
    status: String(raw?.status ?? 'unpaid') as any,
    items: Array.isArray(raw?.items) ? raw.items.map(mapBillItem) : [],
    subtotal: Number(raw?.subtotalCents ?? 0) / 100,
    total: Number(raw?.totalCents ?? 0) / 100,
    paid: Number(raw?.paidCents ?? 0) / 100,
    dueDate: toDate(raw?.dueDate ?? raw?.createdAt),
    payments: Array.isArray(raw?.payments) ? raw.payments.map(mapBillPayment) : [],
    notes: raw?.notes ? String(raw.notes) : undefined,
    sourceType: raw?.sourceType ? String(raw.sourceType) : undefined,
    sourceId: raw?.sourceId ? String(raw.sourceId) : undefined,
    createdByUserId: raw?.createdByUserId ? String(raw.createdByUserId) : undefined,
    createdAt: toDate(raw?.createdAt),
    shopId,
  }
}

export const supplierBillsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSupplierBills: build.query<SupplierBill[], { shopId: string; supplierId?: string; status?: string; q?: string }>({
      query: ({ shopId, supplierId, status, q }) => ({
        url: `/shops/${shopId}/supplier-bills`,
        method: 'GET',
        params: {
          ...(supplierId ? { supplierId } : {}),
          ...(status ? { status } : {}),
          ...(q ? { q } : {}),
        },
      }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((b: any) => mapBill(b, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({ type: 'SupplierBill' as const, id: b.id })),
              { type: 'SupplierBill' as const, id: 'LIST' },
            ]
          : [{ type: 'SupplierBill' as const, id: 'LIST' }],
    }),
    createSupplierBill: build.mutation<
      SupplierBill,
      {
        shopId: string
        input: {
          supplierId: string
          reference?: string
          dueDate: string | Date
          notes?: string
          items: { productId?: string; description: string; qty: number; unitCostCents: number }[]
        }
      }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/supplier-bills`,
        method: 'POST',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapBill(response?.item, arg.shopId),
      invalidatesTags: [{ type: 'SupplierBill', id: 'LIST' }],
    }),
    paySupplierBill: build.mutation<
      SupplierBill,
      {
        shopId: string
        billId: string
        input: { amountCents: number; method: string; paidAt?: string | Date; reference?: string; notes?: string }
      }
    >({
      query: ({ shopId, billId, input }) => ({
        url: `/shops/${shopId}/supplier-bills/${billId}/pay`,
        method: 'POST',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapBill(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'SupplierBill', id: arg.billId },
        { type: 'SupplierBill', id: 'LIST' },
      ],
    }),
    voidSupplierBill: build.mutation<SupplierBill, { shopId: string; billId: string }>({
      query: ({ shopId, billId }) => ({
        url: `/shops/${shopId}/supplier-bills/${billId}/void`,
        method: 'POST',
      }),
      transformResponse: (response: any, _meta, arg) => mapBill(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'SupplierBill', id: arg.billId },
        { type: 'SupplierBill', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListSupplierBillsQuery, useCreateSupplierBillMutation, usePaySupplierBillMutation, useVoidSupplierBillMutation } =
  supplierBillsApi

