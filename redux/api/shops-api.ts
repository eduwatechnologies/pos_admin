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
  }),
})

export const { useListShopsQuery } = shopsApi

