'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Save, Plus, ShieldCheck, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ALLERGENS, type DishAllergen, type AllergenKey } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'

// Categorie food che hanno senso nella scheda allergeni
const FOOD_CATEGORIES = [
  'Burger', 'Brace', 'Pizze', 'Paste', 'Starter', 'Insalate', 'Contorni', 'Dessert',
  'Caffe', 'Birre Medie', 'Birre Piccole', 'Birre Bottiglia', 'Caraffe',
  'Vini', 'Cocktails', 'Amari', 'Bibite', 'Spillatori', 'Beer Tour', 'Coperti', 'Menu',
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function AllergensPageInner() {
  const supabase = createClient()
  const [rows, setRows] = useState<DishAllergen[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('Tutte')
  const [filterAllergen, setFilterAllergen] = useState<AllergenKey | 'Tutti'>('Tutti')
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const [newDish, setNewDish] = useState('')
  const [newCategory, setNewCategory] = useState('Burger')
  const [adding, setAdding] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    fetchRows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRows() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('dish_allergens').select('*').order('category').order('dish_name')
    setRows((data ?? []) as DishAllergen[])
    setLoading(false)
  }

  async function toggleAllergen(row: DishAllergen, key: AllergenKey) {
    const updated = { ...row, [key]: !row[key] }
    setRows((prev) => prev.map((r) => r.id === row.id ? updated : r))
    setSaveState((s) => ({ ...s, [row.id]: 'saving' }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('dish_allergens')
      .update({ [key]: !row[key] })
      .eq('id', row.id)
    setSaveState((s) => ({ ...s, [row.id]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaveState((s) => ({ ...s, [row.id]: 'idle' })), 1500)
  }

  async function updateNote(row: DishAllergen, note: string) {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, note_allergeni: note } : r))
  }

  async function saveNote(row: DishAllergen) {
    setSaveState((s) => ({ ...s, [row.id]: 'saving' }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('dish_allergens')
      .update({ note_allergeni: row.note_allergeni })
      .eq('id', row.id)
    setSaveState((s) => ({ ...s, [row.id]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaveState((s) => ({ ...s, [row.id]: 'idle' })), 1500)
  }

  async function addDish() {
    if (!newDish.trim()) return
    setAdding(true)
    const blank: Partial<DishAllergen> = {
      dish_name: newDish.trim(),
      category: newCategory,
      glutine: false, crostacei: false, uova: false, pesce: false,
      arachidi: false, soia: false, latte: false, frutta_guscio: false,
      sedano: false, senape: false, sesamo: false, anidride: false,
      lupini: false, molluschi: false,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('dish_allergens')
      .insert(blank)
      .select()
      .single()
    if (!error && data) {
      setRows((prev) => [...prev, data as DishAllergen])
      setExpandedRow((data as DishAllergen).id)
    }
    setNewDish('')
    setAdding(false)
  }

  async function deleteDish(id: string) {
    if (!confirm('Eliminare questo piatto dalla scheda allergeni?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('dish_allergens').delete().eq('id', id)
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const categories = useMemo(() => {
    const cats = Array.from(new Set(rows.map((r) => r.category ?? '—'))).sort()
    return ['Tutte', ...cats]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch = r.dish_name.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCategory === 'Tutte' || r.category === filterCategory
      const matchAllergen = filterAllergen === 'Tutti' || r[filterAllergen] === true
      return matchSearch && matchCat && matchAllergen
    })
  }, [rows, search, filterCategory, filterAllergen])

  const grouped = useMemo(() => {
    const map = new Map<string, DishAllergen[]>()
    for (const r of filtered) {
      const cat = r.category ?? '—'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(r)
    }
    return map
  }, [filtered])

  function allergenCount(row: DishAllergen) {
    return ALLERGENS.filter((a) => row[a.key]).length
  }

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento schede allergeni...</div>

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={22} />
            Schede Allergeni
          </h1>
          <p className="text-sm text-slate-500">14 allergeni EU — Reg. 1169/2011 · {rows.length} piatti registrati</p>
        </div>
      </div>

      {/* Aggiungi piatto */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Aggiungi piatto</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-48"
            placeholder="Nome piatto (es. Doppio Smash Bacon)"
            value={newDish}
            onChange={(e) => setNewDish(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDish()}
          />
          <select
            className="input w-40"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {FOOD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={addDish}
            disabled={adding || !newDish.trim()}
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Aggiungi
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              className="input pl-8"
              placeholder="Cerca piatto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-44" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            className="input w-48"
            value={filterAllergen}
            onChange={(e) => setFilterAllergen(e.target.value as AllergenKey | 'Tutti')}
          >
            <option value="Tutti">Tutti gli allergeni</option>
            {ALLERGENS.map((a) => (
              <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400">{filtered.length} piatti</span>
        </div>
      </div>

      {/* Legenda allergeni */}
      <div className="card mb-4 overflow-x-auto">
        <p className="text-xs font-semibold text-slate-500 mb-2">LEGENDA</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <span key={a.key} className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
              <span>{a.emoji}</span>
              <span>{a.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabella per categoria */}
      {filtered.length === 0 ? (
        <div className="card text-center text-slate-400 py-12">
          {rows.length === 0
            ? 'Nessun piatto ancora. Aggiungine uno sopra.'
            : 'Nessun risultato per i filtri selezionati.'}
        </div>
      ) : (
        Array.from(grouped.entries()).map(([cat, dishes]) => (
          <div key={cat} className="card mb-4">
            <h2 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{cat}</span>
              <span className="text-slate-400 font-normal">{dishes.length} piatti</span>
            </h2>

            {/* Desktop: tabella con checkbox */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-2 py-2 text-slate-500 font-medium w-48">Piatto</th>
                    {ALLERGENS.map((a) => (
                      <th key={a.key} className="px-1 py-2 text-center text-slate-500 font-medium" title={a.label}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{a.emoji}</span>
                          <span className="text-[10px] leading-none">{a.label.split('/')[0].slice(0, 6)}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-slate-500 font-medium text-left w-32">Note</th>
                    <th className="px-2 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dishes.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 group">
                      <td className="px-2 py-2">
                        <div className="font-medium text-slate-700 text-xs">{row.dish_name}</div>
                        {allergenCount(row) > 0 && (
                          <div className="text-[10px] text-amber-600 font-medium">{allergenCount(row)} allergeni</div>
                        )}
                      </td>
                      {ALLERGENS.map((a) => (
                        <td key={a.key} className="px-1 py-2 text-center">
                          <button
                            onClick={() => toggleAllergen(row, a.key)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-colors
                              ${row[a.key]
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-slate-200 hover:border-slate-400'
                              }`}
                            title={a.label}
                          >
                            {row[a.key] && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <input
                          className="input text-xs py-1 w-full"
                          placeholder="Note..."
                          value={row.note_allergeni ?? ''}
                          onChange={(e) => updateNote(row, e.target.value)}
                          onBlur={() => saveNote(row)}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {saveState[row.id] === 'saving' && <Loader2 size={12} className="animate-spin text-slate-400" />}
                          {saveState[row.id] === 'saved' && <Save size={12} className="text-emerald-500" />}
                          {saveState[row.id] === 'error' && <span className="text-red-500 text-[10px]">Errore</span>}
                          <button
                            onClick={() => deleteDish(row.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            title="Elimina"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: accordion */}
            <div className="lg:hidden space-y-2">
              {dishes.map((row) => (
                <div key={row.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-left"
                    onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                  >
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{row.dish_name}</p>
                      {allergenCount(row) > 0 && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          {ALLERGENS.filter((a) => row[a.key]).map((a) => a.emoji).join(' ')}
                        </p>
                      )}
                    </div>
                    {expandedRow === row.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {expandedRow === row.id && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {ALLERGENS.map((a) => (
                          <button
                            key={a.key}
                            onClick={() => toggleAllergen(row, a.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-colors
                              ${row[a.key]
                                ? 'bg-red-50 border-red-400 text-red-700 font-medium'
                                : 'bg-white border-slate-200 text-slate-500'
                              }`}
                          >
                            <span>{a.emoji}</span>
                            <span className="text-xs">{a.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          className="input flex-1 text-sm"
                          placeholder="Note allergeni..."
                          value={row.note_allergeni ?? ''}
                          onChange={(e) => updateNote(row, e.target.value)}
                          onBlur={() => saveNote(row)}
                        />
                        <button
                          onClick={() => deleteDish(row.id)}
                          className="text-slate-400 hover:text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function AllergensPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <AllergensPageInner />
}
