-- ============================================================
-- AGGIORNAMENTO PREZZI CATALOGO da VARIANTI_FOOD_AND_BEVERAGE.csv
-- Aggiorna unit_price nei catalog_items esistenti e inserisce
-- le voci food/beverage principali con prezzi reali.
-- Esegui nell'SQL Editor di Supabase.
-- ============================================================

-- 1. AGGIORNA PREZZI BIRRE MEDIE esistenti
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Ultra Pils'      AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Sexy IPA'        AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Honey IPA'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Iper Weiss'      AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Super Chiara'    AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Bella Rossa'     AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Summer IPA'      AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 Imperiale'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Black Stout'     AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Extra Bitter'    AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 Magnus'          AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Panache'         AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Radler'          AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 0.00 WHERE name = '0.4 Super Blanche'   AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 Chiara Alcool Free'  AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 Summer Alcool Free'  AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Regina'          AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 Zingi Ale'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.00 WHERE name = '0.4 Cocoa IPA'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 ''O Sole Mio'    AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 6.40 WHERE name = '0.4 + Che Rossa'     AND type = 'ricavo';

-- 2. AGGIORNA PREZZI BIRRE PICCOLE esistenti
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Summer IPA'      AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Sexy IPA'        AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Extra Bitter'    AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Honey IPA'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Iper Weiss'      AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Bella Rossa'     AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Panache'         AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Radler'          AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Imperiale'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Black Stout'     AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.60 WHERE name = '0.2 Zingi Ale'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Cocoa IPA'       AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 ''O Sole Mio'    AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 Regina'          AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.80 WHERE name = '0.2 Summer Alcool Free' AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 4.00 WHERE name = '0.2 Chiara Alcool Free' AND type = 'ricavo';
UPDATE catalog_items SET unit_price = 3.40 WHERE name = '0.2 + Che Rossa'     AND type = 'ricavo';

-- 3. INSERT/UPDATE FOOD – usa ON CONFLICT su (name, type) se esiste unique,
--    altrimenti DELETE + INSERT per le categorie food principali

-- Rimuove solo le voci food con prezzo 0 per reinserirle con prezzi reali
DELETE FROM catalog_items
WHERE type = 'ricavo'
  AND unit_price = 0
  AND category IN ('Starter','Burger','Brace','Pizze','Paste','Insalate','Contorni','Dessert','Cocktails','Caffè','Vini','Amari','Bibite');

-- INSERT voci RICAVO food & beverage con prezzi reali dal CSV
INSERT INTO catalog_items (type, category, name, unit_price, vat_rate, notes) VALUES

-- STARTER
('ricavo','Starter','Siamo Fritti',              13.60, 10, NULL),
('ricavo','Starter','Antipasto Tricolore',        15.20, 10, NULL),
('ricavo','Starter','Chips Bella Lodi',            5.00, 10, NULL),
('ricavo','Starter','Anelli di Cipolla',           5.80, 10, NULL),
('ricavo','Starter','Rondelle di Melanzana',       4.80, 10, NULL),
('ricavo','Starter','Gnocco Fritto',               7.60, 10, NULL),
('ricavo','Starter','Spiedini di Pollo Panati',   13.40, 10, NULL),
('ricavo','Starter','Tartare Pistacchio e Bella Lodi', 15.60, 10, NULL),
('ricavo','Starter','Arrosticini Abruzzesi',       9.69, 10, NULL),
('ricavo','Starter','Arancini (4 pz)',             6.80, 10, NULL),
('ricavo','Starter','Caprese di Burrata e Pomodori', 8.20, 10, NULL),
('ricavo','Starter','Bombette Pugliesi',           7.80, 10, NULL),
('ricavo','Starter','Tagliata di Pollo Panata',    7.20, 10, NULL),
('ricavo','Starter','Spicchi di Focaccia',         6.40, 10, NULL),
('ricavo','Starter','Prosciutto e Melone',        12.00, 10, NULL),
('ricavo','Starter','Tagliere San Daniele',       36.00, 10, NULL),
('ricavo','Starter','Cazzilli (6pz)',             10.88, 10, NULL),

