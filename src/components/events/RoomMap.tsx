'use client'

import { DoorOpen, CalendarDays } from 'lucide-react'
import type { Room } from '@/lib/supabase/types'
import type { QuickViewEvent } from './EventQuickViewModal'

interface Props {
  rooms: Room[]
  events: QuickViewEvent[]
  date: string
  onDateChange: (date: string) => void
  onSelectEvent: (event: QuickViewEvent) => void
}

export function RoomMap({ rooms, events, date, onDateChange, onSelectEvent }: Props) {
  const eventsOnDate = events.filter((ev) => ev.event_date === date)

  function eventForRoom(roomId: string) {
    return eventsOnDate.find((ev) => ev.room_id === roomId && ev.status !== 'annullato')
  }

  if (rooms.length === 0) return null

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DoorOpen size={16} className="text-dm-wood" />
          <h2 className="font-semibold text-dm-ink/80">Mappa sale</h2>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-400" />
          <input
            type="date"
            className="input py-1 text-sm w-40"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {rooms.map((room) => {
          const occupying = eventForRoom(room.id)
          const occupied = !!occupying
          return (
            <button
              key={room.id}
              type="button"
              disabled={!occupied}
              onClick={() => occupying && onSelectEvent(occupying)}
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
                <p className="text-xs text-dm-maroon font-medium truncate">{occupying.name}</p>
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
