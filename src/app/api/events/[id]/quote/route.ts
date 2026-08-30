import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyInfo } from '@/lib/company'
import { ProposalQuotePdfDocument, DEFAULT_CONTRACT_CLAUSES, type QuoteClient, type ContractClause } from '@/lib/pdf/ProposalQuotePdfDocument'
import { ProposalMenuPdfDocument } from '@/lib/pdf/ProposalMenuPdfDocument'
import { loadEventMealSections } from '@/lib/eventMenu'
import type { QuoteLang } from '@/lib/pdf/i18n'
import type { Event } from '@/lib/supabase/types'

// Genera il PDF "Preventivo Evento" (e il menu allegato) partendo da un evento
// GIA' registrato in /events, precompilando i dati cliente/evento dal record
// salvato invece di farli ridigitare a mano nel form separato /proposte/preventivo.
// A differenza di /api/proposte/quote, questa route NON crea un nuovo evento:
// legge quello esistente e basta.

interface QuoteFromEventBody {
  clauses?: ContractClause[]
  depositPct?: string
  depositDays?: string
  lang?: QuoteLang
}

function applyClausePlaceholders(clauses: ContractClause[], depositPct: string, depositDays: string): ContractClause[] {
  return clauses.map((c) => ({
    ...c,
    text: c.text
      .replace(/\{\{deposit_pct\}\}/g, depositPct || '____')
      .replace(/\{\{deposit_days\}\}/g, depositDays || '____'),
  }))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Stessa difesa in profondita' di /api/proposte/quote: il middleware gia' protegge
  // questa route, ma verifichiamo esplicitamente perche' il PDF contiene l'IBAN aziendale.
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 })
  }

  const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
  const event = ev as unknown as Event | null
  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
  }
  if (!event.client_name?.trim()) {
    return NextResponse.json({ error: 'Il nome del cliente non è compilato per questo evento' }, { status: 400 })
  }

  const sections = await loadEventMealSections(supabase, event)

  const body: QuoteFromEventBody = await req.json().catch(() => ({}))
  const lang: QuoteLang = body.lang === 'en' ? 'en' : 'it'

  const client: QuoteClient = {
    name: event.client_name.trim(),
    address: event.client_address?.trim() || '',
    vatNumber: event.client_vat_number?.trim() || '',
    sdiCode: event.client_sdi_code?.trim() || '',
    email: event.client_email?.trim() || '',
    phone: event.client_phone?.trim() || '',
    eventDate: event.event_date,
    eventTime: event.event_start_time && event.event_end_time
      ? `${event.event_start_time} – ${event.event_end_time}`
      : (event.event_start_time || event.event_end_time || ''),
    guestsCount: event.guests_count,
    bookingStatus: event.status,
    depositDate: event.deposit_date,
  }

  const companyInfo = await getCompanyInfo()
  const quoteRef = event.id.slice(0, 8).toUpperCase()
  const offerDate = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const clauses = applyClausePlaceholders(
    body.clauses && body.clauses.length > 0 ? body.clauses : DEFAULT_CONTRACT_CLAUSES,
    body.depositPct ?? '',
    body.depositDays ?? ''
  )
  const logoSrc = `${req.nextUrl.origin}/brand/doppio-malto-logo.jpg`

  const quoteBuffer = await renderToBuffer(
    ProposalQuotePdfDocument({ client, sections, companyInfo, quoteRef, offerDate, clauses, logoSrc, lang })
  )

  // Se l'evento ha un menu compilato, generiamo anche il PDF menu allegato con lo
  // stesso stile del menu-proposta, cosi' il "vedi allegato" del preventivo e' vero.
  let menuBuffer: Buffer | null = null
  if (sections.length > 0) {
    menuBuffer = await renderToBuffer(
      ProposalMenuPdfDocument({ clientName: client.name, sections, lang })
    )
  }

  // Puo' produrre due file (preventivo + menu allegato): li restituiamo come JSON
  // con i PDF in base64 invece che come corpo binario diretto, cosi' il client puo'
  // scaricarli entrambi da un'unica richiesta senza limiti di dimensione sugli header.
  const fileSlug = client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

  return NextResponse.json({
    quote: {
      base64: quoteBuffer.toString('base64'),
      filename: `preventivo-${fileSlug}.pdf`,
    },
    menu: menuBuffer ? {
      base64: menuBuffer.toString('base64'),
      filename: `menu-${fileSlug}.pdf`,
    } : null,
  })
}
