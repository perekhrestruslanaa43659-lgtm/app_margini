'use client'

// Editor di sezioni/fasce/piatti riusato sia da /proposte (bozza in sessionStorage,
// nessun evento associato) sia dal tab "Menu" della scheda evento (salvataggio diretto
// su events.menu_sections). Riceve `sections`/`onChange` come props invece di gestire
// uno useState interno, cosi' il chiamante decide dove/quando persistere.
import { useMemo, useState } from 'react'
import { Plus, Trash2, Search, GripVertical, X } from 'lucide-react'
import type { CatalogItem } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'
import {
  planPrice, groupPrice, dishesBySubcategory, itemEffectivePrice, itemSharedAmong,
  type MealSection, type PricePlan, type PlanGroup,
} from '@/lib/proposalHtml'

export const MEAL_PRESETS = [
  { label: 'Pranzo', hours: '12:00 – 15:00' },
  { label: 'Cena', hours: '19:30 – 23:00' },
  { label: 'Aperitivo', hours: '18:00 – 22:00' },
]

const STANDARD_NOTES = [
  'Acqua inclusa',
  'Una consumazione a persona',
  'Da condividere ogni 3 persone',
  'Consumazioni aggiuntive escluse',
  'Bevanda a scelta',
]

const ACCENTS: MealSection['accent'][] = ['green', 'coral', 'yellow']

let uid = 0
function nextId() {
  uid += 1
  return `id${Date.now()}${uid}`
}

function emptyGroup(): PlanGroup {
  return { id: nextId(), label: 'Da condividere', tag: '', pricingMode: 'fisso', items: [] }
}

function emptyPlan(): PricePlan {
  return { id: nextId(), name: '', price: '', pricingMode: 'calcolato', note: '', groups: [emptyGroup()] }
}

export function emptySection(preset: { label: string; hours: string }, accent: 'coral' | 'green' | 'yellow'): MealSection {
  return {
    id: nextId(),
    label: preset.label,
    hours: preset.hours,
    meta: '',
    accent,
    plans: [emptyPlan(), emptyPlan(), emptyPlan()],
    extras: [],
    room: '',
    duration: '',
    extraHour: '',
    formula: '',
  }
}

export function nextAccent(sections: MealSection[]): MealSection['accent'] {
  const used = sections.map((s) => s.accent)
  return ACCENTS.find((a) => !used.includes(a)) ?? ACCENTS[sections.length % ACCENTS.length]
}

interface Props {
  sections: MealSection[]
  onChange: (updater: (prev: MealSection[]) => MealSection[]) => void
  catalog: CatalogItem[]
  /** Slot opzionale renderizzato dentro ogni card sezione, sotto l'header e prima dei servizi
   *  aggiuntivi — usato dal tab Menu evento per mostrare il margine calcolato della sezione. */
  renderSectionExtra?: (section: MealSection) => React.ReactNode
}

