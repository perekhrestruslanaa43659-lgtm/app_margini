'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Save, ShieldCheck, Loader2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ALLERGENS, type DishAllergen, type AllergenKey } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function AllergensPageInner() {
  const supabase = createClient()
  const [rows, setRows] = useState<DishAllergen[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('Tutte')
  const [filterAllergen, setFilterAllergen] = useState<AllergenKey | 'Tutti'>('Tutti')
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})

  useEffect(() => {
    fetchRows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRows() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('dish_allergens')
      .select('*')
      .order('category')
      .order('dish_name')
    setRows((data ?? []) as DishAllergen[])
    setLoading(false)
  }

  // Importa tutti i piatti dal catalogo che non esistono ancora in dish_allergens
  async function importFromCatalog() {
    setImporting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catalog } = await (supabase as any).from('catalog_items').select('name, category')
    if (!catalog || catalog.length === 0) { setImporting(false); return }

    const existingNames = new Set(rows.map((r) => r.dish_name))
    const toInsert = (catalog as { name: string; category: string | null }[])
      .filter((c) => !existingNames.has(c.name))
      .map((c) => ({
        dish_name: c.name,
        category: c.category ?? null,
        glutine: false, crostacei: false, uova: false, pesce: false,
        arachidi: false, soia: false, latte: false, frutta_guscio: false,
        sedano: false, senape: false, sesamo: false, anidride: false,
        lupini: false, molluschi: false,
      }))

    if (toInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('dish_allergens').insert(toInsert)
    }
    await fetchRows()
    setImporting(false)
  }

  async function toggleAllergen(row: DishAllergen, key: AllergenKey) {
    const newVal = !row[key]
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, [key]: newVal } : r))
    setSaveState((s) => ({ ...s, [row.id]: 'saving' }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('dish_allergens')
      .update({ [key]: newVal })
      .eq('id', row.id)
    setSaveState((s) => ({ ...s, [row.id]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaveState((s) => ({ ...s, [row.id]: 'idle' })), 1200)
  }

  async function updateNote(id: string, note: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, note_allergeni: note } : r))
  }

  async function saveNote(row: DishAllergen) {
    setSaveState((s) => ({ ...s, [row.id]: 'saving' }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('dish_allergens')
      .update({ note_allergeni: row.note_allergeni })
      .eq('id', row.id)
    setSaveState((s) => ({ ...s, [row.id]: error ? 'error' : 'saved' }))
    setTimeout(() => setSaveState((s) => ({ ...s, [row.id]: 'idle' })), 1200)
  }

  const categories = useMemo(() => {
    const cats = Array.from(new Set(rows.map((r) => r.category ?? '—'))).sort()
    return ['Tutte', ...cats]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.dish_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category ?? '').toLowerCase().includes(search.toLowerCase())
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

  function allergenBadges(row: DishAllergen) {
    return ALLERGENS.filter((a) => row[a.key])
  }

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={22} />
            Schede Allergeni
          </h1>
          <p className="text-sm text-slate-500">
            14 allergeni EU · Reg. 1169/2011 · <strong>{rows.length}</strong> voci
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={importFromCatalog}
          disabled={importing}
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {importing ? 'Importazione...' : 'Importa dal Catalogo'}
        </button>
      </div>

      {/* Prompt vuoto */}
      {rows.length === 0 && (
        <div className="card text-center py-16">
          <ShieldCheck size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium mb-2">Nessuna voce ancora</p>
          <p className="text-slate-400 text-sm mb-6">
            Clicca <strong>Importa dal Catalogo</strong> per caricare automaticamente tutti i piatti e articoli.
          </p>
          <button className="btn-primary mx-auto flex items-center gap-2" onClick={importFromCatalog} disabled={importing}>
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Importa dal Catalogo
          </button>
        </div>
      )}

      {/* Filtri */}
      {rows.length > 0 && (
        <>
          <div className="card mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  className="input pl-8"
                  placeholder="Cerca piatto o categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="input w-44"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select
                className="input w-52"
                value={filterAllergen}
                onChange={(e) => setFilterAllergen(e.target.value as AllergenKey | 'Tutti')}
              >
                <option value="Tutti">Tutti gli allergeni</option>
                {ALLERGENS.map((a) => (
                  <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>
                ))}
              </select>
              <span className="text-sm text-slate-400">{filtered.length} voci</span>
            </div>
          </div>

          {/* Tabella per categoria */}
          {filtered.length === 0 ? (
            <div className="card text-center text-slate-400 py-10">Nessun risultato</div>
          ) : (
            Array.from(grouped.entries()).map(([cat, dishes]) => (
              <div key={cat} className="card mb-4 overflow-x-auto">
                {/* Header categoria */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">{cat}</span>
                  <span className="text-xs text-slate-400">{dishes.length} voci</span>
                </div>

                <table className="w-full text-xs min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-2 py-2 text-slate-500 font-medium w-52">Voce</th>
                      {ALLERGENS.map((a) => (
                        <th key={a.key} className="px-1 py-2 text-center w-10" title={a.label}>
                          <span className="text-base leading-none">{a.emoji}</span>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{a.label.split('/')[0].slice(0, 5)}</p>
                        </th>
                      ))}
                      <th className="text-left px-2 py-2 text-slate-500 font-medium">Note</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dishes.map((row) => {
                      const badges = allergenBadges(row)
                      const st = saveState[row.id]
                      return (
                        <tr key={row.id} className="hover:bg-slate-50 group">
                          <td className="px-2 py-2">
                            <p className="font-medium text-slate-700 leading-tight">{row.dish_name}</p>
                            {badges.length > 0 && (
                              <p className="text-[10px] mt-0.5 text-amber-600">
                                {badges.map((a) => a.emoji).join(' ')}
                              </p>
                            )}
                          </td>
                          {ALLERGENS.map((a) => (
                            <td key={a.key} className="px-1 py-2 text-center">
                              <button
                                onClick={() => toggleAllergen(row, a.key)}
                                title={a.label}
                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all
                                  ${row[a.key]
                                    ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                    : 'border-slate-200 hover:border-red-300 hover:bg-red-50'
                                  }`}
                              >
                                {row[a.key] && <span className="text-[11px] font-bold">✓</span>}
                              </button>
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <input
                              className="input text-xs py-1"
                              placeholder="Note..."
                              value={row.note_allergeni ?? ''}
                              onChange={(e) => updateNote(row.id, e.target.value)}
                              onBlur={() => saveNote(row)}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            {st === 'saving' && <Loader2 size={12} className="animate-spin text-slate-300 mx-auto" />}
                            {st === 'saved'  && <Save size={12} className="text-emerald-500 mx-auto" />}
                            {st === 'error'  && <span className="text-red-400 text-[10px]">!</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

export default function AllergensPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <AllergensPageInner />
}
