-- Menu evento a fasi: categorie (template riutilizzabile + istanza per evento) e piatti scelti.

-- Template categorie riutilizzabile tra eventi (gestito da Impostazioni).
CREATE TABLE IF NOT EXISTS menu_category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'a_scelta', -- 'a_scelta' | 'tutti_inclusi'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Categorie effettive di un evento (copiate/personalizzate dal template).
CREATE TABLE IF NOT EXISTS event_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'a_scelta', -- 'a_scelta' | 'tutti_inclusi'
  price_per_guest NUMERIC, -- usato solo se selection_type = 'a_scelta'
  sort_order INTEGER DEFAULT 0
);

-- Piatti scelti dal catalogo per ciascuna categoria dell'evento.
CREATE TABLE IF NOT EXISTS event_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES event_menu_categories(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  unit_price NUMERIC DEFAULT 0, -- usato solo se la categoria è 'tutti_inclusi' (si somma)
  sort_order INTEGER DEFAULT 0
);

-- Clausole contrattuali standard (coperti minimi, tempi conferma, penali) mostrate nel PDF.
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS contract_terms TEXT;

ALTER TABLE menu_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_menu_category_templates" ON menu_category_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_menu_category_templates" ON menu_category_templates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_event_menu_categories" ON event_menu_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_event_menu_categories" ON event_menu_categories FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_event_menu_items" ON event_menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_event_menu_items" ON event_menu_items FOR ALL TO anon USING (true) WITH CHECK (true);
