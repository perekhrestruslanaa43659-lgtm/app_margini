'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, CalendarDays, Users, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem, EventStatus } from '@/lib/supabase/types'
import { computeMargin, formatCurrency } from '@/lib/margin'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MarginBadge } from '@/components/ui/MarginBadge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface EventWithMargin extends Event {
  marginPct: number
  totalRevenue: number
  totalCosts: number
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'bozza', label: 'Bozza' },
  { value: 'confermato', label: 'Confermato' },
  { value: 'concluso', label: 'Concluso' },
  { value: 'annullato', label: 'Annullato' },
]

function EventsPageInner() {
  const supabase = createClient()
  const [events, setEvents] = useState<EventWithMargin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    const { data: eventsData, error } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    if (error) { setLoading(false); return }
    const { data: itemsData } = await supabase.from('event_items').select('*')

    const events = (eventsData ?? []) as unknown as Event[]
    const allItems = (itemsData ?? []) as unknown as EventItem[]

    const itemsByEvent = new Map<string, EventItem[]>()
    for (const item of allItems) {
      const list = itemsByEvent.get(item.event_id) ?? []
      list.push(item)
      itemsByEvent.set(item.event_id, list)
    }

    const enriched: EventWithMargin[] = events.map((ev) => {
      const items = itemsByEvent.get(ev.id) ?? []
      const summary = computeMargin(items, ev.guests_count ?? 1)
      return { ...ev, marginPct: summary.marginPct, totalRevenue: summary.totalRevenue, totalCosts: summary.totalCosts }
    })

    setEvents(enriched)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEvents() }, [])

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase()
      if (q && !ev.name.toLowerCase().includes(q) && !(ev.client_name ?? '').toLowerCase().includes(q)) return false
      if (statusFilter && ev.status !== statusFilter) return false
      if (monthFilter && ev.event_date) {
        const m = ev.event_date.slice(0, 7)
        if (m !== monthFilter) return false
      }
      return true
    })
  }, [events, search, statusFilter, monthFilter])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((e) => e.id)))
  }

  async function deleteSelected() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('events').delete().in('id', Array.from(selected))
    setSelected(new Set())
    setConfirmDelete(false)
    fetchEvents()
  }

  const months = useMemo(() => {
    const set = new Set<string>()
    events.forEach((ev) => { if (ev.event_date) set.add(ev.event_date.slice(0, 7)) })
    return Array.from(set).sort().reverse()
  }, [events])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Lista Eventi</h1>
          <p className="text-sm text-slate-500">{filtered.length} eventi trovati</p>
        </div>
        <Link href="/events/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus size={16} />
          Nuovo evento
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Cerca per nome o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input sm:w-44" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="">Tutti i mesi</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {format(new Date(m + '-01'), 'MMMM yyyy', { locale: it })}
            </option>
          ))}
        </select>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <span className="text-sm text-blue-700 font-medium">{selected.size} selezionati</span>
          <button className="btn-danger flex items-center gap-1.5 ml-auto" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Elimina selezionati
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card text-center text-slate-400 py-16">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-slate-400 py-16">
          <CalendarDays className="mx-auto mb-3 text-slate-300" size={40} />
          <p>Nessun evento trovato</p>
          <Link href="/events/new" className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Crea il primo evento
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Evento</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Ospiti</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Stato</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Ricavi</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Margine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(ev.id)}
                        onChange={() => toggleSelect(ev.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/events/${ev.id}`} className="group">
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{ev.name}</p>
                        {ev.client_name && <p className="text-xs text-slate-400">{ev.client_name}</p>}
                        {ev.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{ev.location}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy', { locale: it }) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {ev.guests_count ? (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users size={13} />{ev.guests_count}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ev.status as EventStatus} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(ev.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MarginBadge pct={ev.marginPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Elimina eventi"
        message={`Stai per eliminare ${selected.size} eventi. L'operazione è irreversibile.`}
        onConfirm={deleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

export default function EventsPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <EventsPageInner />
}
