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
  formale: 'Tono professionale ma umano e cordiale. Usa "Lei" ma in modo naturale, non burocratico. Apri con "Gentile [nome]," — mai "Egregio" o "Spettabile". Scrivi come un vero responsabile eventi che tiene al cliente, non come un avvocato. Frasi semplici e dirette.',
  amichevole: 'Tono caldo e amichevole, quasi come scrivere a un amico. Usa "tu". Linguaggio spontaneo e entusiasta, trasmetti la passione per l\'evento e per la buona cucina.',
  breve: 'Messaggio breve e diretto, massimo 5-6 righe. Solo le informazioni essenziali. Niente fronzoli. Tono naturale, né troppo formale né troppo confidenziale.',
  dettagliato: 'Messaggio completo e caldo. Includi tutti i dettagli disponibili, ringrazia per la fiducia, mostra disponibilità per qualsiasi chiarimento. Firma estesa con riferimento a Doppio Malto. Tono professionale ma mai freddo o distaccato.',
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

    const prompt = `Sei il responsabile eventi di Doppio Malto, un'azienda italiana di catering e ristorazione che ama il buon cibo, la birra artigianale e le persone.
Scrivi un'email al cliente per il seguente evento:

${details}

Cliente: ${body.clientName || 'Cliente'}

Stile richiesto: ${STYLE_INSTRUCTIONS[body.style]}

Regole IMPORTANTI:
- Inizia sempre con "Gentile [nome]," oppure "Ciao [nome]," a seconda dello stile — MAI "Egregio", "Spettabile" o simili
- Scrivi in italiano corretto ma naturale, come una persona reale
- Non usare frasi fatte burocratiche tipo "con la presente", "si prega di voler", "alla Sua cortese attenzione"
- Firma come "Team Doppio Malto" o "[Nome] — Team Doppio Malto" (inventa un nome di persona plausibile)
- Genera SOLO il testo dell'email: oggetto su prima riga preceduto da "Oggetto: ", riga vuota, poi il corpo
- Nessun commento o spiegazione fuori dall'email`

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
