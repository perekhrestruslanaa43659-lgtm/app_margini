'use client'

import { useEffect, useState, useMemo } from 'react'
import { CalendarDays, TrendingUp, Euro, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem } from '@/lib/supabase/types'
import { computeMargin, formatCurrency, formatPct } from '@/lib/margin'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MarginBadge } from '@/components/ui/MarginBadge'
import { SetupBanner } from '@/components/ui/SetupBanner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

type PeriodFilter = 'month' | 'quarter' | 'year'

interface EventSummary extends Event {
  marginPct: number
  totalRevenue: number
  totalCosts: number
}

const STATUS_COLORS: Record<string, string> = {
  bozza: '#94a3b8',
  confermato: '#10b981',
  concluso: '#3b82f6',
  annullato: '#ef4444',
}

function DashboardPageInner() {
  const supabase = createClient()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodFilter>('year')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [{ data: evs }, { data: its }] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('event_items').select('*'),
      ])

      const allEvs = (evs ?? []) as unknown as Event[]
      const allItems = (its ?? []) as unknown as EventItem[]

      const itemsByEvent = new Map<string, EventItem[]>()
      for (const it of allItems) {
        const list = itemsByEvent.get(it.event_id) ?? []
        list.push(it)
        itemsByEvent.set(it.event_id, list)
      }

      const enriched: EventSummary[] = allEvs.map((ev) => {
        const items = itemsByEvent.get(ev.id) ?? []
        const s = computeMargin(items, ev.guests_count ?? 1)
        return { ...ev, marginPct: s.marginPct, totalRevenue: s.totalRevenue, totalCosts: s.totalCosts }
      })

      setEvents(enriched)
      setLoading(false)
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    return events.filter((ev) => {
      if (!ev.event_date) return period === 'year'
      const d = new Date(ev.event_date)
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3)
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear()
      }
      return d.getFullYear() === now.getFullYear()
    })
  }, [events, period])

  const kpis = useMemo(() => {
    const total = filtered.length
    const confirmed = filtered.filter((e) => e.status === 'confermato' || e.status === 'concluso').length
    const avgMargin = total > 0 ? filtered.reduce((s, e) => s + e.marginPct, 0) / total : 0
    const totalRevenue = filtered.reduce((s, e) => s + e.totalRevenue, 0)
    return { total, confirmed, avgMargin, totalRevenue }
  }, [filtered])

  const barData = useMemo(() =>
    [...filtered]
      .sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? ''))
      .slice(-10)
      .map((ev) => ({
        name: ev.name.length > 18 ? ev.name.slice(0, 16) + '…' : ev.name,
        Ricavi: Math.round(ev.totalRevenue),
        Costi: Math.round(ev.totalCosts),
        margine: Math.round(ev.marginPct),
      })),
    [filtered]
  )

  const pieData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ev of filtered) {
      map[ev.status] = (map[ev.status] ?? 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const top5 = useMemo(() =>
    [...filtered]
      .filter((e) => e.totalRevenue > 0)
      .sort((a, b) => b.marginPct - a.marginPct)
      .slice(0, 5),
    [filtered]
  )

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento dashboard...</div>

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard Margini</h1>
          <p className="text-sm text-slate-500">Panoramica globale delle performance</p>
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100">
          {(['month', 'quarter', 'year'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${period === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {p === 'month' ? 'Mese' : p === 'quarter' ? 'Trimestre' : 'Anno'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Eventi totali" value={String(kpis.total)} icon={CalendarDays} />
        <KpiCard label="Confermati / Conclusi" value={String(kpis.confirmed)} icon={CheckCircle} iconColor="text-emerald-500" />
        <KpiCard label="Margine medio" value={formatPct(kpis.avgMargin)} icon={TrendingUp} iconColor={kpis.avgMargin >= 30 ? 'text-emerald-500' : kpis.avgMargin >= 15 ? 'text-amber-500' : 'text-red-500'} />
        <KpiCard label="Ricavi totali" value={formatCurrency(kpis.totalRevenue)} icon={Euro} iconColor="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Ricavi vs Costi per evento (ultimi 10)</h2>
          {barData.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nessun dato disponibile</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="Ricavi" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Costi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Distribuzione per stato</h2>
          {pieData.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nessun dato</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={10}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">Top 5 eventi per margine %</h2>
        {top5.length === 0 ? (
          <p className="text-sm text-slate-400">Nessun dato disponibile</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Evento</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Data</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Stato</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Ricavi</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Margine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {top5.map((ev, i) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                        <div>
                          <p className="font-medium text-slate-700">{ev.name}</p>
                          {ev.client_name && <p className="text-xs text-slate-400">{ev.client_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell text-xs">
                      {ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy', { locale: it }) : '—'}
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={ev.status} /></td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatCurrency(ev.totalRevenue)}</td>
                    <td className="px-3 py-2.5 text-right"><MarginBadge pct={ev.marginPct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <DashboardPageInner />
}
