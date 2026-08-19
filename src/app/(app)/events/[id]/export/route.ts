import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import type { Event, EventItem, Room } from '@/lib/supabase/types'
import { computeMargin, formatCurrency } from '@/lib/margin'
import { getCompanyInfo } from '@/lib/company'
import { QuotePdfDocument } from '@/lib/pdf/QuotePdfDocument'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const format = req.nextUrl.searchParams.get('format') === 'excel' ? 'excel' : 'pdf'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const [{ data: ev }, { data: it }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).single(),
    supabase.from('event_items').select('*').eq('event_id', params.id),
  ])

  const event = ev as unknown as Event | null
  const items = (it ?? []) as unknown as EventItem[]

  if (!event) {
    return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
  }

  let roomName: string | null = null
  if (event.room_id) {
    const { data: room } = await supabase.from('rooms').select('*').eq('id', event.room_id).single()
    roomName = (room as unknown as Room | null)?.name ?? null
  }

  const revenues = items.filter((i) => i.type === 'ricavo')
  const costs = items.filter((i) => i.type === 'costo')
  const summary = computeMargin(items, event.guests_count ?? 1)
  const fileBase = `preventivo-${event.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
  const companyInfo = await getCompanyInfo()

  if (format === 'pdf') {
    const buffer = await renderToBuffer(
      QuotePdfDocument({ event, revenues, totalRevenue: summary.totalRevenue, companyInfo, roomName })
    )
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileBase}.pdf"`,
      },
    })
  }

  // Excel export — internal use, includes costs and margin (never sent to the client-facing PDF)
  const wb = XLSX.utils.book_new()

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['Preventivo', event.name],
    ['Cliente', event.client_name ?? ''],
    ['Email', event.client_email ?? ''],
    ['Telefono', event.client_phone ?? ''],
    ['Data evento', event.event_date ?? ''],
    ['Location', event.location ?? ''],
    ['N. ospiti', event.guests_count ?? ''],
    [],
    ['Azienda', companyInfo.name],
    ['IBAN', companyInfo.iban],
    ['Condizioni di pagamento', companyInfo.paymentTerms],
  ])
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Info')

  const revenueSheet = XLSX.utils.aoa_to_sheet([
    ['Voce', 'Categoria', 'Quantità', 'Prezzo unitario', 'IVA %', 'Totale'],
    ...revenues.map((r) => [r.name, r.category ?? '', r.quantity, r.unit_price, r.vat_rate, r.quantity * r.unit_price]),
    [],
    ['', '', '', '', 'Totale ricavi', summary.totalRevenue],
  ])
  XLSX.utils.book_append_sheet(wb, revenueSheet, 'Ricavi')

  const costSheet = XLSX.utils.aoa_to_sheet([
    ['Voce', 'Categoria', 'Quantità', 'Prezzo unitario', 'IVA %', 'Totale'],
    ...costs.map((c) => [c.name, c.category ?? '', c.quantity, c.unit_price, c.vat_rate, c.quantity * c.unit_price]),
    [],
    ['', '', '', '', 'Totale costi', summary.totalCosts],
  ])
  XLSX.utils.book_append_sheet(wb, costSheet, 'Costi')

  const marginSheet = XLSX.utils.aoa_to_sheet([
    ['Ricavi totali', formatCurrency(summary.totalRevenue)],
    ['Costi totali', formatCurrency(summary.totalCosts)],
    ['Margine lordo', formatCurrency(summary.grossMargin)],
    ['Margine %', `${summary.marginPct.toFixed(1)}%`],
    ['Ricavo per ospite', formatCurrency(summary.revenuePerGuest)],
    ['Costo per ospite', formatCurrency(summary.costPerGuest)],
    ['Margine per ospite', formatCurrency(summary.marginPerGuest)],
  ])
  XLSX.utils.book_append_sheet(wb, marginSheet, 'Margini')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileBase}.xlsx"`,
    },
  })
}
