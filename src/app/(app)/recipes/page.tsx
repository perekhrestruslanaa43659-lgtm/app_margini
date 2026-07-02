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

  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', cost_per_unit: '', supplier: '' })
  const [addingIng, setAddingIng] = useState(false)
  const [ingSearch, setIngSearch] = useState('')

  const [addingLine, setAddingLine] = useState<string | null>(null)
  const [newLine, setNewLine] = useState({ ingredient_id: '', quantity: '' })

  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({})
  const [editIngSearch, setEditIngSearch] = useState<Record<string, string>>({})
  const [editIngDropdown, setEditIngDropdown] = useState<string | null>(null)

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

  async function updateRecipeQty(id: string, raw: string) {
    const val = parseFloat(raw.replace(',', '.'))
    if (isNaN(val) || val <= 0) return
    await sb.from('recipe_items').update({ quantity: val }).eq('id', id)
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, quantity: val } : r))
  }

  async function updateRecipeIngredient(lineId: string, newIngredientId: string) {
    const ing = ingredients.find((i) => i.id === newIngredientId)
    if (!ing) return
    const { data, error } = await sb.from('recipe_items')
      .update({ ingredient_id: newIngredientId })
      .eq('id', lineId)
      .select('*, ingredient:ingredients(*)')
      .single()
    if (!error && data) {
      setRecipes((prev) => prev.map((r) => r.id === lineId ? (data as RecipeItem) : r))
    }
  }

  async function updateRecipeUnit(lineId: string, newUnit: string, ingredientId: string) {
    await sb.from('ingredients').update({ unit: newUnit }).eq('id', ingredientId)
    setIngredients((prev) => prev.map((i) => i.id === ingredientId ? { ...i, unit: newUnit } : i))
    setRecipes((prev) => prev.map((r) => {
      if (r.id !== lineId) return r
      const ing = r.ingredient as Ingredient | undefined
      if (!ing) return r
      return { ...r, ingredient: { ...ing, unit: newUnit } }
    }))
  }

  function dishCost(dishName: string) {
    return recipes
      .filter((r) => r.dish_name === dishName)
      .reduce((sum, r) => {
        const ing = ingredients.find((i) => i.id === r.ingredient_id) ?? (r.ingredient as Ingredient | undefined)
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

  useEffect(() => {
    if (dishes.length > 0) {
      const cats = new Set(dishes.map((d) => d.category ?? '—'))
      setCollapsedCats(cats)
    }
  }, [dishes])

  const filteredIngredients = useMemo(() =>
    ingredients.filter((i) => i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
  )

  const dishesWithRecipe = useMemo(() => new Set(recipes.map((r) => r.dish_name)), [recipes])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Caricamento...</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-2 py-2 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
          <FlaskConical size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Distinta Base</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ingredienti e food cost per porzione</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── COLONNA SINISTRA ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Form nuovo ingrediente */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package size={13} className="text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">Nuovo ingrediente</h2>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Nome *</label>
                <input
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="es. Hamburger Bovino 180g"
                  value={newIng.name}
                  onChange={(e) => setNewIng((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && saveIngredient()}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Unità & Costo</label>
                <div className="flex gap-2">
                  <select
                    className="h-11 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white w-24"
                    value={newIng.unit}
                    onChange={(e) => setNewIng((p) => ({ ...p, unit: e.target.value }))}
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <input
                    className="flex-1 h-11 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="€/unità"
                    value={newIng.cost_per_unit}
                    onChange={(e) => setNewIng((p) => ({ ...p, cost_per_unit: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && saveIngredient()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Fornitore</label>
                <input
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="Opzionale"
                  value={newIng.supplier}
                  onChange={(e) => setNewIng((p) => ({ ...p, supplier: e.target.value }))}
                />
              </div>

              <button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveIngredient}
                disabled={addingIng || !newIng.name.trim()}
              >
                {addingIng ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Aggiungi ingrediente
              </button>
            </div>
          </div>

          {/* Lista ingredienti */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ingredienti</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ingredients.length}</span>
            </div>

            <div className="px-4 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={13} />
                <input
                  className="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="Cerca..."
                  value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {filteredIngredients.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">Nessun ingrediente</p>
              )}
              {filteredIngredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{ing.name}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {ing.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-xs text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      value={costInputs[ing.id] !== undefined ? costInputs[ing.id] : (ing.cost_per_unit === 0 ? '' : String(ing.cost_per_unit))}
                      placeholder="0"
                      onChange={(e) => setCostInputs((prev) => ({ ...prev, [ing.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      onBlur={(e) => {
                        const val = e.target.value.replace(',', '.')
                        const num = parseFloat(val) || 0
                        setIngredients((prev) => prev.map((i) => i.id === ing.id ? { ...i, cost_per_unit: num } : i))
                        setCostInputs((prev) => { const n = { ...prev }; delete n[ing.id]; return n })
                        updateIngCost(ing.id, val)
                      }}
                      title={`€ per ${ing.unit}`}
                    />
                    <span className="text-[10px] text-slate-400">€</span>
                  </div>
                  <button
                    onClick={() => deleteIngredient(ing.id)}
                    className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLONNA DESTRA ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Barra ricerca + filtro */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
              <input
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 shadow-sm text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Cerca piatto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-11 px-3 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition w-44"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Stat bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {filteredDishes.length} piatti
            </span>
            <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full font-medium">
              {dishesWithRecipe.size} con ricetta
            </span>
          </div>

          {/* Categorie e piatti */}
          <div className="space-y-3">
            {Array.from(groupedDishes.entries()).map(([cat, catDishes]) => {
              const isCatCollapsed = collapsedCats.has(cat)
              const catWithRecipe = catDishes.filter((d) => dishesWithRecipe.has(d.name)).length
              return (
                <div key={cat}>
                  {/* Header categoria */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    onClick={() => setCollapsedCats((prev) => {
                      const next = new Set(prev)
                      if (next.has(cat)) next.delete(cat); else next.add(cat)
                      return next
                    })}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="text-sm font-semibold text-slate-700">{cat}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {catDishes.length} piatti{catWithRecipe > 0 ? ` · ${catWithRecipe} con ricetta` : ''}
                      </span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`text-slate-400 transition-transform duration-200 ${isCatCollapsed ? '' : 'rotate-180'}`}
                    />
                  </button>

                  {/* Piatti della categoria */}
                  {!isCatCollapsed && (
                    <div className="mt-2 space-y-2 pl-2">
                      {catDishes.map((dishObj) => {
                        const dish = dishObj.name
                        const lines = recipes.filter((r) => r.dish_name === dish)
                        const cost = dishCost(dish)
                        const isOpen = expandedDish === dish
                        const hasRecipe = lines.length > 0

                        return (
                          <div
                            key={dish}
                            className={`bg-white border rounded-xl shadow-sm transition-all hover:shadow-md ${hasRecipe ? 'border-l-4 border-l-purple-400 border-slate-200' : 'border-slate-200'}`}
                          >
                            <button
                              className="w-full flex items-center justify-between text-left px-4 py-4"
                              onClick={() => setExpandedDish(isOpen ? null : dish)}
                            >
                              <div>
                                <p className="font-medium text-slate-700 text-sm">{dish}</p>
                                {hasRecipe ? (
                                  <p className="text-xs text-purple-600 font-medium mt-1">
                                    Food cost: {formatCost(cost)} · {lines.length} ingredienti
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 mt-1">Nessuna ricetta</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                {hasRecipe && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-semibold">
                                    {formatCost(cost)}
                                  </span>
                                )}
                                {isOpen
                                  ? <ChevronUp size={16} className="text-slate-400" />
                                  : <ChevronDown size={16} className="text-slate-400" />
                                }
                              </div>
                            </button>

                            {isOpen && (
                              <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                                {lines.length > 0 && (
                                  <table className="w-full text-xs mb-4">
                                    <thead>
                                      <tr className="text-slate-400 border-b border-slate-100">
                                        <th className="text-left py-2 font-medium uppercase tracking-wide text-[10px]">Ingrediente</th>
                                        <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px]">Quantità</th>
                                        <th className="text-right py-2 font-medium uppercase tracking-wide text-[10px]">Costo</th>
                                        <th className="w-6" />
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {lines.map((line) => {
                                        const ing = ingredients.find((i) => i.id === line.ingredient_id) ?? (line.ingredient as Ingredient | undefined)
                                        const lineCost = ing ? calcLineCost(line.quantity, ing.unit, ing.cost_per_unit) : 0
                                        const isEditingIng = editIngDropdown === line.id
                                        const currentIngSearch = editIngSearch[line.id] !== undefined ? editIngSearch[line.id] : (ing?.name ?? '')
                                        return (
                                          <tr key={line.id} className="group">
                                            {/* Colonna ingrediente — dropdown search */}
                                            <td className="py-2 pr-2">
                                              <div className="relative">
                                                <input
                                                  type="text"
                                                  className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                                  value={currentIngSearch}
                                                  onChange={(e) => {
                                                    setEditIngSearch((prev) => ({ ...prev, [line.id]: e.target.value }))
                                                    setEditIngDropdown(line.id)
                                                  }}
                                                  onFocus={() => {
                                                    setEditIngSearch((prev) => ({ ...prev, [line.id]: ing?.name ?? '' }))
                                                    setEditIngDropdown(line.id)
                                                  }}
                                                  onBlur={() => setTimeout(() => {
                                                    setEditIngDropdown(null)
                                                    setEditIngSearch((prev) => { const n = { ...prev }; delete n[line.id]; return n })
                                                  }, 150)}
                                                />
                                                {isEditingIng && currentIngSearch.trim().length >= 1 && (
                                                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                    {ingredients
                                                      .filter((i) => i.name.toLowerCase().includes(currentIngSearch.toLowerCase()))
                                                      .slice(0, 10)
                                                      .map((i) => (
                                                        <button
                                                          key={i.id}
                                                          type="button"
                                                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs border-b border-slate-50 last:border-0 flex justify-between gap-2"
                                                          onMouseDown={() => {
                                                            updateRecipeIngredient(line.id, i.id)
                                                            setEditIngSearch((prev) => { const n = { ...prev }; delete n[line.id]; return n })
                                                            setEditIngDropdown(null)
                                                          }}
                                                        >
                                                          <span className="font-medium text-slate-700">{i.name}</span>
                                                          <span className="text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{i.unit}</span>
                                                        </button>
                                                      ))}
                                                    {ingredients.filter((i) => i.name.toLowerCase().includes(currentIngSearch.toLowerCase())).length === 0 && (
                                                      <div className="px-3 py-3 text-xs text-slate-400 text-center">Nessun risultato</div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            {/* Colonna quantità + unità */}
                                            <td className="py-2 text-right">
                                              <div className="inline-flex items-center gap-1 justify-end">
                                                <input
                                                  type="text"
                                                  inputMode="decimal"
                                                  className="w-16 h-7 px-2 rounded-lg border border-slate-200 text-xs text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                                  value={qtyInputs[line.id] !== undefined ? qtyInputs[line.id] : String(parseFloat(String(line.quantity)))}
                                                  onChange={(e) => setQtyInputs((prev) => ({ ...prev, [line.id]: e.target.value }))}
                                                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                                  onBlur={(e) => {
                                                    const raw = e.target.value
                                                    setQtyInputs((prev) => { const n = { ...prev }; delete n[line.id]; return n })
                                                    updateRecipeQty(line.id, raw)
                                                  }}
                                                />
                                                <select
                                                  className="h-7 px-1 rounded-lg border border-slate-200 text-[10px] text-slate-500 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                                  value={unitInputs[line.id] !== undefined ? unitInputs[line.id] : (ing?.unit ?? 'pz')}
                                                  onChange={(e) => {
                                                    const u = e.target.value
                                                    setUnitInputs((prev) => ({ ...prev, [line.id]: u }))
                                                    if (ing?.id) updateRecipeUnit(line.id, u, ing.id)
                                                  }}
                                                >
                                                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                                                </select>
                                              </div>
                                            </td>
                                            <td className="py-2 text-right text-slate-600 font-medium">{formatCost(lineCost)}</td>
                                            <td className="py-2 text-right">
                                              <button
                                                onClick={() => deleteRecipeLine(line.id)}
                                                className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                      <tr className="border-t border-slate-200">
                                        <td className="pt-3 pb-1 text-xs font-semibold text-slate-600 uppercase tracking-wide" colSpan={2}>Totale food cost</td>
                                        <td className="pt-3 pb-1 text-right font-bold text-purple-700 text-sm">{formatCost(cost)}</td>
                                        <td />
                                      </tr>
                                    </tbody>
                                  </table>
                                )}

                                {addingLine === dish ? (
                                  <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-xs border-b border-slate-50 last:border-0 flex justify-between gap-2"
                                                onMouseDown={() => {
                                                  setNewLine((p) => ({ ...p, ingredient_id: i.id }))
                                                  setIngLineSearch(i.name)
                                                  setIngLineDropdown(false)
                                                }}
                                              >
                                                <span className="font-medium text-slate-700">{i.name}</span>
                                                <span className="text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{i.unit}</span>
                                              </button>
                                            ))}
                                          {ingredients.filter((i) => i.name.toLowerCase().includes(ingLineSearch.toLowerCase())).length === 0 && (
                                            <div className="px-3 py-3 text-xs text-slate-400 text-center">Nessun risultato</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className="w-24 h-9 px-3 rounded-lg border border-slate-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                      placeholder="Qtà"
                                      value={newLine.quantity}
                                      onChange={(e) => setNewLine((p) => ({ ...p, quantity: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && addRecipeLine(dish)}
                                    />
                                    <button
                                      className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition"
                                      onClick={() => { addRecipeLine(dish); setIngLineSearch('') }}
                                    >
                                      Aggiungi
                                    </button>
                                    <button
                                      className="h-9 px-3 text-slate-500 hover:text-slate-700 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                                      onClick={() => { setAddingLine(null); setIngLineSearch('') }}
                                    >
                                      Annulla
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
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
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <RecipesPageInner />
}
