import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const {
      clientName, clientEmail, clientPhone,
      eventDate, location, guestsCount,
      allergies, specialRequests, budgetMin, budgetMax,
    } = await req.json()

    if (!clientName || !clientEmail) {
      return NextResponse.json({ error: 'Nome e email sono obbligatori' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: ev, error } = await supabase
      .from('events')
      .insert({
        name: `Richiesta preventivo – ${clientName}`,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone || null,
        event_date: eventDate || null,
        location: location || null,
        guests_count: guestsCount ? Number(guestsCount) : null,
        status: 'richiesta',
        allergies: allergies || null,
        special_requests: specialRequests || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
      })
      .select()
      .single()

    if (error || !ev) {
      console.error('quote-request insert error', error)
      return NextResponse.json({ error: 'Errore durante il salvataggio della richiesta' }, { status: 500 })
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const lines = [
        `Nuova richiesta di preventivo da ${clientName}`,
        '',
        `Email: ${clientEmail}`,
        clientPhone ? `Telefono: ${clientPhone}` : null,
        eventDate ? `Data evento: ${eventDate}` : null,
        location ? `Location: ${location}` : null,
        guestsCount ? `Numero ospiti: ${guestsCount}` : null,
        (budgetMin || budgetMax) ? `Budget: ${budgetMin || '—'} - ${budgetMax || '—'} €` : null,
        allergies ? `Allergie: ${allergies}` : null,
        specialRequests ? `Richieste particolari: ${specialRequests}` : null,
      ].filter(Boolean).join('\n')

      try {
        await transporter.sendMail({
          from: `Doppio Malto <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          replyTo: clientEmail,
          subject: `Nuova richiesta preventivo – ${clientName}`,
          text: lines,
          html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;max-width:600px">${lines.replace(/\n/g, '<br>')}</div>`,
        })
      } catch (mailErr) {
        console.error('quote-request notify email error', mailErr)
      }
    }

    return NextResponse.json({ success: true, id: ev.id })
  } catch (err) {
    console.error('quote-request error', err)
    const msg = err instanceof Error ? err.message : 'Errore invio richiesta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
