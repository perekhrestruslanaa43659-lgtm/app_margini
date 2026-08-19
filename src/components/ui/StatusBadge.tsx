import type { EventStatus } from '@/lib/supabase/types'

const config: Record<EventStatus, { label: string; className: string }> = {
  richiesta: { label: 'Richiesta', className: 'bg-amber-100 text-amber-700' },
  bozza: { label: 'Bozza', className: 'bg-dm-ink/10 text-dm-ink/70' },
  confermato: { label: 'Confermato', className: 'bg-emerald-100 text-emerald-700' },
  concluso: { label: 'Concluso', className: 'bg-dm-wood/20 text-dm-wood' },
  annullato: { label: 'Annullato', className: 'bg-dm-maroon/10 text-dm-maroon' },
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const { label, className } = config[status] ?? config.bozza
  return <span className={`badge ${className}`}>{label}</span>
}
