import type { EventStatus } from '@/lib/supabase/types'

const config: Record<EventStatus, { label: string; className: string }> = {
  bozza: { label: 'Bozza', className: 'bg-slate-100 text-slate-600' },
  confermato: { label: 'Confermato', className: 'bg-emerald-100 text-emerald-700' },
  concluso: { label: 'Concluso', className: 'bg-blue-100 text-blue-700' },
  annullato: { label: 'Annullato', className: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const { label, className } = config[status] ?? config.bozza
  return <span className={`badge ${className}`}>{label}</span>
}
