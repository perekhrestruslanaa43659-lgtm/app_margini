'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, X, Plus, RotateCcw, ChefHat, BookOpen, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DBIngredient {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  categoria: string
}

interface RecipeRow {
  _key: string
  name: string
  quantity: number
  unit: string
  cost_per_unit: number
  fromDB: boolean
}

function fmt(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function calcPct(cost: number, price: number) {
  if (!price) return null
  return ((cost / price) * 100).toFixed(1) + '%'
}

const CAT_ORDER = [
  'Carni & Proteici', 'Basi & Impasti', 'Salse & Condimenti',
  'Latticini & Formaggi', 'Salumi & Affettati', 'Fritti & Preparati',
  'Verdure & Contorni', 'Dolci & Dessert', 'Birre', 'Alcolici & Caffè',
  'Aggiunte Food', 'Aggiunte Beverage', 'Rimozioni', 'Altro',
]

export default function CalcoloFoodCost() {
  const [dishName, setDishName] = useState('')
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [sellingPrice, setSellingPrice] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [recipeStatus, setRecipeStatus] = useState<'idle' | 'loaded' | 'not_found'>('idle')
  const [ingredients, setIngredients] = useState<DBIngredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const searchRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any

  useEffect(() => {
    async function fetchIngredients() {
      setLoadingIngredients(true)
      const { data } = await sb
        .from('ingredients')
        .select('id, name, unit, cost_per_unit, categoria')
        .order('name')
      setIngredients(data ?? [])
      setLoadingIngredients(false)
    }
    fetchIngredients()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ingredients.map((i) => i.categoria || 'Altro')))
    return CAT_ORDER.filter((c) => cats.includes(c)).concat(cats.filter((c) => !CAT_ORDER.includes(c)).sort())
  }, [ingredients])

  const searchResults = useMemo(() =>
    query.trim().length >= 1
      ? ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
      : [],
    [query, ingredients]
  )

  const filteredIngredients = useMemo(() => {
    if (query.trim()) return []
    if (activeCategory) return ingredients.filter((i) => (i.categoria || 'Altro') === activeCategory)
    return ingredients
  }, [query, activeCategory, ingredients])

  const grouped = useMemo(() => {
    const map = new Map<string, DBIngredient[]>()
    for (const ing of filteredIngredients) {
      const cat = ing.categoria || 'Altro'
      const arr = map.get(cat) ?? []
      arr.push(ing)
      map.set(cat, arr)
    }
    return map
  }, [filteredIngredients])

  const visibleCats = useMemo(() =>
    CAT_ORDER.filter((c) => grouped.has(c)).concat(
      Array.from(grouped.keys()).filter((c) => !CAT_ORDER.includes(c)).sort()
    ),
    [grouped]
  )

  async function loadRecipeFromDB(name: string) {
    setLoadingRecipe(true)
    setRecipeStatus('idle')
    const { data } = await sb
      .from('recipe_items')
      .select('quantity, ingredient:ingredients(id, name, unit, cost_per_unit)')
      .eq('dish_name', name)
    setLoadingRecipe(false)

    if (!data || data.length === 0) {
      setRecipeStatus('not_found')
      return
    }

    const loaded: RecipeRow[] = data.map((r: { quantity: number; ingredient: DBIngredient }) => ({
      _key: Math.random().toString(36).slice(2),
      name: r.ingredient.name,
      quantity: r.quantity,
      unit: r.ingredient.unit,
      cost_per_unit: r.ingredient.cost_per_unit,
      fromDB: true,
    }))
    setRows(loaded)
    setRecipeStatus('loaded')
  }

  function addIngredient(ing: DBIngredient) {
    setRows((prev) => [
      ...prev,
      {
        _key: Math.random().toString(36).slice(2),
        name: ing.name,
        quantity: 1,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit,
        fromDB: false,
      },
    ])
    setQuery('')
    setDropdownOpen(false)
  }

  function addManualRow() {
    setRows((prev) => [
      ...prev,
      { _key: Math.random().toString(36).slice(2), name: '', quantity: 1, unit: 'pz', cost_per_unit: 0, fromDB: false },
    ])
  }

  function updateRow(key: string, field: keyof RecipeRow, value: string | number | boolean) {
    setRows((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r))
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key))
  }

  const reset = useCallback(() => {
    setRows([])
    setDishName('')
    setSellingPrice('')
    setQuery('')
    setActiveCategory(null)
    setRecipeStatus('idle')
  }, [])

  const totalCost = rows.reduce((sum, r) => sum + r.quantity * r.cost_per_unit, 0)
  const price = parseFloat(sellingPrice.replace(',', '.')) || 0
  const foodCostPct = calcPct(totalCost, price)
  const pctColor = !foodCostPct ? ''
    : parseFloat(foodCostPct) <= 28 ? 'text-emerald-600'
    : parseFloat(foodCostPct) <= 35 ? 'text-amber-500'
    : 'text-red-600'

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Calcolo Food Cost</h1>
            <p className="text-xs text-slate-400">Seleziona ingredienti dal catalogo o carica la distinta dal DB</p>
          </div>
        </div>
        <button onClick={reset} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Nome piatto + carica distinta */}
      <div className="card">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Nome piatto</label>
            <input
              className="input"
              placeholder="es. Siamo Fritti, Gran Tagliata…"
              value={dishName}
              onChange={(e) => { setDishName(e.target.value); setRecipeStatus('idle') }}
            />
          </div>
          <button
            className="btn-primary flex items-center gap-1.5 text-xs py-2 shrink-0"
            disabled={!dishName.trim() || loadingRecipe}
            onClick={() => loadRecipeFromDB(dishName.trim())}
          >
            <BookOpen size={13} />
            {loadingRecipe ? 'Carico…' : 'Carica distinta da DB'}
          </button>
        </div>

        {recipeStatus === 'loaded' && (
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            ✓ Distinta base caricata da Supabase — puoi modificare le quantità o aggiungere altri ingredienti
          </div>
        )}
        {recipeStatus === 'not_found' && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            ⚠ Nessuna distinta trovata per &ldquo;{dishName}&rdquo; — inserisci gli ingredienti manualmente dal catalogo
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── COLONNA SINISTRA: Catalogo ingredienti ── */}
        <div className="space-y-3">

          {/* Ricerca */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Catalogo ingredienti</label>
              {!loadingIngredients && (
                <span className="text-[10px] text-slate-400">{ingredients.length} ingredienti</span>
              )}
            </div>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-300" />
                <input
                  className="input pl-8"
                  placeholder="Cerca ingrediente…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
                  onFocus={() => query.trim() && setDropdownOpen(true)}
                />
                {query && (
                  <button className="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500" onClick={() => { setQuery(''); setDropdownOpen(false) }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {dropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {searchResults.map((ing) => (
                    <button
                      key={ing.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); addIngredient(ing) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-medium text-slate-700">{ing.name}</span>
                        <span className="ml-2 text-[10px] text-slate-400 uppercase">{ing.categoria}</span>
                      </div>
                      <span className="text-slate-500 text-xs shrink-0">{fmt(ing.cost_per_unit)}/{ing.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {dropdownOpen && query.trim().length >= 1 && searchResults.length === 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400">
                  Nessun ingrediente trovato per &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Filtri categoria */}
          {!query.trim() && (
            <div className="card p-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === null ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tutti
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista ingredienti raggruppata per categoria */}
          {!query.trim() && (
            <div className="card p-0 overflow-hidden max-h-[480px] overflow-y-auto">
              {loadingIngredients ? (
                <div className="py-10 text-center text-slate-400 text-xs">Caricamento ingredienti…</div>
              ) : visibleCats.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">Nessun ingrediente trovato</div>
              ) : (
                visibleCats.map((cat) => {
                  const items = grouped.get(cat)
                  if (!items || items.length === 0) return null
                  return (
                    <div key={cat}>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat}</span>
                        <span className="ml-2 text-[10px] text-slate-400">{items.length}</span>
                      </div>
                      {items.map((ing) => (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => addIngredient(ing)}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3 group transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Plus size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                            <span className="text-sm text-slate-700 truncate">{ing.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-medium text-slate-600">{fmt(ing.cost_per_unit)}</span>
                            <span className="ml-1 text-[10px] text-slate-400">/{ing.unit}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ── COLONNA DESTRA: Ricetta ── */}
        <div className="space-y-3">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Ingredienti ricetta
                {dishName && <span className="ml-2 text-slate-400 font-normal">— {dishName}</span>}
              </h2>
              <div className="flex items-center gap-2">
                {rows.length > 0 && <span className="text-xs text-slate-400">{rows.length} righe</span>}
                <button onClick={addManualRow} className="btn-secondary flex items-center gap-1 text-xs py-1 px-2">
                  <Pencil size={11} /> Riga manuale
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-2 px-3 font-medium">Ingrediente</th>
                    <th className="text-center py-2 px-2 font-medium w-16">Qtà</th>
                    <th className="text-center py-2 px-2 font-medium w-12">Ud</th>
                    <th className="text-right py-2 px-2 font-medium w-20">Costo/ud</th>
                    <th className="text-right py-2 px-2 font-medium w-20">Totale</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        <Plus size={20} className="text-slate-200 mx-auto mb-2" />
                        Carica la distinta da DB oppure clicca un ingrediente dal catalogo
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const rowTotal = row.quantity * row.cost_per_unit
                    const missing = row.cost_per_unit === 0
                    return (
                      <tr key={row._key} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                        <td className="py-1.5 px-3">
                          {row.fromDB ? (
                            <div>
                              <div className="text-xs font-medium text-slate-700">{row.name}</div>
                              {missing && <div className="text-[10px] text-amber-500">⚠ costo 0</div>}
                            </div>
                          ) : (
                            <input
                              className="input py-0.5 text-xs"
                              placeholder="Nome ingrediente"
                              value={row.name}
                              onChange={(e) => updateRow(row._key, 'name', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number" min="0" step="0.001"
                            className="input py-0.5 text-xs text-center w-14 mx-auto block"
                            value={row.quantity === 0 ? '' : row.quantity}
                            placeholder="0"
                            onChange={(e) => updateRow(row._key, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          {row.fromDB ? (
                            <span className="text-xs text-slate-400 block text-center">{row.unit}</span>
                          ) : (
                            <select
                              className="input py-0.5 text-xs text-center"
                              value={row.unit}
                              onChange={(e) => updateRow(row._key, 'unit', e.target.value)}
                            >
                              <option>pz</option>
                              <option>kg</option>
                              <option>L</option>
                              <option>g</option>
                              <option>ml</option>
                            </select>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number" min="0" step="0.01"
                            className={`input py-0.5 text-xs text-right ${missing ? 'border-amber-300 bg-amber-50' : ''}`}
                            value={row.cost_per_unit === 0 ? '' : row.cost_per_unit}
                            placeholder="0,00"
                            onChange={(e) => updateRow(row._key, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right text-xs font-semibold text-slate-800">
                          {missing ? <span className="text-amber-400">—</span> : fmt(rowTotal)}
                        </td>
                        <td className="py-1.5 px-2">
                          <button type="button" onClick={() => removeRow(row._key)} className="text-slate-300 hover:text-red-500 transition-colors mx-auto block">
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                {rows.some((r) => r.cost_per_unit === 0 && r.name) && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    ⚠ Alcuni ingredienti hanno costo 0 — il totale potrebbe essere incompleto.
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Totale Food Cost</span>
                  <span className="text-xl font-bold text-slate-800">{fmt(totalCost)}</span>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="label">Prezzo di vendita €</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-xs">€</span>
                      <input
                        className="input pl-6 text-sm"
                        type="number" min="0" step="0.01"
                        placeholder="0,00"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  {foodCostPct && (
                    <div className="text-right pb-1">
                      <div className="text-[10px] text-slate-400 mb-0.5">Food Cost %</div>
                      <div className={`text-2xl font-bold ${pctColor}`}>{foodCostPct}</div>
                      <div className="text-[10px] text-slate-400">
                        {parseFloat(foodCostPct) <= 28 ? 'Ottimo' : parseFloat(foodCostPct) <= 35 ? 'Accettabile' : 'Troppo alto'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
