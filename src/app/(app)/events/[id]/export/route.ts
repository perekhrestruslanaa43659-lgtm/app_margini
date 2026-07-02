import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMargin } from '@/lib/margin'
import * as XLSX from 'xlsx'
import type { Event, EventItem, MarginScenario } from '@/lib/supabase/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const format = req.nextUrl.searchParams.get('format') ?? 'excel'
  const supabase = createClient()
  const id = params.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [{ data: rawEvent }, { data: rawItems }, { data: rawScenarios }] = await Promise.all([
    sb.from('events').select('*').eq('id', id).single(),
    sb.from('event_items').select('*').eq('event_id', id),
    sb.from('margin_scenarios').select('*').eq('event_id', id),
  ])

  const event = rawEvent as Event | null
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allItems: EventItem[] = (rawItems ?? []) as EventItem[]
  const scenarios: MarginScenario[] = (rawScenarios ?? []) as MarginScenario[]
  const revenues = allItems.filter((i) => i.type === 'ricavo')
  const costs = allItems.filter((i) => i.type === 'costo')
  const summary = computeMargin(allItems, event.guests_count ?? 1)

  if (format === 'excel') {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Event data
    const eventSheet = XLSX.utils.aoa_to_sheet([
      ['Campo', 'Valore'],
      ['Nome evento', event.name],
      ['Cliente', event.client_name ?? ''],
      ['Data evento', event.event_date ?? ''],
      ['Location', event.location ?? ''],
      ['N° ospiti', event.guests_count ?? ''],
      ['Stato', event.status],
      ['Note', event.notes ?? ''],
    ])
    XLSX.utils.book_append_sheet(wb, eventSheet, 'Evento')

    // Sheet 2: Items
    const itemHeader = ['Tipo', 'Categoria', 'Nome', 'Quantità', 'Prezzo unitario', 'IVA %', 'Totale']
    const itemRows = allItems.map((it) => [
      it.type === 'ricavo' ? 'Ricavo' : 'Costo',
      it.category ?? '',
      it.name,
      it.quantity,
      it.unit_price,
      it.vat_rate,
      { f: `D${allItems.indexOf(it) + 2}*E${allItems.indexOf(it) + 2}` },
    ])
    const itemsSheet = XLSX.utils.aoa_to_sheet([itemHeader, ...itemRows])
    XLSX.utils.book_append_sheet(wb, itemsSheet, 'Voci dettagliate')

    // Sheet 3: Margin summary
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Voce', 'Valore'],
      ['Totale ricavi', summary.totalRevenue],
      ['Totale costi', summary.totalCosts],
      ['Margine lordo', summary.grossMargin],
      ['Margine %', summary.marginPct / 100],
      ['Ricavo per ospite', summary.revenuePerGuest],
      ['Costo per ospite', summary.costPerGuest],
      ['Margine per ospite', summary.marginPerGuest],
    ])
    summarySheet['B4'] = { t: 'n', v: summary.grossMargin, z: '€#,##0.00' }
    summarySheet['B5'] = { t: 'n', v: summary.marginPct / 100, z: '0.0%' }
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Riepilogo margini')

    // Sheet 4: Scenarios
    if (scenarios && scenarios.length > 0) {
      const scHeader = ['Scenario', 'Sconto %', 'Ricavi', 'Costi', 'Margine', 'Margine %']
      const scRows = scenarios.map((sc) => {
        const s = computeMargin(allItems, event.guests_count ?? 1, sc.discount_pct)
        return [sc.name, sc.discount_pct / 100, s.totalRevenue, s.totalCosts, s.grossMargin, s.marginPct / 100]
      })
      const scSheet = XLSX.utils.aoa_to_sheet([scHeader, ...scRows])
      XLSX.utils.book_append_sheet(wb, scSheet, 'Confronto scenari')
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `preventivo-${event.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // PDF — inline HTML for print (simple approach without puppeteer dependency)
  if (format === 'pdf') {
    const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
    const pct = (n: number) => `${n.toFixed(1)}%`

    const revenueRows = revenues.map((it) => `
      <tr>
        <td>${it.category ?? '—'}</td>
        <td>${it.name}</td>
        <td style="text-align:right">${it.quantity}</td>
        <td style="text-align:right">${fmt(it.unit_price)}</td>
        <td style="text-align:right">${it.vat_rate}%</td>
        <td style="text-align:right"><strong>${fmt(it.quantity * it.unit_price)}</strong></td>
      </tr>`).join('')

    const costRows = costs.map((it) => `
      <tr>
        <td>${it.category ?? '—'}</td>
        <td>${it.name}</td>
        <td style="text-align:right">${it.quantity}</td>
        <td style="text-align:right">${fmt(it.unit_price)}</td>
        <td style="text-align:right">${it.vat_rate}%</td>
        <td style="text-align:right"><strong>${fmt(it.quantity * it.unit_price)}</strong></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Preventivo – ${event.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e293b; }
  .logo { width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  .company { font-size: 18px; font-weight: bold; }
  .subtitle { font-size: 11px; color: #64748b; }
  .event-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
  .info-row { display: flex; gap: 8px; }
  .info-label { color: #64748b; min-width: 80px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px; padding: 4px 8px; border-radius: 4px; }
  .revenues h2 { background: #d1fae5; color: #065f46; }
  .costs h2 { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; padding: 6px 8px; background: #f1f5f9; font-weight: 600; color: #475569; }
  td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .summary { margin-top: 24px; padding: 16px; background: #1e293b; color: white; border-radius: 8px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .summary-row.total { border-top: 1px solid #334155; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: bold; }
  .green { color: #34d399; }
  .red { color: #f87171; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 16px; } @page { margin: 1cm; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">DM</div>
  <div>
    <div class="company">Doppio Malto</div>
    <div class="subtitle">Preventivo Evento</div>
  </div>
</div>

<div class="event-info">
  <div class="info-row"><span class="info-label">Evento:</span><strong>${event.name}</strong></div>
  <div class="info-row"><span class="info-label">Cliente:</span>${event.client_name ?? '—'}</div>
  <div class="info-row"><span class="info-label">Data:</span>${event.event_date ?? '—'}</div>
  <div class="info-row"><span class="info-label">Location:</span>${event.location ?? '—'}</div>
  <div class="info-row"><span class="info-label">Ospiti:</span>${event.guests_count ?? '—'}</div>
  <div class="info-row"><span class="info-label">Stato:</span>${event.status}</div>
</div>

<div class="revenues">
<h2>Ricavi</h2>
<table>
  <thead><tr><th>Categoria</th><th>Voce</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">IVA</th><th style="text-align:right">Totale</th></tr></thead>
  <tbody>${revenueRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Nessun ricavo</td></tr>'}</tbody>
</table>
</div>

<div class="costs">
<h2>Costi</h2>
<table>
  <thead><tr><th>Categoria</th><th>Voce</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">IVA</th><th style="text-align:right">Totale</th></tr></thead>
  <tbody>${costRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Nessun costo</td></tr>'}</tbody>
</table>
</div>

<div class="summary">
  <div class="summary-row"><span>Totale ricavi</span><span class="green">${fmt(summary.totalRevenue)}</span></div>
  <div class="summary-row"><span>Totale costi</span><span class="red">${fmt(summary.totalCosts)}</span></div>
  <div class="summary-row total"><span>Margine lordo</span><span class="${summary.grossMargin >= 0 ? 'green' : 'red'}">${fmt(summary.grossMargin)} (${pct(summary.marginPct)})</span></div>
</div>

<div class="footer">
  Doppio Malto · Generato il ${new Date().toLocaleDateString('it-IT')} · Event &amp; Margin Manager
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.json({ error: 'Unknown format' }, { status: 400 })
}
