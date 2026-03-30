import { baseApi } from '@/redux/api/base-api'
import { mapShop, type ApiShop } from '@/lib/api/mappers'

export const shopsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listShops: build.query<ApiShop[], void>({
      query: () => ({ url: '/shops', method: 'GET' }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapShop)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Shop' as const, id: s.id })),
              { type: 'Shop' as const, id: 'LIST' },
            ]
          : [{ type: 'Shop' as const, id: 'LIST' }],
    }),
    createShop: build.mutation<ApiShop, { name: string; currency?: string; businessName?: string; address?: string; phone?: string }>({
      query: (body) => ({ url: '/shops', method: 'POST', body }),
      transformResponse: (response: any) => mapShop(response?.item),
      invalidatesTags: [{ type: 'Shop', id: 'LIST' }],
    }),
  }),
})

export const { useListShopsQuery, useCreateShopMutation } = shopsApi
