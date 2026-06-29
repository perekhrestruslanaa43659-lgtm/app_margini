-- ============================================================
-- INGREDIENTI & DISTINTA BASE – Setup + Dati
-- Menu Doppio Malto Rev.43 02/2026
-- Esegui in Supabase SQL Editor
-- ============================================================

-- --------------------------------------------------------
-- 1. TABELLE
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'kg',
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name TEXT NOT NULL,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0
);

-- --------------------------------------------------------
-- 2. RLS
-- --------------------------------------------------------

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'allow_all_authenticated_ingredients') THEN
    CREATE POLICY "allow_all_authenticated_ingredients" ON ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'allow_anon_ingredients') THEN
    CREATE POLICY "allow_anon_ingredients" ON ingredients FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipe_items' AND policyname = 'allow_all_authenticated_recipe_items') THEN
    CREATE POLICY "allow_all_authenticated_recipe_items" ON recipe_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipe_items' AND policyname = 'allow_anon_recipe_items') THEN
    CREATE POLICY "allow_anon_recipe_items" ON recipe_items FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --------------------------------------------------------
-- 3. INGREDIENTI / SEMILAVORATI
-- unit: kg, L, pz, g, ml
-- cost_per_unit: costo per kg/L/pz (da aggiornare con prezzi reali)
-- --------------------------------------------------------

INSERT INTO ingredients (name, unit, cost_per_unit, supplier, notes)
VALUES
-- BASI & IMPASTI
('Focaccia Romana Base',        'kg',  3.20, NULL, 'Farina FRUMENTO, acqua, olio, sale, lievito'),
('Baresina Classica al Pomodoro','kg', 2.80, NULL, 'Farina GRANO, acqua, olio, pomodoro, sale'),
('Soft Burger Bun Grande',      'pz',  0.45, NULL, 'FRUMENTO, LATTE, SESAMO tracce, SOIA tracce, UOVA tracce'),
('Pane Grattugiato',            'kg',  1.80, NULL, 'GRANO'),
('Savoiardi',                   'kg',  4.50, NULL, 'FRUMENTO, UOVA'),
('Sbrisolona Base',             'kg',  5.20, NULL, 'GRANO, MANDORLE, UOVA, BURRO'),
('Crostini Pane Fritti',        'kg',  2.10, NULL, 'FRUMENTO, SESAMO, AVENA, SEGALE, ORZO'),
('Guttiau',                     'kg',  3.60, NULL, 'GRANO'),
('Tagliatelle Fresche',         'kg',  4.80, NULL, 'Semola GRANO duro, UOVA 20%'),
('Fusilloni',                   'kg',  2.40, NULL, 'Semola GRANO duro'),
('Mezzelune Funghi Porcini',    'kg',  7.20, NULL, 'GRANO, UOVA, LATTE, funghi porcini'),
('Cannolo Guscio',              'pz',  0.60, NULL, 'GRANO, UOVA. Può contenere FRUTTA A GUSCIO, SESAMO'),

-- CARNI & PROTEICI
('Hamburger Bovino 180g',       'pz',  2.80, NULL, 'Manzo, sale, pepe'),
('Scamone Bovino',              'kg', 18.00, NULL, 'Manzo scamone'),
('Cuberoll Entrecote',          'kg', 22.00, NULL, 'Entrecote bovino'),
('Sovracoscia Pollo Mediterranea','kg', 5.40, NULL, 'Pollo, aglio (ANIDRIDE SOLFOROSA, SOLFITI)'),
('Galletto Mediterraneo',       'kg',  6.80, NULL, 'Pollo intero, aglio (ANIDRIDE SOLFOROSA)'),
('Cotoletta di Pollo',          'kg',  7.20, NULL, 'Pollo, farina FRUMENTO, GRANO duro, LATTE polvere'),
('Costine di Maiale',           'kg',  8.50, NULL, 'Costine suino, spezie, aglio'),
('Straccetti di Maiale BBQ',    'kg',  7.80, NULL, 'Maiale, SOIA, SENAPE, ANIDRIDE SOLFOROSA'),
('Salsiccia alla Birra',        'kg',  6.20, NULL, 'Suino, birra (ORZO), spezie'),
('Merluzzo Alaska Impanato',    'kg',  9.80, NULL, 'PESCE merluzzo, FRUMENTO, panatura'),
('Tartare Bovino',              'kg', 20.00, NULL, 'Manzo tartare. Può contenere UOVA, LATTE, FRUTTA A GUSCIO, SOLFITI'),
('Arrosticini Campagnoli',      'kg', 12.00, NULL, 'Ovino e bovino'),
('Burger Vegetale',             'pz',  1.80, NULL, 'Proteine pisello, riso, spezie'),

