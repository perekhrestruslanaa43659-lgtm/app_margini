'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Upload, Search, Edit2, Check, X } from 'lucide-react'
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

function CatalogPageInner() {
  const supabase = createClient()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | ItemType>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyEdit())
  const [addMode, setAddMode] = useState(false)
  const [newItem, setNewItem] = useState<EditState>(emptyEdit())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  async function fetchItems() {
    setLoading(true)
    const { data } = await sb.from('catalog_items').select('*').order('name')
    setItems((data ?? []) as CatalogItem[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchItems() }, [])

  const filtered = items.filter((it) => {
    const q = search.toLowerCase()
    if (q && !it.name.toLowerCase().includes(q) && !(it.category ?? '').toLowerCase().includes(q)) return false
    if (typeFilter && it.type !== typeFilter) return false
    return true
  })

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

    const toInsert = rows
      .filter((r) => r.name)
      .map((r) => ({
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Catalogo Voci</h1>
          <p className="text-sm text-slate-500">{items.length} voci in libreria</p>
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
      <div className="card mb-4 text-xs text-slate-500 py-2 px-4">
        Formato CSV: <code className="bg-slate-100 px-1.5 py-0.5 rounded">type,category,name,unit_price,vat_rate,notes</code>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
            <tbody className="divide-y divide-slate-50">
              {/* Add row */}
              {addMode && (
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
              )}

              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Caricamento...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nessuna voce trovata</td></tr>
              ) : (
                filtered.map((it) => editingId === it.id ? (
                  <tr key={it.id} className="bg-amber-50">
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
                ) : (
                  <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{it.name}</p>
                      {it.notes && <p className="text-xs text-slate-400">{it.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{it.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${it.type === 'ricavo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {it.type === 'ricavo' ? 'Ricavo' : 'Costo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(it.unit_price)}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
