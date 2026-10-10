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
    salesTrend: build.query<
      { month: string; totalSales: number; transactions: number }[],
      { shopId: string; from: string; to: string }
    >({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/analytics/sales-trend`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((item: any) => ({
          month: String(item?.month ?? ''),
          totalSales: Number(item?.totalSalesCents ?? 0) / 100,
          transactions: Number(item?.transactions ?? 0),
        }))
      },
      providesTags: ['Analytics'],
    }),
    paymentBreakdown: build.query<
      { paymentMethod: string; count: number; total: number }[],
      { shopId: string; from?: string; to?: string }
    >({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/analytics/payment-breakdown`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((item: any) => ({
          paymentMethod: String(item?.paymentMethod ?? 'other'),
          count: Number(item?.count ?? 0),
          total: Number(item?.totalCents ?? 0) / 100,
        }))
      },
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

export const {
  useRevenueQuery,
  useSalesTrendQuery,
  usePaymentBreakdownQuery,
  useBestSellersQuery,
  useEmployeePerformanceQuery,
} = analyticsApi
