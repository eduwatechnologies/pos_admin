import { Suspense } from 'react'

import SettingsSystemClient from './system-client'

export default function SettingsSystemPage() {
  return (
    <Suspense fallback={null}>
      <SettingsSystemClient />
    </Suspense>
  )
}
