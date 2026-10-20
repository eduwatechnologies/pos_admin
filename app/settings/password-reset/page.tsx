'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useAdminResetPasswordMutation } from '@/redux/api/auth-api'

export default function AdminPasswordResetPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetPassword, { isLoading }] = useAdminResetPasswordMutation()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (user && !isAdmin) {
      toast({
        title: 'Access denied',
        description: 'Only admins and super admins can reset account passwords.',
        variant: 'destructive',
      })
      router.replace('/dashboard')
    }
  }, [isAdmin, isAuthenticated, router, toast, user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast({ title: 'Email required', description: 'Enter the account email address.', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Confirm the new password and try again.', variant: 'destructive' })
      return
    }

    try {
      await resetPassword({ email: normalizedEmail, password }).unwrap()
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      toast({ title: 'Password reset', description: `The password for ${normalizedEmail} has been updated.` })
    } catch (error) {
      toast({
        title: 'Could not reset password',
        error,
        fallback: 'Please check the account email and try again.',
        variant: 'destructive',
      })
    }
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reset account password</h1>
        <p className="mt-1 text-muted-foreground">
          Set a new password for any account using its email address.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Administrator password reset</CardTitle>
          <CardDescription>
            This action changes the account password immediately. Tell the account holder their new password securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              Passwords must be at least 8 characters. This tool can reset staff, admin, and super-admin accounts.
            </AlertDescription>
          </Alert>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="account-email">Account email</Label>
              <Input
                id="account-email"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting password…' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
