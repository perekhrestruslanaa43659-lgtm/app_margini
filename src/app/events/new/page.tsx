'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem, CatalogItem, ItemType } from '@/lib/supabase/types'
import { computeMargin } from '@/lib/margin'
import { ItemsTable } from '@/components/events/ItemsTable'
import { MarginSummaryPanel } from '@/components/events/MarginSummaryPanel'
import { CatalogImportModal } from '@/components/events/CatalogImportModal'
import { SetupBanner } from '@/components/ui/SetupBanner'

interface DraftItem extends Omit<EventItem, 'id' | 'event_id'> {
  _key: string
}

interface ScenarioDraft {
  name: string
  discount_pct: number
  notes: string
}

const STEPS = ['Info base', 'Voci evento', 'Scenari', 'Riepilogo']

function newDraftItem(type: ItemType): DraftItem {
  return {
    _key: Math.random().toString(36).slice(2),
    type,
    category: null,
    name: '',
    quantity: 1,
    unit_price: 0,
    vat_rate: 22,
    notes: null,
  }
}

function NewEventPageInner() {
  const router = useRouter()
  const supabase = createClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [savedEventId, setSavedEventId] = useState<string | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [guestsCount, setGuestsCount] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const [revenues, setRevenues] = useState<DraftItem[]>([newDraftItem('ricavo')])
  const [costs, setCosts] = useState<DraftItem[]>([newDraftItem('costo')])
  const [catalogModal, setCatalogModal] = useState<{ open: boolean; type: ItemType }>({ open: false, type: 'ricavo' })

  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
    { name: 'Base', discount_pct: 0, notes: '' },
  ])

  const allItems = useMemo(() => [...revenues, ...costs], [revenues, costs])
  const summary = useMemo(
    () => computeMargin(allItems as unknown as EventItem[], Number(guestsCount) || 1),
    [allItems, guestsCount]
  )

  async function persistDraft(eventIdOverride?: string): Promise<string | null> {
    const targetId = eventIdOverride ?? savedEventId
    const eventPayload = {
      name: name.trim() || 'Bozza',
      client_name: clientName || null,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      event_date: eventDate || null,
      location: location || null,
      guests_count: guestsCount !== '' ? Number(guestsCount) : null,
      status: 'bozza' as const,
      notes: notes || null,
    }

    try {
      let evId = targetId

      if (!evId) {
        const { data: ev, error } = await supabase
          .from('events')
          .insert(eventPayload)
          .select()
          .single()
        if (error || !ev) throw error
        evId = (ev as Event).id
        setSavedEventId(evId)
      } else {
        await supabase.from('events').update(eventPayload).eq('id', evId)
      }

      const validItems = allItems.filter((it) => it.name.trim())
      await supabase.from('event_items').delete().eq('event_id', evId)
      if (validItems.length > 0) {
        await supabase.from('event_items').insert(
          validItems.map((it) => ({
            event_id: evId,
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

      return evId
    } catch (err) {
      console.error('persistDraft error', err)
      return null
    }
  }

  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      if (!savedEventId) return
      setAutoSaving(true)
      await persistDraft()
      setAutoSaving(false)
    }, 1500)
  }

  async function goNext() {
    if (step === 0) {
      if (!name.trim()) { alert('Il nome evento è obbligatorio'); return }
      setSaving(true)
      await persistDraft()
      setSaving(false)
    }
    setStep((s) => s + 1)
  }

  async function autoAddCost(dishName: string, quantity: number) {
    const { data: recipeLines } = await supabase
      .from('recipe_items')
      .select('quantity, ingredient:ingredients(cost_per_unit)')
      .eq('dish_name', dishName)

    const foodCost = recipeLines && recipeLines.length > 0
      ? recipeLines.reduce((sum: number, r: { quantity: number; ingredient: { cost_per_unit: number } | null }) =>
          sum + r.quantity * (r.ingredient?.cost_per_unit ?? 0), 0)
      : 0

    setCosts((prev) => {
      const existing = prev.find((c) => c.name === dishName)
      if (existing) {
        return prev.map((c) => c.name === dishName
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
      const filtered = prev.filter((c) => c.name.trim() !== '')
      return [...filtered, newCost]
    })
  }

  function importCatalog(type: ItemType, items: CatalogItem[]) {
    const mapped: DraftItem[] = items.map((it) => ({
      _key: Math.random().toString(36).slice(2),
      type,
      category: it.category,
      name: it.name,
      quantity: 1,
      unit_price: it.unit_price,
      vat_rate: it.vat_rate,
      notes: it.notes,
    }))
    if (type === 'ricavo') setRevenues((p) => [...p, ...mapped])
    else setCosts((p) => [...p, ...mapped])
  }

  function addScenario() {
    setScenarios((p) => [...p, { name: `Scenario ${p.length + 1}`, discount_pct: 0, notes: '' }])
  }

  function updateScenario(i: number, field: keyof ScenarioDraft, value: unknown) {
    setScenarios((p) => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function removeScenario(i: number) {
    if (i === 0) return
    setScenarios((p) => p.filter((_, idx) => idx !== i))
  }

  async function save(status: 'bozza' | 'confermato') {
    setSaving(true)
    try {
      const evId = await persistDraft()
      if (!evId) throw new Error('Salvataggio fallito')

      if (status === 'confermato') {
        await supabase.from('events').update({ status: 'confermato' }).eq('id', evId)
      }

      // Scenari: elimina e reinserisce
      await supabase.from('margin_scenarios').delete().eq('event_id', evId)
      for (const sc of scenarios) {
        await supabase.from('margin_scenarios').insert({
          event_id: evId,
          name: sc.name,
          discount_pct: sc.discount_pct,
          notes: sc.notes || null,
        })
      }

      router.push(`/events/${evId}`)
    } catch (err) {
      console.error(err)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const canNext = step === 0 ? name.trim().length > 0 : true

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Nuovo Evento</h1>
          {autoSaving && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Save size={12} className="animate-pulse" /> Salvataggio automatico...
            </span>
          )}
          {savedEventId && !autoSaving && (
            <span className="text-xs text-emerald-500">✓ Bozza salvata</span>
          )}
        </div>
        {/* Steps */}
        <div className="flex items-center gap-2 mt-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                  ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700 cursor-pointer' : 'bg-slate-100 text-slate-400'}`}
              >
                {i < step ? <Check size={12} /> : null}
                {label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2">
          {/* STEP 0 – Info base */}
          {step === 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Informazioni evento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nome evento *</label>
                  <input className="input" placeholder="es. Cena aziendale Acme Srl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <input className="input" placeholder="Nome e cognome cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Data evento</label>
                  <input type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email cliente</label>
                  <input type="email" className="input" placeholder="cliente@email.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefono cliente</label>
                  <input type="tel" className="input" placeholder="+39 333 000 0000" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="Sede / indirizzo" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="label">N° ospiti</label>
                  <input type="number" min="0" className="input" placeholder="0" value={guestsCount} onChange={(e) => setGuestsCount(e.target.value ? parseInt(e.target.value) : '')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Note</label>
                  <textarea className="input" rows={3} placeholder="Note interne..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 – Voci */}
          {step === 1 && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Voci dell&apos;evento</h2>
              <ItemsTable
                type="ricavo"
                items={revenues}
                onChange={(updated) => {
                  setRevenues(updated)
                  updated.forEach((r) => {
                    if (!r.name.trim()) return
                    setCosts((prev) => prev.map((c) =>
                      c.name === r.name ? { ...c, quantity: r.quantity } : c
                    ))
                  })
                  scheduleAutoSave()
                }}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'ricavo' })}
                onProductSelected={(n, qty) => autoAddCost(n, qty)}
              />
              <ItemsTable
                type="costo"
                items={costs}
                onChange={(updated) => { setCosts(updated); scheduleAutoSave() }}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'costo' })}
              />
            </div>
          )}

          {/* STEP 2 – Scenari */}
          {step === 2 && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Scenari di prezzo</h2>
              <div className="space-y-3">
                {scenarios.map((sc, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Nome scenario</label>
                        <input className="input" value={sc.name} onChange={(e) => updateScenario(i, 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Sconto globale %</label>
                        <input type="number" min="0" max="100" className="input" value={sc.discount_pct} onChange={(e) => updateScenario(i, 'discount_pct', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="label">Note</label>
                        <input className="input" value={sc.notes} onChange={(e) => updateScenario(i, 'notes', e.target.value)} />
                      </div>
                    </div>
                    {i > 0 && (
                      <button className="mt-2 text-xs text-red-400 hover:text-red-600" onClick={() => removeScenario(i)}>
                        Rimuovi scenario
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn-secondary mt-3 text-xs" onClick={addScenario}>+ Aggiungi scenario</button>

              {scenarios.length > 1 && (
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Confronto scenari</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Scenario</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-500">Ricavi</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-500">Costi</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-500">Margine</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-500">Margine %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scenarios.map((sc, i) => {
                        const s = computeMargin(allItems as unknown as EventItem[], Number(guestsCount) || 1, sc.discount_pct)
                        return (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-slate-700">{sc.name}</td>
                            <td className="px-3 py-2 text-right text-emerald-600">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.totalRevenue)}</td>
                            <td className="px-3 py-2 text-right text-red-500">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.totalCosts)}</td>
                            <td className="px-3 py-2 text-right font-medium">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.grossMargin)}</td>
                            <td className="px-3 py-2 text-right font-bold">{s.marginPct.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 – Riepilogo */}
          {step === 3 && (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">Riepilogo preventivo</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-slate-400">Evento: </span><span className="font-medium">{name}</span></div>
                <div><span className="text-slate-400">Cliente: </span><span className="font-medium">{clientName || '—'}</span></div>
                <div><span className="text-slate-400">Data: </span><span className="font-medium">{eventDate || '—'}</span></div>
                <div><span className="text-slate-400">Location: </span><span className="font-medium">{location || '—'}</span></div>
                <div><span className="text-slate-400">Ospiti: </span><span className="font-medium">{guestsCount || '—'}</span></div>
                <div><span className="text-slate-400">Scenari: </span><span className="font-medium">{scenarios.length}</span></div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 mb-2">Voci: {allItems.filter(i => i.name.trim()).length} voci inserite</p>
                <p className="text-xs text-slate-400">{revenues.filter(i => i.name.trim()).length} ricavi · {costs.filter(i => i.name.trim()).length} costi</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => save('bozza')} disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Salva come bozza'}
                </button>
                <button className="btn-primary flex-1" onClick={() => save('confermato')} disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Conferma evento'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between mt-4">
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ChevronLeft size={16} /> Indietro
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={goNext}
                disabled={!canNext || saving}
              >
                {saving ? 'Salvataggio...' : <><span>Avanti</span> <ChevronRight size={16} /></>}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar margin live */}
        <div className="space-y-4">
          <MarginSummaryPanel summary={summary} guestsCount={Number(guestsCount) || undefined} />
        </div>
      </div>

      {/* Catalog import modal */}
      <CatalogImportModal
        open={catalogModal.open}
        type={catalogModal.type}
        onImport={(items) => importCatalog(catalogModal.type, items)}
        onClose={() => setCatalogModal((p) => ({ ...p, open: false }))}
      />
    </div>
  )
}

export default function NewEventPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <NewEventPageInner />
}