-- LATTICINI & FORMAGGI
('Burrata',                     'kg', 14.00, NULL, 'LATTE vaccino, panna'),
('Stracciatella',               'kg', 12.00, NULL, 'LATTE vaccino'),
('Mozzarella Filone',           'kg',  7.50, NULL, 'LATTE vaccino'),
('Provola',                     'kg',  9.20, NULL, 'LATTE vaccino'),
('Pecorino Sardo',              'kg', 16.00, NULL, 'LATTE ovino'),
('Mascarpone',                  'kg',  8.00, NULL, 'LATTE, panna'),
('Robiola',                     'kg', 10.00, NULL, 'LATTE'),
('Crema Bella Lodi',            'kg',  6.50, NULL, 'LATTE, UOVO lisozima, formaggi misti'),
('Grana Bella Lodi Grattugiato','kg', 18.00, NULL, 'LATTE, UOVO lisozima'),
('Parmigiana di Melanzane',     'kg',  5.20, NULL, 'Melanzane, pomodoro, grana padano (LATTE, UOVO)'),
('Crema di Ricotta Dolce',      'kg',  7.80, NULL, 'Siero LATTE ovino, LATTE ovino, zucchero'),
('Panna Spray',                 'L',   4.80, NULL, 'LATTE'),

-- SALSE & CONDIMENTI
('Salsa BBQ DM',                'kg',  4.20, NULL, 'Pomodoro, zucchero, aceto, SOIA, FRUMENTO, PESCE acciughe'),
('Salsa Burger DM',             'kg',  3.60, NULL, 'Maionese, SENAPE, spezie'),
('Maionese alla Birra',         'kg',  4.80, NULL, 'UOVA, LATTE, SENAPE, FRUMENTO, ORZO, olio'),
('Salsa BBQ Bianca',            'kg',  3.80, NULL, 'UOVA, SENAPE, panna, SOLFITI'),
('Marmellata Bacon e Cipolle',  'kg',  6.50, NULL, 'Cipolla, pancetta, zucchero. Può contenere GLUTINE, UOVA, ARACHIDI, SOIA, FRUTTA A GUSCIO, SEDANO, SENAPE, SESAMO'),
('Salsa Miele e Zenzero',       'kg',  5.20, NULL, 'Miele, zenzero, UOVA, LATTE'),
('Emulsione Basilico',          'kg',  3.40, NULL, 'Basilico, olio oliva, limone'),
('Salsa Pomodori Rustici',      'kg',  2.80, NULL, 'Pomodori San Marzano, olio, sale, basilico'),
('Salsa Pomodoro',              'kg',  2.20, NULL, 'Pomodoro, olio, sale, basilico. Può contenere SOIA'),
('Salsa alle Erbe',             'kg',  3.80, NULL, 'Prezzemolo, basilico, olio oliva, limone, aglio'),
('Salsa Piccante',              'kg',  2.60, NULL, 'Peperoncino, aceto, aglio, olio'),
('Nutella',                     'kg', 12.00, NULL, 'NOCCIOLE, zucchero, olio palma, cacao, LATTE polvere, SOIA lecitina'),
('Ragù alla Bolognese',         'kg',  6.80, NULL, 'Bovino, suino, SEDANO, carota, cipolla, pomodoro, vino'),
('Salsa Carbonara',             'kg',  8.50, NULL, 'UOVA, pecorino (LATTE), Parmigiano (LATTE), BURRO, pepe'),
('Cioccolato Fondente Gocce',   'kg', 14.00, NULL, 'Cacao, zucchero. Può contenere LATTE'),

-- FRITTI & PREPARATI
('Chips Patate',                'kg',  2.40, NULL, 'Patate 93%, olio girasole 7%'),
('Anelli di Cipolla Pastellati','kg',  3.20, NULL, 'Cipolla, pastella GRANO, olio girasole, birra ORZO'),
('Rondelle Melanzana Pastellate','kg', 3.80, NULL, 'Melanzane, FRUMENTO, olio. Può contenere tutti gli allergeni'),
('Crocchè di Patate',           'kg',  3.60, NULL, 'Patate, LATTE, UOVA, prezzemolo'),
('Mozzarella in Carrozza',      'kg',  7.20, NULL, 'Mozzarella, LATTE, GRANO, SOIA, panatura FRUMENTO. Può contenere PESCE, FRUTTA A GUSCIO, SENAPE, SESAMO, SEDANO'),
('Arancini Pronti',             'pz',  1.20, NULL, 'Riso, ragù, mozzarella (LATTE), panatura (GRANO, UOVA)'),
('Gnocco Fritto',               'kg',  2.80, NULL, 'FRUMENTO, LATTE polvere, strutto, aceto vino (SOLFITI)'),

-- VERDURE & CONTORNI
('Patate a Spicchio',           'kg',  1.40, NULL, 'Patate, olio oliva, rosmarino, sale'),
('Verdure Miste Grigliate',     'kg',  3.20, NULL, 'Melanzane, zucchine, peperoni, carote, cipolla'),
('Fagiolini',                   'kg',  2.80, NULL, 'Fagiolini, sale'),
('Rucola',                      'kg',  4.00, NULL, 'Rucola fresca'),
('Insalata Mista',              'kg',  2.40, NULL, 'Riccia, gentile, cavolo cappuccio'),
('Pomodoro Ramato',             'kg',  2.60, NULL, 'Pomodori ramati freschi'),
('Pomodori Piccadilly',         'kg',  3.20, NULL, 'Pomodori piccadilly freschi'),
('Cipolla Rossa',               'kg',  1.60, NULL, 'Cipolla rossa di Tropea'),
('Funghi Portobello',           'kg',  5.60, NULL, 'Funghi portobello freschi'),
('Olive Nere',                  'kg',  4.20, NULL, 'Olive nere denocciolate'),

