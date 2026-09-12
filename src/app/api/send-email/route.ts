import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface EmailAttachment {
  filename: string
  /** PDF in base64, come restituito dalle route /api/events/[id]/quote e /menu. */
  content: string
}

/** Metadati opzionali dell'evento di origine: se presenti, dopo l'invio viene
 *  registrata una riga in proposal_sends (log proposte, vedi supabase/add_proposal_sends.sql). */
interface ProposalLogMeta {
  eventId?: string
  clientName?: string
  guestsCount?: number
  pricePerGuest?: number
  totalAmount?: number
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, attachments, log } = await req.json() as {
      to: string
      subject: string
      body: string
      attachments?: EmailAttachment[]
      log?: ProposalLogMeta
    }

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 })
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD non configurati' }, { status: 500 })
    }

    await transporter.sendMail({
      from: `Doppio Malto <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;max-width:600px">${body.replace(/\n/g, '<br>')}</div>`,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: 'base64' as const,
        contentType: 'application/pdf',
      })),
    })

    // Log best-effort: un fallimento qui non deve far apparire l'invio come fallito,
    // l'email e' gia' partita.
    const admin = createAdminClient()
    if (admin) {
      await admin.from('proposal_sends').insert({
        event_id: log?.eventId ?? null,
        client_name: log?.clientName ?? null,
        client_email: to,
        subject,
        attachments: attachments?.map((a) => a.filename) ?? [],
        guests_count: log?.guestsCount ?? null,
        price_per_guest: log?.pricePerGuest ?? null,
        total_amount: log?.totalAmount ?? null,
        status: 'inviata',
      }).then(({ error }) => {
        if (error) console.error('proposal_sends log error', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-email error', err)
    const msg = err instanceof Error ? err.message : 'Errore invio email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
