import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface ExcelSyncPayload {
  token: string
  ref: string // chiave stabile per evitare doppioni, es. "excel:2026-08-15:sala-verde"
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  eventDate?: string | null // ISO yyyy-mm-dd
  startTime?: string | null // HH:mm
  guestsCount?: number | null
  roomName?: string | null
  notes?: string | null
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function buildIcs(opts: {
  uid: string
  summary: string
  description: string
  location: string | null
  date: string // yyyy-mm-dd
  startTime: string | null // HH:mm
}): string {
  const { uid, summary, description, location, date, startTime } = opts
  const [y, m, d] = date.split('-')
  const time = startTime && /^\d{2}:\d{2}$/.test(startTime) ? startTime.replace(':', '') + '00' : '120000'
  const dtStart = `${y}${m}${d}T${time}`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Doppio Malto//Eventi//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria evento',
    'TRIGGER:-P7D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { allowed } = await checkRateLimit('excel-sync', ip, 60, 300)
    if (!allowed) {
      return NextResponse.json({ error: 'Troppe richieste, riprova più tardi.' }, { status: 429 })
    }

    if (!process.env.EXCEL_SYNC_TOKEN) {
      return NextResponse.json({ error: 'Sync non configurata (EXCEL_SYNC_TOKEN mancante)' }, { status: 500 })
    }

    const body: ExcelSyncPayload = await req.json()

    if (body.token !== process.env.EXCEL_SYNC_TOKEN) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    if (!body.ref || !body.clientName) {
      return NextResponse.json({ error: 'ref e clientName sono obbligatori' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 })
    }

    const refTag = `[excel-ref:${body.ref}]`

    // Idempotenza: se questa riga Excel è già stata importata, aggiorna invece di duplicare.
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .ilike('notes', `%${refTag}%`)
      .maybeSingle()

    let roomId: string | null = null
    if (body.roomName) {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .ilike('name', body.roomName)
        .maybeSingle()
      roomId = room?.id ?? null
    }

    const notes = [body.notes, refTag].filter(Boolean).join(' ')

    const eventPayload = {
      name: `Evento ${body.clientName}`,
      client_name: body.clientName,
      client_email: body.clientEmail || null,
      client_phone: body.clientPhone || null,
      event_date: body.eventDate || null,
      guests_count: body.guestsCount ?? null,
      room_id: roomId,
      event_start_time: body.startTime || null,
      status: 'bozza' as const,
      notes,
    }

    let eventId: string

    if (existing) {
      const { data: updated, error } = await supabase
        .from('events')
        .update(eventPayload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error || !updated) {
        console.error('excel-sync update error', error)
        return NextResponse.json({ error: 'Errore durante l\'aggiornamento dell\'evento' }, { status: 500 })
      }
      eventId = updated.id
    } else {
      const { data: created, error } = await supabase
        .from('events')
        .insert(eventPayload)
        .select()
        .single()
      if (error || !created) {
        console.error('excel-sync insert error', error)
        return NextResponse.json({ error: 'Errore durante la creazione dell\'evento' }, { status: 500 })
      }
      eventId = created.id

      // Promemoria calendario solo alla prima creazione, non a ogni aggiornamento.
      if (body.eventDate && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.CALENDAR_REMINDER_EMAIL) {
        try {
          const ics = buildIcs({
            uid: `${eventId}@doppiomalto-eventi`,
            summary: `Evento: ${body.clientName}`,
            description: [
              body.guestsCount ? `Ospiti: ${body.guestsCount}` : null,
              body.clientPhone ? `Telefono: ${body.clientPhone}` : null,
              body.clientEmail ? `Email: ${body.clientEmail}` : null,
            ].filter(Boolean).join('\n'),
            location: body.roomName || null,
            date: body.eventDate,
            startTime: body.startTime || null,
          })

          await transporter.sendMail({
            from: `Doppio Malto <${process.env.GMAIL_USER}>`,
            to: process.env.CALENDAR_REMINDER_EMAIL,
            subject: `Nuovo evento: ${body.clientName} – ${body.eventDate}`,
            text: `Nuovo evento importato dal calendario Excel.\n\nCliente: ${body.clientName}\nData: ${body.eventDate}${body.startTime ? ' ' + body.startTime : ''}`,
            icalEvent: {
              filename: 'invito.ics',
              method: 'PUBLISH',
              content: ics,
            },
          })
        } catch (mailErr) {
          console.error('excel-sync ics email error', mailErr)
        }
      }
    }

    return NextResponse.json({ success: true, id: eventId, created: !existing })
  } catch (err) {
    console.error('excel-sync error', err)
    const msg = err instanceof Error ? err.message : 'Errore sincronizzazione'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
