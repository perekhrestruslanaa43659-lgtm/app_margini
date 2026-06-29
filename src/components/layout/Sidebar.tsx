'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutDashboard, BookOpen, Calculator, Home, Menu, X, ShieldCheck, FlaskConical, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Eventi', icon: CalendarDays },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalog', label: 'Catalogo Voci', icon: BookOpen },
  { href: '/allergens', label: 'Allergeni', icon: ShieldCheck },
  { href: '/recipes', label: 'Distinta Base', icon: FlaskConical },
  { href: '/distinta-base/calcolo', label: 'Food Cost', icon: UtensilsCrossed },
  { href: '/calculator', label: 'Calcolatrice', icon: Calculator },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-xl"
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
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-white z-40 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
              DM
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Doppio Malto</p>
              <p className="text-xs text-slate-400">Event Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150
                  ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
          v1.0.0 · {new Date().getFullYear()}
        </div>
      </aside>
    </>
  )
}
