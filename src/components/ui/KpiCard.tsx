import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  iconColor?: string
}

export function KpiCard({ label, value, sub, icon: Icon, iconColor = 'text-dm-maroon' }: Props) {
  return (
    <div className="card flex items-start gap-4 border-l-4 border-l-dm-yellow">
      <div className={`w-11 h-11 rounded-xl bg-dm-cream flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-dm-ink/60 font-medium">{label}</p>
        <p className="text-2xl font-display font-bold text-dm-ink mt-0.5">{value}</p>
        {sub && <p className="text-xs text-dm-ink/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
