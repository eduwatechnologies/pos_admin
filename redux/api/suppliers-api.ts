import { baseApi } from '@/redux/api/base-api'
import type { Supplier } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapSupplier(raw: any, shopId: string): Supplier {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    email: raw?.email ? String(raw.email) : undefined,
    phone: raw?.phone ? String(raw.phone) : undefined,
    address: raw?.address ? String(raw.address) : undefined,
    notes: raw?.notes ? String(raw.notes) : undefined,
    isActive: raw?.isActive === false ? false : true,
    createdAt: toDate(raw?.createdAt),
    shopId,
  }
}

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSuppliers: build.query<Supplier[], { shopId: string; q?: string; includeInactive?: boolean }>({
      query: ({ shopId, q, includeInactive }) => ({
        url: `/shops/${shopId}/suppliers`,
        method: 'GET',
        params: {
          ...(q ? { q } : {}),
          ...(includeInactive ? { includeInactive: '1' } : {}),
        },
      }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((s: any) => mapSupplier(s, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Supplier' as const, id: s.id })),
              { type: 'Supplier' as const, id: 'LIST' },
            ]
          : [{ type: 'Supplier' as const, id: 'LIST' }],
    }),
    createSupplier: build.mutation<
      Supplier,
      { shopId: string; input: { name: string; email?: string; phone?: string; address?: string; notes?: string } }
    >({
      query: ({ shopId, input }) => ({ url: `/shops/${shopId}/suppliers`, method: 'POST', body: input }),
      transformResponse: (response: any, _meta, arg) => mapSupplier(response?.item, arg.shopId),
      invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
    }),
    updateSupplier: build.mutation<
      Supplier,
      {
        shopId: string
        supplierId: string
        input: Partial<{ name: string; email: string; phone: string; address: string; notes: string; isActive: boolean }>
      }
    >({
      query: ({ shopId, supplierId, input }) => ({
        url: `/shops/${shopId}/suppliers/${supplierId}`,
        method: 'PATCH',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapSupplier(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Supplier', id: arg.supplierId },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
    deleteSupplier: build.mutation<void, { shopId: string; supplierId: string }>({
      query: ({ shopId, supplierId }) => ({
        url: `/shops/${shopId}/suppliers/${supplierId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Supplier', id: arg.supplierId },
        { type: 'Supplier', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } =
  suppliersApi