-- BURGER
('ricavo','Burger','''Nduja e Bella Lodi',        12.40, 10, NULL),
('ricavo','Burger','Tartare e Bella Lodi Burger', 13.80, 10, NULL),
('ricavo','Burger','Pulled Pork all''Italiana',   11.80, 10, NULL),
('ricavo','Burger','Provola e Bacon',             13.40, 10, NULL),
('ricavo','Burger','Doppio Smash Bacon e Cheddar',14.90, 10, NULL),
('ricavo','Burger','Doppio Smash Pecorino e Pomodoro',14.80, 10, NULL),
('ricavo','Burger','Triplo Smash Bacon e Cheddar',17.80, 10, NULL),
('ricavo','Burger','Triplo Smash Pecorino e Pomodoro',18.40, 10, NULL),
('ricavo','Burger','Burger Carbonara Ole',        41.40, 10, NULL),
('ricavo','Burger','Pollo Fritto e Patatine',     28.80, 10, NULL),
('ricavo','Burger','Pulled Chicken Mediterraneo', 12.40, 10, NULL),
('ricavo','Burger','Fish and Chips',              10.80, 10, NULL),
('ricavo','Burger','Super Classico Burger',        9.80, 10, NULL),
('ricavo','Burger','Vegetale e Quale Burger',     10.80, 10, NULL),

-- BRACE
('ricavo','Brace','Tagliata di Pollo',            13.80, 10, NULL),
('ricavo','Brace','Tagliata di Pollo BBQ',        11.84, 10, NULL),
('ricavo','Brace','Costine di Maiale',            16.80, 10, NULL),
('ricavo','Brace','Galletto Mediterraneo',        16.80, 10, NULL),
('ricavo','Brace','Galletto al Fuoco Rosso',      16.80, 10, NULL),
('ricavo','Brace','Polpo alla Griglia',           21.60, 10, NULL),
('ricavo','Brace','Gran Tagliata Speciale New',   18.80, 10, NULL),
('ricavo','Brace','Brace Mista 1px New',          19.80, 10, NULL),
('ricavo','Brace','Tre di Pollo',                 12.64, 10, NULL),
('ricavo','Brace','La Gigante',                   21.60, 10, NULL),

-- PIZZE
('ricavo','Pizze','Margherita',                    8.80, 10, NULL),
('ricavo','Pizze','Margh. Bella Lodi',             8.80, 10, NULL),
('ricavo','Pizze','Crudo e Piccadilly',            12.80, 10, NULL),
('ricavo','Pizze','Burrata e ''Nduja',             12.80, 10, NULL),
('ricavo','Pizze','Burrata e Olive',               13.60, 10, NULL),
('ricavo','Pizze','Mortadella e Bella Lodi',        0.00, 10, NULL),
('ricavo','Pizze','Carbonara Sbagliata Old',       11.80, 10, NULL),
('ricavo','Pizze','Piccadilly e Olive',             8.20, 10, NULL),
('ricavo','Pizze','Gnocchi e Gratinati Bella Lodi', 9.80, 10, NULL),
('ricavo','Pizze','Calzone Cotto e Mozzarella',   12.00, 10, NULL),
('ricavo','Pizze','Calzone Margherita',             6.00, 10, NULL),

-- PASTE
('ricavo','Paste','Tagliatella Carbonara',         13.90, 10, NULL),
('ricavo','Paste','Tagliatella Amatriciana',       12.40, 10, NULL),
('ricavo','Paste','Tagliatelle al Ragù',           12.40, 10, NULL),
('ricavo','Paste','Mezzelune Funghi e Grana',      11.80, 10, NULL),
('ricavo','Paste','Mezzelune Porcini e Tartufo',   12.80, 10, NULL),
('ricavo','Paste','Mezzelune Stracciatella e Pomodoro',10.62,10,NULL),
('ricavo','Paste','Fusilli Cacio e Pepe',          11.60, 10, NULL),
('ricavo','Paste','Fusilli Bella Lodi e Zucchine', 10.80, 10, NULL),
('ricavo','Paste','Fusilli Pomodori Secchi',       12.40, 10, NULL),
('ricavo','Paste','Fusilli Pesto Rosso',            9.80, 10, NULL),
('ricavo','Paste','Fusilli Pomodoro Burrata',      28.00, 10, NULL),
('ricavo','Paste','Gnocchi e Gratinati Bella Lodi', 9.80, 10, NULL),
('ricavo','Paste','Lasagna Bolognese',             13.90, 10, NULL),
('ricavo','Paste','Lasagna Fagiolini e Pesto',     25.80, 10, NULL),
('ricavo','Paste','Lasagna Porzione',              18.80, 10, NULL),
('ricavo','Paste','Tagliatelle Polpo e Olive',     63.60, 10, NULL),
('ricavo','Paste','Linguine Vongole e Bottarga',   79.20, 10, NULL),
('ricavo','Paste','Linguine al Polpo',             90.00, 10, NULL),

-- INSALATE
('ricavo','Insalate','Manzo e Burrata',            12.80, 10, NULL),
('ricavo','Insalate','Orto Fresco Insalata',        6.40, 10, NULL),
('ricavo','Insalate','Insalata Tagliata di Pollo e Pomodori',10.80,10,NULL),
('ricavo','Insalate','Insalata Tonno',             12.00, 10, NULL),
('ricavo','Insalate','Insalata Burrata e Verdure alla Brace',12.80,10,NULL),
('ricavo','Insalate','Ins. Pollo Fritto e Pomodoro',10.80,10,NULL),

-- CONTORNI
('ricavo','Contorni','Patate a Fiammifero',         4.00, 10, NULL),
('ricavo','Contorni','Patate a Spicchio',           4.00, 10, NULL),
('ricavo','Contorni','Verdure Grigliate',           4.20, 10, NULL),
('ricavo','Contorni','Orto Fresco',                 4.20, 10, NULL),
('ricavo','Contorni','Orto Fresco Baby',            4.40, 10, NULL),
('ricavo','Contorni','Fagiolini',                   4.20, 10, NULL),
('ricavo','Contorni','Giardiniera',                 4.00, 10, NULL),

-- DESSERT
('ricavo','Dessert','Birramisu''',                  6.40, 10, NULL),
('ricavo','Dessert','Cheesecake Nutella',           5.80, 10, NULL),
('ricavo','Dessert','Cheesecake Frutti di Bosco',  12.00, 10, NULL),
('ricavo','Dessert','Cannolo Scomposto',            5.60, 10, NULL),
('ricavo','Dessert','Cannolo Singolo',              3.20, 10, NULL),
('ricavo','Dessert','Coppa Fiordilatte e Nutella',  6.40, 10, NULL),
('ricavo','Dessert','Gnocco Fritto e Nutella',      5.20, 10, NULL),
('ricavo','Dessert','Gourmand - Frutti di Bosco',   6.60, 10, NULL),
('ricavo','Dessert','Torta Caprese',                7.00, 10, NULL),
('ricavo','Dessert','Sbrisolona',                   5.20, 10, NULL),

