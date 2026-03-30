import { baseApi } from '@/redux/api/base-api'
import type { Purchase, PurchaseItem } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapPurchaseItem(raw: any): PurchaseItem {
  return {
    productId: String(raw?.productId ?? ''),
    productName: String(raw?.name ?? ''),
    quantity: Number(raw?.qty ?? 0),
    unitCost: Number(raw?.unitCostCents ?? 0) / 100,
    subtotal: Number(raw?.lineTotalCents ?? 0) / 100,
  }
}

function mapPurchase(raw: any, shopId: string): Purchase {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    purchasedAt: toDate(raw?.purchasedAt ?? raw?.createdAt),
    status: String(raw?.status ?? 'posted') as any,
    supplierId: raw?.supplierId ? String(raw.supplierId) : undefined,
    reference: raw?.reference ? String(raw.reference) : undefined,
    notes: raw?.notes ? String(raw.notes) : undefined,
    items: Array.isArray(raw?.items) ? raw.items.map(mapPurchaseItem) : [],
    totalCost: Number(raw?.totalCostCents ?? 0) / 100,
    createdAt: toDate(raw?.createdAt),
    shopId,
  }
}

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPurchases: build.query<Purchase[], { shopId: string; supplierId?: string; status?: string; q?: string }>({
      query: ({ shopId, supplierId, status, q }) => ({
        url: `/shops/${shopId}/purchases`,
        method: 'GET',
        params: {
          ...(supplierId ? { supplierId } : {}),
          ...(status ? { status } : {}),
          ...(q ? { q } : {}),
        },
      }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((p: any) => mapPurchase(p, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Purchase' as const, id: p.id })),
              { type: 'Purchase' as const, id: 'LIST' },
            ]
          : [{ type: 'Purchase' as const, id: 'LIST' }],
    }),
    createPurchase: build.mutation<
      Purchase,
      {
        shopId: string
        input: {
          supplierId?: string
          reference?: string
          notes?: string
          purchasedAt?: string | Date
          items: { productId: string; qty: number; unitCostCents: number }[]
        }
      }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/purchases`,
        method: 'POST',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapPurchase(response?.item, arg.shopId),
      invalidatesTags: [{ type: 'Purchase', id: 'LIST' }, { type: 'Product', id: 'LIST' }],
    }),
    voidPurchase: build.mutation<Purchase, { shopId: string; purchaseId: string }>({
      query: ({ shopId, purchaseId }) => ({
        url: `/shops/${shopId}/purchases/${purchaseId}/void`,
        method: 'POST',
      }),
      transformResponse: (response: any, _meta, arg) => mapPurchase(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Purchase', id: arg.purchaseId },
        { type: 'Purchase', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListPurchasesQuery, useCreatePurchaseMutation, useVoidPurchaseMutation } = purchasesApi
