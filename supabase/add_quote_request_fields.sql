-- Aggiunge campi per le richieste di preventivo pubbliche (allergie, richieste particolari, budget)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC;

-- Nuovo stato "richiesta" per le richieste arrivate dal form pubblico, non ancora prese in carico
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('richiesta', 'bozza', 'confermato', 'concluso', 'annullato'));
