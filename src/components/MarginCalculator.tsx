'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { computeMargin, formatCurrency, formatPct, marginColor } from '@/lib/margin'
import type { EventItem, ItemType } from '@/lib/supabase/types'

interface Row {
  id: string
  type: ItemType
  name: string
  quantity: number
  unit_price: number
  vat_rate: number
}

function newRow(type: ItemType): Row {
  return { id: Math.random().toString(36).slice(2), type, name: '', quantity: 1, unit_price: 0, vat_rate: 22 }
}

export function MarginCalculator() {
  const [rows, setRows] = useState<Row[]>([newRow('ricavo'), newRow('costo')])
  const [guests, setGuests] = useState<number>(1)
  const [discount, setDiscount] = useState<number>(0)

  const summary = useMemo(
    () => computeMargin(rows as unknown as EventItem[], guests, discount),
    [rows, guests, discount]
  )

  function updateRow(id: string, field: keyof Row, value: unknown) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const mc = marginColor(summary.marginPct)
  const Icon = summary.marginPct >= 30 ? TrendingUp : summary.marginPct >= 15 ? Minus : TrendingDown

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input panel */}
      <div className="lg:col-span-2 card">
        <h2 className="font-semibold text-slate-700 mb-4">Voci</h2>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left py-2 px-2">Tipo</th>
                <th className="text-left py-2 px-2">Nome</th>
                <th className="text-right py-2 px-2 w-20">Qtà</th>
                <th className="text-right py-2 px-2 w-28">Prezzo</th>
                <th className="text-right py-2 px-2 w-16">IVA</th>
                <th className="text-right py-2 px-2 w-28">Totale</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="py-1.5 px-2">
                    <select
                      className={`text-xs font-medium rounded-lg px-2 py-1 border-0 outline-none cursor-pointer
                        ${row.type === 'ricavo' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                      value={row.type}
                      onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                    >
                      <option value="ricavo">Ricavo</option>
                      <option value="costo">Costo</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <input className="input py-1 text-xs" placeholder="Descrizione..." value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.01" className="input py-1 text-xs text-right" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <input type="number" min="0" step="0.01" className="input py-1 text-xs text-right" value={row.unit_price} onChange={(e) => updateRow(row.id, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="py-1.5 px-2">
                    <select className="input py-1 text-xs text-right" value={row.vat_rate} onChange={(e) => updateRow(row.id, 'vat_rate', parseFloat(e.target.value))}>
                      {[0, 4, 10, 22].map((v) => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium text-slate-700">
                    {formatCurrency(row.quantity * row.unit_price)}
                  </td>
                  <td className="py-1.5 px-2">
                    <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mb-6">
          <button className="btn-secondary text-xs py-1.5 flex items-center gap-1" onClick={() => setRows((p) => [...p, newRow('ricavo')])}>
            <Plus size={12} /> Ricavo
          </button>
          <button className="btn-secondary text-xs py-1.5 flex items-center gap-1" onClick={() => setRows((p) => [...p, newRow('costo')])}>
            <Plus size={12} /> Costo
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="label">N° ospiti</label>
            <input type="number" min="1" className="input" value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label className="label flex items-center justify-between">
              <span>Sconto globale</span>
              <span className="font-semibold text-slate-700">{discount}%</span>
            </label>
            <input type="range" min="0" max="50" step="1" className="w-full" value={discount} onChange={(e) => setDiscount(parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="space-y-4">
        {/* Main margin card */}
        <div className="card bg-slate-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Risultato</h3>
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

        {/* Per-guest breakdown */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Per ospite ({guests} pax)</h3>
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

        {/* Breakeven */}
        {summary.breakEvenGuests > 0 && (
          <div className="card border-2 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-600 font-medium mb-1">Breakeven ospiti</p>
            <p className="text-3xl font-bold text-amber-700">{summary.breakEvenGuests}</p>
            <p className="text-xs text-amber-500 mt-1">ospiti minimi per coprire i costi</p>
          </div>
        )}
      </div>
    </div>
  )
}
