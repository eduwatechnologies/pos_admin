import { baseApi } from '@/redux/api/base-api'
import type { Expense } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapExpense(raw: any, shopId: string): Expense {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    category: String(raw?.category ?? ''),
    description: raw?.description ? String(raw.description) : undefined,
    amount: Number(raw?.amountCents ?? 0) / 100,
    occurredAt: toDate(raw?.occurredAt ?? raw?.createdAt),
    supplierId: raw?.supplierId ? String(raw.supplierId) : undefined,
    createdByUserId: raw?.createdByUserId ? String(raw.createdByUserId) : undefined,
    shopId,
  }
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listExpenses: build.query<
      Expense[],
      { shopId: string; category?: string; supplierId?: string; from?: string; to?: string }
    >({
      query: ({ shopId, category, supplierId, from, to }) => ({
        url: `/shops/${shopId}/expenses`,
        method: 'GET',
        params: {
          ...(category ? { category } : {}),
          ...(supplierId ? { supplierId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((e: any) => mapExpense(e, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'Expense' as const, id: e.id })),
              { type: 'Expense' as const, id: 'LIST' },
            ]
          : [{ type: 'Expense' as const, id: 'LIST' }],
    }),
    createExpense: build.mutation<
      Expense,
      { shopId: string; input: { category: string; description?: string; amount: number; occurredAt?: string; supplierId?: string } }
    >({
      query: ({ shopId, input }) => ({
        url: `/shops/${shopId}/expenses`,
        method: 'POST',
        body: {
          category: input.category,
          description: input.description ?? null,
          amountCents: Math.round(Number(input.amount ?? 0) * 100),
          occurredAt: input.occurredAt,
          supplierId: input.supplierId,
        },
      }),
      transformResponse: (response: any, _meta, arg) => mapExpense(response?.item, arg.shopId),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    updateExpense: build.mutation<
      Expense,
      {
        shopId: string
        expenseId: string
        input: Partial<{ category: string; description: string; amount: number; occurredAt: string; supplierId: string }>
      }
    >({
      query: ({ shopId, expenseId, input }) => {
        const payload: any = {}
        if ('category' in input) payload.category = input.category
        if ('description' in input) payload.description = input.description
        if ('amount' in input) payload.amountCents = Math.round(Number(input.amount ?? 0) * 100)
        if ('occurredAt' in input) payload.occurredAt = input.occurredAt
        if ('supplierId' in input) payload.supplierId = input.supplierId
        return {
          url: `/shops/${shopId}/expenses/${expenseId}`,
          method: 'PATCH',
          body: payload,
        }
      },
      transformResponse: (response: any, _meta, arg) => mapExpense(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Expense', id: arg.expenseId },
        { type: 'Expense', id: 'LIST' },
      ],
    }),
    deleteExpense: build.mutation<void, { shopId: string; expenseId: string }>({
      query: ({ shopId, expenseId }) => ({
        url: `/shops/${shopId}/expenses/${expenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Expense', id: arg.expenseId },
        { type: 'Expense', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } =
  expensesApi
