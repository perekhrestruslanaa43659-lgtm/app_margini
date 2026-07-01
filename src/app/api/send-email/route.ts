import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 })
    }

    const from = process.env.RESEND_FROM_EMAIL
    if (!from) {
      return NextResponse.json({ error: 'RESEND_FROM_EMAIL non configurato' }, { status: 500 })
    }

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;max-width:600px">${body.replace(/\n/g, '<br>')}</div>`,
    })

    if (error) {
      console.error('Resend error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('send-email error', err)
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 })
  }
}
