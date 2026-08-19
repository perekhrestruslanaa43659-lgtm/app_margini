'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ArrowUpRight, CalendarDays, Users, MapPin, DoorOpen, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MarginBadge } from '@/components/ui/MarginBadge'
import { formatCurrency } from '@/lib/margin'
import { formatTimeRange } from '@/lib/timeOverlap'
import type { EventStatus, Room } from '@/lib/supabase/types'

export interface QuickViewEvent {
  id: string
  name: string
  client_name: string | null
  client_email: string | null
  event_date: string | null
  event_start_time: string | null
  event_end_time: string | null
  location: string | null
  guests_count: number | null
  status: EventStatus
  room_id: string | null
  totalRevenue: number
  marginPct: number
}

const STATUS_OPTIONS: EventStatus[] = ['richiesta', 'bozza', 'confermato', 'concluso', 'annullato']

interface Props {
  event: QuickViewEvent | null
  rooms: Room[]
  onClose: () => void
  onUpdate: (id: string, patch: { status?: EventStatus; room_id?: string | null }) => Promise<void>
}

export function EventQuickViewModal({ event, rooms, onClose, onUpdate }: Props) {
  const [saving, setSaving] = useState(false)

  if (!event) return null

  async function handleStatusChange(status: EventStatus) {
    setSaving(true)
    await onUpdate(event!.id, { status })
    setSaving(false)
  }

  async function handleRoomChange(roomId: string) {
    setSaving(true)
    await onUpdate(event!.id, { room_id: roomId || null })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display font-bold text-dm-ink text-lg leading-tight">{event.name}</h2>
            {event.client_name && <p className="text-sm text-slate-500 mt-0.5">{event.client_name}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-dm-ink transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays size={14} className="text-dm-wood shrink-0" />
            {event.event_date ? format(new Date(event.event_date), 'd MMMM yyyy', { locale: it }) : 'Data non impostata'}
          </div>
          {(event.event_start_time || event.event_end_time) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock size={14} className="text-dm-wood shrink-0" />
              {formatTimeRange(event.event_start_time, event.event_end_time)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-dm-wood shrink-0" />
              {event.location}
            </div>
          )}
          {event.guests_count != null && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users size={14} className="text-dm-wood shrink-0" />
              {event.guests_count} ospiti
            </div>
          )}
          {event.client_email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <a href={`mailto:${event.client_email}`} className="text-dm-maroon hover:underline">{event.client_email}</a>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <span className="text-xs text-slate-400">Ricavi</span>
            <span className="text-sm font-medium text-dm-ink">{formatCurrency(event.totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Margine</span>
            <MarginBadge pct={event.marginPct} />
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 space-y-3">
            <div>
              <label className="label">Stato prenotazione</label>
              <select
                className="input py-1.5 text-sm"
                value={event.status}
                disabled={saving}
                onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1"><DoorOpen size={11} /> Saletta / tavolo</label>
              <select
                className="input py-1.5 text-sm"
                value={event.room_id ?? ''}
                disabled={saving}
                onChange={(e) => handleRoomChange(e.target.value)}
              >
                <option value="">Nessuna</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}{r.location ? ` (${r.location})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-dm-cream flex items-center justify-between gap-3">
          <StatusBadge status={event.status} />
          <Link
            href={`/events/${event.id}`}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            Apri scheda completa <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
