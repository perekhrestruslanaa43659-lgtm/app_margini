import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProposalMenuPdfDocument } from '@/lib/pdf/ProposalMenuPdfDocument'
import { loadEventMealSections } from '@/lib/eventMenu'
import type { QuoteLang } from '@/lib/pdf/i18n'
import type { Event } from '@/lib/supabase/types'

// Genera SOLO il PDF "menu proposta" (stile SKILLS-STILE.md) dai piatti/categorie gia'
// compilati nel tab "Menu" della scheda evento — passaggio intermedio prima di procedere
// al preventivo formale nel tab Export (/api/events/[id]/quote, che genera entrambi i
// PDF insieme). Usa la stessa conversione event_menu_categories/items -> MealSection[]
// di quella route, condivisa via src/lib/eventMenu.ts.

interface MenuFromEventBody {
  lang?: QuoteLang
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  const sections = await loadEventMealSections(supabase, event)
  if (sections.length === 0) {
    return NextResponse.json({ error: 'Nessun piatto nel tab Menu: aggiungi almeno una categoria con un piatto prima di generare il PDF' }, { status: 400 })
  }

  const body: MenuFromEventBody = await req.json().catch(() => ({}))
  const lang: QuoteLang = body.lang === 'en' ? 'en' : 'it'
  const clientName = event.client_name?.trim() || event.name || 'Evento'

  const buffer = await renderToBuffer(
    ProposalMenuPdfDocument({ clientName, sections, lang })
  )

  const fileBase = `menu-${clientName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
    },
  })
}
