-- Aggiunge email e telefono cliente alla tabella events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT;
