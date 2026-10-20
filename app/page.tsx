'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Globe2,
  Menu,
  Package,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

const features = [
  {
    icon: ScanLine,
    title: 'A quicker checkout',
    description: 'Look up products, scan barcodes, manage a cart, and record a sale from one clear screen.',
    tone: 'bg-amber-100 text-amber-800',
  },
  {
    icon: Package,
    title: 'Stock you can keep up with',
    description: 'Manage products and categories, follow stock movements, and see when items need attention.',
    tone: 'bg-teal-100 text-teal-800',
  },
  {
    icon: BarChart3,
    title: 'Useful business reports',
    description: 'Review sales, popular products, payment mix, and performance across your shop.',
    tone: 'bg-blue-100 text-blue-800',
  },
  {
    icon: Users,
    title: 'A team with clear access',
    description: 'Add employees, set role permissions, and keep an audit trail of important activity.',
    tone: 'bg-violet-100 text-violet-800',
  },
  {
    icon: Globe2,
    title: 'In-store and online orders',
    description: 'Manage your public storefront and keep an eye on online orders alongside store operations.',
    tone: 'bg-rose-100 text-rose-800',
  },
  {
    icon: Store,
    title: 'More than one shop',
    description: 'Switch between your shops and manage day-to-day work from the same account.',
    tone: 'bg-emerald-100 text-emerald-800',
  },
]

