function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (Array.isArray(value)) {
    const messages = value.map(readMessage).filter((message): message is string => Boolean(message))
    return messages.length ? messages.join(', ') : undefined
  }
  if (!isRecord(value)) return undefined

  for (const key of ['message', 'error', 'detail']) {
    const message = readMessage(value[key])
    if (message) return message
  }

  const errors = value.errors
  if (Array.isArray(errors)) {
    const messages = errors.map(readMessage).filter((message): message is string => Boolean(message))
    if (messages.length) return messages.join(', ')
  }
  if (isRecord(errors)) {
    const messages = Object.values(errors)
      .map(readMessage)
      .filter((message): message is string => Boolean(message))
    if (messages.length) return messages.join(', ')
  }

  return readMessage(value.data) ?? readMessage(value.response)
}

function statusMessage(status: unknown, fallback: string): string {
  if (status === 'FETCH_ERROR') return 'Unable to reach the server. Check your connection and try again.'
  if (status === 'TIMEOUT_ERROR') return 'The request timed out. Please try again.'
  if (status === 'PARSING_ERROR') return 'The server returned an invalid response. Please try again.'
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This request conflicts with existing data.'
  if (status === 422) return 'Please check the submitted information and try again.'
  if (typeof status === 'number' && status >= 500) return 'A server error occurred. Please try again later.'
  return fallback
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const status = isRecord(error) ? error.status : undefined
  const payloadMessage = isRecord(error)
    ? readMessage(error.data) ?? readMessage(isRecord(error.response) ? error.response.data : undefined)
    : undefined
  if (payloadMessage) return payloadMessage

  if (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    status === 'PARSING_ERROR' ||
    typeof status === 'number'
  ) {
    return statusMessage(status, fallback)
  }

  const message = readMessage(error)
  if (message) return message

  return statusMessage(status, fallback)
}
