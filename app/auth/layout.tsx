import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 p-6 sm:p-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(800px_circle_at_20%_10%,hsl(var(--primary)/0.10),transparent_55%),radial-gradient(700px_circle_at_80%_30%,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden border-r bg-muted/30 lg:flex">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
              <div className="relative flex w-full flex-col p-10">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <div className="flex size-10 items-center justify-center rounded-xl overflow-hidden">
                    <Image
                      src="/kounterLogo.jpeg"
                      alt="Kounter Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  Kounter POS
                </div>
                <div className="my-auto max-w-md space-y-3">
                  <div className="text-3xl font-semibold tracking-tight">Run your store in one place.</div>
                  <div className="text-sm text-muted-foreground">
                    Sales, inventory, receipts, customers, employees, and analytics — all in one dashboard.
                  </div>

                  <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-2 rounded-full bg-primary" />
                      Fast checkout and receipts
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-2 rounded-full bg-primary" />
                      Inventory and purchases
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-2 rounded-full bg-primary" />
                      Reports and analytics
                    </div>
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
