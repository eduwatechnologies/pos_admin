import { baseApi } from '@/redux/api/base-api'
import { mapCategory, type ApiCategory } from '@/lib/api/mappers'

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<ApiCategory[], { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/categories`, method: 'GET' }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapCategory)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Category' as const, id: c.id })),
              { type: 'Category' as const, id: 'LIST' },
            ]
          : [{ type: 'Category' as const, id: 'LIST' }],
    }),
    createCategory: build.mutation<ApiCategory, { shopId: string; input: { name: string } }>({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/categories`,
        method: 'POST',
        body: { name: input.name },
      }),
      transformResponse: (response: any) => mapCategory(response?.item),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: build.mutation<ApiCategory, { shopId: string; categoryId: string; input: { name: string } }>({
      query: ({ shopId, categoryId, input }) => ({
        url: `/shops/${shopId}/categories/${categoryId}`,
        method: 'PATCH',
        body: { name: input.name },
      }),
      transformResponse: (response: any) => mapCategory(response?.item),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Category', id: arg.categoryId },
        { type: 'Category', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    deleteCategory: build.mutation<void, { shopId: string; categoryId: string }>({
      query: ({ shopId, categoryId }) => ({
        url: `/shops/${shopId}/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Category', id: arg.categoryId },
        { type: 'Category', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } =
  categoriesApi

