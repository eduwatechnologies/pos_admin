import { baseApi } from '@/redux/api/base-api'
import { mapProduct, type ApiProduct } from '@/lib/api/mappers'

type ProductPurchaseLine = {
  id: string
  purchasedAt: Date
  status: string
  supplierId?: string
  reference?: string
  qty: number
  unitCost: number
  lineTotal: number
}

type ProductDetailResponse = {
  product: ApiProduct
  purchases: ProductPurchaseLine[]
  suppliers: { id: string; name: string }[]
  movements: {
    id: string
    occurredAt: Date
    type: string
    qtyDelta: number
    sourceType: string
    sourceId: string
    unitPrice?: number
    unitCost?: number
    notes?: string
  }[]
}

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProducts: build.query<ApiProduct[], { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/products`, method: 'GET' }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapProduct)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),
    createProduct: build.mutation<
      ApiProduct,
      {
        shopId: string
        input: { name: string; category?: string; sku?: string; imageUrl?: string; price: number; quantity: number; reorderLevel: number }
      }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/products`,
        method: 'POST',
        body: {
          name: input.name,
          category: input.category ? input.category : null,
          sku: input.sku ? input.sku : null,
          imageUrl: input.imageUrl ? input.imageUrl : null,
          priceCents: Math.round(Number(input.price ?? 0) * 100),
          stockQty: Number(input.quantity ?? 0),
          lowStockThreshold: Number(input.reorderLevel ?? 0),
        },
      }),
      transformResponse: (response: any) => mapProduct(response?.item),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: build.mutation<
      ApiProduct,
      {
        shopId: string
        productId: string
        input: Partial<{ name: string; category: string; sku: string; imageUrl: string; price: number; quantity: number; reorderLevel: number }>
      }
    >({
      query: ({ shopId, productId, input }) => {
        const payload: any = {}
        if ('name' in input) payload.name = input.name
        if ('category' in input) payload.category = input.category ? input.category : null
        if ('sku' in input) payload.sku = input.sku ? input.sku : null
        if ('imageUrl' in input) payload.imageUrl = input.imageUrl ? input.imageUrl : null
        if ('price' in input) payload.priceCents = Math.round(Number(input.price ?? 0) * 100)
        if ('quantity' in input) payload.stockQty = Number(input.quantity ?? 0)
        if ('reorderLevel' in input) payload.lowStockThreshold = Number(input.reorderLevel ?? 0)
        return {
          url: `/shops/${shopId}/products/${productId}`,
          method: 'PATCH',
          body: payload,
        }
      },
      transformResponse: (response: any) => mapProduct(response?.item),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Product', id: arg.productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    deleteProduct: build.mutation<void, { shopId: string; productId: string }>({
      query: ({ shopId, productId }) => ({
        url: `/shops/${shopId}/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Product', id: arg.productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    getProductDetail: build.query<ProductDetailResponse, { shopId: string; productId: string }>({
      query: ({ shopId, productId }) => ({ url: `/shops/${shopId}/products/${productId}/detail`, method: 'GET' }),
      transformResponse: (response: any) => {
        const suppliersRaw = Array.isArray(response?.suppliers) ? response.suppliers : []
        const suppliers = suppliersRaw.map((s: any) => ({
          id: String(s?._id ?? s?.id ?? ''),
          name: String(s?.name ?? ''),
        }))

        const purchasesRaw = Array.isArray(response?.purchases) ? response.purchases : []
        const purchases = purchasesRaw.map((p: any) => ({
          id: String(p?._id ?? p?.id ?? ''),
          purchasedAt: toDate(p?.purchasedAt),
          status: String(p?.status ?? ''),
          supplierId: p?.supplierId ? String(p.supplierId) : undefined,
          reference: p?.reference ? String(p.reference) : undefined,
          qty: Number(p?.qty ?? 0),
          unitCost: Number(p?.unitCostCents ?? 0) / 100,
          lineTotal: Number(p?.lineTotalCents ?? 0) / 100,
        }))

        const movementsRaw = Array.isArray(response?.movements) ? response.movements : []
        const movements = movementsRaw.map((m: any) => ({
          id: String(m?._id ?? m?.id ?? ''),
          occurredAt: toDate(m?.occurredAt),
          type: String(m?.type ?? ''),
          qtyDelta: Number(m?.qtyDelta ?? 0),
          sourceType: String(m?.sourceType ?? ''),
          sourceId: String(m?.sourceId ?? ''),
          unitPrice: m?.unitPriceCents === null || m?.unitPriceCents === undefined ? undefined : Number(m.unitPriceCents ?? 0) / 100,
          unitCost: m?.unitCostCents === null || m?.unitCostCents === undefined ? undefined : Number(m.unitCostCents ?? 0) / 100,
          notes: m?.notes ? String(m.notes) : undefined,
        }))

        return {
          product: mapProduct(response?.item),
          purchases,
          suppliers,
          movements,
        }
      },
      providesTags: (_result, _err, arg) => [{ type: 'Product', id: arg.productId }],
    }),
    adjustStock: build.mutation<
      ApiProduct,
      {
        shopId: string
        productId: string
        input: { delta: number; reason: string }
      }
    >({
      query: ({ shopId, productId, input }) => ({
        url: `/shops/${shopId}/products/${productId}/adjust-stock`,
        method: 'POST',
        body: { delta: input.delta, reason: input.reason },
      }),
      transformResponse: (response: any) => mapProduct(response?.item),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Product', id: arg.productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductDetailQuery,
  useAdjustStockMutation,
} = productsApi
