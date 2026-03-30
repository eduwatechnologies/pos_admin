import { StoreIcon } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 p-6 sm:p-10">
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden border-r bg-muted/30 lg:flex">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
              <div className="relative flex w-full flex-col p-10">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <StoreIcon className="size-5" />
                  </span>
                  BillScan POS
                </div>
                <div className="my-auto max-w-md space-y-2">
                  <div className="text-3xl font-semibold tracking-tight">Run your store in one place.</div>
                  <div className="text-sm text-muted-foreground">
                    Sales, inventory, receipts, customers, employees, and analytics — all in one dashboard.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center p-6 sm:p-10">
              <div className="w-full max-w-md">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
