'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Trash2, FlaskConical, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Ingredient, RecipeItem } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'

const UNITS = ['kg', 'g', 'L', 'ml', 'pz', 'fetta', 'porzione']

function formatCost(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
}

function calcLineCost(qty: number, unit: string, costPerUnit: number) {
  if (unit === 'g') return (qty / 1000) * costPerUnit
  if (unit === 'ml') return (qty / 1000) * costPerUnit
  return qty * costPerUnit
}

function RecipesPageInner() {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [dishes, setDishes] = useState<{ name: string; category: string | null }[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('Tutte')
  const [expandedDish, setExpandedDish] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  // Stato nuovo ingrediente anagrafica
  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', cost_per_unit: '', supplier: '' })
  const [addingIng, setAddingIng] = useState(false)
  const [ingSearch, setIngSearch] = useState('')

  // Stato aggiunta riga ricetta
  const [addingLine, setAddingLine] = useState<string | null>(null)
  const [newLine, setNewLine] = useState({ ingredient_id: '', quantity: '' })

  // Valori stringa temporanei per i campi costo (evita troncamento durante digitazione)
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})

  // Ricerca ingrediente nel form aggiunta riga ricetta
  const [ingLineSearch, setIngLineSearch] = useState('')
  const [ingLineDropdown, setIngLineDropdown] = useState(false)

  useEffect(() => {
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: catalogData }, { data: ingData }, { data: recipeData }] = await Promise.all([
      sb.from('catalog_items').select('name, category').order('category').order('name'),
      sb.from('ingredients').select('*').order('name'),
      sb.from('recipe_items').select('*, ingredient:ingredients(*)').order('dish_name'),
    ])
    setDishes((catalogData ?? []) as { name: string; category: string | null }[])
    setIngredients((ingData ?? []) as Ingredient[])
    setRecipes((recipeData ?? []) as RecipeItem[])
    setLoading(false)
  }

  async function saveIngredient() {
    if (!newIng.name.trim()) return
    setAddingIng(true)
    const { data, error } = await sb.from('ingredients').insert({
      name: newIng.name.trim(),
      unit: newIng.unit,
      cost_per_unit: parseFloat(newIng.cost_per_unit.replace(',', '.')) || 0,
      supplier: newIng.supplier || null,
    }).select().single()
    if (!error && data) {
      setIngredients((prev) => [...prev, data as Ingredient].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setNewIng({ name: '', unit: 'kg', cost_per_unit: '', supplier: '' })
    setAddingIng(false)
  }

  async function updateIngCost(id: string, cost: string) {
    const val = parseFloat(cost.replace(',', '.')) || 0
    await sb.from('ingredients').update({ cost_per_unit: val }).eq('id', id)
    setIngredients((prev) => prev.map((i) => i.id === id ? { ...i, cost_per_unit: val } : i))
  }

  async function deleteIngredient(id: string) {
    if (!confirm('Eliminare questo ingrediente? Verrà rimosso da tutte le ricette.')) return
    await sb.from('ingredients').delete().eq('id', id)
    setIngredients((prev) => prev.filter((i) => i.id !== id))
    setRecipes((prev) => prev.filter((r) => r.ingredient_id !== id))
  }

  async function addRecipeLine(dishName: string) {
    if (!newLine.ingredient_id || !newLine.quantity) return
    const { data, error } = await sb.from('recipe_items').insert({
      dish_name: dishName,
      ingredient_id: newLine.ingredient_id,
      quantity: parseFloat(newLine.quantity.replace(',', '.')) || 0,
    }).select('*, ingredient:ingredients(*)').single()
    if (!error && data) {
      setRecipes((prev) => [...prev, data as RecipeItem])
    }
    setNewLine({ ingredient_id: '', quantity: '' })
    setAddingLine(null)
  }

  async function deleteRecipeLine(id: string) {
    await sb.from('recipe_items').delete().eq('id', id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }

  function dishCost(dishName: string) {
    return recipes
      .filter((r) => r.dish_name === dishName)
      .reduce((sum, r) => {
        const ing = r.ingredient as Ingredient | undefined
        if (!ing) return sum
        return sum + calcLineCost(r.quantity, ing.unit, ing.cost_per_unit)
      }, 0)
  }

  const categories = useMemo(() => {
    const cats = Array.from(new Set(dishes.map((d) => d.category ?? '—'))).sort()
    return ['Tutte', ...cats]
  }, [dishes])

  const filteredDishes = useMemo(() =>
    dishes.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCategory === 'Tutte' || d.category === filterCategory
      return matchSearch && matchCat
    }),
    [dishes, search, filterCategory]
  )

  const groupedDishes = useMemo(() => {
    const map = new Map<string, { name: string; category: string | null }[]>()
    for (const d of filteredDishes) {
      const cat = d.category ?? '—'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(d)
    }
    return map
  }, [filteredDishes])

  const filteredIngredients = useMemo(() =>
    ingredients.filter((i) => i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
  )

  const dishesWithRecipe = useMemo(() => new Set(recipes.map((r) => r.dish_name)), [recipes])

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="text-purple-500" size={22} />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Distinta Base</h1>
          <p className="text-sm text-slate-500">Ingredienti e food cost per porzione</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
              <Package size={15} className="text-slate-400" />
              Ingredienti ({ingredients.length})
            </h2>

            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
              <input
                className="input text-sm"
                placeholder="Nome ingrediente *"
                value={newIng.name}
                onChange={(e) => setNewIng((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && saveIngredient()}
              />
              <div className="flex gap-2">
                <select className="input text-sm flex-1" value={newIng.unit} onChange={(e) => setNewIng((p) => ({ ...p, unit: e.target.value }))}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
                <input
                  className="input text-sm flex-1"
                  placeholder="€/unità"
                  value={newIng.cost_per_unit}
                  onChange={(e) => setNewIng((p) => ({ ...p, cost_per_unit: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && saveIngredient()}
                />
              </div>
              <input
                className="input text-sm"
                placeholder="Fornitore (opzionale)"
                value={newIng.supplier}
                onChange={(e) => setNewIng((p) => ({ ...p, supplier: e.target.value }))}
              />
              <button
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                onClick={saveIngredient}
                disabled={addingIng || !newIng.name.trim()}
              >
                {addingIng ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Aggiungi ingrediente
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
              <input className="input pl-8 text-sm" placeholder="Cerca..." value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredIngredients.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">Nessun ingrediente</p>
              )}
              {filteredIngredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{ing.name}</p>
                    <p className="text-[10px] text-slate-400">{ing.unit}</p>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input text-xs text-right w-20 py-1"
                    value={costInputs[ing.id] !== undefined ? costInputs[ing.id] : (ing.cost_per_unit === 0 ? '' : String(ing.cost_per_unit))}
                    placeholder="0"
                    onChange={(e) => setCostInputs((prev) => ({ ...prev, [ing.id]: e.target.value }))}
                    onBlur={(e) => {
                      const val = e.target.value.replace(',', '.')
                      const num = parseFloat(val) || 0
                      setIngredients((prev) => prev.map((i) => i.id === ing.id ? { ...i, cost_per_unit: num } : i))
                      setCostInputs((prev) => { const n = { ...prev }; delete n[ing.id]; return n })
                      updateIngCost(ing.id, val)
                    }}
                    title={`€ per ${ing.unit}`}
                  />
                  <span className="text-[10px] text-slate-400">/{ing.unit}</span>
                  <button
                    onClick={() => deleteIngredient(ing.id)}
                    className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                className="input pl-9"
                placeholder="Cerca piatto..."
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
          </div>

          <p className="text-xs text-slate-400">{filteredDishes.length} piatti · {dishesWithRecipe.size} con ricetta</p>

          {Array.from(groupedDishes.entries()).map(([cat, catDishes]) => {
            const isCatCollapsed = collapsedCats.has(cat)
            const catWithRecipe = catDishes.filter((d) => dishesWithRecipe.has(d.name)).length
            return (
            <div key={cat}>
              <button
                className="flex items-center gap-2 mt-4 mb-2 w-full text-left group"
                onClick={() => setCollapsedCats((prev) => {
                  const next = new Set(prev)
                  if (next.has(cat)) next.delete(cat); else next.add(cat)
                  return next
                })}
              >
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg group-hover:bg-slate-200 transition-colors">{cat}</span>
                <span className="text-xs text-slate-400">{catDishes.length} piatti{catWithRecipe > 0 ? ` · ${catWithRecipe} con ricetta` : ''}</span>
                <ChevronDown size={14} className={`text-slate-300 ml-auto transition-transform ${isCatCollapsed ? '-rotate-90' : ''}`} />
              </button>

              {!isCatCollapsed && catDishes.map((dishObj) => {
                const dish = dishObj.name
                const lines = recipes.filter((r) => r.dish_name === dish)
                const cost = dishCost(dish)
                const isOpen = expandedDish === dish
                const hasRecipe = lines.length > 0

                return (
                  <div key={dish} className={`card mb-2 transition-all ${hasRecipe ? 'border-l-4 border-l-purple-400' : ''}`}>
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setExpandedDish(isOpen ? null : dish)}
                    >
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{dish}</p>
                        {hasRecipe ? (
                          <p className="text-xs text-purple-600 font-medium mt-0.5">
                            Food cost: {formatCost(cost)} · {lines.length} ingredienti
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">Nessuna ricetta</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasRecipe && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-medium">
                            {formatCost(cost)}
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {lines.length > 0 && (
                          <table className="w-full text-xs mb-3">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-100">
                                <th className="text-left py-1 font-medium">Ingrediente</th>
                                <th className="text-right py-1 font-medium">Quantità</th>
                                <th className="text-right py-1 font-medium">Costo</th>
                                <th className="w-6"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {lines.map((line) => {
                                const ing = line.ingredient as Ingredient | undefined
                                const lineCost = ing ? calcLineCost(line.quantity, ing.unit, ing.cost_per_unit) : 0
                                return (
                                  <tr key={line.id} className="group">
                                    <td className="py-1.5 text-slate-700 font-medium">{ing?.name ?? '—'}</td>
                                    <td className="py-1.5 text-right text-slate-500">{parseFloat(String(line.quantity))} {ing?.unit}</td>
                                    <td className="py-1.5 text-right text-slate-600">{formatCost(lineCost)}</td>
                                    <td className="py-1.5 text-right">
                                      <button
                                        onClick={() => deleteRecipeLine(line.id)}
                                        className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                              <tr className="font-semibold border-t border-slate-200">
                                <td className="py-2 text-slate-700" colSpan={2}>Totale food cost</td>
                                <td className="py-2 text-right text-purple-700">{formatCost(cost)}</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {addingLine === dish ? (
                          <div className="flex gap-2 items-center mt-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                className="input text-xs w-full"
                                placeholder="Cerca ingrediente..."
                                value={ingLineSearch}
                                onChange={(e) => {
                                  setIngLineSearch(e.target.value)
                                  setIngLineDropdown(true)
                                  if (!e.target.value) setNewLine((p) => ({ ...p, ingredient_id: '' }))
                                }}
                                onFocus={() => setIngLineDropdown(true)}
                                onBlur={() => setTimeout(() => setIngLineDropdown(false), 150)}
                              />
                              {ingLineDropdown && ingLineSearch.trim().length >= 1 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                  {ingredients
                                    .filter((i) => i.name.toLowerCase().includes(ingLineSearch.toLowerCase()))
                                    .slice(0, 10)
                                    .map((i) => (
                                      <button
                                        key={i.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs border-b border-slate-50 last:border-0 flex justify-between gap-2"
                                        onMouseDown={() => {
                                          setNewLine((p) => ({ ...p, ingredient_id: i.id }))
                                          setIngLineSearch(i.name)
                                          setIngLineDropdown(false)
                                        }}
                                      >
                                        <span className="font-medium text-slate-700">{i.name}</span>
                                        <span className="text-slate-400 shrink-0">{i.unit}</span>
                                      </button>
                                    ))}
                                  {ingredients.filter((i) => i.name.toLowerCase().includes(ingLineSearch.toLowerCase())).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-slate-400">Nessun risultato</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="input text-xs w-24 text-right"
                              placeholder="Quantità"
                              value={newLine.quantity}
                              onChange={(e) => setNewLine((p) => ({ ...p, quantity: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addRecipeLine(dish)}
                            />
                            <button className="btn-primary text-xs px-3 py-1.5" onClick={() => { addRecipeLine(dish); setIngLineSearch('') }}>
                              Aggiungi
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 text-xs" onClick={() => { setAddingLine(null); setIngLineSearch('') }}>
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1"
                            onClick={() => { setAddingLine(dish); setNewLine({ ingredient_id: '', quantity: '' }) }}
                          >
                            <Plus size={13} /> Aggiungi ingrediente
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <RecipesPageInner />
}