-- COCKTAILS
('ricavo','Cocktails','Spritz Aperol',              7.00, 22, NULL),
('ricavo','Cocktails','Spritz Campari',             7.00, 22, NULL),
('ricavo','Cocktails','Spritz Hugo',                7.00, 22, NULL),
('ricavo','Cocktails','Negroni',                    7.00, 22, NULL),
('ricavo','Cocktails','Negroni Sbagliato',          7.00, 22, NULL),
('ricavo','Cocktails','Moscow Mule',                7.00, 22, NULL),
('ricavo','Cocktails','Mojito',                     7.00, 22, NULL),
('ricavo','Cocktails','Gin Tonic',                  7.00, 22, NULL),
('ricavo','Cocktails','Gin Lemon',                  7.00, 22, NULL),
('ricavo','Cocktails','Cuba Libre',                 6.00, 22, NULL),
('ricavo','Cocktails','Sex on the Beach',           7.00, 22, NULL),
('ricavo','Cocktails','Americano',                  7.00, 22, NULL),
('ricavo','Cocktails','Vodka Tonic',                7.00, 22, NULL),
('ricavo','Cocktails','Vodka Lemon',                7.00, 22, NULL),
('ricavo','Cocktails','Riviera',                    7.00, 22, NULL),
('ricavo','Cocktails','Clorofillo',                 6.00, 22, NULL),
('ricavo','Cocktails','Casanova Spritz',            7.00, 22, NULL),
('ricavo','Cocktails','Bitter Bull',                7.00, 22, NULL),
('ricavo','Cocktails','Golden Spritz',             14.00, 22, NULL),
('ricavo','Cocktails','Paloma',                    90.00, 22, NULL),

