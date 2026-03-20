import { baseApi } from '@/redux/api/base-api'
import { mapEmployee, toIsoDate, type ApiEmployee } from '@/lib/api/mappers'

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listEmployees: build.query<ApiEmployee[], { shopId: string }>({
      query: ({ shopId }) => ({ url: `/shops/${shopId}/employees`, method: 'GET' }),
      transformResponse: (response: any, _meta, arg) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map((u: any) => mapEmployee(u, arg.shopId))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'Employee' as const, id: e.id })),
              { type: 'Employee' as const, id: 'LIST' },
            ]
          : [{ type: 'Employee' as const, id: 'LIST' }],
    }),
    createEmployee: build.mutation<ApiEmployee, { shopId: string; input: { name: string; email: string; password: string; role: string } }>({
      query: ({ shopId, input }) => ({ url: `/shops/${shopId}/employees`, method: 'POST', body: input }),
      transformResponse: (response: any, _meta, arg) => {
        const item = response?.item
        return {
          id: String(item?.id ?? item?._id ?? ''),
          name: String(item?.name ?? ''),
          email: String(item?.email ?? ''),
          phone: item?.phone ? String(item.phone) : undefined,
          role: String(item?.role ?? 'cashier'),
          status: item?.isActive === false ? 'inactive' : 'active',
          joinDate: toIsoDate(item?.createdAt),
          salaryOrWage: undefined,
          shopId: arg.shopId,
        }
      },
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
    updateEmployee: build.mutation<ApiEmployee, { shopId: string; employeeId: string; input: Partial<{ name: string; email: string; role: string }> }>({
      query: ({ shopId, employeeId, input }) => ({
        url: `/shops/${shopId}/employees/${employeeId}`,
        method: 'PATCH',
        body: input,
      }),
      transformResponse: (response: any, _meta, arg) => mapEmployee(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [{ type: 'Employee', id: arg.employeeId }],
    }),
    setEmployeeStatus: build.mutation<ApiEmployee, { shopId: string; employeeId: string; isActive: boolean }>({
      query: ({ shopId, employeeId, isActive }) => ({
        url: `/shops/${shopId}/employees/${employeeId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: (response: any, _meta, arg) => mapEmployee(response?.item, arg.shopId),
      invalidatesTags: (_result, _err, arg) => [{ type: 'Employee', id: arg.employeeId }],
    }),
    deleteEmployee: build.mutation<void, { shopId: string; employeeId: string }>({
      query: ({ shopId, employeeId }) => ({
        url: `/shops/${shopId}/employees/${employeeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Employee', id: arg.employeeId },
        { type: 'Employee', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useSetEmployeeStatusMutation,
  useDeleteEmployeeMutation,
} = employeesApi
