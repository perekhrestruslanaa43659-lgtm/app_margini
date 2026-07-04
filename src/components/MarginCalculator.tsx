'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Search, Loader2, ChevronDown } from 'lucide-react'
import { computeMargin, formatCurrency, formatPct, marginColor } from '@/lib/margin'
import { createClient } from '@/lib/supabase/client'
import type { EventItem, ItemType } from '@/lib/supabase/types'

interface DishRow {
  id: string
  dishName: string
  sellingPrice: number   // da catalog_items
  foodCost: number       // calcolato da recipe_items
  quantity: number       // n° porzioni
}

interface ManualRow {
  id: string
  type: ItemType
  name: string
  quantity: number
  unit_price: number
  vat_rate: number
}

type CatalogDish = { name: string; unit_price: number; category: string | null }

function uid() { return Math.random().toString(36).slice(2) }

export function MarginCalculator() {
  const [guests, setGuests] = useState<number | ''>(1)
  const [discount, setDiscount] = useState(0)

  // Piatti dal catalogo
  const [catalog, setCatalog] = useState<CatalogDish[]>([])
  // Food cost per piatto { dishName -> costo porzione }
  const [foodCosts, setFoodCosts] = useState<Record<string, number>>({})
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  // Righe piatti selezionati
  const [dishRows, setDishRows] = useState<DishRow[]>([])
  // Righe manuali extra (costi fissi, extra ricavi)
  const [manualRows, setManualRows] = useState<ManualRow[]>([])

  // Dropdown ricerca piatto
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function load() {
      setLoadingCatalog(true)
      const sb = createClient() as ReturnType<typeof createClient> & Record<string, unknown>
      const [{ data: catData }, { data: recipeData }] = await Promise.all([
        (sb as unknown as { from: (t: string) => { select: (s: string) => { order: (f: string) => Promise<{ data: unknown[] | null }> } } })
          .from('catalog_items').select('name, unit_price, category').order('name'),
        (sb as unknown as { from: (t: string) => { select: (s: string) => Promise<{ data: unknown[] | null }> } })
          .from('recipe_items').select('dish_name, quantity, ingredient:ingredients(cost_per_unit, unit)'),
      ])

      setCatalog((catData ?? []) as CatalogDish[])

      // Calcola food cost per piatto
      const costs: Record<string, number> = {}
      for (const row of (recipeData ?? []) as { dish_name: string; quantity: number; ingredient: { cost_per_unit: number; unit: string } | null }[]) {
        const ing = row.ingredient
        if (!ing) continue
        const lineCost = ing.unit === 'g' || ing.unit === 'ml'
          ? (row.quantity / 1000) * ing.cost_per_unit
          : row.quantity * ing.cost_per_unit
        costs[row.dish_name] = (costs[row.dish_name] ?? 0) + lineCost
      }
      setFoodCosts(costs)
      setLoadingCatalog(false)
    }
    load()
  }, [])

  function addDish(dish: CatalogDish) {
    setDishRows((prev) => {
      const existing = prev.find((r) => r.dishName === dish.name)
      if (existing) {
        return prev.map((r) => r.dishName === dish.name ? { ...r, quantity: r.quantity + 1 } : r)
      }
      return [...prev, {
        id: uid(),
        dishName: dish.name,
        sellingPrice: dish.unit_price,
        foodCost: foodCosts[dish.name] ?? 0,
        quantity: 1,
      }]
    })
    setSearch('')
    setShowDropdown(false)
  }

  function updateDishQty(id: string, qty: number) {
    setDishRows((prev) => prev.map((r) => r.id === id ? { ...r, quantity: Math.max(1, qty) } : r))
  }

  function removeDish(id: string) {
    setDishRows((prev) => prev.filter((r) => r.id !== id))
  }

  function addManual(type: ItemType) {
    setManualRows((prev) => [...prev, { id: uid(), type, name: '', quantity: 1, unit_price: 0, vat_rate: type === 'ricavo' ? 10 : 22 }])
  }

  function updateManual(id: string, field: keyof ManualRow, value: unknown) {
    setManualRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  function removeManual(id: string) {
    setManualRows((prev) => prev.filter((r) => r.id !== id))
  }

  // Costruisce le righe per computeMargin
  const allRows = useMemo((): EventItem[] => {
    const fromDishes: EventItem[] = dishRows.flatMap((d) => [
      // Ricavo: prezzo di vendita × quantità
      { id: d.id + '_r', type: 'ricavo' as ItemType, category: 'Menu', name: d.dishName, quantity: d.quantity, unit_price: d.sellingPrice, vat_rate: 10, notes: null, event_id: '' },
      // Costo: food cost × quantità
      ...(d.foodCost > 0 ? [{ id: d.id + '_c', type: 'costo' as ItemType, category: 'Food Cost', name: d.dishName, quantity: d.quantity, unit_price: d.foodCost, vat_rate: 10, notes: null, event_id: '' }] : []),
    ])
    const fromManual: EventItem[] = manualRows.map((r) => ({
      id: r.id, type: r.type, category: null, name: r.name, quantity: r.quantity, unit_price: r.unit_price, vat_rate: r.vat_rate, notes: null, event_id: '',
    }))
    return [...fromDishes, ...fromManual]
  }, [dishRows, manualRows])

  const summary = useMemo(() => computeMargin(allRows, guests || 1, discount), [allRows, guests, discount])
  const mc = marginColor(summary.marginPct)
  const Icon = summary.marginPct >= 30 ? TrendingUp : summary.marginPct >= 15 ? Minus : TrendingDown

  const filteredCatalog = useMemo(() =>
    catalog.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12),
    [catalog, search]
  )

  const totalFoodCost = useMemo(() =>
    dishRows.reduce((sum, d) => sum + d.foodCost * d.quantity, 0),
    [dishRows]
  )

  const totalRevenueDishes = useMemo(() =>
    dishRows.reduce((sum, d) => sum + d.sellingPrice * d.quantity, 0),
    [dishRows]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Colonna sinistra: selezione piatti + extra ── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Selezione piatti */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Search size={13} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">Piatti del menu</h2>
            {loadingCatalog && <Loader2 size={13} className="animate-spin text-slate-400 ml-auto" />}
          </div>

          <div className="px-5 py-4">
            {/* Dropdown ricerca */}
            <div className="relative mb-4">
              <Search size={13} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                className="w-full h-10 pl-8 pr-4 rounded-lg border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Cerca piatto dal catalogo..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              />
              {showDropdown && search.length >= 1 && filteredCatalog.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  {filteredCatalog.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onMouseDown={() => addDish(d)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-medium text-slate-700">{d.name}</span>
                        {d.category && <span className="ml-2 text-xs text-slate-400">{d.category}</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-600 font-semibold text-xs">{formatCurrency(d.unit_price)}</span>
                        {foodCosts[d.name] > 0 && (
                          <span className="ml-2 text-red-400 text-xs">FC {formatCurrency(foodCosts[d.name])}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabella piatti selezionati */}
            {dishRows.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-2 font-medium uppercase tracking-wide text-[10px]">Piatto</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-20">Qtà</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-24">Prezzo</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-24">Food Cost</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-24">Margine</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dishRows.map((d) => {
                    const margin = (d.sellingPrice - d.foodCost) * d.quantity
                    const pct = d.sellingPrice > 0 ? ((d.sellingPrice - d.foodCost) / d.sellingPrice) * 100 : 0
                    return (
                      <tr key={d.id} className="group">
                        <td className="py-2 font-medium text-slate-700">{d.dishName}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min="1"
                            className="w-16 h-7 px-2 rounded-lg border border-slate-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            value={d.quantity}
                            onChange={(e) => updateDishQty(d.id, parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="py-2 text-right text-emerald-600 font-semibold">{formatCurrency(d.sellingPrice * d.quantity)}</td>
                        <td className="py-2 text-right text-red-500">{d.foodCost > 0 ? formatCurrency(d.foodCost * d.quantity) : <span className="text-slate-300">—</span>}</td>
                        <td className="py-2 text-right">
                          <span className={`font-semibold ${pct >= 40 ? 'text-emerald-600' : pct >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
                            {formatCurrency(margin)}
                          </span>
                          <span className="ml-1 text-slate-400">({pct.toFixed(0)}%)</span>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeDish(d.id)} className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="py-2 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Totale piatti</td>
                    <td />
                    <td className="py-2 text-right text-xs font-bold text-emerald-600">{formatCurrency(totalRevenueDishes)}</td>
                    <td className="py-2 text-right text-xs font-bold text-red-500">{formatCurrency(totalFoodCost)}</td>
                    <td className="py-2 text-right text-xs font-bold text-slate-700">{formatCurrency(totalRevenueDishes - totalFoodCost)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <ChevronDown size={20} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">Cerca un piatto per aggiungerlo al calcolo</p>
              </div>
            )}
          </div>
        </div>

        {/* Righe extra manuali */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Voci extra</h2>
            <div className="flex gap-2">
              <button onClick={() => addManual('ricavo')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition">
                <Plus size={11} /> Ricavo
              </button>
              <button onClick={() => addManual('costo')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 transition">
                <Plus size={11} /> Costo
              </button>
            </div>
          </div>

          {manualRows.length > 0 ? (
            <div className="px-5 py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-2 font-medium uppercase tracking-wide text-[10px]">Tipo</th>
                    <th className="text-left py-2 font-medium uppercase tracking-wide text-[10px]">Nome</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-16">Qtà</th>
                    <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px] w-24">Importo</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {manualRows.map((r) => (
                    <tr key={r.id} className="group">
                      <td className="py-1.5">
                        <select
                          className={`text-[10px] font-medium rounded-lg px-2 py-1 border-0 outline-none cursor-pointer ${r.type === 'ricavo' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                          value={r.type}
                          onChange={(e) => updateManual(r.id, 'type', e.target.value)}
                        >
                          <option value="ricavo">Ricavo</option>
                          <option value="costo">Costo</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Descrizione..." value={r.name} onChange={(e) => updateManual(r.id, 'name', e.target.value)} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" min="0" className="w-14 h-7 px-2 rounded-lg border border-slate-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" value={r.quantity} onChange={(e) => updateManual(r.id, 'quantity', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" min="0" step="0.01" className="w-24 h-7 px-2 rounded-lg border border-slate-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" value={r.unit_price} onChange={(e) => updateManual(r.id, 'unit_price', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => removeManual(r.id)} className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-5">Nessuna voce extra — aggiungi costi fissi o ricavi aggiuntivi</p>
          )}
        </div>

        {/* Ospiti + Sconto */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">N° ospiti</label>
            <input
              type="number" min="1"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              value={guests}
              onChange={(e) => setGuests(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Sconto globale — <span className="font-bold text-slate-700">{discount}%</span>
            </label>
            <input type="range" min="0" max="50" step="1" className="w-full mt-2" value={discount} onChange={(e) => setDiscount(parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* ── Colonna destra: risultati ── */}
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Margine totale</h3>
            <div className={`flex items-center gap-2 text-3xl font-bold ${mc}`}>
              <Icon size={24} />
              {formatPct(summary.marginPct)}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Ricavi{discount > 0 ? ` (−${discount}%)` : ''}</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(summary.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Costi</span>
              <span className="text-red-400 font-medium">{formatCurrency(summary.totalCosts)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700 font-bold">
              <span>Margine lordo</span>
              <span className={mc}>{formatCurrency(summary.grossMargin)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Per ospite ({guests || 1} pax)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Ricavo/ospite</span>
              <span className="text-emerald-600 font-medium">{formatCurrency(summary.revenuePerGuest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Costo/ospite</span>
              <span className="text-red-500 font-medium">{formatCurrency(summary.costPerGuest)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
              <span className="text-slate-700">Margine/ospite</span>
              <span className={marginColor(summary.marginPct)}>{formatCurrency(summary.marginPerGuest)}</span>
            </div>
          </div>
        </div>

        {summary.breakEvenGuests > 0 && (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
            <p className="text-xs text-amber-600 font-medium mb-1">Breakeven ospiti</p>
            <p className="text-3xl font-bold text-amber-700">{summary.breakEvenGuests}</p>
            <p className="text-xs text-amber-500 mt-1">ospiti minimi per coprire i costi</p>
          </div>
        )}

        {dishRows.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Food Cost %</h3>
            {dishRows.map((d) => {
              const pct = d.sellingPrice > 0 ? (d.foodCost / d.sellingPrice) * 100 : 0
              return (
                <div key={d.id} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate max-w-32">{d.dishName}</span>
                    <span className={`font-semibold ${pct < 30 ? 'text-emerald-600' : pct < 45 ? 'text-amber-500' : 'text-red-500'}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct < 30 ? 'bg-emerald-400' : pct < 45 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
