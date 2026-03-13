'use client'

import React from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopHeader } from '@/components/top-header'
import { useAuth } from '@/context/auth-context'

export function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = useAuth()

  return (
    <>
      <Sidebar />
      <main className={`min-h-screen ${user ? 'md:ml-64' : ''}`}>
        <TopHeader />
        {children}
      </main>
    </>
  )
}
