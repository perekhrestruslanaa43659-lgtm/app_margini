import Link from 'next/link'
import { CalendarDays, Plus, LayoutDashboard, BookOpen, Calculator, TrendingUp } from 'lucide-react'

const cards = [
  {
    href: '/events',
    icon: CalendarDays,
    title: 'Lista Eventi',
    description: 'Visualizza e gestisci tutti gli eventi',
    color: 'bg-blue-50 text-blue-600',
    border: 'hover:border-blue-300',
  },
  {
    href: '/events/new',
    icon: Plus,
    title: 'Nuovo Evento',
    description: 'Crea un nuovo preventivo evento',
    color: 'bg-emerald-50 text-emerald-600',
    border: 'hover:border-emerald-300',
  },
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard Margini',
    description: 'Panoramica globale e KPI di performance',
    color: 'bg-violet-50 text-violet-600',
    border: 'hover:border-violet-300',
  },
  {
    href: '/catalog',
    icon: BookOpen,
    title: 'Catalogo Voci',
    description: 'Libreria riutilizzabile di prodotti e costi',
    color: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-300',
  },
  {
    href: '/calculator',
    icon: Calculator,
    title: 'Calcolatrice Margine',
    description: 'Simulazione rapida ricavi, costi e margine',
    color: 'bg-rose-50 text-rose-600',
    border: 'hover:border-rose-300',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
          <TrendingUp className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Event & Margin Manager</h1>
          <p className="text-slate-500 text-sm mt-0.5">Doppio Malto · Gestione eventi e margini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, icon: Icon, title, description, color, border }) => (
          <Link
            key={href}
            href={href}
            className={`card border-2 border-slate-100 ${border} transition-all duration-200 hover:shadow-md group`}
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
              <Icon size={24} />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-12">
        Doppio Malto · Event &amp; Margin Manager v1.0
      </p>
    </div>
  )
}