export function SectionsEditor({ sections, onChange, catalog, renderSectionExtra }: Props) {
  const [pickerFor, setPickerFor] = useState<{ sectionId: string; planId: string; groupId: string } | null>(null)
  const [extraPickerFor, setExtraPickerFor] = useState<string | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('')

  const [mergeModeFor, setMergeModeFor] = useState<{ sectionId: string; planId: string } | null>(null)
  const [mergeSelection, setMergeSelection] = useState<string[]>([])
  const [mergeNewLabel, setMergeNewLabel] = useState('')

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((c) => c.category ?? '').filter(Boolean))).sort(),
    [catalog]
  )

  const pickerResults = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim()
    return catalog.filter((it) => {
      if (pickerCategory && it.category !== pickerCategory) return false
      if (q && !it.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [catalog, pickerSearch, pickerCategory])

  function addSection() {
    const preset = MEAL_PRESETS[sections.length % MEAL_PRESETS.length]
    onChange((prev) => [...prev, emptySection(preset, nextAccent(prev))])
  }

  function removeSection(id: string) {
    onChange((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSection(id: string, patch: Partial<MealSection>) {
    onChange((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function updatePlan(sectionId: string, planId: string, patch: Partial<PricePlan>) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return { ...s, plans: s.plans.map((p) => (p.id === planId ? { ...p, ...patch } : p)) }
    }))
  }

  function addPlan(sectionId: string) {
    onChange((prev) => prev.map((s) => (s.id === sectionId ? { ...s, plans: [...s.plans, emptyPlan()] } : s)))
  }

  function removePlan(sectionId: string, planId: string) {
    onChange((prev) => prev.map((s) => (s.id === sectionId ? { ...s, plans: s.plans.filter((p) => p.id !== planId) } : s)))
  }

  function updateGroup(sectionId: string, planId: string, groupId: string, patch: Partial<PlanGroup>) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          return { ...p, groups: p.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }
        }),
      }
    }))
  }

  function addGroup(sectionId: string, planId: string) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return { ...s, plans: s.plans.map((p) => (p.id === planId ? { ...p, groups: [...p.groups, emptyGroup()] } : p)) }
    }))
  }

  function removeGroup(sectionId: string, planId: string, groupId: string) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return { ...s, plans: s.plans.map((p) => (p.id === planId ? { ...p, groups: p.groups.filter((g) => g.id !== groupId) } : p)) }
    }))
  }

  /** Fonde piu' gruppi in uno solo: i piatti restano distinguibili tramite subgroup (nome del gruppo di origine), la media si calcola su tutti insieme. */
  function mergeGroups(sectionId: string, planId: string, groupIds: string[], newLabel: string) {
    if (groupIds.length < 2) return
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          const toMerge = p.groups.filter((g) => groupIds.includes(g.id))
          const rest = p.groups.filter((g) => !groupIds.includes(g.id))
          const mergedItems = toMerge.flatMap((g) =>
            g.items.map((it) => ({ ...it, subgroup: it.subgroup || g.label }))
          )
          const merged: PlanGroup = {
            id: nextId(),
            label: newLabel || toMerge.map((g) => g.label).join(' / '),
            tag: '',
            pricingMode: 'media',
            defaultSharedAmong: toMerge.find((g) => g.defaultSharedAmong)?.defaultSharedAmong,
            items: mergedItems,
          }
          return { ...p, groups: [...rest, merged] }
        }),
      }
    }))
  }

  function removeDishFromGroup(sectionId: string, planId: string, groupId: string, dishId: string) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          return {
            ...p,
            groups: p.groups.map((g) => (g.id === groupId ? { ...g, items: g.items.filter((it) => it.catalogId !== dishId) } : g)),
          }
        }),
      }
    }))
  }

  function updateDishSharing(sectionId: string, planId: string, groupId: string, catalogId: string, sharedAmong: number | undefined) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          return {
            ...p,
            groups: p.groups.map((g) => {
              if (g.id !== groupId) return g
              return { ...g, items: g.items.map((it) => (it.catalogId === catalogId ? { ...it, sharedAmong } : it)) }
            }),
          }
        }),
      }
    }))
  }

  function updateDishSubgroup(sectionId: string, planId: string, groupId: string, catalogId: string, subgroup: string | undefined) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          return {
            ...p,
            groups: p.groups.map((g) => {
              if (g.id !== groupId) return g
              return { ...g, items: g.items.map((it) => (it.catalogId === catalogId ? { ...it, subgroup } : it)) }
            }),
          }
        }),
      }
    }))
  }

  function addDishToPicker(item: CatalogItem) {
    if (!pickerFor) return
    const { sectionId, planId, groupId } = pickerFor
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          return {
            ...p,
            groups: p.groups.map((g) => {
              if (g.id !== groupId) return g
              if (g.items.some((it) => it.catalogId === item.id)) return g
              return { ...g, items: [...g.items, { catalogId: item.id, name: item.name, desc: '', price: item.unit_price, category: item.category ?? '' }] }
            }),
          }
        }),
      }
    }))
  }

  function addExtra(item: CatalogItem) {
    if (!extraPickerFor) return
    onChange((prev) => prev.map((s) => {
      if (s.id !== extraPickerFor) return s
      if (s.extras.some((ex) => ex.catalogId === item.id)) return s
      return { ...s, extras: [...s.extras, { catalogId: item.id, name: item.name, price: item.unit_price, unit: 'fisso' }] }
    }))
  }

  function updateExtra(sectionId: string, catalogId: string, patch: Partial<{ unit: 'fisso' | 'a_persona' }>) {
    onChange((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      return { ...s, extras: s.extras.map((ex) => (ex.catalogId === catalogId ? { ...ex, ...patch } : ex)) }
    }))
  }

  function removeExtra(sectionId: string, catalogId: string) {
    onChange((prev) => prev.map((s) => (s.id === sectionId ? { ...s, extras: s.extras.filter((ex) => ex.catalogId !== catalogId) } : s)))
  }

  return (
    <div>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <select
                className="input sm:w-48"
                value={section.label}
                onChange={(e) => {
                  const preset = MEAL_PRESETS.find((p) => p.label === e.target.value)
                  updateSection(section.id, { label: e.target.value, hours: preset?.hours ?? section.hours })
                }}
              >
                {MEAL_PRESETS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                <option value="Altro">Altro</option>
              </select>
              <input
                className="input sm:w-44"
                placeholder="Orario (es. 12:00–15:00)"
                value={section.hours}
                onChange={(e) => updateSection(section.id, { hours: e.target.value })}
              />
              <input
                className="input flex-1"
                placeholder="Descrizione breve del momento"
                value={section.meta}
                onChange={(e) => updateSection(section.id, { meta: e.target.value })}
              />
              <select
                className="input sm:w-32"
                value={section.accent}
                onChange={(e) => updateSection(section.id, { accent: e.target.value as MealSection['accent'] })}
              >
                <option value="green">Verde</option>
                <option value="coral">Corallo</option>
                <option value="yellow">Giallo</option>
              </select>
              <button className="text-slate-300 hover:text-red-500 transition-colors shrink-0" onClick={() => removeSection(section.id)}>
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input className="input" placeholder="Sala (es. Sala Verde)" value={section.room} onChange={(e) => updateSection(section.id, { room: e.target.value })} />
              <input className="input" placeholder="Permanenza (es. 2 ore)" value={section.duration} onChange={(e) => updateSection(section.id, { duration: e.target.value })} />
              <input className="input" placeholder="Ora extra (es. 150€/ora)" value={section.extraHour} onChange={(e) => updateSection(section.id, { extraHour: e.target.value })} />
            </div>

            {renderSectionExtra?.(section)}

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Servizi aggiuntivi</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {section.extras.map((ex) => (
                  <span key={ex.catalogId} className="inline-flex items-center gap-1.5 bg-dm-cream border border-dm-yellow/40 rounded-full pl-3 pr-1.5 py-1 text-xs">
                    {ex.name} · {formatCurrency(ex.price)}
                    <select
                      className="bg-transparent text-[11px] text-slate-500 border-0 focus:ring-0 py-0"
                      value={ex.unit}
                      onChange={(e) => updateExtra(section.id, ex.catalogId, { unit: e.target.value as 'fisso' | 'a_persona' })}
                    >
                      <option value="fisso">fisso</option>
                      <option value="a_persona">a persona</option>
                    </select>
                    <button className="text-slate-400 hover:text-red-500" onClick={() => removeExtra(section.id, ex.catalogId)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                className="text-xs text-dm-maroon hover:bg-dm-maroon/5 rounded-md px-2 py-1 border border-dashed border-dm-maroon/30 inline-flex items-center gap-1"
                onClick={() => { setExtraPickerFor(section.id); setPickerSearch(''); setPickerCategory('') }}
              >
                <Plus size={12} /> Aggiungi servizio dal catalogo
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {section.plans.map((plan) => (
                <div key={plan.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      className="input py-1.5 text-sm flex-1"
                      placeholder="Nome fascia (es. Il Classico)"
                      value={plan.name}
                      onChange={(e) => updatePlan(section.id, plan.id, { name: e.target.value })}
                    />
                    {section.plans.length > 1 && (
                      <button className="text-slate-300 hover:text-red-500 shrink-0" onClick={() => removePlan(section.id, plan.id)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                      <button
                        className={`px-2.5 py-1.5 ${plan.pricingMode === 'calcolato' ? 'bg-dm-yellow text-dm-ink font-medium' : 'bg-white text-slate-500'}`}
                        onClick={() => updatePlan(section.id, plan.id, { pricingMode: 'calcolato' })}
                      >
                        Su misura
                      </button>
                      <button
                        className={`px-2.5 py-1.5 ${plan.pricingMode === 'fisso' ? 'bg-dm-yellow text-dm-ink font-medium' : 'bg-white text-slate-500'}`}
                        onClick={() => updatePlan(section.id, plan.id, { pricingMode: 'fisso' })}
                      >
                        Prezzo fisso
                      </button>
                    </div>
                    {plan.pricingMode === 'fisso' ? (
                      <input
                        className="input py-1.5 text-sm w-24 text-right"
                        placeholder="€ a testa"
                        value={plan.price}
                        onChange={(e) => updatePlan(section.id, plan.id, { price: e.target.value })}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-dm-ink ml-auto">
                        {formatCurrency(planPrice(plan))} <span className="text-xs font-normal text-slate-400">/ persona</span>
                      </span>
                    )}
                  </div>

                  <input
                    className="input py-1.5 text-xs mb-1.5"
                    placeholder="Nota (es. Bevanda a scelta — acqua inclusa)"
                    value={plan.note}
                    onChange={(e) => updatePlan(section.id, plan.id, { note: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1 mb-3">
                    {STANDARD_NOTES.map((phrase) => (
                      <button
                        key={phrase}
                        className="text-[10px] bg-slate-100 hover:bg-dm-yellow/40 text-slate-500 rounded-full px-2 py-0.5 transition-colors"
                        onClick={() => updatePlan(section.id, plan.id, { note: plan.note ? `${plan.note} — ${phrase}` : phrase })}
                      >
                        + {phrase}
                      </button>
                    ))}
                  </div>

                  {plan.groups.length > 1 && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
                      {mergeModeFor?.sectionId === section.id && mergeModeFor?.planId === plan.id ? (
                        <>
                          <span className="text-xs font-medium text-slate-600">Seleziona i gruppi da unire ({mergeSelection.length} selezionati)</span>
                          <input
                            className="input py-1 text-xs w-40"
                            placeholder="Nome nuovo gruppo (es. Main)"
                            value={mergeNewLabel}
                            onChange={(e) => setMergeNewLabel(e.target.value)}
                          />
                          <button
                            className="text-xs font-medium text-white bg-dm-maroon rounded-full px-3 py-1.5 disabled:opacity-40 ml-auto"
                            disabled={mergeSelection.length < 2}
                            onClick={() => {
                              mergeGroups(section.id, plan.id, mergeSelection, mergeNewLabel)
                              setMergeModeFor(null)
                              setMergeSelection([])
                              setMergeNewLabel('')
                            }}
                          >
                            Unisci selezionati
                          </button>
                          <button className="text-xs text-slate-500 hover:text-dm-ink" onClick={() => { setMergeModeFor(null); setMergeSelection([]); setMergeNewLabel('') }}>
                            Annulla
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-xs font-medium text-dm-maroon border border-dm-maroon/40 rounded-full px-3 py-1.5 hover:bg-dm-maroon/5 transition-colors flex items-center gap-1.5"
                          onClick={() => { setMergeModeFor({ sectionId: section.id, planId: plan.id }); setMergeSelection([]) }}
                        >
                          <GripVertical size={12} /> Unisci gruppi in uno (media unica)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {plan.groups.map((group) => {
                      const merging = mergeModeFor?.sectionId === section.id && mergeModeFor?.planId === plan.id
                      const selected = mergeSelection.includes(group.id)
                      return (
                      <div key={group.id} className={`bg-white rounded-lg border p-2.5 ${merging && selected ? 'border-dm-maroon ring-1 ring-dm-maroon' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {merging && (
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => setMergeSelection((prev) => e.target.checked ? [...prev, group.id] : prev.filter((id) => id !== group.id))}
                            />
                          )}
                          <GripVertical size={12} className="text-slate-300 shrink-0" />
                          <input
                            className="input py-1 text-xs flex-1"
                            placeholder="Es. Antipasto, Main a scelta..."
                            value={group.label}
                            onChange={(e) => updateGroup(section.id, plan.id, group.id, { label: e.target.value })}
                          />
                          <input
                            className="input py-1 text-xs w-24"
                            placeholder="tag (opz.)"
                            value={group.tag}
                            onChange={(e) => updateGroup(section.id, plan.id, group.id, { tag: e.target.value })}
                          />
                          {plan.groups.length > 1 && (
                            <button className="text-slate-300 hover:text-red-500 shrink-0" onClick={() => removeGroup(section.id, plan.id, group.id)}>
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {plan.pricingMode === 'calcolato' && (
                          <div className="flex items-center gap-1.5 mb-2 text-xs">
                            <button
                              className={`px-2 py-0.5 rounded-full ${group.pricingMode === 'fisso' ? 'bg-dm-cream text-dm-ink font-medium ring-1 ring-dm-yellow' : 'text-slate-400 hover:text-dm-ink'}`}
                              onClick={() => updateGroup(section.id, plan.id, group.id, { pricingMode: 'fisso' })}
                            >
                              Incluso (somma)
                            </button>
                            <button
                              className={`px-2 py-0.5 rounded-full ${group.pricingMode === 'media' ? 'bg-dm-cream text-dm-ink font-medium ring-1 ring-dm-yellow' : 'text-slate-400 hover:text-dm-ink'}`}
                              onClick={() => updateGroup(section.id, plan.id, group.id, { pricingMode: 'media' })}
                            >
                              A scelta (media)
                            </button>
                            {group.items.length > 0 && (
                              <span className="ml-auto text-slate-400">{formatCurrency(groupPrice(group))}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                          <span>Da condividere ogni</span>
                          <input
                            type="number"
                            min={1}
                            className="w-11 text-center text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-dm-maroon py-0.5"
                            placeholder="1"
                            value={group.defaultSharedAmong ?? ''}
                            onChange={(e) => {
                              const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                              updateGroup(section.id, plan.id, group.id, { defaultSharedAmong: v && v > 1 ? v : undefined })
                            }}
                          />
                          <span>persone <span className="text-slate-400">(default per il gruppo, modificabile per piatto)</span></span>
                        </div>

                        {group.items.length > 0 && (() => {
                          const isChoice = group.pricingMode === 'media' && group.items.length > 1
                          const subcats = isChoice ? dishesBySubcategory(group) : null
                          const showSubcats = subcats ? subcats.size > 1 : false

                          const renderDish = (it: (typeof group.items)[number]) => {
                            const effectiveShared = itemSharedAmong(it, group)
                            return (
                              <li key={it.catalogId} className="flex flex-col gap-1 text-xs bg-dm-cream/60 rounded-md px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-dm-ink/80 truncate">{it.name}</span>
                                  <span className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-slate-400">
                                      {formatCurrency(itemEffectivePrice(it, group))}
                                      {effectiveShared && effectiveShared > 1 && (
                                        <span className="text-slate-300"> ({formatCurrency(it.price)}/{effectiveShared})</span>
                                      )}
                                    </span>
                                    <button className="text-slate-300 hover:text-red-500" onClick={() => removeDishFromGroup(section.id, plan.id, group.id, it.catalogId)}>
                                      <X size={12} />
                                    </button>
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1 shrink-0">
                                    <span>ogni</span>
                                    <input
                                      type="number"
                                      min={1}
                                      className="w-10 text-center text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-dm-maroon py-0.5"
                                      placeholder={group.defaultSharedAmong ? String(group.defaultSharedAmong) : '1'}
                                      value={it.sharedAmong ?? ''}
                                      onChange={(e) => {
                                        const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                                        updateDishSharing(section.id, plan.id, group.id, it.catalogId, v && v > 1 ? v : undefined)
                                      }}
                                    />
                                    <span>pax</span>
                                  </span>
                                  <span className="flex items-center gap-1 flex-1 min-w-0">
                                    <span className="shrink-0">sotto-gruppo</span>
                                    <input
                                      className="flex-1 min-w-0 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-dm-maroon py-0.5 px-1.5"
                                      placeholder={it.category || 'nessuno'}
                                      value={it.subgroup ?? ''}
                                      onChange={(e) => updateDishSubgroup(section.id, plan.id, group.id, it.catalogId, e.target.value || undefined)}
                                    />
                                  </span>
                                </div>
                              </li>
                            )
                          }

                          if (!showSubcats) {
                            return <ul className="space-y-1 mb-2">{group.items.map(renderDish)}</ul>
                          }

                          return (
                            <div className="space-y-2 mb-2">
                              {Array.from(subcats!.entries()).map(([subcat, dishes]) => (
                                <div key={subcat}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dm-wood mb-1">{subcat}</p>
                                  <ul className="space-y-1">{dishes.map(renderDish)}</ul>
                                </div>
                              ))}
                            </div>
                          )
                        })()}

                        <button
                          className="w-full text-xs text-dm-maroon hover:bg-dm-maroon/5 rounded-md py-1.5 flex items-center justify-center gap-1 border border-dashed border-dm-maroon/30"
                          onClick={() => { setPickerFor({ sectionId: section.id, planId: plan.id, groupId: group.id }); setPickerSearch(''); setPickerCategory('') }}
                        >
                          <Plus size={12} /> Aggiungi piatto dal menu
                        </button>
                      </div>
                      )
                    })}
                    <button
                      className="text-xs text-slate-400 hover:text-dm-maroon transition-colors"
                      onClick={() => addGroup(section.id, plan.id)}
                    >
                      + Aggiungi gruppo (es. Dolce)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 text-xs text-slate-400 hover:text-dm-maroon transition-colors" onClick={() => addPlan(section.id)}>
              + Aggiungi fascia prezzo
            </button>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="card text-center text-slate-400 py-16">
            Nessun momento aggiunto. Clicca &quot;Aggiungi momento&quot; per iniziare.
          </div>
        )}
      </div>

      <button className="btn-secondary flex items-center gap-2 mt-6" onClick={addSection}>
        <Plus size={15} /> Aggiungi momento
      </button>

      {/* Dish / extra service picker modal */}
      {(pickerFor || extraPickerFor) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setPickerFor(null); setExtraPickerFor(null) }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-dm-ink">{extraPickerFor ? 'Scegli un servizio dal catalogo' : 'Scegli un piatto dal catalogo'}</h3>
                <button className="text-slate-400 hover:text-dm-ink" onClick={() => { setPickerFor(null); setExtraPickerFor(null) }}><X size={18} /></button>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  autoFocus
                  className="input pl-9"
                  placeholder="Cerca piatto..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setPickerCategory('')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${pickerCategory === '' ? 'bg-dm-yellow text-dm-ink' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tutte
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(pickerCategory === cat ? '' : cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${pickerCategory === cat ? 'bg-dm-yellow text-dm-ink' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {pickerResults.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Nessun piatto trovato</p>
              ) : (
                pickerResults.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-dm-cream text-left transition-colors"
                    onClick={() => {
                      if (extraPickerFor) { addExtra(item); setExtraPickerFor(null) }
                      else addDishToPicker(item)
                    }}
                  >
                    <span>
                      <span className="text-sm text-dm-ink/90 font-medium">{item.name}</span>
                      <span className="block text-xs text-slate-400">{item.category}</span>
                    </span>
                    <span className="text-sm text-slate-500">{formatCurrency(item.unit_price)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
