'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Plus, Trash2, Upload, Search, Edit2, Check, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { CatalogItem, ItemType } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SetupBanner } from '@/components/ui/SetupBanner'

const CATEGORIES = ['Food', 'Bevande', 'Staff', 'Logistica', 'Extra', 'Noleggio', 'Servizio']
const VAT_OPTIONS = [0, 4, 10, 22]

interface EditState {
  type: ItemType
  category: string
  name: string
  unit_price: string
  vat_rate: string
  notes: string
}

const emptyEdit = (): EditState => ({
  type: 'costo',
  category: '',
  name: '',
  unit_price: '',
  vat_rate: '22',
  notes: '',
})

function ItemRow({
  it,
  editingId,
  editState,
  setEditState,
  saveEdit,
  setEditingId,
  startEdit,
  startInlinePrice,
  saveInlinePrice,
  inlinePrice,
  setInlinePrice,
  priceInputRef,
  setDeleteId,
}: {
  it: CatalogItem
  editingId: string | null
  editState: EditState
  setEditState: (fn: (p: EditState) => EditState) => void
  saveEdit: (id: string) => void
  setEditingId: (id: string | null) => void
  startEdit: (item: CatalogItem) => void
  startInlinePrice: (item: CatalogItem) => void
  saveInlinePrice: () => void
  inlinePrice: { id: string; value: string } | null
  setInlinePrice: (v: { id: string; value: string } | null) => void
  priceInputRef: React.RefObject<HTMLInputElement>
  setDeleteId: (id: string) => void
}) {
  if (editingId === it.id) {
    return (
      <tr className="bg-amber-50">
        <td className="px-4 py-2">
          <input className="input py-1 text-xs" value={editState.name} onChange={(e) => setEditState((p) => ({ ...p, name: e.target.value }))} />
        </td>
        <td className="px-4 py-2">
          <select className="input py-1 text-xs" value={editState.category} onChange={(e) => setEditState((p) => ({ ...p, category: e.target.value }))}>
            <option value="">—</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </td>
        <td className="px-4 py-2">
          <select className="input py-1 text-xs" value={editState.type} onChange={(e) => setEditState((p) => ({ ...p, type: e.target.value as ItemType }))}>
            <option value="costo">Costo</option>
            <option value="ricavo">Ricavo</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <input type="number" className="input py-1 text-xs text-right" value={editState.unit_price} onChange={(e) => setEditState((p) => ({ ...p, unit_price: e.target.value }))} />
        </td>
        <td className="px-4 py-2">
          <select className="input py-1 text-xs" value={editState.vat_rate} onChange={(e) => setEditState((p) => ({ ...p, vat_rate: e.target.value }))}>
            {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-1">
            <button className="text-emerald-500 hover:text-emerald-700" onClick={() => saveEdit(it.id)}><Check size={16} /></button>
            <button className="text-slate-400 hover:text-slate-700" onClick={() => setEditingId(null)}><X size={16} /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-700">{it.name}</p>
        {it.notes && <p className="text-xs text-slate-400">{it.notes}</p>}
      </td>
      <td className="px-4 py-3 text-slate-500">{it.category ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${it.type === 'ricavo' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
          {it.type === 'ricavo' ? 'Ricavo' : 'Costo'}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium text-slate-700">
        {inlinePrice?.id === it.id ? (
          <input
            ref={priceInputRef}
            type="number"
            step="0.01"
            className="input py-1 text-right w-28 text-sm"
            value={inlinePrice.value}
            onChange={(e) => setInlinePrice({ id: it.id, value: e.target.value })}
            onBlur={saveInlinePrice}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveInlinePrice()
              if (e.key === 'Escape') setInlinePrice(null)
            }}
          />
        ) : (
          <span
            className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 px-2 py-1 rounded-lg transition-colors"
            onClick={() => startInlinePrice(it)}
            title="Clicca per modificare"
          >
            {formatCurrency(it.unit_price)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-slate-500">{it.vat_rate}%</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button className="text-slate-300 hover:text-blue-500 transition-colors" onClick={() => startEdit(it)}>
            <Edit2 size={14} />
          </button>
          <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => setDeleteId(it.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

const TABLE_HEAD = (
  <thead className="bg-slate-50 border-b border-slate-100">
    <tr>
      <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
      <th className="text-left px-4 py-3 font-medium text-slate-600">Categoria</th>
      <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
      <th className="text-right px-4 py-3 font-medium text-slate-600">Prezzo</th>
      <th className="text-right px-4 py-3 font-medium text-slate-600">IVA</th>
      <th className="w-20 px-4 py-3" />
    </tr>
  </thead>
)

function CatalogPageInner() {
  const supabase = createClient()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | ItemType>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyEdit())
  const [addMode, setAddMode] = useState(false)
  const [newItem, setNewItem] = useState<EditState>(emptyEdit())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [inlinePrice, setInlinePrice] = useState<{ id: string; value: string } | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  async function fetchItems() {
    setLoading(true)
    const { data } = await sb.from('catalog_items').select('*').order('category').order('name')
    setItems((data ?? []) as CatalogItem[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchItems() }, [])

  // Collapse all categories by default once items load
  useEffect(() => {
    if (items.length === 0) return
    const cats = new Set(items.map((it) => it.category ?? '—'))
    setCollapsedCats(cats)
  }, [items])

  const availableCategories = useMemo(
    () => Array.from(new Set(items.map((it) => it.category ?? '').filter(Boolean))).sort(),
    [items]
  )

  const filtered = useMemo(() => items.filter((it) => {
    const q = search.toLowerCase()
    if (q && !it.name.toLowerCase().includes(q) && !(it.category ?? '').toLowerCase().includes(q)) return false
    if (typeFilter && it.type !== typeFilter) return false
    if (categoryFilter && it.category !== categoryFilter) return false
    return true
  }), [items, search, typeFilter, categoryFilter])

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    for (const it of filtered) {
      const cat = it.category ?? '—'
      const arr = map.get(cat) ?? []
      arr.push(it)
      map.set(cat, arr)
    }
    return map
  }, [filtered])

  const sortedCats = useMemo(() =>
    Array.from(grouped.keys()).sort(),
    [grouped]
  )

  const isFiltering = search.trim().length > 0 || typeFilter !== '' || categoryFilter !== ''

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function expandAll() {
    setCollapsedCats(new Set())
  }

  function collapseAll() {
    setCollapsedCats(new Set(sortedCats))
  }

  async function addItem() {
    if (!newItem.name.trim()) return
    await sb.from('catalog_items').insert({
      type: newItem.type,
      category: newItem.category || null,
      name: newItem.name.trim(),
      unit_price: parseFloat(newItem.unit_price) || 0,
      vat_rate: parseFloat(newItem.vat_rate) || 22,
      notes: newItem.notes || null,
    })
    setNewItem(emptyEdit())
    setAddMode(false)
    fetchItems()
  }

  async function saveEdit(id: string) {
    await sb.from('catalog_items').update({
      type: editState.type,
      category: editState.category || null,
      name: editState.name.trim(),
      unit_price: parseFloat(editState.unit_price) || 0,
      vat_rate: parseFloat(editState.vat_rate) || 22,
      notes: editState.notes || null,
    }).eq('id', id)
    setEditingId(null)
    fetchItems()
  }

  async function deleteItem(id: string) {
    await sb.from('catalog_items').delete().eq('id', id)
    setDeleteId(null)
    fetchItems()
  }

  function startInlinePrice(item: CatalogItem) {
    setInlinePrice({ id: item.id, value: String(item.unit_price) })
    setTimeout(() => priceInputRef.current?.select(), 30)
  }

  async function saveInlinePrice() {
    if (!inlinePrice) return
    const price = parseFloat(inlinePrice.value.replace(',', '.')) || 0
    await sb.from('catalog_items').update({ unit_price: price }).eq('id', inlinePrice.id)
    setItems((prev) => prev.map((it) => it.id === inlinePrice.id ? { ...it, unit_price: price } : it))
    setInlinePrice(null)
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id)
    setEditState({
      type: item.type,
      category: item.category ?? '',
      name: item.name,
      unit_price: String(item.unit_price),
      vat_rate: String(item.vat_rate),
      notes: item.notes ?? '',
    })
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      header.forEach((h, i) => { row[h] = cols[i] ?? '' })
      return row
    })
    const toInsert = rows.filter((r) => r.name).map((r) => ({
      type: (r.type === 'ricavo' ? 'ricavo' : 'costo') as ItemType,
      category: r.category || null,
      name: r.name,
      unit_price: parseFloat(r.unit_price || r.prezzo || '0') || 0,
      vat_rate: parseFloat(r.vat_rate || r.iva || '22') || 22,
      notes: r.notes || null,
    }))
    if (toInsert.length > 0) {
      await sb.from('catalog_items').insert(toInsert)
      fetchItems()
    }
    e.target.value = ''
  }

  const rowProps = {
    editingId, editState, setEditState, saveEdit, setEditingId,
    startEdit, startInlinePrice, saveInlinePrice, inlinePrice,
    setInlinePrice, priceInputRef, setDeleteId,
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="text-amber-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Catalogo Voci</h1>
            <p className="text-sm text-slate-500">{items.length} voci in libreria · {sortedCats.length} categorie</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Importa CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <button className="btn-primary flex items-center gap-2" onClick={() => setAddMode(true)}>
            <Plus size={15} /> Nuova voce
          </button>
        </div>
      </div>

      {/* CSV format hint */}
      <div className="mb-4 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl py-2 px-4">
        Formato CSV: <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-slate-600">type,category,name,unit_price,vat_rate,notes</code>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input className="input pl-9" placeholder="Cerca voce..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as '' | ItemType)}>
            <option value="">Tutti i tipi</option>
            <option value="ricavo">Ricavi</option>
            <option value="costo">Costi</option>
          </select>
        </div>
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Tutti
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expand / collapse all — only shown when not filtering */}
      {!isFiltering && sortedCats.length > 1 && (
        <div className="flex gap-2 mb-3 justify-end">
          <button onClick={expandAll} className="text-xs text-slate-400 hover:text-blue-600 transition-colors">Espandi tutto</button>
          <span className="text-slate-200">|</span>
          <button onClick={collapseAll} className="text-xs text-slate-400 hover:text-blue-600 transition-colors">Comprimi tutto</button>
        </div>
      )}

      {/* Add row (shown above categories when addMode) */}
      {addMode && (
        <div className="card p-0 overflow-hidden mb-3">
          <table className="w-full text-sm">
            {TABLE_HEAD}
            <tbody>
              <tr className="bg-blue-50">
                <td className="px-4 py-2">
                  <input className="input py-1 text-xs" placeholder="Nome voce *" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
                </td>
                <td className="px-4 py-2">
                  <select className="input py-1 text-xs" value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}>
                    <option value="">—</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select className="input py-1 text-xs" value={newItem.type} onChange={(e) => setNewItem((p) => ({ ...p, type: e.target.value as ItemType }))}>
                    <option value="costo">Costo</option>
                    <option value="ricavo">Ricavo</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input type="number" className="input py-1 text-xs text-right" placeholder="0.00" value={newItem.unit_price} onChange={(e) => setNewItem((p) => ({ ...p, unit_price: e.target.value }))} />
                </td>
                <td className="px-4 py-2">
                  <select className="input py-1 text-xs" value={newItem.vat_rate} onChange={(e) => setNewItem((p) => ({ ...p, vat_rate: e.target.value }))}>
                    {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 flex gap-1">
                  <button className="text-emerald-500 hover:text-emerald-700" onClick={addItem}><Check size={16} /></button>
                  <button className="text-slate-400 hover:text-slate-700" onClick={() => setAddMode(false)}><X size={16} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card text-center text-slate-400 py-16">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-slate-400 py-16">Nessuna voce trovata</div>
      ) : isFiltering ? (
        /* Flat table when searching/filtering */
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {TABLE_HEAD}
              <tbody className="divide-y divide-slate-50">
                {filtered.map((it) => (
                  <ItemRow key={it.id} it={it} {...rowProps} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grouped by category with collapsible headers */
        <div className="space-y-2">
          {sortedCats.map((cat) => {
            const catItems = grouped.get(cat) ?? []
            const isCollapsed = collapsedCats.has(cat)
            return (
              <div key={cat} className="card p-0 overflow-hidden">
                {/* Category header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCat(cat)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{catItems.length}</span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown size={16} className="text-slate-400" />
                    : <ChevronUp size={16} className="text-slate-400" />
                  }
                </button>

                {/* Category items */}
                {!isCollapsed && (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="w-full text-sm">
                      {TABLE_HEAD}
                      <tbody className="divide-y divide-slate-50">
                        {catItems.map((it) => (
                          <ItemRow key={it.id} it={it} {...rowProps} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Elimina voce"
        message="Eliminare questa voce dal catalogo?"
        onConfirm={() => deleteItem(deleteId!)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default function CatalogPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <CatalogPageInner />
}
