'use client'

import type { ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/error-message'

type ToastInput = {
  title?: ReactNode
  description?: ReactNode
  error?: unknown
  fallback?: string
  variant?: 'default' | 'destructive'
}

function toast({ title, description, error, fallback, variant }: ToastInput) {
  const resolvedDescription = error === undefined ? description : getApiErrorMessage(error, fallback)
  const message = title ?? resolvedDescription
  if (message == null) return

  const options = title != null && resolvedDescription != null ? { description: resolvedDescription } : undefined
  return variant === 'destructive'
    ? sonnerToast.error(message, options)
    : sonnerToast(message, options)
}

function useToast() {
  return { toast }
}

export { useToast, toast }
