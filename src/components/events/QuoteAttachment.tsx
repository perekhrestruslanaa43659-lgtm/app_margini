'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, FileText, ShieldCheck, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react'
import type { ExtractedQuote } from '@/app/api/extract-quote/route'

interface Props {
  open: boolean
  onClose: () => void
  onExtracted: (data: ExtractedQuote) => void
}

type Step = 'consent' | 'scanning' | 'result' | 'error'

const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/png,image/webp'

export function QuoteAttachment({ open, onClose, onExtracted }: Props) {
  const [step, setStep] = useState<Step>('consent')
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracted, setExtracted] = useState<ExtractedQuote | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('consent')
    setErrorMsg('')
    setFileName('')
    setExtracted(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const base64 = dataUrl.split(',')[1]
      analyzeFile(base64, file.type || 'application/pdf')
    }
    reader.readAsDataURL(file)
  }

  async function analyzeFile(fileBase64: string, mimeType: string) {
    setStep('scanning')
    try {
      const res = await fetch('/api/extract-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, mimeType }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExtracted(data.data)
      setStep('result')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante l\'analisi del documento')
      setStep('error')
    }
  }

  function confirm() {
    if (extracted) onExtracted(extracted)
    reset()
    onClose()
  }

  if (!open) return null

  const fieldLabels: Record<keyof ExtractedQuote, string> = {
    clientName: 'Cliente',
    clientEmail: 'Email',
    clientPhone: 'Telefono',
    eventDate: 'Data evento',
    location: 'Location',
    guestsCount: 'N° ospiti',
    budgetMin: 'Budget min',
    budgetMax: 'Budget max',
    allergies: 'Allergie',
    specialRequests: 'Richieste particolari',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <Paperclip size={17} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-dm-ink">Allega preventivo</h2>
            <p className="text-xs text-slate-400">Estrai automaticamente i dati dal documento</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* STEP: Consenso privacy */}
          {step === 'consent' && (
            <div className="p-6 space-y-5">
              <div className="bg-dm-wood/10 border border-dm-wood/30 rounded-xl p-4 flex gap-3">
                <ShieldCheck size={18} className="text-dm-wood shrink-0 mt-0.5" />
                <div className="text-sm text-dm-ink/80 space-y-2">
                  <p className="font-semibold">Come vengono trattati i tuoi dati</p>
                  <ul className="text-xs space-y-1 text-dm-wood">
                    <li>• Il documento viene inviato ad <strong>Anthropic Claude</strong> solo per estrarre i dati</li>
                    <li>• Anthropic <strong>non salva</strong> i dati delle API e non li usa per addestrare modelli</li>
                    <li>• La trasmissione è cifrata (HTTPS)</li>
                    <li>• Il file <strong>non viene salvato</strong> nel nostro database</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
              >
                <Upload size={24} className="text-violet-500" />
                <span className="text-sm font-medium text-dm-ink/80">Carica preventivo</span>
                <span className="text-xs text-slate-400">PDF, JPG, PNG o WebP</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* STEP: Scanning */}
          {step === 'scanning' && (
            <div className="p-8 text-center space-y-4">
              <FileText size={40} className="mx-auto text-slate-300" />
              <p className="text-sm text-slate-500 truncate px-4">{fileName}</p>
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <Loader2 size={20} className="animate-spin text-violet-500" />
                <span className="text-sm font-medium">Analisi in corso...</span>
              </div>
              <p className="text-xs text-slate-400">Claude sta leggendo il documento</p>
            </div>
          )}

          {/* STEP: Risultato */}
          {step === 'result' && extracted && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={15} />
                <span className="text-xs font-medium">Dati estratti — verranno inseriti nel form</span>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(fieldLabels) as (keyof ExtractedQuote)[])
                  .filter((key) => extracted[key] !== null && extracted[key] !== '')
                  .map((key) => (
                    <div key={key} className="flex items-center gap-2 text-sm px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-400 w-32 shrink-0">{fieldLabels[key]}</span>
                      <span className="text-dm-ink/80 truncate">{String(extracted[key])}</span>
                    </div>
                  ))}
                {(Object.keys(fieldLabels) as (keyof ExtractedQuote)[]).every((key) => extracted[key] === null || extracted[key] === '') && (
                  <p className="text-xs text-slate-400 text-center py-4">Nessun dato riconosciuto nel documento. Puoi comunque compilare il form manualmente.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP: Errore */}
          {step === 'error' && (
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
              <button
                onClick={reset}
                className="w-full h-10 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Riprova
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between gap-3 shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-500 hover:text-dm-ink/80 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
            Annulla
          </button>
          {step === 'result' && (
            <button
              onClick={confirm}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition"
            >
              Compila form
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
