'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, RotateCcw, ChefHat } from 'lucide-react'
import type { Ingredient } from '@/lib/catalog'

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

export default function CalcoloFoodCost() {
  const [catalog, setCatalog] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  const [dishName, setDishName] = useState('')
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [sellingPrice, setSellingPrice] = useState('')

  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/ingredients')
      .then((r) => r.json())
      .then((data) => { setCatalog(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = query.trim().length >= 1
    ? catalog.filter((c) => c.prodotto.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : []

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
  }, [])

  const totalCost = rows.reduce((sum, r) => sum + r.quantity * r.ingredient.pvMedio, 0)
  const price = parseFloat(sellingPrice.replace(',', '.')) || 0
  const foodCostPct = pct(totalCost, price)

  const pctColor = !foodCostPct ? ''
    : parseFloat(foodCostPct) <= 28 ? 'text-emerald-600'
    : parseFloat(foodCostPct) <= 35 ? 'text-amber-500'
    : 'text-red-600'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Calcolo Food Cost</h1>
            <p className="text-xs text-slate-400">Costruisci la ricetta e calcola il costo reale</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="btn-secondary flex items-center gap-1.5 text-xs"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Dish name */}
      <div className="card">
        <label className="label">Nome piatto (opzionale)</label>
        <input
          className="input"
          placeholder="es. Siamo Fritti, Gran Tagliata…"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
        />
      </div>

      {/* Search */}
      <div className="card">
        <label className="label">Aggiungi ingrediente</label>
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-300" />
            <input
              className="input pl-8"
              placeholder={loading ? 'Caricamento catalogo…' : 'Cerca prodotto dal catalogo…'}
              value={query}
              disabled={loading}
              onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => query.trim() && setDropdownOpen(true)}
            />
          </div>

          {dropdownOpen && filtered.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {filtered.map((ing) => (
                <button
                  key={ing.codice + ing.prodotto}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addIngredient(ing) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-medium text-slate-700">{ing.prodotto}</span>
                    <span className="ml-2 text-[10px] text-slate-400 uppercase">{ing.categoria}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-xs">{fmt(ing.pvMedio)}</span>
                    <span className="ml-1 text-slate-300 text-[10px]">/{ing.ub}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {dropdownOpen && query.trim().length >= 1 && filtered.length === 0 && !loading && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400">
              Nessun prodotto trovato per &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Recipe table */}
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
                <th className="text-left py-2.5 px-4 font-medium">Ingrediente</th>
                <th className="text-center py-2.5 px-3 font-medium w-28">Quantità</th>
                <th className="text-center py-2.5 px-3 font-medium w-16">Unità</th>
                <th className="text-right py-2.5 px-3 font-medium w-28">Costo unit.</th>
                <th className="text-right py-2.5 px-3 font-medium w-28">Totale riga</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Plus size={24} className="text-slate-200" />
                      <span>Nessun ingrediente aggiunto — cerca dal catalogo qui sopra</span>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const rowTotal = row.quantity * row.ingredient.pvMedio
                const missing = row.ingredient.pvMedio === 0
                return (
                  <tr key={row._key} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-700">{row.ingredient.prodotto}</div>
                      {missing && (
                        <div className="text-[10px] text-amber-500 mt-0.5">⚠ Costo non disponibile — inseriscilo manualmente</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input py-1 text-xs text-center w-24 mx-auto block"
                        value={row.quantity === 0 ? '' : row.quantity}
                        placeholder="0"
                        onChange={(e) => updateQty(row._key, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-xs">{row.ingredient.ub}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 text-xs">
                      {missing
                        ? <span className="text-amber-400">0,00 €</span>
                        : fmt(row.ingredient.pvMedio)
                      }
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {missing
                        ? <span className="text-amber-400">0,00 €</span>
                        : fmt(rowTotal)
                      }
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => removeRow(row._key)}
                        className="text-slate-300 hover:text-red-500 transition-colors mx-auto block"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {rows.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 space-y-4">
            {/* Missing cost warning */}
            {rows.some((r) => r.ingredient.pvMedio === 0) && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <span className="text-base leading-none">⚠</span>
                <span>
                  Alcuni ingredienti hanno costo a 0 — il totale food cost potrebbe essere incompleto.
                  Aggiorna i prezzi nel catalogo per un calcolo preciso.
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Totale Food Cost</span>
              <span className="text-xl font-bold text-slate-800">{fmt(totalCost)}</span>
            </div>

            {/* Food cost % */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">Prezzo di vendita (per calcolo food cost %)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">€</span>
                  <input
                    className="input pl-6"
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
                <div className="text-right pt-4">
                  <div className="text-xs text-slate-400 mb-1">Food Cost %</div>
                  <div className={`text-2xl font-bold ${pctColor}`}>{foodCostPct}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {parseFloat(foodCostPct) <= 28 ? 'Ottimo' : parseFloat(foodCostPct) <= 35 ? 'Accettabile' : 'Troppo alto'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
