'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, LayoutDashboard, BookOpen, Calculator, Home, Menu, X, ShieldCheck, FlaskConical, LogOut, Building2, FileText } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Eventi', icon: CalendarDays },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalog', label: 'Catalogo Voci', icon: BookOpen },
  { href: '/proposte', label: 'Proposte Eventi', icon: FileText },
  { href: '/allergens', label: 'Allergeni', icon: ShieldCheck },
  { href: '/recipes', label: 'Food Cost', icon: FlaskConical },
  { href: '/calculator', label: 'Calcolatrice', icon: Calculator },
  { href: '/settings', label: 'Impostazioni', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-dm-ink text-dm-yellow p-2 rounded-xl"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-dm-ink text-white z-40 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <p className="font-display font-semibold text-[15px] leading-tight uppercase tracking-wide">Doppio Malto</p>
          <p className="text-[11px] text-white/40 mt-1 tracking-wide">Event Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3.5 py-4 space-y-px">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors duration-150
                  ${active
                    ? 'bg-dm-yellow/10 text-dm-yellow font-semibold shadow-[inset_2px_0_0_theme(colors.dm.yellow)]'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                  }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Esci
          </button>
          <p className="text-xs text-white/30 px-3 pt-1">v1.0.0 · {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  )
}
