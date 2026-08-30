-- Aggiunge i campi di fatturazione cliente mancanti per generare il PDF "Preventivo
-- Evento" direttamente dalla scheda evento, senza doverli ridigitare a mano nel form
-- separato /proposte/preventivo (che oggi e' l'unico posto dove esistono).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS client_vat_number TEXT,
  ADD COLUMN IF NOT EXISTS client_sdi_code TEXT;
