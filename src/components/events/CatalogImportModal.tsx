'use client'

import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CatalogItem, ItemType } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'

interface Props {
  open: boolean
  type: ItemType
  onImport: (items: CatalogItem[]) => void
  onClose: () => void
}

export function CatalogImportModal({ open, type, onImport, onClose }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('catalog_items').select('*').eq('type', type).then(({ data }: { data: CatalogItem[] | null }) => setItems(data ?? []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type])

  const filtered = items.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    (it.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleImport() {
    const toImport = items.filter((it) => selected.has(it.id))
    onImport(toImport)
    setSelected(new Set())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Importa dal catalogo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              className="input pl-8"
              placeholder="Cerca voce..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Nessuna voce nel catalogo</p>
          )}
          {filtered.map((it) => (
            <label key={it.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(it.id)}
                onChange={() => toggle(it.id)}
                className="rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{it.name}</p>
                <p className="text-xs text-slate-400">{it.category ?? '—'} · IVA {it.vat_rate}%</p>
              </div>
              <span className="text-sm text-slate-600">{formatCurrency(it.unit_price)}</span>
            </label>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn-primary" onClick={handleImport} disabled={selected.size === 0}>
            Importa {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
