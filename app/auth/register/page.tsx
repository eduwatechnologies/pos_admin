'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AlertCircle, EyeIcon, EyeOffIcon } from 'lucide-react'
import Image from 'next/image'

import { useAuth } from '@/context/auth-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, isAuthenticated } = useAuth()

  const [name, setName] = useState('')
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  function getErrorMessage(err: unknown) {
    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    if (typeof err === 'object' && err) {
      const anyErr = err as Record<string, unknown>
      const data = anyErr.data as unknown
      if (typeof data === 'object' && data) {
        const anyData = data as Record<string, unknown>
        const message = anyData.error ?? anyData.message
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        shopName: shopName.trim() || undefined,
        currency: currency.trim() || undefined,
      })
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

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
          <div className="text-lg font-semibold">Kounter POS</div>
        </div>
        <CardTitle>Create account</CardTitle>
        <CardDescription>We’ll create your first shop automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopName">Shop name (optional)</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Ikeja Branch"
            />
          </div>

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
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="NGN" />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground sm:text-left">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
