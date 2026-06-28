import type { MarginSummary } from '@/lib/supabase/types'
import { formatCurrency, formatPct, marginColor } from '@/lib/margin'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  summary: MarginSummary
  guestsCount?: number
}

export function MarginSummaryPanel({ summary, guestsCount }: Props) {
  const { totalRevenue, totalCosts, grossMargin, marginPct, revenuePerGuest, costPerGuest, marginPerGuest } = summary
  const mc = marginColor(marginPct)
  const Icon = marginPct >= 30 ? TrendingUp : marginPct >= 15 ? Minus : TrendingDown

  return (
    <div className="card bg-slate-800 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-slate-300">Riepilogo Margine</h3>
        <div className={`flex items-center gap-1.5 text-2xl font-bold ${mc}`}>
          <Icon size={20} />
          {formatPct(marginPct)}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Totale ricavi</span>
          <span className="font-medium text-emerald-400">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Totale costi</span>
          <span className="font-medium text-red-400">{formatCurrency(totalCosts)}</span>
        </div>
        <div className="border-t border-slate-700 pt-2 flex justify-between">
          <span className="text-slate-300 font-medium">Margine lordo</span>
          <span className={`font-bold ${mc}`}>{formatCurrency(grossMargin)}</span>
        </div>
      </div>

      {guestsCount && guestsCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-1.5 text-xs">
          <p className="text-slate-400 font-medium mb-2">Per ospite ({guestsCount} pax)</p>
          <div className="flex justify-between text-slate-400">
            <span>Ricavo/ospite</span>
            <span className="text-emerald-400">{formatCurrency(revenuePerGuest)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Costo/ospite</span>
            <span className="text-red-400">{formatCurrency(costPerGuest)}</span>
          </div>
          <div className="flex justify-between text-slate-300 font-medium">
            <span>Margine/ospite</span>
            <span className={mc}>{formatCurrency(marginPerGuest)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
