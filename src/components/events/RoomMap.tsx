'use client'

import { useState } from 'react'
import { DoorOpen, CalendarDays, Clock } from 'lucide-react'
import type { Room } from '@/lib/supabase/types'
import type { QuickViewEvent } from './EventQuickViewModal'
import { timeRangesOverlap, formatTimeRange } from '@/lib/timeOverlap'

interface Props {
  rooms: Room[]
  events: QuickViewEvent[]
  date: string
  onDateChange: (date: string) => void
  onSelectEvent: (event: QuickViewEvent) => void
}

export function RoomMap({ rooms, events, date, onDateChange, onSelectEvent }: Props) {
  const [checkStart, setCheckStart] = useState('')
  const [checkEnd, setCheckEnd] = useState('')

  const eventsOnDate = events.filter((ev) => ev.event_date === date && ev.status !== 'annullato')

  function eventsForRoom(roomId: string) {
    return eventsOnDate
      .filter((ev) => ev.room_id === roomId)
      .filter((ev) => timeRangesOverlap(checkStart || null, checkEnd || null, ev.event_start_time, ev.event_end_time))
  }

  if (rooms.length === 0) return null

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DoorOpen size={16} className="text-dm-wood" />
          <h2 className="font-semibold text-dm-ink/80">Mappa sale</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays size={14} className="text-slate-400" />
          <input
            type="date"
            className="input py-1 text-sm w-40"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <Clock size={14} className="text-slate-400 ml-1" />
          <input
            type="time"
            className="input py-1 text-sm w-28"
            value={checkStart}
            onChange={(e) => setCheckStart(e.target.value)}
            title="Fascia oraria da controllare (opzionale)"
          />
          <span className="text-slate-300 text-xs">–</span>
          <input
            type="time"
            className="input py-1 text-sm w-28"
            value={checkEnd}
            onChange={(e) => setCheckEnd(e.target.value)}
            title="Fascia oraria da controllare (opzionale)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {rooms.map((room) => {
          const roomEvents = eventsForRoom(room.id)
          const occupied = roomEvents.length > 0
          return (
            <button
              key={room.id}
              type="button"
              disabled={!occupied}
              onClick={() => occupied && onSelectEvent(roomEvents[0])}
              className={`text-left rounded-xl border-2 p-3.5 transition-colors
                ${occupied
                  ? 'border-dm-maroon/40 bg-dm-maroon/5 hover:bg-dm-maroon/10 cursor-pointer'
                  : 'border-emerald-200 bg-emerald-50 cursor-default'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-dm-ink truncate">{room.name}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${occupied ? 'bg-dm-maroon' : 'bg-emerald-500'}`} />
              </div>
              {room.location && <p className="text-[11px] text-slate-400 mb-1.5 truncate">{room.location}</p>}
              {occupied ? (
                <div className="space-y-0.5">
                  {roomEvents.map((ev) => (
                    <p key={ev.id} className="text-xs text-dm-maroon font-medium truncate">
                      {ev.name} · {formatTimeRange(ev.event_start_time, ev.event_end_time)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">Libera</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
