import { baseApi } from '@/redux/api/base-api'

export type BillingPlan = {
  id: string
  name: string
  currency: string
  priceMonthly: number
  isActive: boolean
}

export type StoreSubscription = {
  id: string
  planId: string
  status: 'active' | 'past_due' | 'canceled'
  currentPeriodStart: string
  currentPeriodEnd: string
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBillingPlans: build.query<BillingPlan[], { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/billing/plans`,
      transformResponse: (resp: any) =>
        Array.isArray(resp?.items)
          ? resp.items.map((p: any) => ({
              id: String(p._id ?? p.id),
              name: String(p.name ?? ''),
              currency: String(p.currency ?? 'NGN'),
              priceMonthly: Number(p.priceMonthly ?? 0),
              isActive: p.isActive !== false,
            }))
          : [],
      providesTags: (_result, _err, arg) => [{ type: 'Billing' as const, id: `plans-${arg.shopId}` }],
    }),

    getBillingSubscription: build.query<StoreSubscription | null, { shopId: string }>({
      query: ({ shopId }) => `/shops/${shopId}/billing/subscription`,
      transformResponse: (resp: any) => {
        const s = resp?.item
        if (!s) return null
        return {
          id: String(s._id ?? s.id),
          planId: String(s.planId ?? ''),
          status: s.status,
          currentPeriodStart: String(s.currentPeriodStart ?? ''),
          currentPeriodEnd: String(s.currentPeriodEnd ?? ''),
        }
      },
      providesTags: (_result, _err, arg) => [{ type: 'Billing' as const, id: `sub-${arg.shopId}` }],
    }),

    initializePaystack: build.mutation<
      { authorizationUrl: string; reference: string; invoiceId: string },
      { shopId: string; planId: string; redirectUrl: string }
    >({
      query: ({ shopId, ...body }) => ({
        url: `/shops/${shopId}/billing/paystack/initialize`,
        method: 'POST',
        body,
      }),
    }),

    verifyPaystack: build.mutation<
      { invoice: any; subscription: any },
      { shopId: string; reference: string }
    >({
      query: ({ shopId, reference }) => ({
        url: `/shops/${shopId}/billing/paystack/verify?reference=${encodeURIComponent(reference)}`,
        method: 'GET',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Billing' as const, id: `sub-${arg.shopId}` },
        { type: 'Billing' as const, id: `plans-${arg.shopId}` },
      ],
    }),
  }),
})

export const {
  useListBillingPlansQuery,
  useGetBillingSubscriptionQuery,
  useInitializePaystackMutation,
  useVerifyPaystackMutation,
} = billingApi