-- SALUMI & AFFETTATI
('Prosciutto Crudo',            'kg', 18.00, NULL, 'Prosciutto crudo di Parma'),
('Mortadella',                  'kg',  8.00, NULL, 'Mortadella Bologna IGP'),
('Pancetta',                    'kg', 10.00, NULL, 'Pancetta tesa stagionata'),
('Nduja',                       'kg', 14.00, NULL, 'Nduja di Spilinga (suino, peperoncino)'),

-- DOLCI & DESSERT
('Gelato alla Panna',           'kg',  6.80, NULL, 'LATTE, panna, zucchero'),
('Gelato alla Birra',           'kg',  8.20, NULL, 'LATTE, birra (ORZO, FRUMENTO), UOVA tuorlo, zucchero'),
('Gelato Caramello Salato',     'kg',  7.40, NULL, 'LATTE, caramello, sale'),
('Frutti di Bosco Sciroppo',    'kg',  4.60, NULL, 'Lamponi, mirtilli, ribes, sciroppo'),
('Granella Pistacchio',         'kg', 32.00, NULL, 'PISTACCHIO (FRUTTA A GUSCIO)'),
('Offelle',                     'pz',  0.25, NULL, 'FRUMENTO, BURRO, UOVA, SOIA lecitina'),
('Zucchero a Velo',             'kg',  1.80, NULL, 'Zucchero, amido'),
('Cacao Amaro',                 'kg',  8.00, NULL, 'Cacao. Può contenere LATTE'),
('Vanillina',                   'kg', 60.00, NULL, 'Vanillina artificiale'),

-- BIRRE DM (per ricette cocktail e dessert)
('Black Stout DM 0.4',         'L',   3.20, NULL, 'ORZO, FRUMENTO, luppolo, lievito'),
('Extra Bitter DM 0.4',        'L',   2.80, NULL, 'ORZO, luppolo, lievito'),
('Bella Rossa DM 0.4',         'L',   2.80, NULL, 'ORZO, luppolo, lievito'),
('Super Chiara DM 0.4',        'L',   2.60, NULL, 'ORZO, luppolo, lievito'),
('Summer IPA DM 0.4',          'L',   3.00, NULL, 'ORZO, FRUMENTO, AVENA, luppolo, arancia'),

-- ALCOLICI BASE
('Caffè Espresso',              'pz',  0.18, NULL, 'Caffè arabica/robusta'),
('Baileys Irish Cream',         'L',  18.00, NULL, 'Panna (LATTE), whisky irlandese, cacao'),
('Vermouth Rosso Cinzano',      'L',   8.00, NULL, 'Vino (SOLFITI), aromi, erbe'),
('Prosecco Valdobbiadene',      'L',   7.50, NULL, 'Vino bianco spumante (SOLFITI)'),
('Rhum Chiaro',                 'L',  12.00, NULL, 'Distillato canna da zucchero'),
('Gin',                         'L',  14.00, NULL, 'Distillato di cereali, ginepro'),
('Vodka',                       'L',  10.00, NULL, 'Distillato di cereali'),
('Whisky Johnnie Walker',       'L',  20.00, NULL, 'Malto ORZO, cereali')

ON CONFLICT (name) DO UPDATE SET
  unit         = EXCLUDED.unit,
  cost_per_unit = EXCLUDED.cost_per_unit,
  notes        = EXCLUDED.notes;