const readingLinks = [
  { name: 'POSA', href: 'https://getposa.com/' },
  { name: 'Square Point of Sale', href: 'https://squareup.com/us/en/point-of-sale' },
  { name: 'Loyverse POS', href: 'https://loyverse.com/pos-system' },
  { name: 'Shopify POS', href: 'https://www.shopify.com/pos' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-slate-950">
      <header className="relative z-20 border-b border-slate-200/80 bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Kounter home" className="flex items-center gap-3">
            <Image
              src="/kounterLogo.jpeg"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-xl object-cover"
              priority
            />
            <span className="text-xl font-bold tracking-tight">kounter</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-950">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-950">How it works</a>
            <a href="#questions" className="text-sm font-medium text-slate-600 hover:text-slate-950">FAQs</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost" className="text-slate-700">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full bg-teal-800 px-5 text-white hover:bg-teal-900">
              <Link href="/auth/register">Start your 7-day trial</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {menuOpen ? (
          <nav aria-label="Mobile navigation" className="absolute left-0 right-0 top-full border-b border-slate-200 bg-[#fbfaf7] p-5 shadow-lg md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm font-medium">Features</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-medium">How it works</a>
              <a href="#questions" onClick={() => setMenuOpen(false)} className="text-sm font-medium">FAQs</a>
              <div className="flex gap-3 pt-2">
                <Button asChild variant="outline" className="flex-1 rounded-full">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild className="flex-1 rounded-full bg-teal-800 hover:bg-teal-900">
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      <section className="relative">
        <div className="absolute -right-40 top-0 size-[30rem] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute -left-40 top-48 size-[24rem] rounded-full bg-teal-200/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:py-28">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white/80 px-3.5 py-2 text-sm font-medium text-teal-950 shadow-sm">
              <span className="size-2 rounded-full bg-teal-600" />
              The everyday tools for running your shop
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem]">
              Make every sale
              <span className="block text-teal-800">count.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Kounter brings checkout, stock, staff, and sales insights together, so you can spend less time
              juggling tools and more time looking after your customers.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-teal-800 px-6 text-base hover:bg-teal-900">
                <Link href="/auth/register">
                  Start your 7-day trial
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-slate-300 bg-white/70 px-6 text-base">
                <Link href="/auth/login">Sign in to Kounter</Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {['Set up your shop', 'Add your products', 'Start selling'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-teal-700" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-teal-950/[0.04] blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-800 text-white">
                    <Store className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Your shop</div>
                    <div className="text-xs text-slate-500">Workspace preview</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Ready to sell
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="col-span-2 rounded-2xl bg-[#f3f6f3] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Point of sale</div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">A smoother checkout</div>
                      <p className="mt-1 text-sm text-slate-600">Find a product, build a cart, complete the sale.</p>
                    </div>
                    <div className="hidden size-11 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm sm:flex">
                      <ShoppingBag className="size-5" />
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                    <ScanLine className="size-4 text-teal-800" />
                    <span className="text-sm text-slate-500">Scan or search products</span>
                    <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">SKU</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-teal-900 px-4 py-3 text-white">
                    <span className="text-sm font-medium">Open POS terminal</span>
                    <ArrowRight className="size-4" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                    <Wallet className="size-4" />
                  </div>
                  <div className="mt-4 text-sm font-medium">Sales & receipts</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">Keep transactions organized and easy to review.</div>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    <ClipboardList className="size-4" />
                  </div>
                  <div className="mt-4 text-sm font-medium">Stock & purchases</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">See what is in stock and what needs reordering.</div>
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Your team, your permissions</div>
                      <div className="mt-1 text-xs text-slate-500">Roles and activity in one place</div>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:flex lg:-left-8">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <div className="text-xs font-semibold">The bigger picture</div>
                <div className="text-xs text-slate-500">Reports for better decisions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 border-y border-slate-200/80 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">One connected workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The tools behind a well-run shop.
            </h2>
            <p className="mt-4 text-lg leading-7 text-slate-600">
              From the first scan to the end-of-day review, keep the essential parts of your business in sync.
            </p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, tone }) => (
              <article key={title} className="border-t border-slate-200 pt-5">
                <div className={`inline-flex size-11 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-[#f1f3ee] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">Easy to get going</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start simple. Build from there.</h2>
            <p className="mt-4 max-w-lg leading-7 text-slate-600">
              Create your shop, add the products you sell, and invite the people who help you run it. Kounter keeps
              your daily tools together as your operation grows.
            </p>
            <Button asChild className="mt-7 rounded-full bg-teal-800 px-5 hover:bg-teal-900">
              <Link href="/auth/register">
                Create your shop
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { number: '01', title: 'Set up', description: 'Create your account and shop details.' },
              { number: '02', title: 'Add products', description: 'Organize your catalogue and stock.' },
              { number: '03', title: 'Start selling', description: 'Use the terminal and follow your sales.' },
            ].map((step) => (
              <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-teal-800">{step.number}</div>
                <h3 className="mt-8 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="questions" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <CircleHelp className="size-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">A few useful answers.</h2>
            <p className="mt-3 leading-7 text-slate-600">Questions about getting started with Kounter?</p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              {
                question: 'How do I get started?',
                answer: 'Create an account, set up your shop, add products, and open the POS terminal to begin recording sales.',
              },
              {
                question: 'Can I use Kounter on a phone or tablet?',
                answer: 'Kounter is a web app designed to work across desktop, tablet, and mobile screen sizes.',
              },
              {
                question: 'Can I manage staff and permissions?',
                answer: 'Yes. Add employee accounts and configure which parts of the workspace each role can access.',
              },
              {
                question: 'Is there a trial?',
                answer: 'New shops start with a 7-day trial. Create an account to set up your shop and see the available options.',
              },
            ].map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {question}
                  <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-2xl pr-8 leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-200">Ready when you are</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Bring your shop into focus.</h2>
            <p className="mt-3 leading-7 text-teal-100/80">Start a Kounter trial and bring your daily operations together.</p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 rounded-full bg-white px-6 text-teal-950 hover:bg-teal-50">
            <Link href="/auth/register">
              Start your 7-day trial
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="bg-[#fbfaf7] py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 md:flex-row">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/kounterLogo.jpeg" alt="" width={32} height={32} className="size-8 rounded-lg object-cover" />
                <span className="font-bold tracking-tight">kounter</span>
              </Link>
              <p className="mt-3 text-sm leading-6 text-slate-600">Practical tools for the people who keep shops moving.</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Explore POS systems</h2>
              <p className="mt-1 text-xs text-slate-500">External references for POS features and workflows.</p>
              <nav aria-label="External POS references" className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {readingLinks.map(({ name, href }) => (
                  <a key={name} href={href} target="_blank" rel="noreferrer" className="text-sm text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-teal-900">
                    {name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Kounter. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/auth/login" className="hover:text-slate-900">Sign in</Link>
              <Link href="/auth/register" className="hover:text-slate-900">Create account</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
