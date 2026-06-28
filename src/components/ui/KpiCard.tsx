import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  iconColor?: string
}

export function KpiCard({ label, value, sub, icon: Icon, iconColor = 'text-blue-600' }: Props) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
