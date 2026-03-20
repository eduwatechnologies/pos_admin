import { baseApi } from '@/redux/api/base-api'

type PermissionKey = 'dashboard' | 'terminal' | 'receipts' | 'analytics' | 'inventory' | 'employees' | 'settings'

type RolePermissions = {
  [role: string]: Record<PermissionKey, boolean>
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<
      {
        businessName: string
        address: string
        phone: string
        currency: string
        name: string
        rolePermissions: RolePermissions
      },
      { shopId: string }
    >({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/settings`, method: 'GET' }),
      transformResponse: (response: any) => {
        const s = response?.settings ?? {}
        return {
          businessName: String(s?.businessName ?? ''),
          address: s?.address ? String(s.address) : '',
          phone: s?.phone ? String(s.phone) : '',
          currency: String(s?.currency ?? 'NGN'),
          name: String(s?.name ?? ''),
          rolePermissions: (s?.rolePermissions ?? {
            admin: {
              dashboard: true,
              terminal: true,
              receipts: true,
              analytics: true,
              inventory: true,
              employees: true,
              settings: true,
            },
            cashier: {
              dashboard: true,
              terminal: true,
              receipts: true,
              analytics: false,
              inventory: false,
              employees: false,
              settings: false,
            },
          }) as RolePermissions,
        }
      },
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<
      {
        businessName: string
        address: string
        phone: string
        currency: string
        name: string
        rolePermissions: RolePermissions
      },
      {
        shopId: string
        input: Partial<{
          name: string
          currency: string
          businessName: string
          address: string
          phone: string
          rolePermissions: RolePermissions
        }>
      }
    >({
      query: ({ shopId, input }) => ({ url: `/shops/${shopId}/settings`, method: 'PATCH', body: input }),
      transformResponse: (response: any) => {
        const s = response?.settings ?? {}
        return {
          businessName: String(s?.businessName ?? ''),
          address: s?.address ? String(s.address) : '',
          phone: s?.phone ? String(s.phone) : '',
          currency: String(s?.currency ?? 'NGN'),
          name: String(s?.name ?? ''),
          rolePermissions: (s?.rolePermissions ?? {
            admin: {
              dashboard: true,
              terminal: true,
              receipts: true,
              analytics: true,
              inventory: true,
              employees: true,
              settings: true,
            },
            cashier: {
              dashboard: true,
              terminal: true,
              receipts: true,
              analytics: false,
              inventory: false,
              employees: false,
              settings: false,
            },
          }) as RolePermissions,
        }
      },
      invalidatesTags: ['Settings'],
    }),
  }),
})

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi
