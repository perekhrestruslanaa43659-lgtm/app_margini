-- Data entro cui va versato l'acconto, mostrata nel PDF preventivo.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deposit_date DATE,
  ADD COLUMN IF NOT EXISTS room_id UUID;

-- Salette/tavoli disponibili per locale (es. "Saletta Vip" @ "DM Duomo").
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE events
  ADD CONSTRAINT events_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_rooms" ON rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_rooms" ON rooms FOR ALL TO anon USING (true) WITH CHECK (true);
