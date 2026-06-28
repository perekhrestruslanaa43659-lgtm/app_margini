'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { EventItem, ItemType } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'

interface DraftItem extends Omit<EventItem, 'id' | 'event_id'> {
  _key: string
}

interface Props {
  type: ItemType
  items: DraftItem[]
  onChange: (items: DraftItem[]) => void
  onImportFromCatalog?: () => void
}

const CATEGORIES_RICAVO = ['Food', 'Bevande', 'Servizio', 'Extra']
const CATEGORIES_COSTO = ['Food', 'Bevande', 'Staff', 'Logistica', 'Extra', 'Noleggio']
const VAT_OPTIONS = [0, 4, 10, 22]

function newItem(type: ItemType): DraftItem {
  return {
    _key: Math.random().toString(36).slice(2),
    type,
    category: null,
    name: '',
    quantity: 1,
    unit_price: 0,
    vat_rate: 22,
    notes: null,
  }
}

export function ItemsTable({ type, items, onChange, onImportFromCatalog }: Props) {
  const categories = type === 'ricavo' ? CATEGORIES_RICAVO : CATEGORIES_COSTO
  const title = type === 'ricavo' ? 'RICAVI' : 'COSTI'
  const accent = type === 'ricavo' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'

  function update(key: string, field: keyof DraftItem, value: unknown) {
    onChange(items.map((it) => it._key === key ? { ...it, [field]: value } : it))
  }

  function remove(key: string) {
    onChange(items.filter((it) => it._key !== key))
  }

  function add() {
    onChange([...items, newItem(type)])
  }

  const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0)

  return (
    <div className="mb-6">
      <div className={`flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide ${accent}`}>
        <span>{title}</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left py-2 px-2 font-medium">Categoria</th>
              <th className="text-left py-2 px-2 font-medium">Nome voce</th>
              <th className="text-right py-2 px-2 font-medium w-20">Qtà</th>
              <th className="text-right py-2 px-2 font-medium w-28">Prezzo unit.</th>
              <th className="text-right py-2 px-2 font-medium w-20">IVA %</th>
              <th className="text-right py-2 px-2 font-medium w-28">Totale</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">Nessuna voce aggiunta</td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it._key} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-1.5 px-2">
                  <select
                    className="input py-1 text-xs"
                    value={it.category ?? ''}
                    onChange={(e) => update(it._key, 'category', e.target.value || null)}
                  >
                    <option value="">—</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="py-1.5 px-2">
                  <input
                    className="input py-1 text-xs"
                    placeholder="Nome voce..."
                    value={it.name}
                    onChange={(e) => update(it._key, 'name', e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input py-1 text-xs text-right"
                    value={it.quantity}
                    onChange={(e) => update(it._key, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input py-1 text-xs text-right"
                    value={it.unit_price}
                    onChange={(e) => update(it._key, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="py-1.5 px-2">
                  <select
                    className="input py-1 text-xs text-right"
                    value={it.vat_rate}
                    onChange={(e) => update(it._key, 'vat_rate', parseFloat(e.target.value))}
                  >
                    {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </td>
                <td className="py-1.5 px-2 text-right text-slate-700 font-medium">
                  {formatCurrency(it.quantity * it.unit_price)}
                </td>
                <td className="py-1.5 px-2">
                  <button
                    type="button"
                    onClick={() => remove(it._key)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-2">
        <button type="button" onClick={add} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5">
          <Plus size={13} /> Aggiungi voce
        </button>
        {onImportFromCatalog && (
          <button type="button" onClick={onImportFromCatalog} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5">
            Importa dal catalogo
          </button>
        )}
      </div>
    </div>
  )
}
