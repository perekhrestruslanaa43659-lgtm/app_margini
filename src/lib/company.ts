// Dati aziendali per i documenti di preventivo (PDF/Excel).
// Server-only: importato solo da route API / generatori di export, mai da componenti client
// e mai inviato a servizi esterni (Anthropic incluso). Valori sovrascrivibili via env
// cosi' l'IBAN e gli altri dati sensibili non finiscono nel codice sorgente/versionamento.
export const COMPANY_INFO = {
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
}
