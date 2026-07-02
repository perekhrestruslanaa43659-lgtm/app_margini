'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, Plus, Trash2, Mail, MessageCircle, CalendarDays, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem, MarginScenario, EventStatus, CatalogItem, ItemType } from '@/lib/supabase/types'
import { computeMargin, formatCurrency } from '@/lib/margin'
import { MarginBadge } from '@/components/ui/MarginBadge'
import { MarginSummaryPanel } from '@/components/events/MarginSummaryPanel'
import { ItemsTable } from '@/components/events/ItemsTable'
import { CatalogImportModal } from '@/components/events/CatalogImportModal'
import { EmailModal } from '@/components/events/EmailModal'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Tab = 'preventivo' | 'scenari' | 'export' | 'note'

interface DraftItem extends Omit<EventItem, 'id' | 'event_id'> {
  _key: string
  id?: string
}

const STATUS_OPTIONS: EventStatus[] = ['bozza', 'confermato', 'concluso', 'annullato']

function EventDetailPageInner() {
  const { id } = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any
  const [tab, setTab] = useState<Tab>('preventivo')
  const [event, setEvent] = useState<Event | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const [scenarios, setScenarios] = useState<MarginScenario[]>([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogModal, setCatalogModal] = useState<{ open: boolean; type: ItemType }>({ open: false, type: 'ricavo' })
  const [savingScenario, setSavingScenario] = useState(false)
  const [calcingCosts, setCalcingCosts] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [{ data: ev }, { data: it }, { data: sc }] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('event_items').select('*').eq('event_id', id),
      sb.from('margin_scenarios').select('*').eq('event_id', id),
    ])
    const evTyped = ev as unknown as Event | null
    const itTyped = (it ?? []) as unknown as EventItem[]
    const scTyped = (sc ?? []) as unknown as MarginScenario[]
    if (evTyped) { setEvent(evTyped); setNoteText(evTyped.notes ?? '') }
    setItems(itTyped.map((i) => ({ ...i, _key: i.id })))
    setScenarios(scTyped)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [id])

  const revenues = useMemo(() => items.filter((i) => i.type === 'ricavo'), [items])
  const costs = useMemo(() => items.filter((i) => i.type === 'costo'), [items])
  const summary = useMemo(
    () => computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1),
    [items, event]
  )

  async function updateStatus(status: EventStatus) {
    await sb.from('events').update({ status }).eq('id', id)
    setEvent((e) => e ? { ...e, status } : e)
  }

  async function saveItems() {
    await sb.from('event_items').delete().eq('event_id', id)
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length > 0) {
      await sb.from('event_items').insert(
        validItems.map((it) => ({
          event_id: id,
          type: it.type,
          category: it.category,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          vat_rate: it.vat_rate,
          notes: it.notes,
        }))
      )
    }
    fetchAll()
  }

  async function saveNote() {
    setSavingNote(true)
    await sb.from('events').update({ notes: noteText }).eq('id', id)
    setSavingNote(false)
  }

  async function autoAddCost(dishName: string, quantity: number) {
    const { data: recipeLines } = await sb
      .from('recipe_items')
      .select('quantity, ingredient:ingredients(cost_per_unit)')
      .eq('dish_name', dishName)

    const foodCost = recipeLines && recipeLines.length > 0
      ? recipeLines.reduce((sum: number, r: { quantity: number; ingredient: { cost_per_unit: number } | null }) =>
          sum + r.quantity * (r.ingredient?.cost_per_unit ?? 0), 0)
      : 0

    setItems((prev) => {
      const existingCost = prev.find((c) => c.type === 'costo' && c.name === dishName)
      if (existingCost) {
        return prev.map((c) => c.type === 'costo' && c.name === dishName
          ? { ...c, quantity, unit_price: foodCost }
          : c)
      }
      const newCost: DraftItem = {
        _key: Math.random().toString(36).slice(2),
        type: 'costo',
        category: 'Food',
        name: dishName,
        quantity,
        unit_price: foodCost,
        vat_rate: 10,
        notes: foodCost > 0 ? 'Food cost da distinta base' : 'Inserire costo manualmente',
      }
      const filtered = prev.filter((c) => !(c.type === 'costo' && c.name.trim() === ''))
      return [...filtered, newCost]
    })
  }

  async function calcAllFoodCosts() {
    const revs = items.filter((i) => i.type === 'ricavo' && i.name.trim())
    if (revs.length === 0) return
    setCalcingCosts(true)
    const dishNames = revs.map((r) => r.name)
    const { data } = await sb
      .from('recipe_items')
      .select('dish_name, quantity, ingredient:ingredients(cost_per_unit)')
      .in('dish_name', dishNames)

    const costByDish: Record<string, number> = {}
    for (const r of (data ?? []) as { dish_name: string; quantity: number; ingredient: { cost_per_unit: number } | null }[]) {
      costByDish[r.dish_name] = (costByDish[r.dish_name] ?? 0) + r.quantity * (r.ingredient?.cost_per_unit ?? 0)
    }

    const newCosts: DraftItem[] = revs.map((r) => ({
      _key: Math.random().toString(36).slice(2),
      type: 'costo' as ItemType,
      category: 'Food',
      name: r.name,
      quantity: r.quantity,
      unit_price: costByDish[r.name] ?? 0,
      vat_rate: 10,
      notes: costByDish[r.name] ? 'Food cost da distinta base' : 'Inserire costo manualmente',
    }))

    setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...newCosts])
    setCalcingCosts(false)
  }

  function handleRevenueChange(updated: DraftItem[]) {
    setItems((prev) => {
      const currentCosts = prev.filter((i) => i.type === 'costo')
      const syncedCosts = currentCosts.map((c) => {
        const matchingRev = updated.find((r) => r.name === c.name)
        return matchingRev ? { ...c, quantity: matchingRev.quantity } : c
      })
      return [...updated, ...syncedCosts]
    })
  }

  function handleCostChange(updated: DraftItem[]) {
    setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...updated])
  }

  function importCatalog(type: ItemType, catalogItems: CatalogItem[]) {
    const mapped: DraftItem[] = catalogItems.map((it) => ({
      _key: Math.random().toString(36).slice(2),
      type,
      category: it.category,
      name: it.name,
      quantity: 1,
      unit_price: it.unit_price,
      vat_rate: it.vat_rate,
      notes: it.notes,
    }))
    if (type === 'ricavo') {
      setItems((prev) => [...mapped, ...prev.filter((i) => i.type === 'costo')])
    } else {
      setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...mapped])
    }
  }

  async function addScenario() {
    setSavingScenario(true)
    await sb.from('margin_scenarios').insert({
      event_id: id,
      name: `Scenario ${scenarios.length + 1}`,
      discount_pct: 0,
      notes: null,
    })
    setSavingScenario(false)
    fetchAll()
  }

  async function updateScenario(scId: string, field: 'name' | 'discount_pct' | 'notes', value: unknown) {
    await sb.from('margin_scenarios').update({ [field]: value }).eq('id', scId)
    setScenarios((prev) => prev.map((s) => s.id === scId ? { ...s, [field]: value } : s))
  }

  async function deleteScenario(scId: string) {
    await sb.from('margin_scenarios').delete().eq('id', scId)
    setScenarios((prev) => prev.filter((s) => s.id !== scId))
  }

  const scenarioChartData = useMemo(() =>
    scenarios.map((sc) => {
      const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct)
      return { name: sc.name, Ricavi: Math.round(s.totalRevenue), Costi: Math.round(s.totalCosts), Margine: Math.round(s.grossMargin) }
    }),
    [scenarios, items, event]
  )

  function exportPDF() {
    window.open(`/events/${id}/export?format=pdf`, '_blank')
  }

  function exportExcel() {
    window.open(`/events/${id}/export?format=excel`, '_blank')
  }

  function buildMessageText() {
    const date = event?.event_date ? new Date(event.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
    const guests = event?.guests_count ? `${event.guests_count} ospiti` : ''
    const location = event?.location ? `\n📍 ${event.location}` : ''
    const totale = summary.totalRevenue > 0 ? `\n💰 Totale preventivo: ${formatCurrency(summary.totalRevenue)}` : ''
    return `Gentile ${event?.client_name || 'Cliente'},\n\nle confermiamo i dettagli del suo evento:\n\n📅 ${event?.name}\n🗓 ${date}${guests ? ` · ${guests}` : ''}${location}${totale}\n\nSiamo a disposizione per qualsiasi informazione.\n\nCordiali saluti,\nDoppio Malto`
  }

  function sendEmail() {
    setEmailModalOpen(true)
  }

  function sendWhatsApp() {
    const text = encodeURIComponent(buildMessageText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>
  if (!event) return <div className="card text-center text-slate-400 py-16">Evento non trovato</div>

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <Link href="/events" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3">
            <ArrowLeft size={14} /> Lista eventi
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="text-blue-600" size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">{event.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
            {event.client_name && <span>{event.client_name}</span>}
            {event.client_email && <a href={`mailto:${event.client_email}`} className="text-blue-500 hover:underline">· {event.client_email}</a>}
            {event.client_phone && <a href={`tel:${event.client_phone}`} className="hover:underline">· {event.client_phone}</a>}
            {event.event_date && <span>· {event.event_date}</span>}
            {event.location && <span>· {event.location}</span>}
            {event.guests_count && <span>· {event.guests_count} ospiti</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input w-36"
            value={event.status}
            onChange={(e) => updateStatus(e.target.value as EventStatus)}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={sendEmail}
            title="Invia email al cliente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Mail size={15} /> Email
          </button>
          <button
            onClick={sendWhatsApp}
            title="Invia WhatsApp al cliente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-sm font-medium transition-colors"
          >
            <MessageCircle size={15} /> WhatsApp
          </button>
          <MarginBadge pct={summary.marginPct} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-slate-100 w-fit">
            {(['preventivo', 'scenari', 'export', 'note'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                  ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Preventivo */}
          {tab === 'preventivo' && (
            <div className="card">
              <ItemsTable
                type="ricavo"
                items={revenues as DraftItem[]}
                onChange={handleRevenueChange as (items: DraftItem[]) => void}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'ricavo' })}
                onProductSelected={(n, qty) => autoAddCost(n, qty)}
              />
              {/* Auto food cost button */}
              {revenues.some((r) => r.name.trim()) && (
                <div className="mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700">Calcola food cost dalla distinta base</p>
                    <p className="text-[11px] text-blue-500 mt-0.5">Sostituisce i costi attuali con quelli calcolati dagli ingredienti</p>
                  </div>
                  <button
                    type="button"
                    onClick={calcAllFoodCosts}
                    disabled={calcingCosts}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <Zap size={13} />
                    {calcingCosts ? 'Calcolo...' : 'Calcola costi'}
                  </button>
                </div>
              )}
              <ItemsTable
                type="costo"
                items={costs as DraftItem[]}
                onChange={handleCostChange as (items: DraftItem[]) => void}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'costo' })}
              />
              <div className="flex justify-end mt-4">
                <button className="btn-primary" onClick={saveItems}>Salva voci</button>
              </div>
            </div>
          )}

          {/* Tab: Scenari */}
          {tab === 'scenari' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Scenari di prezzo</h2>
                <button className="btn-secondary flex items-center gap-1.5 text-xs py-1.5" onClick={addScenario} disabled={savingScenario}>
                  <Plus size={13} /> Aggiungi scenario
                </button>
              </div>

              {scenarios.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nessuno scenario. Aggiungine uno con il pulsante in alto.</p>
              ) : (
                <>
                  {/* Editable scenario list */}
                  <div className="space-y-2 mb-6">
                    {scenarios.map((sc) => (
                      <div key={sc.id} className="border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <input
                          className="input py-1 text-xs font-medium sm:w-40"
                          value={sc.name}
                          onChange={(e) => updateScenario(sc.id, 'name', e.target.value)}
                          onBlur={(e) => sb.from('margin_scenarios').update({ name: e.target.value }).eq('id', sc.id)}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400 whitespace-nowrap">Sconto</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input py-1 text-xs w-20 text-right"
                            value={sc.discount_pct}
                            onChange={(e) => updateScenario(sc.id, 'discount_pct', parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                        <div className="flex-1">
                          {(() => {
                            const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct)
                            return <MarginBadge pct={s.marginPct} />
                          })()}
                        </div>
                        <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => deleteScenario(sc.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Comparison table */}
                  <div className="overflow-x-auto mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Confronto</h3>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-slate-500">Scenario</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Sconto</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Ricavi</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Costi</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Margine</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {scenarios.map((sc) => {
                          const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct)
                          return (
                            <tr key={sc.id}>
                              <td className="px-3 py-2 font-medium text-slate-700">{sc.name}</td>
                              <td className="px-3 py-2 text-right text-slate-500">{sc.discount_pct}%</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(s.totalRevenue)}</td>
                              <td className="px-3 py-2 text-right text-red-500">{formatCurrency(s.totalCosts)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.grossMargin)}</td>
                              <td className="px-3 py-2 text-right"><MarginBadge pct={s.marginPct} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {scenarioChartData.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenarioChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                          <Legend />
                          <Bar dataKey="Ricavi" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Costi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Margine" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Export */}
          {tab === 'export' && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-6">Esporta preventivo</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-red-300 transition-colors">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Download className="text-red-500" size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">PDF Preventivo</h3>
                  <p className="text-xs text-slate-400 mb-4">Layout professionale con logo DM</p>
                  <button className="btn-primary w-full" onClick={exportPDF}>
                    Scarica PDF
                  </button>
                </div>
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="text-emerald-500" size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">Excel</h3>
                  <p className="text-xs text-slate-400 mb-4">4 fogli con formule native</p>
                  <button className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700" onClick={exportExcel}>
                    Scarica Excel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Note */}
          {tab === 'note' && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Note interne</h2>
              <textarea
                className="input min-h-48"
                placeholder="Note libere sull'evento..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button className="btn-primary" onClick={saveNote} disabled={savingNote}>
                  {savingNote ? 'Salvataggio...' : 'Salva note'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <MarginSummaryPanel summary={summary} guestsCount={event.guests_count ?? undefined} />
        </div>
      </div>

      <CatalogImportModal
        open={catalogModal.open}
        type={catalogModal.type}
        onImport={(items) => importCatalog(catalogModal.type, items)}
        onClose={() => setCatalogModal((p) => ({ ...p, open: false }))}
      />

      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        eventName={event.name}
        clientName={event.client_name ?? null}
        clientEmail={event.client_email ?? null}
        eventDate={event.event_date ?? null}
        location={event.location ?? null}
        guestsCount={event.guests_count ?? null}
        totalRevenue={summary.totalRevenue}
        menuItems={revenues.map((r) => r.name).filter(Boolean)}
      />
    </div>
  )
}

export default function EventDetailPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <EventDetailPageInner />
}
