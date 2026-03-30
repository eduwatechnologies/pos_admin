'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Employee } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

type EmployeeFormData = Partial<Employee> & { password?: string }

interface AddEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (employee: EmployeeFormData) => void | Promise<void>
  initialEmployee?: Employee
  availableRoles: string[]
  isSaving?: boolean
  canManage?: boolean
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  onSave,
  initialEmployee,
  availableRoles,
  isSaving,
  canManage,
}: AddEmployeeModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isBusy = Boolean(isSaving) || isSubmitting
  const isDisabled = isBusy || !canManage
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    status: 'active',
    salaryOrWage: 0,
    password: '',
  })

  useEffect(() => {
    if (!open) return
    if (initialEmployee) {
      setFormData({
        ...initialEmployee,
        password: '',
      })
    } else {
      const defaultRole = availableRoles[0] ?? 'cashier'
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: defaultRole as any,
        status: 'active',
        salaryOrWage: 0,
        password: '',
      })
    }
  }, [availableRoles, initialEmployee, open])

  useEffect(() => {
    if (!open) setIsSubmitting(false)
  }, [open])

  const submitLabel = useMemo(() => {
    if (isBusy) return initialEmployee ? 'Saving…' : 'Creating…'
    return initialEmployee ? 'Update Employee' : 'Add Employee'
  }, [initialEmployee, isBusy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isBusy) return
    if (!canManage) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage employees',
        variant: 'destructive',
      })
      return
    }
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!initialEmployee && !formData.password) {
      toast({
        title: 'Error',
        description: 'Password is required',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSave(formData)
    } catch {
      setIsSubmitting(false)
      return
    }

    onOpenChange(false)

    toast({
      title: 'Success',
      description: initialEmployee ? 'Employee updated' : 'Employee added',
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isBusy && !nextOpen) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {initialEmployee ? 'Update employee details' : 'Add a new team member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe"
              disabled={isDisabled}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled={isDisabled}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="555-0000"
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {initialEmployee ? 'New Password (optional)' : 'Password *'}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={initialEmployee ? 'Leave blank to keep current password' : 'Create a password'}
                disabled={isDisabled}
                className="pr-10"
                required={!initialEmployee}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isDisabled}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role *
              </label>
              <select
                id="role"
                value={formData.role || 'cashier'}
                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                disabled={isDisabled}
                required
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={formData.status || 'active'}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                disabled={isDisabled}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="salary" className="text-sm font-medium">
              Monthly Wage/Salary (₦)
            </label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              min="0"
              value={formData.salaryOrWage || 0}
              onChange={e => setFormData({ ...formData, salaryOrWage: parseFloat(e.target.value) })}
              placeholder="0.00"
              disabled={isDisabled}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
