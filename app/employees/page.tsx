'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { EmployeesTable } from './components/employees-table'
import { AddEmployeeModal } from './components/add-employee-modal'
import { Employee } from '@/lib/types'
import { Plus, TrendingUp } from 'lucide-react'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'

export default function EmployeesPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated || !currentShop) return
      setIsLoading(true)
      try {
        const items = await api.employees.list(currentShop.id)
        if (!cancelled) setEmployees(items)
      } catch (err) {
        if (cancelled) return
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load employees',
          variant: 'destructive',
        })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, currentShop, toast])

  if (!isAuthenticated) {
    return null
  }

  const handleAddEmployee = async (employeeData: Partial<Employee> & { password?: string }) => {
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
        const updated = await api.employees.update(currentShop.id, editingEmployee.id, {
          name: employeeData.name ?? editingEmployee.name,
          email: employeeData.email ?? editingEmployee.email,
        })

        const requestedStatus = employeeData.status
        const needsStatusChange =
          requestedStatus && requestedStatus !== editingEmployee.status

        const finalEmployee = needsStatusChange
          ? await api.employees.setStatus(currentShop.id, editingEmployee.id, requestedStatus === 'active')
          : updated

        setEmployees(prev => prev.map(e => (e.id === finalEmployee.id ? finalEmployee : e)))
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

        const created = await api.employees.create(currentShop.id, {
          name: employeeData.name ?? '',
          email: employeeData.email ?? '',
          password,
        })
        setEmployees(prev => [created, ...prev])
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Missing password') return
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save employee',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setModalOpen(true)
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!currentShop) return
    try {
      await api.employees.remove(currentShop.id, employeeId)
      setEmployees(prev => prev.filter(e => e.id !== employeeId))
      toast({
        title: 'Success',
        description: 'Employee deleted',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete employee',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-2">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/performance">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </Button>
          </Link>
          <Button
            onClick={() => {
              setEditingEmployee(undefined)
              setModalOpen(true)
            }}
            className="gap-2"
            disabled={!currentShop || isLoading}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <EmployeesTable
        employees={employees}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
      />

      <AddEmployeeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddEmployee}
        initialEmployee={editingEmployee}
      />
    </div>
  )
}
