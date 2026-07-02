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
  formale: 'Professionale ma umano. Usa "Lei" in modo naturale, non rigido. Frasi dirette. Il tono è quello di un collega serio che rispetta il cliente, non di un ufficio legale.',
  amichevole: 'Caldo e diretto. Usa "tu". Scrivi come scriveresti a qualcuno che conosci già: spontaneo, concreto, senza esagerare con l\'entusiasmo.',
  breve: 'Massimo 4-5 righe di corpo. Solo i fatti essenziali. Niente aperture elaborate, niente conclusioni filosofiche.',
  dettagliato: 'Completo ma leggibile. Includi tutti i dettagli disponibili. Usa paragrafi corti. Mostra disponibilità reale, non generica.',
}

// Regole di scrittura umana derivate dall'analisi dei pattern LLM più comuni
const HUMANIZER_RULES = `
REGOLE DI SCRITTURA (obbligatorie):

Vocabolario vietato — non usare MAI queste parole o frasi:
- "cruciale", "fondamentale", "chiave", "imprescindibile", "imperdibile"
- "delve", "landscape", "testament", "underscore", "vibrant", "enhance", "interplay"
- "non solo... ma anche", "non si tratta solo di... si tratta di"
- "serves as" / "rappresenta un punto di riferimento" / "si erge come"
- "in order to" → usa "per"; "due to the fact that" → usa "perché"
- "pivotal", "segna un momento", "marca una svolta", "riflette un trend"
- "esperti sostengono", "secondo gli esperti", "gli addetti ai lavori"
- "il futuro è luminoso", "tempi entusiasmanti", "non vediamo l'ora"
- "al suo nucleo", "in sostanza", "fondamentalmente", "ciò che conta davvero"
- "analizziamo", "esploriamo insieme", "vediamo nel dettaglio", "facciamo un passo indietro"

Struttura vietata:
- Mai usare trattini em (—) o en (–): sostituisci con virgola, punto o parentesi
- Mai emoji nel testo
- Mai grassetto su termini o acronimi a caso
- Mai la tripletta artificiale (tre elementi in serie solo per riempire)
- Mai frasi burocratiche: "con la presente", "si prega di voler", "alla Sua cortese attenzione", "Egregio", "Spettabile"
- Mai apertura con "Spero che questa email la trovi bene" o simili
- Mai chiusura con "Resto a disposizione per qualsiasi chiarimento" come frase vuota (se lo scrivi, rendila specifica)

Cosa fare invece:
- Varia la lunghezza delle frasi: alterna frasi corte e lunghe, non tutte uguali
- Nomina le cose con il loro nome: "è" invece di "funge da" o "si configura come"
- Sii specifico: se c'è una data, un numero, un luogo, usali. Evita generalità.
- Lascia qualcosa di non risolto se è naturale farlo (es. "ci sentiamo per i dettagli finali")
- La firma deve sembrare una persona vera, non un ufficio
`

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

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
      body.totalRevenue > 0 && `Importo preventivo: ${body.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, style: 'currency', currency: 'EUR' })}`,
    ].filter(Boolean).join('\n')

    const prompt = `Sei un responsabile eventi di Doppio Malto, catering italiano specializzato in eventi con birra artigianale e cucina di qualità. Scrivi una email reale al cliente, non un template.

Dati evento:
${details}

Cliente: ${body.clientName || 'Cliente'}

Stile: ${STYLE_INSTRUCTIONS[body.style]}
${HUMANIZER_RULES}
Inizia con "Gentile ${body.clientName?.split(' ')[0] || 'cliente'}," (formale/dettagliato) o "Ciao ${body.clientName?.split(' ')[0] || ''}," (amichevole/breve).
Firma con un nome italiano plausibile seguito da "Doppio Malto" (es. "Marco, Doppio Malto" — senza trattini).

Genera SOLO il testo dell'email. Prima riga: "Oggetto: [testo]". Poi riga vuota. Poi il corpo. Zero commenti fuori dall'email.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
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
    const msg = err instanceof Error ? err.message : 'Errore generazione email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
