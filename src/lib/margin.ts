import type { EventItem, MarginSummary, ScenarioOverride } from './supabase/types'

export function computeItemTotal(item: EventItem, overrides?: ScenarioOverride): number {
  const qty = overrides?.quantity_override ?? item.quantity
  const price = overrides?.unit_price_override ?? item.unit_price
  return qty * price
}

export function computeMargin(
  items: EventItem[],
  guestsCount: number = 1,
  discountPct: number = 0,
  overrides: ScenarioOverride[] = []
): MarginSummary {
  const overrideMap = new Map(overrides.map((o) => [o.item_id, o]))

  let totalRevenue = 0
  let totalCosts = 0

  for (const item of items) {
    const override = overrideMap.get(item.id)
    const total = computeItemTotal(item, override)
    if (item.type === 'ricavo') totalRevenue += total
    else totalCosts += total
  }

  const discountedRevenue = totalRevenue * (1 - discountPct / 100)
  const grossMargin = discountedRevenue - totalCosts
  const marginPct = discountedRevenue > 0 ? (grossMargin / discountedRevenue) * 100 : 0
  const guests = guestsCount > 0 ? guestsCount : 1
  const revenuePerGuest = discountedRevenue / guests
  const costPerGuest = totalCosts / guests
  const marginPerGuest = grossMargin / guests
  const breakEvenGuests =
    revenuePerGuest > 0 ? Math.ceil(totalCosts / revenuePerGuest) : 0

  return {
    totalRevenue: discountedRevenue,
    totalCosts,
    grossMargin,
    marginPct,
    revenuePerGuest,
    costPerGuest,
    marginPerGuest,
    breakEvenGuests,
  }
}

export function marginColor(marginPct: number): string {
  if (marginPct >= 30) return 'text-emerald-600'
  if (marginPct >= 15) return 'text-amber-500'
  return 'text-red-500'
}

export function marginBgColor(marginPct: number): string {
  if (marginPct >= 30) return 'bg-emerald-100 text-emerald-700'
  if (marginPct >= 15) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}
