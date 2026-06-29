'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, X, Plus, RotateCcw, ChefHat } from 'lucide-react'
import { CATALOG, type Ingredient } from '@/lib/catalog'

interface RecipeRow {
  _key: string
  ingredient: Ingredient
  quantity: number
}

function fmt(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function pct(cost: number, price: number) {
  if (!price) return null
  return ((cost / price) * 100).toFixed(1) + '%'
}

const MAIN_CATEGORIES = [
  'STARTER', 'BURGER 🍔', 'BURGER', 'SMASH BURGER 🍔',
  'BRACE 🔥 🥩', 'BRACE', 'PIZZE', 'PASTE', 'INSALATE 🥬', 'INSALATE',
  'CONTORNI 🥗', 'DESSERT 🍰', 'DESSERT',
  'BIRRE 0.4 🍺', 'BIRRE 0.2 🍻',
  'COCKTAILS 🍸', 'AMARI', 'VINI', 'BIBITE 🥤', 'BIBITE',
  "CAFFE'", 'CAFFE\\', 'CAFFETTERIA', 'STRANE COPPIE',
]

const SKIP_CATALOG = new Set([
  'COMMENTI', 'VARIANTI FOOD +', 'VARIANTI FOOD -', 'VARIANTI BEVERAGE',
  "VARIANTI CAFFE'", 'VARIANTI CAFFE\\', 'VARIANTI SALSE +', 'VARIANTI SALSE -',
  'VARIANTI CONTORNI', 'SMAIL LOYALTY', 'MERCHANDISING 👕', 'RICAVI',
  'NOLEGGIO OMBRELLONI', 'POP CORN', 'COPERTI_10', 'SOFT DRINK', 'GELATI',
  'COLAZIONI SAN SIRO PUB', 'MENU DIPENDENTI FOOD', 'CARAFFE 🍺',
  'BEER TOUR 🍻', 'MENU\\', "MENU'", 'BAR',
])

const VISIBLE = CATALOG.filter((c) => !SKIP_CATALOG.has(c.categoria))

const ALL_CATS = Array.from(new Set(VISIBLE.map((c) => c.categoria))).sort((a, b) => {
  const ia = MAIN_CATEGORIES.indexOf(a)
  const ib = MAIN_CATEGORIES.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.localeCompare(b, 'it')
})

export default function CalcoloFoodCost() {
  const [dishName, setDishName] = useState('')
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [sellingPrice, setSellingPrice] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const searchResults = useMemo(() =>
    query.trim().length >= 1
      ? VISIBLE.filter((c) => c.prodotto.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
      : [],
    [query]
  )

  const catalogList = useMemo(() => {
    if (query.trim()) return []
    if (activeCategory) return VISIBLE.filter((c) => c.categoria === activeCategory)
    return VISIBLE
  }, [query, activeCategory])

  const grouped = useMemo(() => {
    const map = new Map<string, Ingredient[]>()
    for (const item of catalogList) {
      const arr = map.get(item.categoria) ?? []
      arr.push(item)
      map.set(item.categoria, arr)
    }
    return map
  }, [catalogList])

  function addIngredient(ing: Ingredient) {
    setRows((prev) => [
      ...prev,
      { _key: Math.random().toString(36).slice(2), ingredient: ing, quantity: 1 },
    ])
    setQuery('')
    setDropdownOpen(false)
  }

  function updateQty(key: string, qty: number) {
    setRows((prev) => prev.map((r) => r._key === key ? { ...r, quantity: qty } : r))
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
  }, [])

  const totalCost = rows.reduce((sum, r) => sum + r.quantity * r.ingredient.pvMedio, 0)
  const price = parseFloat(sellingPrice.replace(',', '.')) || 0
  const foodCostPct = pct(totalCost, price)
  const pctColor = !foodCostPct ? ''
    : parseFloat(foodCostPct) <= 28 ? 'text-emerald-600'
    : parseFloat(foodCostPct) <= 35 ? 'text-amber-500'
    : 'text-red-600'

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Calcolo Food Cost</h1>
            <p className="text-xs text-slate-400">Seleziona ingredienti dal catalogo e calcola il costo</p>
          </div>
        </div>
        <button onClick={reset} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Nome piatto */}
      <div className="card">
        <label className="label">Nome piatto (opzionale)</label>
        <input
          className="input"
          placeholder="es. Siamo Fritti, Gran Tagliata…"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── COLONNA SINISTRA: Catalogo ── */}
        <div className="space-y-3">
          <div className="card">
            <label className="label">Cerca nel catalogo</label>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-300" />
                <input
                  className="input pl-8"
                  placeholder="Digita per cercare un prodotto…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
                  onFocus={() => query.trim() && setDropdownOpen(true)}
                />
                {query && (
                  <button
                    className="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500"
                    onClick={() => { setQuery(''); setDropdownOpen(false) }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {dropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {searchResults.map((ing) => (
                    <button
                      key={ing.codice}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); addIngredient(ing) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-medium text-slate-700">{ing.prodotto}</span>
                        <span className="ml-2 text-[10px] text-slate-400 uppercase">{ing.categoria}</span>
                      </div>
                      <span className="text-slate-500 text-xs shrink-0">{fmt(ing.pvMedio)}</span>
                    </button>
                  ))}
                </div>
              )}
              {dropdownOpen && query.trim().length >= 1 && searchResults.length === 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400">
                  Nessun prodotto trovato per &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Filtri categoria */}
          <div className="card p-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tutti
              </button>
              {ALL_CATS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Lista catalogo */}
          {!query.trim() && (
            <div className="card p-0 overflow-hidden max-h-[520px] overflow-y-auto">
              {ALL_CATS.filter((cat) => !activeCategory || cat === activeCategory).map((cat) => {
                const items = grouped.get(cat)
                if (!items || items.length === 0) return null
                return (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat}</span>
                      <span className="ml-2 text-[10px] text-slate-400">{items.length} prodotti</span>
                    </div>
                    {items.map((ing) => (
                      <button
                        key={ing.codice}
                        type="button"
                        onClick={() => addIngredient(ing)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                          <span className="text-sm text-slate-700 truncate">{ing.prodotto}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-medium text-slate-600">{fmt(ing.pvMedio)}</span>
                          <span className="ml-1 text-[10px] text-slate-400">/{ing.ub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── COLONNA DESTRA: Ricetta ── */}
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Ingredienti ricetta
                {dishName && <span className="ml-2 text-slate-400 font-normal">— {dishName}</span>}
              </h2>
              {rows.length > 0 && (
                <span className="text-xs text-slate-400">{rows.length} {rows.length === 1 ? 'riga' : 'righe'}</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-2 px-3 font-medium">Ingrediente</th>
                    <th className="text-center py-2 px-2 font-medium w-20">Qtà</th>
                    <th className="text-center py-2 px-2 font-medium w-12">Ud</th>
                    <th className="text-right py-2 px-2 font-medium w-20">Costo</th>
                    <th className="text-right py-2 px-2 font-medium w-20">Totale</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        <Plus size={20} className="text-slate-200 mx-auto mb-2" />
                        Clicca un prodotto dal catalogo per aggiungerlo
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const rowTotal = row.quantity * row.ingredient.pvMedio
                    const missing = row.ingredient.pvMedio === 0
                    return (
                      <tr key={row._key} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="text-xs font-medium text-slate-700 leading-tight">{row.ingredient.prodotto}</div>
                          {missing && <div className="text-[10px] text-amber-500">⚠ costo 0</div>}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input py-1 text-xs text-center w-16 mx-auto block"
                            value={row.quantity === 0 ? '' : row.quantity}
                            placeholder="0"
                            onChange={(e) => updateQty(row._key, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400 text-xs">{row.ingredient.ub}</td>
                        <td className="py-2 px-2 text-right text-xs text-slate-500">
                          {missing ? <span className="text-amber-400">—</span> : fmt(row.ingredient.pvMedio)}
                        </td>
                        <td className="py-2 px-2 text-right text-xs font-semibold text-slate-800">
                          {missing ? <span className="text-amber-400">—</span> : fmt(rowTotal)}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row._key)}
                            className="text-slate-300 hover:text-red-500 transition-colors mx-auto block"
                          >
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
                {rows.some((r) => r.ingredient.pvMedio === 0) && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    ⚠ Alcuni ingredienti hanno costo 0 — totale potrebbe essere incompleto.
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
                        type="number"
                        min="0"
                        step="0.01"
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
