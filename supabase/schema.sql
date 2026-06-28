-- ============================================================
-- Event & Margin Manager – Doppio Malto
-- Supabase Schema
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  event_date DATE,
  location TEXT,
  guests_count INTEGER,
  status TEXT DEFAULT 'bozza', -- bozza | confermato | concluso | annullato
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE event_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'costo' | 'ricavo'
  category TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 22,
  notes TEXT
);

CREATE TABLE margin_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_pct NUMERIC DEFAULT 0,
  notes TEXT
);

CREATE TABLE scenario_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES margin_scenarios(id) ON DELETE CASCADE,
  item_id UUID REFERENCES event_items(id) ON DELETE CASCADE,
  quantity_override NUMERIC,
  unit_price_override NUMERIC
);

CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'costo' | 'ricavo'
  category TEXT,
  name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 22,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_items" ON event_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_scenarios" ON margin_scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_overrides" ON scenario_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_catalog" ON catalog_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anonymous read policy (for demo/dev without auth)
CREATE POLICY "allow_anon_events" ON events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_items" ON event_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_scenarios" ON margin_scenarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_overrides" ON scenario_overrides FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_catalog" ON catalog_items FOR ALL TO anon USING (true) WITH CHECK (true);
