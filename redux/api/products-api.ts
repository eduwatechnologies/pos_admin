import { baseApi } from '@/redux/api/base-api'
import { mapProduct, type ApiProduct } from '@/lib/api/mappers'

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
        input: { name: string; category?: string; sku?: string; price: number; quantity: number; reorderLevel: number }
      }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/products`,
        method: 'POST',
        body: {
          name: input.name,
          category: input.category ? input.category : null,
          sku: input.sku ? input.sku : null,
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
        input: Partial<{ name: string; category: string; sku: string; price: number; quantity: number; reorderLevel: number }>
      }
    >({
      query: ({ shopId, productId, input }) => {
        const payload: any = {}
        if ('name' in input) payload.name = input.name
        if ('category' in input) payload.category = input.category ? input.category : null
        if ('sku' in input) payload.sku = input.sku ? input.sku : null
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
  }),
})

export const {
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi
