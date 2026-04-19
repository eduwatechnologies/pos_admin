'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Package, Receipt, ShoppingCart, StoreIcon, TrendingUp, Users, ArrowRight, CheckCircle2, Zap, Shield, Smartphone } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) return
    router.replace('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden">
              <Image src="/kounterLogo.jpeg" alt="Kounter Logo" width={40} height={40} className="object-cover" />
            </div>
            <span className="text-xl font-bold text-slate-900">Kounter</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="h-10 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="h-10 px-5 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-100 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm text-teal-700">
              <Zap className="size-4" />
              <span>Point of Sale made simple</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run your store with{' '}
              <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">confidence</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 sm:text-xl sm:leading-8 max-w-2xl mx-auto">
              Kounter helps you sell faster, track inventory in real-time, and understand your business with clear insights — all in one place.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/30 rounded-xl font-semibold">
                <Link href="/auth/register">
                  Start free trial
                  <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base rounded-xl font-semibold border-slate-300 hover:border-slate-400 hover:bg-slate-50">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-500">No credit card required · Free 14-day trial</p>
          </div>

          <div className="mt-20 flex flex-col items-center justify-center gap-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 text-center shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all hover:-translate-y-1">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-4">
                  <ShoppingCart className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Fast Checkout</h3>
                <p className="mt-2 text-sm text-slate-600">Complete sales in seconds with barcode scanning and quick cart.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 text-center shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all hover:-translate-y-1">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 mb-4">
                  <Package className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Smart Inventory</h3>
                <p className="mt-2 text-sm text-slate-600">Track stock automatically and get low stock alerts instantly.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 text-center shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all hover:-translate-y-1">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-4">
                  <BarChart3 className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Sales Insights</h3>
                <p className="mt-2 text-sm text-slate-600">Understand trends, best sellers, and grow your business.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to sell more</h2>
            <p className="mt-4 text-lg text-slate-600">Powerful features that help your business grow faster.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShoppingCart, color: 'orange', title: 'Fast POS Terminal', desc: 'Scan barcodes, apply discounts, take any payment type. Complete sales in seconds.' },
              { icon: Package, color: 'teal', title: 'Smart Inventory', desc: 'Track stock levels automatically. Get alerts when items are running low.' },
              { icon: Receipt, color: 'green', title: 'Digital Receipts', desc: 'Send receipts via SMS or email. Never lose a sale record.' },
              { icon: Users, color: 'purple', title: 'Customer Management', desc: 'Build customer profiles and track purchase history for repeat sales.' },
              { icon: BarChart3, color: 'rose', title: 'Sales Analytics', desc: 'Understand your best sellers, peak hours, and growth trends.' },
              { icon: Shield, color: 'cyan', title: 'Staff Access Control', desc: 'Create roles for cashiers and managers. Track every action.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50">
                <div className={`inline-flex size-12 items-center justify-center rounded-xl bg-${color}-100 text-${color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Plans for every store size</h2>
            <p className="mt-4 text-lg text-slate-600">Start small and upgrade when you’re ready. Keep the same teal look across every plan.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Starter</div>
                  <div className="mt-1 text-sm text-slate-600">For single-store teams.</div>
                </div>
                <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
                  7-day trial
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-slate-900">₦0</div>
                  <div className="pb-1 text-sm text-slate-500">/ trial</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">Includes core POS features to get you selling fast.</div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  'POS terminal + receipts',
                  'Products + categories',
                  'Customers + refunds',
                  'Basic analytics',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-teal-100">
                      <CheckCircle2 className="size-3 text-teal-700" />
                    </div>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800">
                  <Link href="/auth/register">Start trial</Link>
                </Button>
              </div>
            </div>

            <div className="relative rounded-2xl border border-teal-200 bg-white p-8 shadow-xl shadow-teal-600/10">
              <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-teal-600/30">
                Most popular
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Business</div>
                  <div className="mt-1 text-sm text-slate-600">For growing stores.</div>
                </div>
                <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200">
                  Best value
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-slate-900">₦5,000</div>
                  <div className="pb-1 text-sm text-slate-500">/ month</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">More control, more insights, and better operations.</div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  'Everything in Starter',
                  'Employees + permissions',
                  'Purchases + suppliers',
                  'Advanced reports',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-teal-100">
                      <CheckCircle2 className="size-3 text-teal-700" />
                    </div>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25">
                  <Link href="/auth/register">
                    Get started
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
              <div>
                <div className="text-sm font-semibold text-slate-900">Pro</div>
                <div className="mt-1 text-sm text-slate-600">For teams that need more control.</div>
              </div>

              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-slate-900">₦10,000</div>
                  <div className="pb-1 text-sm text-slate-500">/ month</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">Reliable tools for busy stores and growing operations.</div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  'Everything in Business',
                  'Priority support',
                  'Advanced controls',
                  'Higher staff limits',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-teal-100">
                      <CheckCircle2 className="size-3 text-teal-700" />
                    </div>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild variant="outline" className="w-full h-11 rounded-xl border-slate-300 hover:border-slate-400 hover:bg-slate-50">
                  <Link href="/auth/register">Choose Pro</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-sm text-slate-500">
            All plans use the same secure platform and teal theme. Cancel anytime.
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to transform your store?</h2>
          <p className="mt-4 text-lg text-teal-100 max-w-2xl mx-auto">
            Join thousands of businesses already using Kounter to sell faster and manage their business better.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-teal-700 hover:bg-teal-50 shadow-xl rounded-xl font-semibold">
              <Link href="/auth/register">
                Start free trial
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl font-semibold">
              <Link href="/auth/login">Sign in to your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Frequently asked questions</h3>
              <p className="mt-3 text-slate-600">Everything you need to know about Kounter.</p>

              <div className="mt-8 space-y-6">
                {[
                  { q: 'How do I get started?', a: 'Sign up for a free account, create your shop, add your products, and you are ready to start selling.' },
                  { q: 'Can I use Kounter on mobile?', a: 'Yes. Kounter works on any device with a browser — desktop, tablet, or smartphone.' },
                  { q: 'What payment methods are supported?', a: 'You can record cash, card, and bank transfer sales from the POS terminal.' },
                ].map(({ q, a }) => (
                  <div key={q} className="border-b border-slate-200 pb-6">
                    <div className="text-base font-semibold text-slate-900">{q}</div>
                    <div className="mt-2 text-sm text-slate-600">{a}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-slate-900">Why businesses love Kounter</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Saves 2+ hours daily on inventory',
                  'Reduces billing errors to zero',
                  'Instant stock alerts prevent outages',
                  'Receipts reach customers in seconds',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="size-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl bg-teal-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Smartphone className="size-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Try Kounter on any device</div>
                    <div className="text-xs text-slate-600">Works on desktop, tablet, and mobile</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                <StoreIcon className="size-4" />
              </div>
              <span className="text-base font-bold text-slate-900">Kounter</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/auth/login" className="hover:text-slate-900">Sign in</Link>
              <Link href="/auth/register" className="hover:text-slate-900">Create account</Link>
            </div>
            <div className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Kounter POS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
