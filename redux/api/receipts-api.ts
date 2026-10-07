import { baseApi } from '@/redux/api/base-api'
import { mapReceipt, type ApiReceipt } from '@/lib/api/mappers'

export type ApiOnlineOrderItem = {
  productId?: string | null
  name: string
  qty: number
  unitPriceCents: number
  lineTotalCents: number
}

export type ApiOnlineOrder = {
  id: string
  orderId: string
  orderNumber: string
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  paymentMethod: string
  status: string
  orderStatus: string
  totalCents: number
  subtotalCents: number
  taxCents: number
  createdAt: string
  paidAt: string
  notes?: string | null
  items: ApiOnlineOrderItem[]
}

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
    listOnlineOrders: build.query<ApiOnlineOrder[], { shopId: string; orderStatus?: string; q?: string }>({
      query: ({ shopId, orderStatus, q }) => ({
        url: `/shops/${shopId}/storefront/orders`,
        method: 'GET',
        params: { orderStatus, q },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((order: any) => ({
          id: String(order?.id ?? order?._id ?? ''),
          orderId: String(order?.orderId ?? order?.id ?? order?._id ?? ''),
          orderNumber: String(order?.orderNumber ?? `ORD-${String(order?.id ?? order?._id ?? '').slice(-8).toUpperCase()}`),
          customerName: order?.customerName ?? null,
          customerPhone: order?.customerPhone ?? null,
          customerEmail: order?.customerEmail ?? null,
          paymentMethod: String(order?.paymentMethod ?? 'cash'),
          status: String(order?.status ?? 'paid'),
          orderStatus: String(order?.orderStatus ?? 'pending'),
          totalCents: Number(order?.totalCents ?? 0),
          subtotalCents: Number(order?.subtotalCents ?? 0),
          taxCents: Number(order?.taxCents ?? 0),
          createdAt: String(order?.createdAt ?? order?.paidAt ?? new Date().toISOString()),
          paidAt: String(order?.paidAt ?? order?.createdAt ?? new Date().toISOString()),
          notes: order?.notes ?? null,
          items: Array.isArray(order?.items) ? order.items : [],
        }))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((order) => ({ type: 'Receipt' as const, id: order.id })),
              { type: 'Receipt' as const, id: 'ONLINE_ORDERS' },
            ]
          : [{ type: 'Receipt' as const, id: 'ONLINE_ORDERS' }],
    }),
    getOnlineOrder: build.query<ApiOnlineOrder, { shopId: string; orderId: string }>({
      query: ({ shopId, orderId }) => ({
        url: `/shops/${shopId}/storefront/orders/${orderId}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        const order = response?.item ?? response ?? {}
        return {
          id: String(order?.id ?? order?._id ?? ''),
          orderId: String(order?.orderId ?? order?.id ?? order?._id ?? ''),
          orderNumber: String(order?.orderNumber ?? `ORD-${String(order?.id ?? order?._id ?? '').slice(-8).toUpperCase()}`),
          customerName: order?.customerName ?? null,
          customerPhone: order?.customerPhone ?? null,
          customerEmail: order?.customerEmail ?? null,
          paymentMethod: String(order?.paymentMethod ?? 'cash'),
          status: String(order?.status ?? 'paid'),
          orderStatus: String(order?.orderStatus ?? 'pending'),
          totalCents: Number(order?.totalCents ?? 0),
          subtotalCents: Number(order?.subtotalCents ?? 0),
          taxCents: Number(order?.taxCents ?? 0),
          createdAt: String(order?.createdAt ?? order?.paidAt ?? new Date().toISOString()),
          paidAt: String(order?.paidAt ?? order?.createdAt ?? new Date().toISOString()),
          notes: order?.notes ?? null,
          items: Array.isArray(order?.items) ? order.items : [],
        }
      },
      providesTags: (_result, _err, arg) => [{ type: 'Receipt' as const, id: arg.orderId }],
    }),
    updateOnlineOrderStatus: build.mutation<ApiOnlineOrder, { shopId: string; orderId: string; orderStatus: string }>({
      query: ({ shopId, orderId, orderStatus }) => ({
        url: `/shops/${shopId}/storefront/orders/${orderId}/status`,
        method: 'PATCH',
        body: { orderStatus },
      }),
      transformResponse: (response: any) => {
        const order = response?.item ?? response ?? {}
        return {
          id: String(order?.id ?? order?._id ?? ''),
          orderId: String(order?.orderId ?? order?.id ?? order?._id ?? ''),
          orderNumber: String(order?.orderNumber ?? `ORD-${String(order?.id ?? order?._id ?? '').slice(-8).toUpperCase()}`),
          customerName: order?.customerName ?? null,
          customerPhone: order?.customerPhone ?? null,
          customerEmail: order?.customerEmail ?? null,
          paymentMethod: String(order?.paymentMethod ?? 'cash'),
          status: String(order?.status ?? 'paid'),
          orderStatus: String(order?.orderStatus ?? 'pending'),
          totalCents: Number(order?.totalCents ?? 0),
          subtotalCents: Number(order?.subtotalCents ?? 0),
          taxCents: Number(order?.taxCents ?? 0),
          createdAt: String(order?.createdAt ?? order?.paidAt ?? new Date().toISOString()),
          paidAt: String(order?.paidAt ?? order?.createdAt ?? new Date().toISOString()),
          notes: order?.notes ?? null,
          items: Array.isArray(order?.items) ? order.items : [],
        }
      },
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Receipt', id: arg.orderId },
        { type: 'Receipt', id: 'ONLINE_ORDERS' },
        { type: 'Receipt', id: 'LIST' },
      ],
    }),
    createReceipt: build.mutation<
      ApiReceipt,
      {
        shopId: string
        input: {
          items: Array<{ productId: string; qty: number; name?: string; unitPriceCents?: number }>
          customerId?: string | null
          customerName?: string
          paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | string
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
          customerId: input.customerId ? input.customerId : null,
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
    refundReceipt: build.mutation<
      ApiReceipt,
      {
        shopId: string
        receiptId: string
        input: { reason: string }
      }
    >({
      query: ({ shopId, receiptId, input }) => ({
        url: `/shops/${shopId}/receipts/${receiptId}/refund`,
        method: 'POST',
        body: { reason: input.reason },
      }),
      transformResponse: (response: any) => mapReceipt(response?.item),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Receipt', id: arg.receiptId },
        { type: 'Receipt', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListReceiptsQuery, useListOnlineOrdersQuery, useGetOnlineOrderQuery, useUpdateOnlineOrderStatusMutation, useCreateReceiptMutation, useRefundReceiptMutation } = receiptsApi
