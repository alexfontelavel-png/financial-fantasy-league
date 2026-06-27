'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/league',    label: 'Ligas'     },
  { href: '/market',    label: 'Mercado'   },
  { href: '/history',   label: 'Historial' },
]

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-purple flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-[15px]">StockFantasy</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map(l => (
              <Link key={l.href} href={l.href}
                className={clsx('px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
                  pathname.startsWith(l.href) ? 'bg-purple text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-red transition-colors">
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
