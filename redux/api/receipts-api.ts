import { baseApi } from '@/redux/api/base-api'
import { mapReceipt, type ApiReceipt } from '@/lib/api/mappers'

export const receiptsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listReceipts: build.query<ApiReceipt[], { shopId: string; from?: string; to?: string; paymentMethod?: string; q?: string }>({
      query: ({ shopId, from, to, paymentMethod, q }) => ({
        url: `/shops/${shopId}/receipts`,
        method: 'GET',
        params: { from, to, paymentMethod, q },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((r: any) => mapReceipt(r))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Receipt' as const, id: r.id })),
              { type: 'Receipt' as const, id: 'LIST' },
            ]
          : [{ type: 'Receipt' as const, id: 'LIST' }],
    }),
    createReceipt: build.mutation<
      ApiReceipt,
      {
        shopId: string
        input: {
          items: Array<{ productId: string; qty: number; name?: string; unitPriceCents?: number }>
          customerName?: string
          paymentMethod: 'cash' | 'card' | 'digital' | string
          taxCents?: number
        }
      }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/receipts`,
        method: 'POST',
        body: {
          items: input.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            name: i.name,
            unitPriceCents: i.unitPriceCents,
          })),
          customerName: input.customerName ? input.customerName : null,
          paymentMethod: input.paymentMethod,
          taxCents: typeof input.taxCents === 'number' ? input.taxCents : 0,
        },
      }),
      transformResponse: (response: any) => mapReceipt(response?.item),
      invalidatesTags: [
        { type: 'Receipt', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListReceiptsQuery, useCreateReceiptMutation } = receiptsApi
