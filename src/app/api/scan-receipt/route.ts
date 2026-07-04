import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ScannedItem {
  name: string
  quantity: number
  unit_price: number
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const { imageBase64, mimeType } = await req.json() as { imageBase64: string; mimeType: string }

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Immagine mancante' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analizza questo scontrino e restituisci SOLO un JSON array con gli articoli trovati.
Formato richiesto (array JSON puro, nessun testo fuori):
[{"name":"Nome articolo","quantity":1,"unit_price":0.00}, ...]

Regole:
- name: nome dell'articolo come appare sullo scontrino, senza codici o abbreviazioni strane
- quantity: quantità (default 1 se non specificata)
- unit_price: prezzo unitario in euro (numero decimale)
- Escludi totali, subtotali, IVA, sconti, righe di servizio
- Se non riesci a leggere bene un articolo, omettilo
- Restituisci SOLO il JSON array, nient'altro`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

    // Estrai JSON dalla risposta
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ items: [] })
    }

    const items: ScannedItem[] = JSON.parse(jsonMatch[0])
    return NextResponse.json({ items })
  } catch (err) {
    console.error('scan-receipt error', err)
    const msg = err instanceof Error ? err.message : 'Errore scansione'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
