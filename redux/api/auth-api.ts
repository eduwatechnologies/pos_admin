import { baseApi } from '@/redux/api/base-api'
import { mapUser, type ApiUser } from '@/lib/api/mappers'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<
      { token: string; user: ApiUser; shop?: { id: string; name: string; currency?: string } },
      { email: string; password: string; name: string; shopName?: string; currency?: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => ({
        token: String(response?.token ?? ''),
        user: mapUser(response?.user),
        shop: response?.shop
          ? {
              id: String(response.shop.id ?? response.shop._id ?? ''),
              name: String(response.shop.name ?? ''),
              currency: response.shop.currency ? String(response.shop.currency) : undefined,
            }
          : undefined,
      }),
      invalidatesTags: ['Auth', 'Shop'],
    }),
    login: build.mutation<{ token: string; user: ApiUser }, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => ({
        token: String(response?.token ?? ''),
        user: mapUser(response?.user),
      }),
      invalidatesTags: ['Auth'],
    }),
    me: build.query<{ user: ApiUser }, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: any) => ({ user: mapUser(response?.user) }),
      providesTags: ['Auth'],
    }),
  }),
})

export const { useRegisterMutation, useLoginMutation, useMeQuery } = authApi
