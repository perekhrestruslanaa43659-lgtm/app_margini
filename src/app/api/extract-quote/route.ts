import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export interface ExtractedQuote {
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  eventDate: string | null
  location: string | null
  guestsCount: number | null
  budgetMin: number | null
  budgetMax: number | null
  allergies: string | null
  specialRequests: string | null
}

const EXTRACTION_PROMPT = `Analizza questo documento (preventivo/richiesta evento) ed estrai le informazioni del cliente e dell'evento.
Restituisci SOLO un oggetto JSON puro, nessun testo fuori, in questo formato esatto:
{
  "clientName": "Nome e cognome cliente o azienda, oppure null",
  "clientEmail": "email, oppure null",
  "clientPhone": "telefono, oppure null",
  "eventDate": "data evento in formato YYYY-MM-DD, oppure null",
  "location": "location/indirizzo dell'evento, oppure null",
  "guestsCount": numero ospiti come intero, oppure null,
  "budgetMin": budget minimo come numero, oppure null,
  "budgetMax": budget massimo come numero, oppure null,
  "allergies": "allergie/intolleranze menzionate, oppure null",
  "specialRequests": "richieste particolari, menù, allestimenti, note, oppure null"
}

Regole:
- Usa null per ogni campo che non trovi nel documento, non inventare dati
- eventDate deve essere in formato ISO YYYY-MM-DD, se trovi solo un mese/anno approssima al primo giorno
- Restituisci SOLO l'oggetto JSON, nient'altro`

export async function POST(req: NextRequest) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { fileBase64, mimeType } = await req.json() as { fileBase64: string; mimeType: string }

    if (!fileBase64 || !mimeType) {
      return NextResponse.json({ error: 'File mancante' }, { status: 400 })
    }

    const isPdf = mimeType === 'application/pdf'
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)

    if (!isPdf && !isImage) {
      return NextResponse.json({ error: 'Formato non supportato. Usa PDF, JPG, PNG o WebP.' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            isPdf
              ? {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
                }
              : {
                  type: 'image',
                  source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 },
                },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Nessun dato riconosciuto nel documento' }, { status: 422 })
    }

    const extracted: ExtractedQuote = JSON.parse(jsonMatch[0])
    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('extract-quote error', err)
    const msg = err instanceof Error ? err.message : 'Errore estrazione dati'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
