import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProposalMenuPdfDocument } from '@/lib/pdf/ProposalMenuPdfDocument'
import type { MealSection } from '@/lib/proposalHtml'
import type { QuoteLang } from '@/lib/pdf/i18n'
import type { Room } from '@/lib/supabase/types'

interface MenuRequestBody {
  clientName: string
  sections: MealSection[]
  lang?: QuoteLang
}

export async function POST(req: NextRequest) {
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

  const body: MenuRequestBody = await req.json()

  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: 'Nessun momento nella proposta' }, { status: 400 })
  }

  const clientName = body.clientName?.trim() || 'Cliente'
  const lang: QuoteLang = body.lang === 'en' ? 'en' : 'it'

  const logoSrc = `${req.nextUrl.origin}/brand/doppio-malto-logo.png`

  // Ogni sezione puo' avere una sala diversa (section.room, testo libero scelto nel
  // builder): costruiamo una mappa nome sala -> foto assoluta interrogando rooms,
  // invece di una singola foto globale come in /api/events/[id]/menu (dove l'evento
  // ha una sola sala fissa).
  const roomPhotoByName = new Map<string, string>()
  const admin = createAdminClient()
  if (admin) {
    const { data: roomsData } = await admin.from('rooms').select('*')
    for (const r of (roomsData ?? []) as Room[]) {
      if (r.photo_url) roomPhotoByName.set(r.name.trim().toLowerCase(), `${req.nextUrl.origin}${r.photo_url}`)
    }
  }

  const buffer = await renderToBuffer(
    ProposalMenuPdfDocument({ clientName, sections: body.sections, lang, logoSrc, roomPhotoByName })
  )

  const fileBase = `menu-${clientName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
    },
  })
}
