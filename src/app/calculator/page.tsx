import { MarginCalculator } from '@/components/MarginCalculator'
import { Calculator } from 'lucide-react'

export default function CalculatorPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center">
          <Calculator className="text-rose-500" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Calcolatrice Margine</h1>
          <p className="text-sm text-slate-500">Simulazione rapida senza salvare un evento</p>
        </div>
      </div>
      <MarginCalculator />
    </div>
  )
}
