import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyInfo } from '@/lib/company'
import { ProposalQuotePdfDocument, DEFAULT_CONTRACT_CLAUSES, type QuoteClient, type ContractClause } from '@/lib/pdf/ProposalQuotePdfDocument'
import { planPrice, type MealSection } from '@/lib/proposalHtml'

interface QuoteRequestBody {
  client: {
    name: string
    address?: string
    vatNumber?: string
    sdiCode?: string
    email?: string
    phone?: string
    eventDate?: string | null
    eventTime?: string
    guestsCount?: number | null
    bookingStatus?: string
    depositDate?: string | null
  }
  sections: MealSection[]
  clauses?: ContractClause[]
}

export async function POST(req: NextRequest) {
  // Richiede una sessione autenticata: il middleware protegge gia' questa route
  // (non e' nella lista di eccezioni), ma verifichiamo esplicitamente l'utente
  // qui perche' la route restituisce l'IBAN aziendale nel PDF.
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

  const body: QuoteRequestBody = await req.json()

  if (!body.client?.name?.trim()) {
    return NextResponse.json({ error: 'Il nome del cliente è obbligatorio' }, { status: 400 })
  }
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: 'Nessun momento nella proposta' }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 })
  }

  const client: QuoteClient = {
    name: body.client.name.trim(),
    address: body.client.address?.trim() || '',
    vatNumber: body.client.vatNumber?.trim() || '',
    sdiCode: body.client.sdiCode?.trim() || '',
    email: body.client.email?.trim() || '',
    phone: body.client.phone?.trim() || '',
    eventDate: body.client.eventDate || null,
    eventTime: body.client.eventTime?.trim() || '',
    guestsCount: body.client.guestsCount ?? null,
    bookingStatus: body.client.bookingStatus?.trim() || '',
    depositDate: body.client.depositDate || null,
  }

  const eventName = `Proposta – ${client.name}`

  const { data: event, error: eventErr } = await supabase
    .from('events')
    .insert({
      name: eventName,
      client_name: client.name,
      client_email: client.email || null,
      client_phone: client.phone || null,
      event_date: client.eventDate,
      guests_count: client.guestsCount,
      deposit_date: client.depositDate,
      status: 'richiesta',
      notes: `Preventivo generato da Proposte Eventi (${body.sections.map((s) => s.label).join(', ')})`,
    })
    .select()
    .single()

  if (eventErr || !event) {
    console.error('proposte/quote event insert error', eventErr)
    return NextResponse.json({ error: 'Errore durante la creazione dell\'evento' }, { status: 500 })
  }

  // Ogni fascia scelta (con almeno un piatto) diventa una voce di ricavo dell'evento,
  // cosi' l'evento resta consultabile/modificabile come tutti gli altri.
  const itemsToInsert = body.sections.flatMap((section) =>
    section.plans
      .filter((p) => p.groups.some((g) => g.items.length > 0))
      .map((plan) => ({
        event_id: event.id,
        type: 'ricavo' as const,
        category: section.label,
        name: `${section.label} — ${plan.name || 'Fascia'}`,
        quantity: client.guestsCount ?? 1,
        unit_price: planPrice(plan),
        vat_rate: 10,
        notes: null,
      }))
  )

  const extraItems = body.sections.flatMap((section) =>
    section.extras.map((ex) => ({
      event_id: event.id,
      type: 'ricavo' as const,
      category: `${section.label} — Servizi`,
      name: ex.name,
      quantity: ex.unit === 'a_persona' ? (client.guestsCount ?? 1) : 1,
      unit_price: ex.price,
      vat_rate: 22,
      notes: null,
    }))
  )

  const allItems = [...itemsToInsert, ...extraItems]
  if (allItems.length > 0) {
    const { error: itemsErr } = await supabase.from('event_items').insert(allItems)
    if (itemsErr) {
      console.error('proposte/quote items insert error', itemsErr)
    }
  }

  const companyInfo = await getCompanyInfo()
  const quoteRef = event.id.slice(0, 8).toUpperCase()
  const offerDate = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const clauses = body.clauses && body.clauses.length > 0 ? body.clauses : DEFAULT_CONTRACT_CLAUSES

  const buffer = await renderToBuffer(
    ProposalQuotePdfDocument({ client, sections: body.sections, companyInfo, quoteRef, offerDate, clauses })
  )

  const fileBase = `preventivo-${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
      'X-Event-Id': event.id,
    },
  })
}
