import { baseApi } from '@/redux/api/base-api'
import type { AuditLog } from '@/lib/types'

function toDate(input: any) {
  const d = input ? new Date(input) : null
  return d && !Number.isNaN(d.getTime()) ? d : new Date(0)
}

function mapAudit(raw: any): AuditLog {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    occurredAt: toDate(raw?.occurredAt ?? raw?.createdAt),
    action: String(raw?.action ?? ''),
    entityType: String(raw?.entityType ?? ''),
    entityId: raw?.entityId ? String(raw.entityId) : undefined,
    userId: raw?.userId ? String(raw.userId) : undefined,
    ip: raw?.ip ? String(raw.ip) : undefined,
    userAgent: raw?.userAgent ? String(raw.userAgent) : undefined,
    metadata: raw?.metadata ?? undefined,
  }
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAuditLogs: build.query<
      AuditLog[],
      { shopId: string; entityType?: string; action?: string; userId?: string; from?: string; to?: string }
    >({
      query: ({ shopId, entityType, action, userId, from, to }) => ({
        url: `/shops/${shopId}/audit-logs`,
        method: 'GET',
        params: {
          ...(entityType ? { entityType } : {}),
          ...(action ? { action } : {}),
          ...(userId ? { userId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapAudit)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: 'Audit' as const, id: a.id })),
              { type: 'Audit' as const, id: 'LIST' },
            ]
          : [{ type: 'Audit' as const, id: 'LIST' }],
    }),
  }),
})

export const { useListAuditLogsQuery } = auditApi
