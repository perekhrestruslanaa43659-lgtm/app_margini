import { createClient } from '@supabase/supabase-js'
import type { CompanySettings } from '@/lib/supabase/types'

// Dati aziendali per i documenti di preventivo (PDF/Excel).
// Server-only: importato solo da route API / generatori di export, mai da componenti client
// e mai inviato a servizi esterni (Anthropic incluso).
const ENV_DEFAULTS = {
  name: process.env.COMPANY_NAME || 'Doppio Malto',
  legalName: process.env.COMPANY_LEGAL_NAME || '',
  address: process.env.COMPANY_ADDRESS || '',
  vatNumber: process.env.COMPANY_VAT_NUMBER || '',
  taxCode: process.env.COMPANY_TAX_CODE || '',
  email: process.env.COMPANY_EMAIL || '',
  phone: process.env.COMPANY_PHONE || '',
  iban: process.env.COMPANY_IBAN || '',
  bankName: process.env.COMPANY_BANK_NAME || '',
  paymentTerms: process.env.COMPANY_PAYMENT_TERMS || 'Acconto 30% alla conferma, saldo entro la data evento.',
  contractTerms: process.env.COMPANY_CONTRACT_TERMS || '',
}

export type CompanyInfo = typeof ENV_DEFAULTS

// Legge le impostazioni aziendali da Supabase (modificabili dalla pagina /settings).
// Se la tabella è vuota o non raggiungibile, usa i valori da variabili d'ambiente come fallback.
export async function getCompanyInfo(): Promise<CompanyInfo> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return ENV_DEFAULTS
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .single()

    const row = data as unknown as CompanySettings | null
    if (!row) return ENV_DEFAULTS

    return {
      name: row.name || ENV_DEFAULTS.name,
      legalName: row.legal_name || ENV_DEFAULTS.legalName,
      address: row.address || ENV_DEFAULTS.address,
      vatNumber: row.vat_number || ENV_DEFAULTS.vatNumber,
      taxCode: row.tax_code || ENV_DEFAULTS.taxCode,
      email: row.email || ENV_DEFAULTS.email,
      phone: row.phone || ENV_DEFAULTS.phone,
      iban: row.iban || ENV_DEFAULTS.iban,
      bankName: row.bank_name || ENV_DEFAULTS.bankName,
      paymentTerms: row.payment_terms || ENV_DEFAULTS.paymentTerms,
      contractTerms: row.contract_terms || ENV_DEFAULTS.contractTerms,
    }
  } catch {
    return ENV_DEFAULTS
  }
}
