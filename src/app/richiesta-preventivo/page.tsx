'use client'

import { useState } from 'react'
import { CalendarPlus, Loader2, Send, CheckCircle2, Paperclip } from 'lucide-react'
import { QuoteAttachment } from '@/components/events/QuoteAttachment'
import type { ExtractedQuote } from '@/app/api/extract-quote/route'

export default function QuoteRequestPage() {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [guestsCount, setGuestsCount] = useState<number | ''>('')
  const [budgetMin, setBudgetMin] = useState<number | ''>('')
  const [budgetMax, setBudgetMax] = useState<number | ''>('')
  const [allergies, setAllergies] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)

  function applyExtracted(data: ExtractedQuote) {
    if (data.clientName) setClientName(data.clientName)
    if (data.clientEmail) setClientEmail(data.clientEmail)
    if (data.clientPhone) setClientPhone(data.clientPhone)
    if (data.eventDate) setEventDate(data.eventDate)
    if (data.location) setLocation(data.location)
    if (data.guestsCount != null) setGuestsCount(data.guestsCount)
    if (data.budgetMin != null) setBudgetMin(data.budgetMin)
    if (data.budgetMax != null) setBudgetMax(data.budgetMax)
    if (data.allergies) setAllergies(data.allergies)
    if (data.specialRequests) setSpecialRequests(data.specialRequests)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/public/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName, clientEmail, clientPhone,
          eventDate, location, guestsCount,
          allergies, specialRequests, budgetMin, budgetMax,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'invio della richiesta')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={28} />
          </div>
          <h1 className="text-lg font-bold text-dm-ink mb-2">Richiesta inviata!</h1>
          <p className="text-sm text-slate-500">
            Grazie {clientName}, abbiamo ricevuto la tua richiesta di preventivo. Ti contatteremo al più presto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-dm-yellow rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-dm-ink mx-auto mb-4">
            DM
          </div>
          <h1 className="text-2xl font-bold text-dm-ink">Doppio Malto</h1>
          <p className="text-sm text-slate-500 mt-1">Richiedi un preventivo per il tuo evento</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-dm-wood/20 rounded-xl flex items-center justify-center">
              <CalendarPlus size={16} className="text-dm-wood" />
            </div>
            <h2 className="font-semibold text-dm-ink/80">Raccontaci del tuo evento</h2>
          </div>

          <button
            type="button"
            onClick={() => setAttachOpen(true)}
            className="w-full flex items-center justify-center gap-2 mb-5 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-sm font-medium text-slate-600 hover:text-violet-700 transition-all"
          >
            <Paperclip size={15} /> Hai già un preventivo? Allegalo per compilare automaticamente
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome e cognome *</label>
                <input
                  className="input"
                  required
                  placeholder="Il tuo nome"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  required
                  placeholder="email@esempio.it"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+39 333 000 0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Data evento</label>
                <input
                  type="date"
                  className="input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">N° ospiti</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  placeholder="0"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value ? parseInt(e.target.value) : '')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Location</label>
                <input
                  className="input"
                  placeholder="Dove si terrà l'evento"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Budget minimo (€)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  placeholder="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value ? parseFloat(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="label">Budget massimo (€)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  placeholder="0"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value ? parseFloat(e.target.value) : '')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Allergie / intolleranze</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Es. glutine, lattosio, frutta a guscio..."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Richieste particolari</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Menù speciale, allestimento, esigenze particolari..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full h-11 bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink font-display font-semibold uppercase tracking-wide text-sm rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {sending
                ? <><Loader2 size={15} className="animate-spin" /> Invio in corso...</>
                : <><Send size={15} /> Invia richiesta</>
              }
            </button>
          </form>
        </div>
      </div>

      <QuoteAttachment
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onExtracted={applyExtracted}
      />
    </div>
  )
}
