import { baseApi } from '@/redux/api/base-api'

type PermissionKey = 'dashboard' | 'terminal' | 'customers' | 'receipts' | 'analytics' | 'inventory' | 'employees' | 'settings'

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
        taxRateBps: number
        allowNegativeStock: boolean
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
          taxRateBps: Number(s?.taxRateBps ?? 0),
          allowNegativeStock: s?.allowNegativeStock === true,
          rolePermissions: (s?.rolePermissions ?? {
            admin: {
              dashboard: true,
              terminal: true,
              customers: true,
              receipts: true,
              analytics: true,
              inventory: true,
              employees: true,
              settings: true,
            },
            cashier: {
              dashboard: true,
              terminal: true,
              customers: false,
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
        taxRateBps: number
        allowNegativeStock: boolean
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
          taxRateBps: number
          allowNegativeStock: boolean
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
          taxRateBps: Number(s?.taxRateBps ?? 0),
          allowNegativeStock: s?.allowNegativeStock === true,
          rolePermissions: (s?.rolePermissions ?? {
            admin: {
              dashboard: true,
              terminal: true,
              customers: true,
              receipts: true,
              analytics: true,
              inventory: true,
              employees: true,
              settings: true,
            },
            cashier: {
              dashboard: true,
              terminal: true,
              customers: false,
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
    listRoles: build.query<{ rolePermissions: RolePermissions }, { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/settings/roles`, method: 'GET' }),
      transformResponse: (response: any) => {
        const rolePermissions = (response?.rolePermissions ?? {}) as RolePermissions
        return { rolePermissions }
      },
      providesTags: ['Settings'],
    }),
    createRole: build.mutation<{ rolePermissions: RolePermissions }, { shopId: string; roleKey: string }>({
      query: ({ shopId, roleKey }) => ({
        url: `/shops/${shopId}/settings/roles`,
        method: 'POST',
        body: { roleKey },
      }),
      transformResponse: (response: any) => {
        const rolePermissions = (response?.rolePermissions ?? {}) as RolePermissions
        return { rolePermissions }
      },
      invalidatesTags: ['Settings'],
    }),
    updateRole: build.mutation<
      { rolePermissions: RolePermissions },
      { shopId: string; roleKey: string; input: Partial<{ roleKey: string; permissions: Partial<Record<PermissionKey, boolean>> }> }
    >({
      query: ({ shopId, roleKey, input }) => ({
        url: `/shops/${shopId}/settings/roles/${encodeURIComponent(roleKey)}`,
        method: 'PATCH',
        body: input,
      }),
      transformResponse: (response: any) => {
        const rolePermissions = (response?.rolePermissions ?? {}) as RolePermissions
        return { rolePermissions }
      },
      invalidatesTags: ['Settings'],
    }),
    deleteRole: build.mutation<{ rolePermissions: RolePermissions }, { shopId: string; roleKey: string }>({
      query: ({ shopId, roleKey }) => ({
        url: `/shops/${shopId}/settings/roles/${encodeURIComponent(roleKey)}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        const rolePermissions = (response?.rolePermissions ?? {}) as RolePermissions
        return { rolePermissions }
      },
      invalidatesTags: ['Settings'],
    }),
  }),
})

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useListRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = settingsApi
