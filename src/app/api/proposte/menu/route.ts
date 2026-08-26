import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@supabase/ssr'
import { ProposalMenuPdfDocument } from '@/lib/pdf/ProposalMenuPdfDocument'
import type { MealSection } from '@/lib/proposalHtml'
import type { QuoteLang } from '@/lib/pdf/i18n'

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

  const buffer = await renderToBuffer(
    ProposalMenuPdfDocument({ clientName, sections: body.sections, lang })
  )

  const fileBase = `menu-${clientName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
    },
  })
}
