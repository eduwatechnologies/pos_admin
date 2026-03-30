import { baseApi } from '@/redux/api/base-api'

export type ReportSummary = {
  grossSales: number
  grossSubtotal: number
  grossTax: number
  refundedSales: number
  refundedCount: number
  netSales: number
  transactions: number
  averageOrderValue: number
  expenses: number
  expenseCount: number
  net: number
}

export type SalesByDayRow = {
  date: string
  grossSales: number
  refundedSales: number
  refundedCount: number
  netSales: number
  transactions: number
}

export type TopProductRow = {
  productId: string | null
  name: string
  qty: number
  revenue: number
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    reportSummary: build.query<ReportSummary, { shopId: string; from?: string; to?: string }>({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/reports/summary`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (r: any) => ({
        grossSales: Number(r?.grossSalesCents ?? 0) / 100,
        grossSubtotal: Number(r?.grossSubtotalCents ?? 0) / 100,
        grossTax: Number(r?.grossTaxCents ?? 0) / 100,
        refundedSales: Number(r?.refundedSalesCents ?? 0) / 100,
        refundedCount: Number(r?.refundedCount ?? 0),
        netSales: Number(r?.netSalesCents ?? 0) / 100,
        transactions: Number(r?.transactions ?? 0),
        averageOrderValue: Number(r?.averageOrderValueCents ?? 0) / 100,
        expenses: Number(r?.expensesCents ?? 0) / 100,
        expenseCount: Number(r?.expenseCount ?? 0),
        net: Number(r?.netCents ?? 0) / 100,
      }),
      providesTags: ['Report'],
    }),
    salesByDay: build.query<SalesByDayRow[], { shopId: string; from?: string; to?: string }>({
      query: ({ shopId, from, to }) => ({
        url: `/shops/${shopId}/reports/sales-by-day`,
        method: 'GET',
        params: { from, to },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((i: any) => ({
          date: String(i?.date ?? ''),
          grossSales: Number(i?.grossSalesCents ?? 0) / 100,
          refundedSales: Number(i?.refundedSalesCents ?? 0) / 100,
          refundedCount: Number(i?.refundedCount ?? 0),
          netSales: Number(i?.netSalesCents ?? 0) / 100,
          transactions: Number(i?.transactions ?? 0),
        }))
      },
      providesTags: ['Report'],
    }),
    topProducts: build.query<TopProductRow[], { shopId: string; from?: string; to?: string; limit?: number }>({
      query: ({ shopId, from, to, limit }) => ({
        url: `/shops/${shopId}/reports/top-products`,
        method: 'GET',
        params: { from, to, limit },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((i: any) => ({
          productId: i?.productId ? String(i.productId) : null,
          name: String(i?.name ?? ''),
          qty: Number(i?.qty ?? 0),
          revenue: Number(i?.revenueCents ?? 0) / 100,
        }))
      },
      providesTags: ['Report'],
    }),
  }),
})

export const { useReportSummaryQuery, useSalesByDayQuery, useTopProductsQuery } = reportsApi
