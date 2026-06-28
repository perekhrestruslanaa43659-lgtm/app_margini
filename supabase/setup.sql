-- ============================================================
-- Event & Margin Manager – Doppio Malto
-- Setup completo: tabelle + RLS + dati di esempio
-- Incolla tutto nell'SQL Editor di Supabase e clicca "Run"
-- ============================================================

-- --------------------------------------------------------
-- 1. TABELLE
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  event_date DATE,
  location TEXT,
  guests_count INTEGER,
  status TEXT DEFAULT 'bozza',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 22,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS margin_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_pct NUMERIC DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS scenario_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES margin_scenarios(id) ON DELETE CASCADE,
  item_id UUID REFERENCES event_items(id) ON DELETE CASCADE,
  quantity_override NUMERIC,
  unit_price_override NUMERIC
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT,
  name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 22,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- --------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- --------------------------------------------------------

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

-- Accesso totale per utenti autenticati
CREATE POLICY "allow_all_authenticated_events"    ON events            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_items"     ON event_items       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_scenarios" ON margin_scenarios  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_overrides" ON scenario_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated_catalog"   ON catalog_items     FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Accesso totale anche per anon (dev/demo senza login)
CREATE POLICY "allow_anon_events"     ON events            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_items"      ON event_items       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_scenarios"  ON margin_scenarios  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_overrides"  ON scenario_overrides FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_catalog"    ON catalog_items     FOR ALL TO anon USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 3. CATALOGO VOCI DI ESEMPIO (Doppio Malto)
-- --------------------------------------------------------

INSERT INTO catalog_items (type, category, name, unit_price, vat_rate, notes) VALUES
-- RICAVI
('ricavo', 'Food',     'Menu degustazione 5 portate',  85.00, 10, 'Per persona'),
('ricavo', 'Food',     'Buffet aperitivo',             35.00, 10, 'Per persona'),
('ricavo', 'Food',     'Cena di gala 4 portate',       75.00, 10, 'Per persona'),
('ricavo', 'Bevande',  'Open bar premium 4h',          40.00, 22, 'Per persona'),
('ricavo', 'Bevande',  'Welcome drink prosecco',        8.00, 22, 'Per persona'),
('ricavo', 'Bevande',  'Pacchetto vini selezionati',   25.00, 22, 'Per persona'),
('ricavo', 'Servizio', 'Noleggio sala eventi',        800.00, 22, 'Forfait giornaliero'),
('ricavo', 'Servizio', 'Allestimento tavoli',         200.00, 22, 'Forfait'),
('ricavo', 'Servizio', 'Servizio fotografico',        500.00, 22, 'Forfait evento'),
('ricavo', 'Extra',    'Intrattenimento musicale',    600.00, 22, 'Forfait'),
('ricavo', 'Extra',    'Torta personalizzata',        150.00, 10, 'Forfait'),

-- COSTI
('costo', 'Food',       'Materie prime cucina',        22.00, 10, 'Per persona – food cost medio'),
('costo', 'Food',       'Antipasto misto',              8.00, 10, 'Per persona'),
('costo', 'Food',       'Pasta fresca artigianale',     6.00, 10, 'Per persona'),
('costo', 'Food',       'Secondo piatto carne',        12.00, 10, 'Per persona'),
('costo', 'Food',       'Dessert',                      4.00, 10, 'Per persona'),
('costo', 'Bevande',    'Acqua minerale',               1.50, 22, 'Per persona'),
('costo', 'Bevande',    'Vino tavola',                  5.00, 22, 'Per persona'),
('costo', 'Bevande',    'Prosecco DOC',                 8.00, 22, 'Per persona'),
('costo', 'Bevande',    'Birra artigianale',            4.00, 22, 'Per persona'),
('costo', 'Staff',      'Chef / cuoco',               200.00, 22, 'Per evento (8h)'),
('costo', 'Staff',      'Cameriere',                  120.00, 22, 'Per evento (8h)'),
('costo', 'Staff',      'Barman',                     150.00, 22, 'Per evento (8h)'),
('costo', 'Staff',      'Coordinatore evento',        180.00, 22, 'Per evento'),
('costo', 'Logistica',  'Trasporto e consegna',        80.00, 22, 'Forfait'),
('costo', 'Logistica',  'Pulizia post-evento',         120.00, 22, 'Forfait'),
('costo', 'Noleggio',   'Noleggio tavoli e sedie',     150.00, 22, 'Forfait'),
('costo', 'Noleggio',   'Noleggio tovagliato',          80.00, 22, 'Forfait'),
('costo', 'Noleggio',   'Noleggio stoviglie',          100.00, 22, 'Forfait'),
('costo', 'Extra',      'Fiori e decorazioni',         200.00, 22, 'Forfait'),
('costo', 'Extra',      'Stampa menù e cartellonistica', 50.00, 22, 'Forfait');

-- --------------------------------------------------------
-- 4. EVENTI DI ESEMPIO
-- --------------------------------------------------------

DO $$
DECLARE
  ev1 UUID;
  ev2 UUID;
  ev3 UUID;
BEGIN

-- Evento 1: Cena aziendale confermata
INSERT INTO events (name, client_name, event_date, location, guests_count, status, notes)
VALUES ('Cena Aziendale Acme Srl', 'Acme Srl', '2026-07-15', 'Sala Principale – Doppio Malto Milano', 80, 'confermato',
        'Cliente storico. Richiesta menu senza glutine per 5 persone.')