-- CAFFÈ
('ricavo','Caffè','Caffè',                          2.00, 22, NULL),
('ricavo','Caffè','Caffè Macchiato',                2.00, 22, NULL),
('ricavo','Caffè','Cappuccino',                     2.60, 22, NULL),
('ricavo','Caffè','Latte Macchiato',                2.00, 22, NULL),
('ricavo','Caffè','Caffè Doppio',                   2.00, 22, NULL),
('ricavo','Caffè','Caffè Americano',                2.00, 22, NULL),
('ricavo','Caffè','Caffè Corretto',                 2.00, 22, NULL),
('ricavo','Caffè','Caffè Ginseng',                  1.50, 22, NULL),
('ricavo','Caffè','Caffè Orzo',                     1.50, 22, NULL),
('ricavo','Caffè','Decaffeinato',                   1.50, 22, NULL),
('ricavo','Caffè','Cioccolata Piccola',             2.50, 22, NULL),
('ricavo','Caffè','Cioccolata Grande',              3.60, 22, NULL),

-- VINI
('ricavo','Vini','Calice Cannonau',                 5.00, 22, NULL),
('ricavo','Vini','Calice Dolcetto',                 6.00, 22, NULL),
('ricavo','Vini','Calice Rosato',                   6.00, 22, NULL),
('ricavo','Vini','Calice Prosecco',                 5.00, 22, NULL),
('ricavo','Vini','Calice Vermentino',               6.00, 22, NULL),
('ricavo','Vini','Calice Traminer',                 6.00, 22, NULL),
('ricavo','Vini','Calice Galluccio',                6.00, 22, NULL),
('ricavo','Vini','Calice Lambrusco',                5.00, 22, NULL),
('ricavo','Vini','Prosecco Premium Bottiglia',     24.00, 22, NULL),
('ricavo','Vini','Vermentino Bottiglia',           22.00, 22, NULL),
('ricavo','Vini','Traminer Bottiglia',             24.00, 22, NULL),
('ricavo','Vini','Rosato Bottiglia',               24.00, 22, NULL),
('ricavo','Vini','Dolcetto Bottiglia',             22.00, 22, NULL),
('ricavo','Vini','Lambrusco Bottiglia',            26.00, 22, NULL),
('ricavo','Vini','Galluccio Bottiglia',            22.00, 22, NULL),

-- AMARI
('ricavo','Amari','Averna',                         4.00, 22, NULL),
('ricavo','Amari','Amaro del Capo',                 4.00, 22, NULL),
('ricavo','Amari','Braulio',                        4.40, 22, NULL),
('ricavo','Amari','Montenegro',                     4.00, 22, NULL),
('ricavo','Amari','Jagermeister',                   4.00, 22, NULL),
('ricavo','Amari','Sambuca',                        4.00, 22, NULL),
('ricavo','Amari','Limoncello',                     4.00, 22, NULL),
('ricavo','Amari','Baileys',                        4.00, 22, NULL),
('ricavo','Amari','Amaro Doppio Malto',             3.50, 22, NULL),

-- BIBITE
('ricavo','Bibite','Cola',                          3.80, 22, NULL),
('ricavo','Bibite','Cola Zero',                     4.00, 22, NULL),
('ricavo','Bibite','Fanta',                         4.00, 22, NULL),
('ricavo','Bibite','Sprite',                        4.00, 22, NULL),
('ricavo','Bibite','Aranciata',                     3.80, 22, NULL),
('ricavo','Bibite','Limonata',                      4.00, 22, NULL),
('ricavo','Bibite','Gassosa',                       4.00, 22, NULL),
('ricavo','Bibite','The Pesca',                     3.80, 22, NULL),
('ricavo','Bibite','The Limone',                    4.00, 22, NULL),
('ricavo','Bibite','Tonica',                        3.80, 22, NULL),
('ricavo','Bibite','Red Bull',                      4.00, 22, NULL),
('ricavo','Bibite','Red Bull Zero',                 3.80, 22, NULL),
('ricavo','Bibite','Acqua Naturale',                2.50, 22, NULL),
('ricavo','Bibite','Acqua Frizzante',               2.50, 22, NULL),

-- COPERTI / SERVIZIO EVENTI
('ricavo','Servizio','Servizio',                    2.00, 22, NULL),
('ricavo','Servizio','Coperto Baby',                8.00, 22, NULL),
('ricavo','Servizio','Aperitivo 1 pax',            10.00, 22, NULL),
('ricavo','Servizio','Aperitivo 2 pax',            20.00, 22, NULL),
('ricavo','Servizio','Veg Aperitivo 1 pax',        10.00, 22, NULL),
('ricavo','Servizio','Veg Aperitivo 2 pax',        20.00, 22, NULL)

ON CONFLICT DO NOTHING;
