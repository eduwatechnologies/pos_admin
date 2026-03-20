'use client'

import { useEffect, useState } from 'react'
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

type EmployeeFormData = Partial<Employee> & { password?: string }

interface AddEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (employee: EmployeeFormData) => void | Promise<void>
  initialEmployee?: Employee
  availableRoles: string[]
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  onSave,
  initialEmployee,
  availableRoles,
}: AddEmployeeModalProps) {
  const { toast } = useToast()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await onSave(formData)
    } catch {
      return
    }

    onOpenChange(false)

    toast({
      title: 'Success',
      description: initialEmployee ? 'Employee updated' : 'Employee added',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            />
          </div>

          {!initialEmployee && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password *
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                required
              />
            </div>
          )}

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
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialEmployee ? 'Update' : 'Add'} Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
