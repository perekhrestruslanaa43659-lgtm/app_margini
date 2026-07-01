import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface GenerateEmailRequest {
  eventName: string
  clientName: string | null
  clientEmail: string | null
  eventDate: string | null
  location: string | null
  guestsCount: number | null
  totalRevenue: number
  style: 'formale' | 'amichevole' | 'breve' | 'dettagliato'
}

const STYLE_INSTRUCTIONS: Record<GenerateEmailRequest['style'], string> = {
  formale: 'Tono professionale e formale. Usa "Lei" e formule di cortesia classiche. Linguaggio sobrio e preciso.',
  amichevole: 'Tono caldo e amichevole. Usa "tu". Linguaggio naturale e accogliente, trasmetti entusiasmo per l\'evento.',
  breve: 'Messaggio breve e diretto, massimo 5-6 righe. Solo le informazioni essenziali. Niente fronzoli.',
  dettagliato: 'Messaggio completo e dettagliato. Includi tutti i dettagli disponibili, ringraziamenti, disponibilità per chiarimenti, firma estesa.',
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateEmailRequest = await req.json()

    const dateStr = body.eventDate
      ? new Date(body.eventDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const details = [
      body.eventName && `Evento: ${body.eventName}`,
      dateStr && `Data: ${dateStr}`,
      body.location && `Location: ${body.location}`,
      body.guestsCount && `Ospiti previsti: ${body.guestsCount}`,
      body.totalRevenue > 0 && `Importo preventivo: €${body.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
    ].filter(Boolean).join('\n')

    const prompt = `Sei il team eventi di Doppio Malto, un'azienda di catering e ristorazione italiana.
Scrivi un'email al cliente per il seguente evento:

${details}

Cliente: ${body.clientName || 'Cliente'}
Email cliente: ${body.clientEmail || '—'}

Stile richiesto: ${STYLE_INSTRUCTIONS[body.style]}

Genera SOLO il testo dell'email (oggetto su prima riga preceduto da "Oggetto: ", poi una riga vuota, poi il corpo).
Non aggiungere spiegazioni o commenti fuori dall'email.
Firma sempre come "Team Doppio Malto".`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse subject and body
    const lines = text.trim().split('\n')
    let subject = ''
    let bodyText = ''
    if (lines[0].toLowerCase().startsWith('oggetto:')) {
      subject = lines[0].replace(/^oggetto:\s*/i, '').trim()
      bodyText = lines.slice(2).join('\n').trim()
    } else {
      subject = `Evento ${body.eventName}`
      bodyText = text.trim()
    }

    return NextResponse.json({ subject, body: bodyText })
  } catch (err) {
    console.error('generate-email error', err)
    return NextResponse.json({ error: 'Errore generazione email' }, { status: 500 })
  }
}
