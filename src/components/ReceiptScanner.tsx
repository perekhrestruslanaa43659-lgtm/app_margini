'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Camera, Upload, Loader2, ScanLine, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ScannedItem } from '@/app/api/scan-receipt/route'

interface Props {
  open: boolean
  onClose: () => void
  onItemsScanned: (items: ScannedItem[]) => void
}

type Step = 'consent' | 'capture' | 'scanning' | 'result' | 'error'

export function ReceiptScanner({ open, onClose, onItemsScanned }: Props) {
  const [step, setStep] = useState<Step>('consent')
  const [items, setItems] = useState<ScannedItem[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [useCamera, setUseCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function reset() {
    setStep('consent')
    setItems([])
    setErrorMsg('')
    setPreview(null)
    setUseCamera(false)
    stopCamera()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setUseCamera(true)
      setStep('capture')
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s
      }, 100)
    } catch {
      setUseCamera(false)
      setStep('capture')
    }
  }

  function captureFromCamera() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPreview(dataUrl)
    stopCamera()
    analyzeImage(dataUrl, 'image/jpeg')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)
      const mime = file.type || 'image/jpeg'
      analyzeImage(dataUrl, mime)
    }
    reader.readAsDataURL(file)
  }

  async function analyzeImage(dataUrl: string, mimeType: string) {
    setStep('scanning')
    try {
      const base64 = dataUrl.split(',')[1]
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setItems(data.items ?? [])
      setStep(data.items?.length > 0 ? 'result' : 'error')
      if (!data.items?.length) setErrorMsg('Nessun articolo riconosciuto. Riprova con una foto più nitida.')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante la scansione')
      setStep('error')
    }
  }

  function updateItem(index: number, field: keyof ScannedItem, value: string | number) {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function confirmItems() {
    onItemsScanned(items)
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <ScanLine size={17} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800">Scanner scontrino</h2>
            <p className="text-xs text-slate-400">Estrai automaticamente gli articoli</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* STEP: Consenso privacy */}
          {step === 'consent' && (
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">Come vengono trattati i tuoi dati</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• L'immagine viene inviata ad <strong>Anthropic Claude</strong> solo per estrarre il testo</li>
                    <li>• Anthropic <strong>non salva</strong> i dati delle API e non li usa per addestrare modelli</li>
                    <li>• La trasmissione è cifrata (HTTPS)</li>
                    <li>• L'immagine <strong>non viene salvata</strong> nel nostro database</li>
                    <li>• Solo i nomi articoli e prezzi vengono restituiti all'app</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Procedi solo se lo scontrino non contiene dati personali sensibili (nomi clienti, dati medici, ecc.).
                I dati fiscali standard degli scontrini di ristorazione sono sicuri da elaborare.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setStep('capture'); startCamera() }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                >
                  <Camera size={24} className="text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Usa fotocamera</span>
                  <span className="text-xs text-slate-400">Scatta una foto</span>
                </button>
                <button
                  onClick={() => { setStep('capture'); fileInputRef.current?.click() }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                >
                  <Upload size={24} className="text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Carica immagine</span>
                  <span className="text-xs text-slate-400">JPG, PNG dal dispositivo</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* STEP: Camera attiva */}
          {step === 'capture' && useCamera && (
            <div className="p-6 space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/60 rounded-xl w-3/4 h-2/3 flex items-center justify-center">
                    <span className="text-white/60 text-xs">Inquadra lo scontrino</span>
                  </div>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={captureFromCamera}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Camera size={18} /> Scatta foto
              </button>
            </div>
          )}

          {/* STEP: Scanning */}
          {step === 'scanning' && (
            <div className="p-8 text-center space-y-4">
              {preview && (
                <img src={preview} alt="Anteprima scontrino" className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 opacity-60" />
              )}
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <Loader2 size={20} className="animate-spin text-violet-500" />
                <span className="text-sm font-medium">Analisi in corso...</span>
              </div>
              <p className="text-xs text-slate-400">Claude sta leggendo gli articoli dallo scontrino</p>
            </div>
          )}

          {/* STEP: Risultato */}
          {step === 'result' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={15} />
                <span className="text-xs font-medium">{items.length} articoli trovati — verifica e conferma</span>
              </div>

              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <input
                        className="w-full text-sm font-medium text-slate-700 bg-transparent border-0 outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-1 -mx-1"
                        value={item.name}
                        onChange={(e) => updateItem(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-slate-400">×</span>
                      <input
                        type="number"
                        min="1"
                        className="w-12 h-7 text-xs text-center rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-20 h-7 text-xs text-right rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 px-2"
                        value={item.unit_price}
                        onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-xs text-slate-400">€</span>
                    </div>
                    <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400 transition-colors ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { reset(); fileInputRef.current?.click() }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Scansiona un altro scontrino
              </button>
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
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
            Annulla
          </button>
          {step === 'result' && (
            <button
              onClick={confirmItems}
              disabled={items.length === 0}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
            >
              Aggiungi {items.length} articoli alla calcolatrice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
