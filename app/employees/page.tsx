'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { EmployeesTable } from './components/employees-table'
import { AddEmployeeModal } from './components/add-employee-modal'
import { Employee } from '@/lib/types'
import { Plus, TrendingUp } from 'lucide-react'
import { useShop } from '@/context/shop-context'
import {
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useListEmployeesQuery,
  useSetEmployeePasswordMutation,
  useSetEmployeeStatusMutation,
  useUpdateEmployeeMutation,
} from '@/redux/api/employees-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useGetBillingSubscriptionQuery, useListBillingPlansQuery } from '@/redux/api/billing-api'

export default function EmployeesPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()

  const toErrorMessage = useCallback((err: any) => {
    const dataError = err?.data?.error ?? err?.data?.message
    if (dataError) return String(dataError)
    if (err?.error) return String(err.error)
    if (typeof err?.status === 'number') return `Request failed (${err.status})`
    if (err instanceof Error) return err.message
    return 'Something went wrong'
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const { data: employees = [], isFetching: isLoading, error } = useListEmployeesQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  const skipBilling = !isAuthenticated || !currentShop
  const { data: subscription } = useGetBillingSubscriptionQuery({ shopId: currentShop?.id ?? '' }, { skip: skipBilling })
  const { data: plans = [] } = useListBillingPlansQuery({ shopId: currentShop?.id ?? '' }, { skip: skipBilling })

  const maxEmployees = useMemo(() => {
    const plan = subscription?.planId ? plans.find((p) => p.id === subscription.planId) ?? null : null
    const raw = plan?.features?.maxEmployees
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    if (n < 0) return null
    return Math.floor(n)
  }, [plans, subscription?.planId])

  const isEmployeeLimitReached = useMemo(() => {
    if (typeof maxEmployees !== 'number') return false
    return employees.length >= maxEmployees
  }, [employees.length, maxEmployees])

  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip: !isAuthenticated || !currentShop })
  const availableRoles = useMemo(() => {
    const rolesFromSettings = Object.keys(settings?.rolePermissions ?? {})
      .filter((r) => r !== 'admin' && r !== 'super_admin')
      .sort((a, b) => a.localeCompare(b))
    const rolesFromEmployees = Array.from(new Set(employees.map((e) => String(e.role ?? '')).filter(Boolean)))
    const roles = Array.from(new Set([...rolesFromSettings, ...rolesFromEmployees])).sort((a, b) => a.localeCompare(b))
    return roles.length ? roles : ['cashier']
  }, [employees, settings?.rolePermissions])

  const canManageEmployees = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.employees)
  }, [settings?.rolePermissions, user])

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [setEmployeePassword] = useSetEmployeePasswordMutation()
  const [setEmployeeStatus, { isLoading: isSettingStatus }] = useSetEmployeeStatusMutation()
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation()

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: toErrorMessage(error),
      variant: 'destructive',
    })
  }, [error, toast, toErrorMessage])

  if (!isAuthenticated) {
    return null
  }

  const handleAddEmployee = async (employeeData: Partial<Employee> & { password?: string }) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage employees',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) {
      toast({
        title: 'Error',
        description: 'Select a shop first',
        variant: 'destructive',
      })
      return
    }

    try {
      if (editingEmployee) {
        await updateEmployee({
          shopId: currentShop.id,
          employeeId: editingEmployee.id,
          input: {
            name: employeeData.name ?? editingEmployee.name,
            email: employeeData.email ?? editingEmployee.email,
            role: String(employeeData.role ?? editingEmployee.role ?? 'cashier'),
            salaryOrWage: employeeData.salaryOrWage ?? editingEmployee.salaryOrWage ?? 0,
          },
        }).unwrap()

        const nextPassword = String(employeeData.password ?? '').trim()
        if (nextPassword) {
          await setEmployeePassword({
            shopId: currentShop.id,
            employeeId: editingEmployee.id,
            password: nextPassword,
          }).unwrap()
        }

        const requestedStatus = employeeData.status
        const needsStatusChange =
          requestedStatus && requestedStatus !== editingEmployee.status

        if (needsStatusChange) {
          await setEmployeeStatus({
            shopId: currentShop.id,
            employeeId: editingEmployee.id,
            isActive: requestedStatus === 'active',
          }).unwrap()
        }
        setEditingEmployee(undefined)
      } else {
        const password = employeeData.password
        if (!password) {
          toast({
            title: 'Error',
            description: 'Password is required to create an employee',
            variant: 'destructive',
          })
          throw new Error('Missing password')
        }

        await createEmployee({
          shopId: currentShop.id,
          input: {
            name: employeeData.name ?? '',
            email: employeeData.email ?? '',
            password,
            role: String(employeeData.role ?? 'cashier'),
            salaryOrWage: employeeData.salaryOrWage ?? 0,
          },
        }).unwrap()
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Missing password') return
      toast({
        title: 'Error',
        description: toErrorMessage(err),
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage employees',
        variant: 'destructive',
      })
      return
    }
    setEditingEmployee(employee)
    setModalOpen(true)
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage employees',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) return
    try {
      await deleteEmployee({ shopId: currentShop.id, employeeId }).unwrap()
      toast({
        title: 'Success',
        description: 'Employee deleted',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: toErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-end gap-2">
        <Link href="/employees/performance">
          <Button variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </Button>
        </Link>
        <Button
          onClick={() => {
            if (isEmployeeLimitReached) {
              toast({
                title: 'Plan limit reached',
                description:
                  typeof maxEmployees === 'number'
                    ? `You have reached your plan limit (${employees.length}/${maxEmployees}). Upgrade to add more staff.`
                    : 'You have reached your plan limit. Upgrade to add more staff.',
                variant: 'destructive',
              })
              router.push('/settings/system')
              return
            }
            setEditingEmployee(undefined)
            setModalOpen(true)
          }}
          className="gap-2"
          disabled={!canManageEmployees || !currentShop || isLoading || isCreating || isUpdating || isSettingStatus || isDeleting || isEmployeeLimitReached}
        >
          <Plus className="h-4 w-4" />
          {isLoading ? 'Loading…' : 'Add Employee'}
        </Button>
      </div>
      {isEmployeeLimitReached ? (
        <div className="text-sm text-muted-foreground">
          Plan limit reached ({employees.length}/{typeof maxEmployees === 'number' ? maxEmployees : employees.length}).{' '}
          <Link href="/settings/system" className="underline underline-offset-2">
            Upgrade to add more staff
          </Link>
          .
        </div>
      ) : null}

      <EmployeesTable
        employees={employees}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        disableActions={!canManageEmployees || isLoading || isCreating || isUpdating || isSettingStatus || isDeleting}
      />

      <AddEmployeeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddEmployee}
        initialEmployee={editingEmployee}
        availableRoles={availableRoles}
        isSaving={isCreating || isUpdating}
        canManage={canManageEmployees}
      />
    </div>
  )
}
