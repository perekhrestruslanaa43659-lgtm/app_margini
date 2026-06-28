import { marginBgColor, formatPct } from '@/lib/margin'

export function MarginBadge({ pct }: { pct: number }) {
  return (
    <span className={`badge ${marginBgColor(pct)}`}>
      {formatPct(pct)}
    </span>
  )
}
