import { baseApi } from '@/redux/api/base-api'

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    revenue: build.query<
      { totalSales: number; totalTransactions: number; averageOrderValue: number },
      { shopId: string; from?: string; to?: string }
    >({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/analytics/revenue`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => ({
        totalSales: Number(response?.totalSalesCents ?? 0) / 100,
        totalTransactions: Number(response?.totalTransactions ?? 0),
        averageOrderValue: Number(response?.averageOrderValueCents ?? 0) / 100,
      }),
      providesTags: ['Analytics'],
    }),
    bestSellers: build.query<{ name: string; qty: number; revenue: number }[], { shopId: string; from?: string; to?: string }>({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/analytics/best-sellers`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((i: any) => ({
          name: String(i?.name ?? ''),
          qty: Number(i?.qty ?? 0),
          revenue: Number(i?.revenueCents ?? 0) / 100,
        }))
      },
      providesTags: ['Analytics'],
    }),
    employeePerformance: build.query<
      { cashierUserId: string; totalSales: number; totalTransactions: number }[],
      { shopId: string; from?: string; to?: string }
    >({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/analytics/employee-performance`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((i: any) => ({
          cashierUserId: String(i?.cashierUserId ?? ''),
          totalSales: Number(i?.totalSalesCents ?? 0) / 100,
          totalTransactions: Number(i?.totalTransactions ?? 0),
        }))
      },
      providesTags: ['Analytics'],
    }),
  }),
})

export const { useRevenueQuery, useBestSellersQuery, useEmployeePerformanceQuery } = analyticsApi

