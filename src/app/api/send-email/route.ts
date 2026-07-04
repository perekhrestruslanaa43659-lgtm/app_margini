import { NextRequest, NextResponse } from 'next/server'
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
    const { to, subject, body } = await req.json()

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
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-email error', err)
    const msg = err instanceof Error ? err.message : 'Errore invio email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
