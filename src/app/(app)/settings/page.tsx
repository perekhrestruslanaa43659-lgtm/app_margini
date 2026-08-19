'use client'

import { useEffect, useState } from 'react'
import { Building2, Save, CheckCircle2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { CompanySettings } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'

type FormState = Omit<CompanySettings, 'id' | 'updated_at'>

const EMPTY: FormState = {
  name: '',
  legal_name: '',
  address: '',
  vat_number: '',
  tax_code: '',
  email: '',
  phone: '',
  iban: '',
  bank_name: '',
  payment_terms: '',
}

const FIELDS: { key: keyof FormState; label: string; placeholder: string; span?: boolean }[] = [
  { key: 'name', label: 'Nome commerciale', placeholder: 'Doppio Malto' },
  { key: 'legal_name', label: 'Ragione sociale', placeholder: 'Doppio Malto S.r.l.' },
  { key: 'address', label: 'Indirizzo', placeholder: 'Via Roma 1, 20100 Milano', span: true },
  { key: 'vat_number', label: 'P.IVA', placeholder: '12345678901' },
  { key: 'tax_code', label: 'Codice fiscale', placeholder: '12345678901' },
  { key: 'email', label: 'Email', placeholder: 'info@doppiomalto.it' },
  { key: 'phone', label: 'Telefono', placeholder: '+39 02 0000000' },
  { key: 'bank_name', label: 'Nome banca', placeholder: 'Es. Intesa Sanpaolo' },
  { key: 'iban', label: 'IBAN', placeholder: 'IT00 A000 0000 0000 0000 0000 000' },
]

function SettingsPageInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any
  const [form, setForm] = useState<FormState>(EMPTY)
  const [paymentTerms, setPaymentTerms] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await sb.from('company_settings').select('*').eq('id', 1).single()
      if (data) {
        const row = data as CompanySettings
        setForm({
          name: row.name ?? '',
          legal_name: row.legal_name ?? '',
          address: row.address ?? '',
          vat_number: row.vat_number ?? '',
          tax_code: row.tax_code ?? '',
          email: row.email ?? '',
          phone: row.phone ?? '',
          iban: row.iban ?? '',
          bank_name: row.bank_name ?? '',
          payment_terms: row.payment_terms ?? '',
        })
        setPaymentTerms(row.payment_terms ?? '')
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await sb.from('company_settings').upsert({ id: 1, ...form, payment_terms: paymentTerms })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function setField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-dm-yellow rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="text-dm-ink" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-dm-ink">Impostazioni azienda</h1>
          <p className="text-sm text-slate-500">Questi dati compaiono nel PDF del preventivo inviato ai clienti</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start gap-3 bg-dm-cream border border-dm-ink/10 rounded-xl px-4 py-3 mb-6">
          <ShieldCheck size={16} className="text-dm-maroon shrink-0 mt-0.5" />
          <p className="text-xs text-dm-ink/70">
            Questi dati (incluso l&apos;IBAN) sono visibili solo al team interno e vengono inseriti automaticamente nel PDF generato.
            Non vengono mai condivisi con servizi di intelligenza artificiale o resi pubblici.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, placeholder, span }) => (
            <div key={key} className={span ? 'sm:col-span-2' : ''}>
              <label className="label">{label}</label>
              <input
                className="input"
                placeholder={placeholder}
                value={form[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="label">Condizioni di pagamento</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Es. Acconto 30% alla conferma, saldo entro la data evento."
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={15} /> Salvato
            </span>
          )}
          <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? 'Salvataggio...' : 'Salva impostazioni'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <SettingsPageInner />
}
