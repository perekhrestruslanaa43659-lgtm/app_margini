'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, Plus, Trash2, Mail, MessageCircle, CalendarDays, Zap, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem, MarginScenario, ScenarioOverride, EventStatus, CatalogItem, ItemType, Room } from '@/lib/supabase/types'
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

const STATUS_OPTIONS: EventStatus[] = ['richiesta', 'bozza', 'confermato', 'concluso', 'annullato']

const MISSING_FIELDS: { key: keyof Event | '__items'; label: string; type: 'text' | 'email' | 'tel' | 'date' | 'number' }[] = [
  { key: 'client_name', label: 'Nome cliente', type: 'text' },
  { key: 'client_email', label: 'Email cliente', type: 'email' },
  { key: 'event_date', label: 'Data evento', type: 'date' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'guests_count', label: 'Numero ospiti', type: 'number' },
]

function EventDetailPageInner() {
  const { id } = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any
  const [tab, setTab] = useState<Tab>('preventivo')
  const [event, setEvent] = useState<Event | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [scenarios, setScenarios] = useState<MarginScenario[]>([])
  const [overrides, setOverrides] = useState<ScenarioOverride[]>([])
  const [editingScenario, setEditingScenario] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogModal, setCatalogModal] = useState<{ open: boolean; type: ItemType }>({ open: false, type: 'ricavo' })
  const [savingScenario, setSavingScenario] = useState(false)
  const [calcingCosts, setCalcingCosts] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [missingDraft, setMissingDraft] = useState<Record<string, string>>({})
  const [savingMissing, setSavingMissing] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [{ data: ev }, { data: it }, { data: sc }, { data: rm }] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('event_items').select('*').eq('event_id', id),
      sb.from('margin_scenarios').select('*').eq('event_id', id),
      sb.from('rooms').select('*').order('name'),
    ])
    const evTyped = ev as unknown as Event | null
    const itTyped = (it ?? []) as unknown as EventItem[]
    const scTyped = (sc ?? []) as unknown as MarginScenario[]
    const rmTyped = (rm ?? []) as unknown as Room[]
    if (evTyped) { setEvent(evTyped); setNoteText(evTyped.notes ?? '') }
    setItems(itTyped.map((i) => ({ ...i, _key: i.id })))
    setScenarios(scTyped)
    setRooms(rmTyped)

    if (scTyped.length > 0) {
      const { data: ov } = await sb
        .from('scenario_overrides')
        .select('*')
        .in('scenario_id', scTyped.map((s) => s.id))
      setOverrides((ov ?? []) as unknown as ScenarioOverride[])
    } else {
      setOverrides([])
    }

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

  const missingFields = useMemo(() => {
    if (!event) return []
    const fields = MISSING_FIELDS.filter(({ key }) => {
      if (key === '__items') return false
      const v = event[key]
      return v === null || v === undefined || v === ''
    })
    if (revenues.filter((r) => r.name.trim()).length === 0) {
      fields.push({ key: '__items', label: 'Voci di preventivo (nessuna inserita)', type: 'text' })
    }
    return fields
  }, [event, revenues])

  const availableRooms = useMemo(() => {
    if (!event?.location) return rooms
    const loc = event.location.trim().toLowerCase()
    if (!loc) return rooms
    const matches = rooms.filter((r) => {
      const rLoc = (r.location ?? '').trim().toLowerCase()
      return rLoc && (rLoc.includes(loc) || loc.includes(rLoc))
    })
    return matches.length > 0 ? matches : rooms
  }, [rooms, event])

  async function saveMissingField(key: keyof Event, type: string) {
    const raw = missingDraft[key]
    if (!raw) return
    setSavingMissing(true)
    const value = type === 'number' ? Number(raw) : raw
    await sb.from('events').update({ [key]: value }).eq('id', id)
    setEvent((e) => e ? { ...e, [key]: value } : e)
    setMissingDraft((d) => { const next = { ...d }; delete next[key]; return next })
    setSavingMissing(false)
  }

  async function updateStatus(status: EventStatus) {
    await sb.from('events').update({ status }).eq('id', id)
    setEvent((e) => e ? { ...e, status } : e)
  }

  async function updateDepositDate(value: string) {
    const depositDate = value || null
    await sb.from('events').update({ deposit_date: depositDate }).eq('id', id)
    setEvent((e) => e ? { ...e, deposit_date: depositDate } : e)
  }

  async function updateRoom(value: string) {
    const roomId = value || null
    await sb.from('events').update({ room_id: roomId }).eq('id', id)
    setEvent((e) => e ? { ...e, room_id: roomId } : e)
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
    setOverrides((prev) => prev.filter((o) => o.scenario_id !== scId))
  }

  function overridesFor(scId: string) {
    return overrides.filter((o) => o.scenario_id === scId)
  }

  async function setItemOverride(scId: string, itemId: string, field: 'quantity_override' | 'unit_price_override', raw: string) {
    const value = raw === '' ? null : parseFloat(raw)
    const existing = overrides.find((o) => o.scenario_id === scId && o.item_id === itemId)

    if (existing) {
      const otherField = field === 'quantity_override' ? 'unit_price_override' : 'quantity_override'
      if (value === null && existing[otherField] === null) {
        await sb.from('scenario_overrides').delete().eq('id', existing.id)
        setOverrides((prev) => prev.filter((o) => o.id !== existing.id))
        return
      }
      await sb.from('scenario_overrides').update({ [field]: value }).eq('id', existing.id)
      setOverrides((prev) => prev.map((o) => o.id === existing.id ? { ...o, [field]: value } : o))
      return
    }

    if (value === null) return
    const { data } = await sb
      .from('scenario_overrides')
      .insert({ scenario_id: scId, item_id: itemId, quantity_override: null, unit_price_override: null, [field]: value })
      .select()
      .single()
    if (data) setOverrides((prev) => [...prev, data as unknown as ScenarioOverride])
  }

  async function clearItemOverride(scId: string, itemId: string) {
    const existing = overrides.find((o) => o.scenario_id === scId && o.item_id === itemId)
    if (!existing) return
    await sb.from('scenario_overrides').delete().eq('id', existing.id)
    setOverrides((prev) => prev.filter((o) => o.id !== existing.id))
  }

  const scenarioChartData = useMemo(() =>
    scenarios.map((sc) => {
      const scOverrides = overrides.filter((o) => o.scenario_id === sc.id)
      const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, scOverrides)
      return { name: sc.name, Ricavi: Math.round(s.totalRevenue), Costi: Math.round(s.totalCosts), Margine: Math.round(s.grossMargin) }
    }),
    [scenarios, items, event, overrides]
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
            <div className="w-10 h-10 bg-dm-wood/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="text-dm-wood" size={18} />
            </div>
            <h1 className="text-xl font-bold text-dm-ink">{event.name}</h1>
            {missingFields.length > 0 && (
              <button
                type="button"
                onClick={() => setTab('export')}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-full transition-colors"
                title="Ci sono dati mancanti nel preventivo"
              >
                <AlertTriangle size={12} /> {missingFields.length} dati mancanti
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
            {event.client_name && <span>{event.client_name}</span>}
            {event.client_email && <a href={`mailto:${event.client_email}`} className="text-dm-maroon hover:underline">· {event.client_email}</a>}
            {event.client_phone && <a href={`tel:${event.client_phone}`} className="hover:underline">· {event.client_phone}</a>}
            {event.event_date && <span>· {event.event_date}</span>}
            {event.location && <span>· {event.location}</span>}
            {event.guests_count && <span>· {event.guests_count} ospiti</span>}
            {(event.budget_min || event.budget_max) && (
              <span>· Budget {event.budget_min ? formatCurrency(event.budget_min) : '—'} – {event.budget_max ? formatCurrency(event.budget_max) : '—'}</span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-4 mt-3">
            <div>
              <label className="label">Data acconto</label>
              <input
                type="date"
                className="input py-1.5 text-sm w-40"
                value={event.deposit_date ?? ''}
                onChange={(e) => updateDepositDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Saletta / tavolo</label>
              {availableRooms.length > 0 ? (
                <select
                  className="input py-1.5 text-sm w-48"
                  value={event.room_id ?? ''}
                  onChange={(e) => updateRoom(e.target.value)}
                >
                  <option value="">Nessuna</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.location ? ` (${r.location})` : ''}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400">
                  Nessuna saletta configurata. <Link href="/settings" className="text-dm-maroon hover:underline">Aggiungila in Impostazioni</Link>
                </p>
              )}
            </div>
          </div>
          {(event.allergies || event.special_requests) && (
            <div className="flex flex-col gap-1 mt-2 text-sm">
              {event.allergies && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block w-fit">
                  ⚠ Allergie: {event.allergies}
                </p>
              )}
              {event.special_requests && (
                <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 inline-block w-fit">
                  📝 Richieste particolari: {event.special_requests}
                </p>
              )}
            </div>
          )}
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-dm-wood/10 hover:border-dm-wood hover:text-dm-wood text-sm font-medium transition-colors"
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
                  ${tab === t ? 'bg-dm-yellow text-dm-ink' : 'text-slate-500 hover:text-dm-ink'}`}
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
                <div className="mb-3 flex items-center gap-3 bg-dm-wood/10 border border-dm-wood/30 rounded-xl px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-dm-wood">Calcola food cost dalla distinta base</p>
                    <p className="text-[11px] text-dm-wood/80 mt-0.5">Sostituisce i costi attuali con quelli calcolati dagli ingredienti</p>
                  </div>
                  <button
                    type="button"
                    onClick={calcAllFoodCosts}
                    disabled={calcingCosts}
                    className="flex items-center gap-1.5 bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink font-display font-semibold uppercase tracking-wide text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
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
                <h2 className="font-semibold text-dm-ink/80">Scenari di prezzo</h2>
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
                    {scenarios.map((sc) => {
                      const scOverrides = overridesFor(sc.id)
                      const isEditing = editingScenario === sc.id
                      return (
                        <div key={sc.id} className="border border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
                            <button
                              type="button"
                              onClick={() => setEditingScenario(isEditing ? null : sc.id)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap
                                ${isEditing ? 'bg-dm-yellow text-dm-ink' : 'bg-dm-cream text-dm-ink/70 hover:bg-dm-yellow/40'}`}
                            >
                              {scOverrides.length > 0 ? `Voci modificate (${scOverrides.length})` : 'Modifica voci'}
                            </button>
                            <div className="flex-1">
                              {(() => {
                                const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, scOverrides)
                                return <MarginBadge pct={s.marginPct} />
                              })()}
                            </div>
                            <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => deleteScenario(sc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {isEditing && (
                            <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-1.5">
                              <p className="text-[11px] text-slate-400 mb-2">
                                Modifica quantità o prezzo solo per questo scenario. Le voci originali del preventivo non vengono toccate.
                              </p>
                              {items.filter((it) => it.name.trim() && it.id).map((it) => {
                                const ov = scOverrides.find((o) => o.item_id === it.id)
                                const hasOverride = !!ov && (ov.quantity_override !== null || ov.unit_price_override !== null)
                                return (
                                  <div key={it._key} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${hasOverride ? 'bg-dm-yellow/15 border border-dm-yellow/40' : 'bg-white border border-slate-100'}`}>
                                    <span className={`text-xs flex-1 truncate ${it.type === 'ricavo' ? 'text-emerald-700' : 'text-red-500'}`}>{it.name}</span>
                                    <input
                                      type="number"
                                      step="any"
                                      className="input py-1 text-xs w-20 text-right"
                                      placeholder={String(it.quantity)}
                                      value={ov?.quantity_override ?? ''}
                                      onChange={(e) => setItemOverride(sc.id, it.id!, 'quantity_override', e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-300">×</span>
                                    <input
                                      type="number"
                                      step="any"
                                      className="input py-1 text-xs w-24 text-right"
                                      placeholder={String(it.unit_price)}
                                      value={ov?.unit_price_override ?? ''}
                                      onChange={(e) => setItemOverride(sc.id, it.id!, 'unit_price_override', e.target.value)}
                                    />
                                    {hasOverride && (
                                      <button
                                        type="button"
                                        onClick={() => clearItemOverride(sc.id, it.id!)}
                                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                        title="Ripristina valore originale"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                              {items.filter((it) => it.name.trim() && it.id).length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-3">Salva prima le voci di preventivo per poterle modificare qui.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
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
                          const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, overridesFor(sc.id))
                          return (
                            <tr key={sc.id}>
                              <td className="px-3 py-2 font-medium text-dm-ink/80">{sc.name}</td>
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
              <h2 className="font-semibold text-dm-ink/80 mb-6">Esporta preventivo</h2>

              {missingFields.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Dati mancanti nel preventivo</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Alcune informazioni non sono state compilate. Il PDF verrà comunque generato, ma è consigliato completarle prima dell&apos;invio al cliente.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {missingFields.map(({ key, label, type }) => (
                      key === '__items' ? (
                        <div key={key} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-amber-200">
                          <span className="text-xs text-amber-800">{label}</span>
                          <button
                            type="button"
                            className="text-xs font-medium text-dm-maroon hover:underline shrink-0"
                            onClick={() => setTab('preventivo')}
                          >
                            Vai al preventivo →
                          </button>
                        </div>
                      ) : (
                        <div key={key} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-200">
                          <span className="text-xs text-amber-800 w-32 shrink-0">{label}</span>
                          <input
                            type={type}
                            className="flex-1 text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder={label}
                            value={missingDraft[key] ?? ''}
                            onChange={(e) => setMissingDraft((d) => ({ ...d, [key]: e.target.value }))}
                          />
                          <button
                            type="button"
                            disabled={!missingDraft[key] || savingMissing}
                            onClick={() => saveMissingField(key, type)}
                            className="text-xs font-medium bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                          >
                            Salva
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-dm-maroon/40 transition-colors">
                  <div className="w-12 h-12 bg-dm-maroon/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Download className="text-dm-maroon" size={24} />
                  </div>
                  <h3 className="font-semibold text-dm-ink/80 mb-1">PDF Preventivo</h3>
                  <p className="text-xs text-slate-400 mb-4">Layout professionale con logo DM</p>
                  <button className="btn-primary w-full" onClick={exportPDF}>
                    Scarica PDF
                  </button>
                </div>
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="text-emerald-500" size={24} />
                  </div>
                  <h3 className="font-semibold text-dm-ink/80 mb-1">Excel</h3>
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
              <h2 className="font-semibold text-dm-ink/80 mb-4">Note interne</h2>
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
