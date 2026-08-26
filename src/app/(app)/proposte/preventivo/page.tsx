'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileCheck, Lock, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { loadDraftProposal, clearDraftProposal } from '@/lib/proposalDraft'
import { planPrice, type MealSection } from '@/lib/proposalHtml'
import { formatCurrency } from '@/lib/margin'

const BOOKING_STATUSES = ['In attesa di conferma', 'Confermata', 'Caparra ricevuta', 'Annullata']

const DEFAULT_CLAUSES = [
  {
    title: 'Minimo garantito e conteggio ospiti.',
    text: 'La fatturazione minima è calcolata sul numero di partecipanti garantito indicato dal cliente. Qualora il numero di presenti risultasse inferiore a tale soglia, resta comunque dovuto l’importo calcolato sul minimo garantito. In caso di partecipanti eccedenti, verrà applicato il costo unitario per persona indicato in tabella per ogni ospite aggiuntivo. Il cliente è tenuto a comunicare il numero definitivo di partecipanti entro i termini concordati e comunque non oltre 3 giorni lavorativi prima dell’evento.',
  },
  {
    title: 'Comunicazione delle preferenze di menu.',
    text: 'Al fine di garantire un servizio fluido e tempi di uscita adeguati, il cliente è tenuto a comunicare la scelta del main course, nonché eventuali allergie o intolleranze alimentari dei partecipanti, entro e non oltre 5 giorni prima della data dell’evento.',
  },
  {
    title: 'Caparra confirmatoria.',
    text: 'A conferma della prenotazione è richiesto il versamento di una caparra confirmatoria pari al {{deposit_pct}}% dell’importo totale stimato, da corrispondere entro e non oltre {{deposit_days}} giorni dalla data di accettazione del presente preventivo, tramite bonifico bancario sulle coordinate indicate. La mancata ricezione della caparra entro i termini indicati comporta la decadenza automatica dell’opzione sulla data e sulla sala.',
  },
  {
    title: 'Saldo finale e modalità di pagamento.',
    text: 'Il saldo residuo dovrà essere corrisposto entro e non oltre la data dell’evento, salvo diverso accordo scritto tra le parti, tramite bonifico bancario o le ulteriori modalità concordate. Il presente documento non costituisce fattura fiscale.',
  },
  {
    title: 'Recesso e cancellazione.',
    text: 'Eventuali disdette o modifiche alla prenotazione dovranno essere comunicate per iscritto. La caparra versata non è rimborsabile in caso di recesso comunicato a meno di 7 giorni dalla data dell’evento, salvo diverso accordo tra le parti.',
  },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function PreventivoPage() {
  const router = useRouter()
  const [sections, setSections] = useState<MealSection[] | null>(null)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [sdiCode, setSdiCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [guestsCount, setGuestsCount] = useState('')
  const [bookingStatus, setBookingStatus] = useState(BOOKING_STATUSES[0])
  const [depositDate, setDepositDate] = useState('')
  const [depositPct, setDepositPct] = useState('30')
  const [depositDays, setDepositDays] = useState('7')

  const [clauses, setClauses] = useState(DEFAULT_CLAUSES)
  const [showClauses, setShowClauses] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const draft = loadDraftProposal()
    if (!draft || draft.length === 0) {
      router.replace('/proposte')
      return
    }
    setSections(draft)
  }, [router])

  function updateClause(i: number, patch: Partial<{ title: string; text: string }>) {
    setClauses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  async function submit() {
    if (!sections) return
    if (!name.trim()) {
      setError('Il nome del cliente è obbligatorio')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const client = {
        name: name.trim(),
        address: address.trim() || undefined,
        vatNumber: vatNumber.trim() || undefined,
        sdiCode: sdiCode.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        eventDate: eventDate || null,
        eventTime: eventTime.trim() || undefined,
        guestsCount: guestsCount ? Number(guestsCount) : null,
        bookingStatus,
        depositDate: depositDate || null,
      }

      const quoteRes = await fetch('/api/proposte/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, sections, clauses, depositPct, depositDays }),
      })

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => null)
        throw new Error(body?.error || 'Errore nella generazione del preventivo')
      }

      const fileSlug = name.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      downloadBlob(await quoteRes.blob(), `preventivo-${fileSlug}.pdf`)

      const menuRes = await fetch('/api/proposte/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: name.trim(), sections }),
      })

      if (menuRes.ok) {
        downloadBlob(await menuRes.blob(), `menu-${fileSlug}.pdf`)
      }

      clearDraftProposal()
      router.push('/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella generazione del preventivo')
    } finally {
      setSubmitting(false)
    }
  }

  if (!sections) {
    return <div className="max-w-3xl mx-auto"><div className="card text-center text-slate-400 py-16">Caricamento...</div></div>
  }

  const totalPerGuest = sections.reduce((sum, s) => {
    const best = s.plans.filter((p) => p.groups.some((g) => g.items.length > 0))[0]
    return sum + (best ? planPrice(best) : 0)
  }, 0)

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <button className="text-sm text-slate-500 hover:text-dm-ink flex items-center gap-1.5 mb-4" onClick={() => router.push('/proposte')}>
        <ArrowLeft size={15} /> Torna alla proposta
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <FileCheck className="text-amber-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dm-ink">Crea preventivo</h1>
          <p className="text-sm text-slate-500">Dati cliente per generare il preventivo e il menu allegato in PDF</p>
        </div>
      </div>

      <div className="card mb-4 flex items-start gap-3 bg-emerald-50/60 border-emerald-100">
        <Lock className="text-emerald-600 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-emerald-800 leading-relaxed">
          I PDF vengono generati sul server: l&apos;IBAN e i dati bancari aziendali non vengono mai inviati al browser come testo modificabile,
          solo incorporati nel documento finale. Serve una sessione autenticata per procedere.
        </p>
      </div>

      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-dm-ink mb-3">Riepilogo proposta</h2>
        <div className="space-y-1.5 mb-3">
          {sections.map((s) => {
            const best = s.plans.filter((p) => p.groups.some((g) => g.items.length > 0))[0]
            return (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{s.label} {best ? `· ${best.name || 'Fascia'}` : ''}</span>
                <span className="font-medium text-dm-ink">{best ? formatCurrency(planPrice(best)) : '—'}/persona</span>
              </div>
            )
          })}
        </div>
        {totalPerGuest > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-500">Totale stimato a persona</span>
            <span className="font-semibold text-dm-ink">{formatCurrency(totalPerGuest)}</span>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">Il dettaglio dei piatti sarà nel PDF “Menu” allegato, non nel preventivo.</p>
      </div>

      <div className="card space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-dm-ink mb-1">Dati cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Nome cliente / Ragione sociale *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Indirizzo" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="input" placeholder="P. IVA" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
          <input className="input" placeholder="Codice SDI" value={sdiCode} onChange={(e) => setSdiCode(e.target.value)} />
          <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <h2 className="text-sm font-semibold text-dm-ink mb-1 pt-2">Dettagli evento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Data evento
            <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>
          <input className="input self-end" placeholder="Orario (es. 20:00 – 21:30)" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          <input className="input" placeholder="Minimo garantito (n. ospiti)" type="number" value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} />
          <select className="input" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <h2 className="text-sm font-semibold text-dm-ink mb-1 pt-2">Caparra</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="input" placeholder="Percentuale caparra (%)" type="number" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
          <input className="input" placeholder="Giorni per versarla" type="number" value={depositDays} onChange={(e) => setDepositDays(e.target.value)} />
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Scadenza acconto (facoltativa)
            <input className="input" type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="card mb-4">
        <button className="w-full flex items-center justify-between text-sm font-semibold text-dm-ink" onClick={() => setShowClauses((v) => !v)}>
          Clausole contrattuali
          {showClauses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showClauses && (
          <div className="space-y-3 mt-3">
            <p className="text-xs text-slate-400">
              Usa <code className="bg-slate-100 px-1 rounded">{'{{deposit_pct}}'}</code> e <code className="bg-slate-100 px-1 rounded">{'{{deposit_days}}'}</code> per inserire automaticamente i valori di caparra impostati sopra.
            </p>
            {clauses.map((c, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3">
                <input
                  className="input py-1.5 text-sm mb-2 font-medium"
                  value={c.title}
                  onChange={(e) => updateClause(i, { title: e.target.value })}
                />
                <textarea
                  className="input text-xs"
                  rows={3}
                  value={c.text}
                  onChange={(e) => updateClause(i, { text: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
        {submitting ? 'Generazione in corso...' : 'Genera preventivo e menu (2 PDF)'}
      </button>
    </div>
  )
}
