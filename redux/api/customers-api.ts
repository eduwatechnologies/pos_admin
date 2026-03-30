import { baseApi } from '@/redux/api/base-api'
import type { Customer } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapCustomer(raw: any, shopId: string): Customer {
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

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCustomers: build.query<Customer[], { shopId: string; q?: string }>({
      query: ({ shopId, q }) => ({
        url: `/shops/${shopId}/customers`,
        method: 'GET',
        params: q ? { q } : undefined,
      }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((c: any) => mapCustomer(c, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Customer' as const, id: c.id })),
              { type: 'Customer' as const, id: 'LIST' },
            ]
          : [{ type: 'Customer' as const, id: 'LIST' }],
    }),
    createCustomer: build.mutation<
      Customer,
      { shopId: string; input: { name: string; email?: string; phone?: string; address?: string; notes?: string } }
    >({
      query: ({ shopId, input }) => ({ url: `/shops/${shopId}/customers`, method: 'POST', body: input }),
      transformResponse: (response: any, _meta, arg) => mapCustomer(response?.item, arg.shopId),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    updateCustomer: build.mutation<
      Customer,
      {
        shopId: string
        customerId: string
        input: Partial<{ name: string; email: string; phone: string; address: string; notes: string; isActive: boolean }>
      }
    >({
      query: ({ shopId, customerId, input }) => ({
        url: `/shops/${shopId}/customers/${customerId}`,
        method: 'PATCH',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapCustomer(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Customer', id: arg.customerId },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
    deleteCustomer: build.mutation<void, { shopId: string; customerId: string }>({
      query: ({ shopId, customerId }) => ({
        url: `/shops/${shopId}/customers/${customerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Customer', id: arg.customerId },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } =
  customersApi

