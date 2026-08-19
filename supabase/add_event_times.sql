-- Orario di inizio/fine dell'evento, usato per calcolare l'occupazione delle
-- salette in fasce orarie invece che sull'intera giornata.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_start_time TIME,
  ADD COLUMN IF NOT EXISTS event_end_time TIME;