RETURNING id INTO ev1;

INSERT INTO event_items (event_id, type, category, name, quantity, unit_price, vat_rate) VALUES
(ev1, 'ricavo', 'Food',     'Menu degustazione 5 portate', 80, 85.00, 10),
(ev1, 'ricavo', 'Bevande',  'Open bar premium 4h',         80, 40.00, 22),
(ev1, 'ricavo', 'Servizio', 'Noleggio sala eventi',         1, 800.00, 22),
(ev1, 'ricavo', 'Extra',    'Intrattenimento musicale',     1, 600.00, 22),
(ev1, 'costo',  'Food',     'Materie prime cucina',        80, 22.00, 10),
(ev1, 'costo',  'Bevande',  'Vino tavola',                 80,  5.00, 22),
(ev1, 'costo',  'Bevande',  'Prosecco DOC',                80,  8.00, 22),
(ev1, 'costo',  'Staff',    'Chef / cuoco',                 1, 200.00, 22),
(ev1, 'costo',  'Staff',    'Cameriere',                    4, 120.00, 22),
(ev1, 'costo',  'Staff',    'Barman',                       2, 150.00, 22),
(ev1, 'costo',  'Logistica','Pulizia post-evento',          1, 120.00, 22);

INSERT INTO margin_scenarios (event_id, name, discount_pct) VALUES
(ev1, 'Base',       0),
(ev1, 'Sconto 5%',  5),
(ev1, 'Sconto 10%', 10);

-- Evento 2: Matrimonio bozza
INSERT INTO events (name, client_name, event_date, location, guests_count, status, notes)
VALUES ('Matrimonio Rossi-Bianchi', 'Famiglia Rossi', '2026-09-20', 'Villa Reale – Monza', 120, 'bozza',
        'Primo contatto. Budget indicativo €15.000. Da confermare entro fine luglio.')
RETURNING id INTO ev2;

INSERT INTO event_items (event_id, type, category, name, quantity, unit_price, vat_rate) VALUES
(ev2, 'ricavo', 'Food',     'Cena di gala 4 portate',     120, 75.00, 10),
(ev2, 'ricavo', 'Bevande',  'Open bar premium 4h',        120, 40.00, 22),
(ev2, 'ricavo', 'Bevande',  'Welcome drink prosecco',     120,  8.00, 22),
(ev2, 'ricavo', 'Servizio', 'Allestimento tavoli',          1, 500.00, 22),
(ev2, 'ricavo', 'Extra',    'Torta personalizzata',         1, 400.00, 10),
(ev2, 'ricavo', 'Extra',    'Servizio fotografico',         1, 800.00, 22),
(ev2, 'costo',  'Food',     'Materie prime cucina',       120, 22.00, 10),
(ev2, 'costo',  'Bevande',  'Prosecco DOC',               120,  8.00, 22),
(ev2, 'costo',  'Bevande',  'Vino tavola',                120,  5.00, 22),
(ev2, 'costo',  'Staff',    'Chef / cuoco',                 2, 200.00, 22),
(ev2, 'costo',  'Staff',    'Cameriere',                    6, 120.00, 22),
(ev2, 'costo',  'Staff',    'Barman',                       2, 150.00, 22),
(ev2, 'costo',  'Noleggio', 'Noleggio tavoli e sedie',      1, 300.00, 22),
(ev2, 'costo',  'Noleggio', 'Noleggio tovagliato',          1, 150.00, 22),
(ev2, 'costo',  'Extra',    'Fiori e decorazioni',          1, 400.00, 22),
(ev2, 'costo',  'Logistica','Pulizia post-evento',          1, 180.00, 22);

INSERT INTO margin_scenarios (event_id, name, discount_pct) VALUES
(ev2, 'Proposta A', 0),
(ev2, 'Proposta B – sconto famiglia', 8);

-- Evento 3: Aperitivo concluso
INSERT INTO events (name, client_name, event_date, location, guests_count, status, notes)
VALUES ('Aperitivo Lancio Prodotto', 'Tech Startup Srl', '2026-05-10', 'Spazio Eventi – Doppio Malto Torino', 50, 'concluso',
        'Evento riuscito. Cliente soddisfatto. Ricontattare per evento autunnale.')
RETURNING id INTO ev3;

INSERT INTO event_items (event_id, type, category, name, quantity, unit_price, vat_rate) VALUES
(ev3, 'ricavo', 'Food',     'Buffet aperitivo',        50, 35.00, 10),
(ev3, 'ricavo', 'Bevande',  'Open bar premium 4h',     50, 40.00, 22),
(ev3, 'ricavo', 'Servizio', 'Noleggio sala eventi',     1, 400.00, 22),
(ev3, 'costo',  'Food',     'Materie prime cucina',    50, 12.00, 10),
(ev3, 'costo',  'Bevande',  'Birra artigianale',        50,  4.00, 22),
(ev3, 'costo',  'Bevande',  'Prosecco DOC',             50,  8.00, 22),
(ev3, 'costo',  'Staff',    'Cameriere',                 2, 120.00, 22),
(ev3, 'costo',  'Staff',    'Barman',                    1, 150.00, 22),
(ev3, 'costo',  'Logistica','Pulizia post-evento',       1,  80.00, 22);

INSERT INTO margin_scenarios (event_id, name, discount_pct) VALUES
(ev3, 'Consuntivo', 0);

END $$;
