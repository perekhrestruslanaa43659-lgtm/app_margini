-- Dati aziendali (IBAN, P.IVA, condizioni di pagamento) usati nel preventivo PDF.
-- Tabella singleton: una sola riga con id fisso.
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT,
  legal_name TEXT,
  address TEXT,
  vat_number TEXT,
  tax_code TEXT,
  email TEXT,
  phone TEXT,
  iban TEXT,
  bank_name TEXT,
  payment_terms TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT company_settings_singleton CHECK (id = 1)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Solo utenti autenticati (team interno) possono leggere/modificare.
CREATE POLICY "allow_all_authenticated_company_settings" ON company_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lettura anche per il ruolo anon: necessaria perché la route server /events/[id]/export
-- usa la stessa chiave pubblica anon del resto dell'app (nessuna service role key configurata).
-- Coerente con il livello di esposizione già presente sulle altre tabelle (events, ecc.).
CREATE POLICY "allow_anon_read_company_settings" ON company_settings
  FOR SELECT TO anon USING (true);

INSERT INTO company_settings (id, name, payment_terms)
VALUES (1, 'Doppio Malto', 'Acconto 30% alla conferma, saldo entro la data evento.')
ON CONFLICT (id) DO NOTHING;
