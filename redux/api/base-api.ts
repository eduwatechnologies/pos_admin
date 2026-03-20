import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { normalizeBaseUrl } from '@/lib/api/http'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'),
    prepareHeaders: (headers) => {
      if (typeof window === 'undefined') return headers
      const token = localStorage.getItem('auth_token')
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Auth', 'Shop', 'Product', 'Category', 'Employee', 'Receipt', 'Settings', 'Analytics'],
  endpoints: () => ({}),
})
