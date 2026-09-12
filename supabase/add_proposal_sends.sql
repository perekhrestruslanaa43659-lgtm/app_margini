-- Registro delle proposte (menu/preventivo) inviate ai clienti: una riga per ogni
-- invio email, collegata all'evento di origine. Sostituisce l'idea di un log Excel
-- locale (skill "doppio-malto-proposta-cliente-skill", pensata per un ambiente
-- Claude diverso da questa app) con una tabella consultabile nella dashboard e
-- coerente con i dati reali dell'evento, invece di un file scollegato dal database.
CREATE TABLE IF NOT EXISTS proposal_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,
  subject TEXT,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  guests_count INTEGER,
  price_per_guest NUMERIC,
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'inviata',
  notes TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposal_sends_event_id_idx ON proposal_sends(event_id);

ALTER TABLE proposal_sends ENABLE ROW LEVEL SECURITY;

-- Nessun accesso anonimo: dati commerciali (nome/email cliente, importi), stessa
-- policy di company_settings/rooms dopo restrict_sensitive_rls.sql.
CREATE POLICY "allow_all_authenticated_proposal_sends" ON proposal_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);
