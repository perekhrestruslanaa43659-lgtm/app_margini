'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Send, Loader2, Mail, RefreshCw } from 'lucide-react'
import type { GenerateEmailRequest } from '@/app/api/generate-email/route'

type Style = GenerateEmailRequest['style']

const STYLES: { value: Style; label: string; desc: string }[] = [
  { value: 'formale',     label: 'Formale',      desc: 'Lei, tono professionale' },
  { value: 'amichevole',  label: 'Amichevole',   desc: 'Tu, tono caldo' },
  { value: 'breve',       label: 'Breve',        desc: '5-6 righe essenziali' },
  { value: 'dettagliato', label: 'Dettagliato',  desc: 'Completo con tutti i dettagli' },
]

interface Props {
  open: boolean
  onClose: () => void
  eventName: string
  clientName: string | null
  clientEmail: string | null
  eventDate: string | null
  location: string | null
  guestsCount: number | null
  totalRevenue: number
}

export function EmailModal({
  open, onClose,
  eventName, clientName, clientEmail,
  eventDate, location, guestsCount, totalRevenue,
}: Props) {
  const [style, setStyle] = useState<Style>('formale')
  const [to, setTo] = useState(clientEmail ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      setTo(clientEmail ?? '')
      setSubject('')
      setBody('')
      setSendResult('idle')
      setErrorMsg('')
    }
  }, [open, clientEmail])

  async function generate() {
    setGenerating(true)
    setSendResult('idle')
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName, clientName, clientEmail,
          eventDate, location, guestsCount,
          totalRevenue, style,
        } satisfies GenerateEmailRequest),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSubject(data.subject)
      setBody(data.body)
    } catch (e) {
      setErrorMsg((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function send() {
    if (!to.trim() || !subject.trim() || !body.trim()) return
    setSending(true)
    setSendResult('idle')
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSendResult('success')
    } catch (e) {
      setErrorMsg((e as Error).message)
      setSendResult('error')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="text-blue-600" size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800">Invia email al cliente</h2>
            <p className="text-xs text-slate-400">{eventName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Style pills */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Stile del messaggio</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    style === s.value
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`ml-1.5 ${style === s.value ? 'text-blue-200' : 'text-slate-400'}`}>· {s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60"
          >
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> Generazione in corso...</>
              : body
              ? <><RefreshCw size={15} /> Rigenera bozza</>
              : <><Sparkles size={15} /> Genera bozza con AI</>
            }
          </button>

          {/* Email fields — shown after generation or always editable */}
          <div className="space-y-3">
            <div>
              <label className="label">A</label>
              <input
                className="input"
                type="email"
                placeholder="email@cliente.it"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Oggetto</label>
              <input
                className="input"
                placeholder="Oggetto email..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Messaggio</label>
              <textarea
                className="input min-h-52 resize-y font-mono text-xs leading-relaxed"
                placeholder="Clicca &quot;Genera bozza con AI&quot; per creare il messaggio, oppure scrivi direttamente..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              ⚠ {errorMsg}
            </div>
          )}

          {/* Success */}
          {sendResult === 'success' && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              ✓ Email inviata con successo a <strong>{to}</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Chiudi
          </button>
          <button
            onClick={send}
            disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {sending
              ? <><Loader2 size={15} className="animate-spin" /> Invio...</>
              : <><Send size={15} /> Invia email</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