-- --------------------------------------------------------
-- 4. RICETTE – collega piatti agli ingredienti
-- quantity = quantità per porzione (in base all'unità)
-- --------------------------------------------------------

-- Prima pulisce le ricette esistenti per i piatti che stiamo popolando
DELETE FROM recipe_items WHERE dish_name IN (
  'Chips Bella Lodi', 'Focaccia Barese', 'Mozzarelle in Carrozza',
  'Anelli di Cipolla', 'Siamo Fritti', 'Gnocco Fritto', 'Spicchi di Focaccia',
  'Caprese di Burrata e Pomodori', 'Antipasto Tricolore', 'Caponata di Verdure',
  'Arancini (4 pz)', 'Tartare Pistacchio e Bella Lodi', 'Tagliata di Pollo Panato',
  'Spiedini di Pollo Panati', 'Arrosticini Abruzzesi',
  'Super Classico Burger', 'Il Troppo Buono', 'Bacon e Provola', 'Super BBQ',
  'Pulled Pork All Italiana', 'Tartare e Bella Lodi Burger', 'Burger Carbonara Ole',
  'Fish&Chips Burger', 'Pollo Fritto Burger', 'Che Pollo', 'Vegetale e Quale Burger',
  'Doppio Smash Bacon e Cheddar',
  'Gran Tagliata', 'Gran Tagliata Speciale', 'Tagliata di Pollo', 'Tagliata di Pollo BBQ',
  'Galletto Mediterraneo', 'Costine di Maiale', 'Cosce in Crosta', 'Arrosticini di Pollo',
  'Burrata e Verdure alla Brace',
  'Margherita', 'Crudo e Piccadilly', 'Mortadella e Fiordilatte', 'Pizza Ortolana',
  'Tagliatelle al Ragu', 'Fusilli Pesto Rosso', 'Gnocchi e Gratinati Bella Lodi',
  'Gnocchi Bella Lodi e Pepe', 'Parmigiana',
  'Orto Fresco Insalata', 'Manzo e Burrata', 'Caponata e Crudite',
  'Patate a Fiammifero', 'Patate a Spicchio', 'Patate Chips', 'Verdure Grigliate', 'Fagiolini',
  'Birramisu''', 'Torta Caprese', 'Cheesecake Frutti di Bosco', 'Cheesecake Nutella',
  'Cannolo Singolo', 'Cannolo Scomposto', 'Caffe'' Gourmand',
  'Coppa Fiordilatte e Nutella', 'Coppa Birra e Caramello Salato',
  'Irlandese', 'Capadolce'
);

INSERT INTO recipe_items (dish_name, ingredient_id, quantity)
SELECT dish_name, i.id, qty
FROM (VALUES

-- CHIPS BELLA LODI
('Chips Bella Lodi',        'Chips Patate',               0.08),
('Chips Bella Lodi',        'Crema Bella Lodi',           0.05),
('Chips Bella Lodi',        'Marmellata Bacon e Cipolle', 0.03),

-- FOCACCIA BARESE
('Focaccia Barese',         'Baresina Classica al Pomodoro', 0.15),
('Focaccia Barese',         'Emulsione Basilico',         0.02),

-- MOZZARELLE IN CARROZZA
('Mozzarelle in Carrozza',  'Mozzarella in Carrozza',     0.12),
('Mozzarelle in Carrozza',  'Salsa Pomodoro',             0.04),

-- ANELLI DI CIPOLLA
('Anelli di Cipolla',       'Anelli di Cipolla Pastellati', 0.12),
('Anelli di Cipolla',       'Maionese alla Birra',        0.04),

-- SIAMO FRITTI
('Siamo Fritti',            'Rondelle Melanzana Pastellate', 0.06),
('Siamo Fritti',            'Crocchè di Patate',          0.06),
('Siamo Fritti',            'Anelli di Cipolla Pastellati', 0.06),
('Siamo Fritti',            'Maionese alla Birra',        0.04),

-- GNOCCO FRITTO
('Gnocco Fritto',           'Gnocco Fritto',              0.15),
('Gnocco Fritto',           'Prosciutto Crudo',           0.04),
('Gnocco Fritto',           'Mortadella',                 0.04),
('Gnocco Fritto',           'Stracciatella',              0.04),

-- SPICCHI DI FOCACCIA
('Spicchi di Focaccia',     'Focaccia Romana Base',       0.18),
('Spicchi di Focaccia',     'Crema Bella Lodi',           0.04),
('Spicchi di Focaccia',     'Prosciutto Crudo',           0.04),

-- CAPRESE DI BURRATA E POMODORI
('Caprese di Burrata e Pomodori', 'Burrata',              0.12),
('Caprese di Burrata e Pomodori', 'Pomodoro Ramato',      0.15),
('Caprese di Burrata e Pomodori', 'Olive Nere',           0.02),
('Caprese di Burrata e Pomodori', 'Emulsione Basilico',   0.02),

-- ANTIPASTO TRICOLORE
('Antipasto Tricolore',     'Prosciutto Crudo',           0.05),
('Antipasto Tricolore',     'Mortadella',                 0.05),
('Antipasto Tricolore',     'Stracciatella',              0.05),
('Antipasto Tricolore',     'Baresina Classica al Pomodoro', 0.06),
('Antipasto Tricolore',     'Guttiau',                    0.02),

-- CAPONATA DI VERDURE
('Caponata di Verdure',     'Verdure Miste Grigliate',    0.15),
('Caponata di Verdure',     'Salsa Pomodori Rustici',     0.05),
('Caponata di Verdure',     'Olive Nere',                 0.02),
('Caponata di Verdure',     'Crema Bella Lodi',           0.04),

-- ARANCINI (4 pz)
('Arancini (4 pz)',         'Arancini Pronti',            4.00),
('Arancini (4 pz)',         'Salsa Pomodoro',             0.04),

-- TARTARE PISTACCHIO E BELLA LODI
('Tartare Pistacchio e Bella Lodi', 'Tartare Bovino',     0.12),
('Tartare Pistacchio e Bella Lodi', 'Crema Bella Lodi',   0.04),
('Tartare Pistacchio e Bella Lodi', 'Granella Pistacchio',0.02),

-- TAGLIATA DI POLLO PANATO
('Tagliata di Pollo Panato','Cotoletta di Pollo',         0.18),
('Tagliata di Pollo Panato','Insalata Mista',             0.08),
('Tagliata di Pollo Panato','Pomodoro Ramato',            0.06),
('Tagliata di Pollo Panato','Maionese alla Birra',        0.03),

-- SPIEDINI DI POLLO PANATI
('Spiedini di Pollo Panati','Cotoletta di Pollo',         0.18),
('Spiedini di Pollo Panati','Pane Grattugiato',           0.03),
('Spiedini di Pollo Panati','Emulsione Basilico',         0.02),

-- ARROSTICINI ABRUZZESI
('Arrosticini Abruzzesi',   'Arrosticini Campagnoli',     0.20),

-- ============ BURGER ============

-- SUPER CLASSICO BURGER
('Super Classico Burger',   'Soft Burger Bun Grande',     1.00),
('Super Classico Burger',   'Hamburger Bovino 180g',      1.00),
('Super Classico Burger',   'Provola',                    0.04),
('Super Classico Burger',   'Insalata Mista',             0.04),
('Super Classico Burger',   'Pomodoro Ramato',            0.05),
('Super Classico Burger',   'Maionese alla Birra',        0.04),
('Super Classico Burger',   'Chips Patate',               0.10),

-- IL TROPPO BUONO
('Il Troppo Buono',         'Soft Burger Bun Grande',     1.00),
('Il Troppo Buono',         'Hamburger Bovino 180g',      1.00),
('Il Troppo Buono',         'Salsa BBQ Bianca',           0.04),
('Il Troppo Buono',         'Marmellata Bacon e Cipolle', 0.04),
('Il Troppo Buono',         'Grana Bella Lodi Grattugiato',0.03),
('Il Troppo Buono',         'Insalata Mista',             0.04),
('Il Troppo Buono',         'Pomodoro Ramato',            0.05),
('Il Troppo Buono',         'Maionese alla Birra',        0.04),
('Il Troppo Buono',         'Chips Patate',               0.10),

-- BACON E PROVOLA
('Bacon e Provola',         'Soft Burger Bun Grande',     1.00),
('Bacon e Provola',         'Hamburger Bovino 180g',      1.00),
('Bacon e Provola',         'Provola',                    0.05),
('Bacon e Provola',         'Pancetta',                   0.04),
('Bacon e Provola',         'Salsa Burger DM',            0.03),
('Bacon e Provola',         'Insalata Mista',             0.04),
('Bacon e Provola',         'Pomodoro Ramato',            0.05),
('Bacon e Provola',         'Maionese alla Birra',        0.04),
('Bacon e Provola',         'Chips Patate',               0.10),

-- SUPER BBQ
('Super BBQ',               'Soft Burger Bun Grande',     1.00),
('Super BBQ',               'Hamburger Bovino 180g',      1.00),
('Super BBQ',               'Salsa BBQ DM',               0.05),
('Super BBQ',               'Anelli di Cipolla Pastellati',0.06),
('Super BBQ',               'Maionese alla Birra',        0.04),
('Super BBQ',               'Chips Patate',               0.10),

-- PULLED PORK ALL ITALIANA
('Pulled Pork All Italiana','Soft Burger Bun Grande',     1.00),
('Pulled Pork All Italiana','Straccetti di Maiale BBQ',   0.15),
('Pulled Pork All Italiana','Salsa BBQ DM',               0.04),
('Pulled Pork All Italiana','Cipolla Rossa',              0.04),
('Pulled Pork All Italiana','Insalata Mista',             0.03),
('Pulled Pork All Italiana','Maionese alla Birra',        0.04),
('Pulled Pork All Italiana','Chips Patate',               0.10),

-- TARTARE E BELLA LODI BURGER
('Tartare e Bella Lodi Burger','Soft Burger Bun Grande',  1.00),
('Tartare e Bella Lodi Burger','Tartare Bovino',          0.12),
('Tartare e Bella Lodi Burger','Stracciatella',           0.05),
('Tartare e Bella Lodi Burger','Grana Bella Lodi Grattugiato',0.03),
('Tartare e Bella Lodi Burger','Funghi Portobello',       0.05),
('Tartare e Bella Lodi Burger','Emulsione Basilico',      0.02),
('Tartare e Bella Lodi Burger','Maionese alla Birra',     0.04),
('Tartare e Bella Lodi Burger','Chips Patate',            0.10),

-- BURGER CARBONARA OLE
('Burger Carbonara Ole',    'Soft Burger Bun Grande',     1.00),
('Burger Carbonara Ole',    'Hamburger Bovino 180g',      1.00),
('Burger Carbonara Ole',    'Salsa Carbonara',            0.06),
('Burger Carbonara Ole',    'Pancetta',                   0.04),
('Burger Carbonara Ole',    'Pecorino Sardo',             0.03),
('Burger Carbonara Ole',    'Insalata Mista',             0.03),
('Burger Carbonara Ole',    'Maionese alla Birra',        0.04),
('Burger Carbonara Ole',    'Chips Patate',               0.10),

-- FISH & CHIPS BURGER
('Fish&Chips Burger',       'Soft Burger Bun Grande',     1.00),
('Fish&Chips Burger',       'Merluzzo Alaska Impanato',   0.16),
('Fish&Chips Burger',       'Salsa Burger DM',            0.03),
('Fish&Chips Burger',       'Insalata Mista',             0.04),
('Fish&Chips Burger',       'Pomodoro Ramato',            0.05),
('Fish&Chips Burger',       'Maionese alla Birra',        0.04),
('Fish&Chips Burger',       'Chips Patate',               0.10),

-- POLLO FRITTO BURGER
('Pollo Fritto Burger',     'Soft Burger Bun Grande',     1.00),
('Pollo Fritto Burger',     'Cotoletta di Pollo',         0.18),
('Pollo Fritto Burger',     'Salsa Miele e Zenzero',      0.04),
('Pollo Fritto Burger',     'Marmellata Bacon e Cipolle', 0.03),
('Pollo Fritto Burger',     'Insalata Mista',             0.04),
('Pollo Fritto Burger',     'Maionese alla Birra',        0.04),
('Pollo Fritto Burger',     'Chips Patate',               0.10),

-- CHE POLLO
('Che Pollo',               'Soft Burger Bun Grande',     1.00),
('Che Pollo',               'Sovracoscia Pollo Mediterranea',0.18),
('Che Pollo',               'Pancetta',                   0.04),
('Che Pollo',               'Insalata Mista',             0.04),
('Che Pollo',               'Maionese alla Birra',        0.04),
('Che Pollo',               'Chips Patate',               0.10),

-- VEGETALE E QUALE BURGER
('Vegetale e Quale Burger', 'Soft Burger Bun Grande',     1.00),
('Vegetale e Quale Burger', 'Burger Vegetale',            1.00),
('Vegetale e Quale Burger', 'Salsa Burger DM',            0.03),
('Vegetale e Quale Burger', 'Insalata Mista',             0.04),
('Vegetale e Quale Burger', 'Pomodoro Ramato',            0.05),
('Vegetale e Quale Burger', 'Maionese alla Birra',        0.04),
('Vegetale e Quale Burger', 'Chips Patate',               0.10),

-- DOPPIO SMASH
('Doppio Smash Bacon e Cheddar','Soft Burger Bun Grande', 1.00),
('Doppio Smash Bacon e Cheddar','Hamburger Bovino 180g',  2.00),
('Doppio Smash Bacon e Cheddar','Provola',                0.06),
('Doppio Smash Bacon e Cheddar','Pancetta',               0.05),
('Doppio Smash Bacon e Cheddar','Maionese alla Birra',    0.04),
('Doppio Smash Bacon e Cheddar','Chips Patate',           0.10),

-- ============ BRACE ============

-- GRAN TAGLIATA
('Gran Tagliata',           'Scamone Bovino',             0.22),
('Gran Tagliata',           'Patate a Spicchio',          0.15),
('Gran Tagliata',           'Verdure Miste Grigliate',    0.08),
('Gran Tagliata',           'Rucola',                     0.03),
('Gran Tagliata',           'Maionese alla Birra',        0.04),

-- GRAN TAGLIATA SPECIALE
('Gran Tagliata Speciale',  'Cuberoll Entrecote',         0.22),
('Gran Tagliata Speciale',  'Patate a Spicchio',          0.15),
('Gran Tagliata Speciale',  'Verdure Miste Grigliate',    0.08),
('Gran Tagliata Speciale',  'Rucola',                     0.03),
('Gran Tagliata Speciale',  'Maionese alla Birra',        0.04),

-- TAGLIATA DI POLLO
('Tagliata di Pollo',       'Sovracoscia Pollo Mediterranea',0.20),
('Tagliata di Pollo',       'Patate a Spicchio',          0.15),
('Tagliata di Pollo',       'Verdure Miste Grigliate',    0.08),
('Tagliata di Pollo',       'Salsa alle Erbe',            0.04),
('Tagliata di Pollo',       'Maionese alla Birra',        0.03),

-- TAGLIATA DI POLLO BBQ
('Tagliata di Pollo BBQ',   'Sovracoscia Pollo Mediterranea',0.20),
('Tagliata di Pollo BBQ',   'Patate a Spicchio',          0.15),
('Tagliata di Pollo BBQ',   'Verdure Miste Grigliate',    0.08),
('Tagliata di Pollo BBQ',   'Salsa BBQ DM',               0.04),
('Tagliata di Pollo BBQ',   'Maionese alla Birra',        0.03),

-- GALLETTO MEDITERRANEO
('Galletto Mediterraneo',   'Galletto Mediterraneo',      0.45),
('Galletto Mediterraneo',   'Patate a Spicchio',          0.15),
('Galletto Mediterraneo',   'Rucola',                     0.03),
('Galletto Mediterraneo',   'Maionese alla Birra',        0.03),

-- COSTINE DI MAIALE
('Costine di Maiale',       'Costine di Maiale',          0.30),
('Costine di Maiale',       'Salsa BBQ DM',               0.05),
('Costine di Maiale',       'Patate a Spicchio',          0.15),
('Costine di Maiale',       'Verdure Miste Grigliate',    0.08),
('Costine di Maiale',       'Maionese alla Birra',        0.03),

-- COSCE IN CROSTA
('Cosce in Crosta',         'Sovracoscia Pollo Mediterranea',0.25),
('Cosce in Crosta',         'Patate a Spicchio',          0.15),
('Cosce in Crosta',         'Verdure Miste Grigliate',    0.08),
('Cosce in Crosta',         'Rucola',                     0.03),
('Cosce in Crosta',         'Maionese alla Birra',        0.03),

-- ARROSTICINI DI POLLO
('Arrosticini di Pollo',    'Cotoletta di Pollo',         0.20),
('Arrosticini di Pollo',    'Pane Grattugiato',           0.03),
('Arrosticini di Pollo',    'Emulsione Basilico',         0.02),

-- BURRATA E VERDURE ALLA BRACE
('Burrata e Verdure alla Brace','Burrata',                0.12),
('Burrata e Verdure alla Brace','Verdure Miste Grigliate',0.15),
('Burrata e Verdure alla Brace','Pomodoro Ramato',        0.06),
('Burrata e Verdure alla Brace','Emulsione Basilico',     0.02),

-- ============ PIZZE ============

-- MARGHERITA
('Margherita',              'Focaccia Romana Base',       0.22),
('Margherita',              'Salsa Pomodoro',             0.08),
('Margherita',              'Mozzarella Filone',          0.10),

-- CRUDO E PICCADILLY
('Crudo e Piccadilly',      'Focaccia Romana Base',       0.22),
('Crudo e Piccadilly',      'Mozzarella Filone',          0.10),
('Crudo e Piccadilly',      'Prosciutto Crudo',           0.06),
('Crudo e Piccadilly',      'Pomodori Piccadilly',        0.08),
('Crudo e Piccadilly',      'Grana Bella Lodi Grattugiato',0.03),

-- MORTADELLA E FIORDILATTE
('Mortadella e Fiordilatte','Focaccia Romana Base',       0.22),
('Mortadella e Fiordilatte','Mozzarella Filone',          0.10),
('Mortadella e Fiordilatte','Mortadella',                 0.08),
('Mortadella e Fiordilatte','Crema Bella Lodi',           0.04),
('Mortadella e Fiordilatte','Granella Pistacchio',        0.02),

-- PIZZA ORTOLANA
('Pizza Ortolana',          'Focaccia Romana Base',       0.22),
('Pizza Ortolana',          'Mozzarella Filone',          0.10),
('Pizza Ortolana',          'Verdure Miste Grigliate',    0.12),
('Pizza Ortolana',          'Pomodori Piccadilly',        0.06),
('Pizza Ortolana',          'Emulsione Basilico',         0.02),

-- ============ PASTE ============

-- TAGLIATELLE AL RAGU
('Tagliatelle al Ragu',     'Tagliatelle Fresche',        0.10),
('Tagliatelle al Ragu',     'Ragù alla Bolognese',        0.12),
('Tagliatelle al Ragu',     'Salsa Pomodoro',             0.04),
('Tagliatelle al Ragu',     'Grana Bella Lodi Grattugiato',0.03),

-- FUSILLI PESTO ROSSO
('Fusilli Pesto Rosso',     'Fusilloni',                  0.10),
('Fusilli Pesto Rosso',     'Crema Bella Lodi',           0.06),
('Fusilli Pesto Rosso',     'Verdure Miste Grigliate',    0.06),

-- GNOCCHI E GRATINATI BELLA LODI
('Gnocchi e Gratinati Bella Lodi','Mezzelune Funghi Porcini',0.18),
('Gnocchi e Gratinati Bella Lodi','Crema Bella Lodi',     0.06),
('Gnocchi e Gratinati Bella Lodi','Funghi Portobello',    0.06),

-- GNOCCHI BELLA LODI E PEPE
('Gnocchi Bella Lodi e Pepe','Mezzelune Funghi Porcini',  0.18),
('Gnocchi Bella Lodi e Pepe','Crema Bella Lodi',          0.06),
('Gnocchi Bella Lodi e Pepe','Grana Bella Lodi Grattugiato',0.03),

-- PARMIGIANA
('Parmigiana',              'Parmigiana di Melanzane',    0.20),
('Parmigiana',              'Salsa Pomodoro',             0.05),
('Parmigiana',              'Mozzarella Filone',          0.08),
('Parmigiana',              'Crema Bella Lodi',           0.04),

-- ============ INSALATE ============

-- ORTO FRESCO INSALATA
('Orto Fresco Insalata',    'Insalata Mista',             0.10),
('Orto Fresco Insalata',    'Pomodoro Ramato',            0.08),
('Orto Fresco Insalata',    'Verdure Miste Grigliate',    0.06),
('Orto Fresco Insalata',    'Salsa alle Erbe',            0.03),
('Orto Fresco Insalata',    'Guttiau',                    0.02),

-- MANZO E BURRATA
('Manzo e Burrata',         'Scamone Bovino',             0.12),
('Manzo e Burrata',         'Burrata',                    0.10),
('Manzo e Burrata',         'Insalata Mista',             0.08),
('Manzo e Burrata',         'Pomodoro Ramato',            0.06),
('Manzo e Burrata',         'Crostini Pane Fritti',       0.03),
('Manzo e Burrata',         'Salsa alle Erbe',            0.03),
('Manzo e Burrata',         'Guttiau',                    0.02),

-- CAPONATA E CRUDITE
('Caponata e Crudite',      'Verdure Miste Grigliate',    0.12),
('Caponata e Crudite',      'Insalata Mista',             0.06),
('Caponata e Crudite',      'Salsa Pomodori Rustici',     0.05),
('Caponata e Crudite',      'Olive Nere',                 0.02),
('Caponata e Crudite',      'Emulsione Basilico',         0.02),
('Caponata e Crudite',      'Guttiau',                    0.02),

-- ============ CONTORNI ============

('Patate a Fiammifero',     'Chips Patate',               0.12),
('Patate a Fiammifero',     'Maionese alla Birra',        0.04),
('Patate a Spicchio',       'Patate a Spicchio',          0.18),
('Patate Chips',            'Chips Patate',               0.08),
('Patate Chips',            'Maionese alla Birra',        0.04),
('Verdure Grigliate',       'Verdure Miste Grigliate',    0.18),
('Verdure Grigliate',       'Emulsione Basilico',         0.02),
('Fagiolini',               'Fagiolini',                  0.15),
('Fagiolini',               'Emulsione Basilico',         0.02),

-- ============ DESSERT ============

-- BIRRAMISU'
('Birramisu''',             'Mascarpone',                 0.08),
('Birramisu''',             'Savoiardi',                  0.06),
('Birramisu''',             'Black Stout DM 0.4',         0.08),
('Birramisu''',             'Cioccolato Fondente Gocce',  0.02),
('Birramisu''',             'Vanillina',                  0.001),

-- TORTA CAPRESE
('Torta Caprese',           'Sbrisolona Base',            0.12),
('Torta Caprese',           'Granella Pistacchio',        0.02),
('Torta Caprese',           'Gelato alla Panna',          0.08),

-- CHEESECAKE FRUTTI DI BOSCO
('Cheesecake Frutti di Bosco','Sbrisolona Base',          0.10),
('Cheesecake Frutti di Bosco','Robiola',                  0.08),
('Cheesecake Frutti di Bosco','Frutti di Bosco Sciroppo', 0.06),
('Cheesecake Frutti di Bosco','Panna Spray',              0.04),

-- CHEESECAKE NUTELLA
('Cheesecake Nutella',      'Sbrisolona Base',            0.10),
('Cheesecake Nutella',      'Robiola',                    0.08),
('Cheesecake Nutella',      'Nutella',                    0.05),
('Cheesecake Nutella',      'Panna Spray',                0.04),

-- CANNOLO SINGOLO
('Cannolo Singolo',         'Cannolo Guscio',             1.00),
('Cannolo Singolo',         'Crema di Ricotta Dolce',     0.06),
('Cannolo Singolo',         'Cioccolato Fondente Gocce',  0.01),
('Cannolo Singolo',         'Granella Pistacchio',        0.01),

-- CANNOLO SCOMPOSTO
('Cannolo Scomposto',       'Cannolo Guscio',             1.00),
('Cannolo Scomposto',       'Crema di Ricotta Dolce',     0.08),
('Cannolo Scomposto',       'Cioccolato Fondente Gocce',  0.02),
('Cannolo Scomposto',       'Granella Pistacchio',        0.02),
('Cannolo Scomposto',       'Panna Spray',                0.04),

-- CAFFE' GOURMAND
('Caffe'' Gourmand',        'Caffè Espresso',             1.00),
('Caffe'' Gourmand',        'Mascarpone',                 0.04),
('Caffe'' Gourmand',        'Savoiardi',                  0.03),
('Caffe'' Gourmand',        'Cannolo Guscio',             1.00),
('Caffe'' Gourmand',        'Crema di Ricotta Dolce',     0.04),
('Caffe'' Gourmand',        'Sbrisolona Base',            0.05),
('Caffe'' Gourmand',        'Cioccolato Fondente Gocce',  0.02),

-- COPPA FIORDILATTE E NUTELLA
('Coppa Fiordilatte e Nutella','Gelato alla Panna',       0.12),
('Coppa Fiordilatte e Nutella','Nutella',                 0.04),
('Coppa Fiordilatte e Nutella','Panna Spray',             0.04),
('Coppa Fiordilatte e Nutella','Sbrisolona Base',         0.04),

-- COPPA BIRRA E CARAMELLO SALATO
('Coppa Birra e Caramello Salato','Gelato alla Birra',    0.10),
('Coppa Birra e Caramello Salato','Gelato Caramello Salato',0.06),
('Coppa Birra e Caramello Salato','Sbrisolona Base',      0.04),
('Coppa Birra e Caramello Salato','Frutti di Bosco Sciroppo',0.04),
('Coppa Birra e Caramello Salato','Panna Spray',          0.04),
('Coppa Birra e Caramello Salato','Offelle',              2.00),

-- ============ CAFFE SPECIALI ============

('Irlandese',               'Caffè Espresso',             1.00),
('Irlandese',               'Baileys Irish Cream',        0.04),
('Irlandese',               'Panna Spray',                0.03),
('Irlandese',               'Cioccolato Fondente Gocce',  0.01),

('Capadolce',               'Caffè Espresso',             1.00),
('Capadolce',               'Nutella',                    0.03),
('Capadolce',               'Panna Spray',                0.03),
('Capadolce',               'Sbrisolona Base',            0.04),
('Capadolce',               'Cacao Amaro',                0.005)

) AS v(dish_name, ingredient_name, qty)
JOIN ingredients i ON i.name = v.ingredient_name;
