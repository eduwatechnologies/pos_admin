'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem('remember_email') ?? '',
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(() =>
    typeof window === 'undefined' ? false : !!localStorage.getItem('remember_email'),
  )
  const router = useRouter()
  const { login, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      setIsNavigating(true)
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (rememberEmail) localStorage.setItem('remember_email', email)
    else localStorage.removeItem('remember_email')
  }, [email, rememberEmail])

  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  function getErrorMessage(err: unknown) {
    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    if (typeof err === 'object' && err) {
      const anyErr = err as Record<string, unknown>
      const data = anyErr.data as unknown
      if (typeof data === 'object' && data) {
        const anyData = data as Record<string, unknown>
        const message = anyData.message
        if (typeof message === 'string') return message
      }
      const message = anyErr.message
      if (typeof message === 'string') return message
    }
    return 'An error occurred'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      setIsNavigating(true)
      router.replace('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const busy = isLoading || isNavigating

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-center gap-2 sm:justify-start md:hidden">
          <div className="flex size-10 items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/kounterLogo.jpeg"
              alt="Kounter Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div className="sm:hidden text-lg font-semibold">Kounter POS</div>
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        {isNavigating ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div className="text-sm font-medium text-card-foreground">Loading dashboard…</div>
            </div>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@pos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberEmail"
                checked={rememberEmail}
                onCheckedChange={(v) => setRememberEmail(v === true)}
              />
              <Label htmlFor="rememberEmail" className="text-muted-foreground">
                Remember email
              </Label>
            </div>
            <Link href="/auth/register" className="text-sm text-primary underline-offset-4 hover:underline">
              Create account
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
