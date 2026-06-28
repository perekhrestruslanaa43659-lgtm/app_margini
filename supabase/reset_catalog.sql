-- ============================================================
-- RESET CATALOGO – cancella voci demo e carica menu DM Duomo
-- Esegui nell'SQL Editor di Supabase
-- ============================================================

-- 1. Svuota il catalogo demo (NON tocca eventi o allergeni)
DELETE FROM catalog_items;

-- 2. Inserisce tutto il menu reale DM Milano Duomo

INSERT INTO catalog_items (type, category, name, unit_price, vat_rate, notes) VALUES

-- ============================================================
-- BIRRE MEDIE (0.4L)
-- ============================================================
('ricavo', 'Birre Medie', '0.4 Super Chiara',         0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Sexy IPA',             0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Honey IPA',            0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Iper Weiss',           0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Ultra Pils',           0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Bella Rossa',          0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Summer IPA',           0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Imperiale',            0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Black Stout',          0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Extra Bitter',         0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 West Coast IPA',       0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Magnus',               0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Panache',              0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Radler',               0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Super Blanche',        0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 + Che Rossa',          0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 ''O Sole Mio',          0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Zingi Ale',            0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Cocoa IPA',            0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Regina',               0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Chiara Alcool Free',   0, 10, NULL),
('ricavo', 'Birre Medie', '0.4 Summer Alcool Free',   0, 10, NULL),

-- ============================================================
-- BIRRE PICCOLE (0.2L)
-- ============================================================
('ricavo', 'Birre Piccole', '0.2 Super Chiara',        0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Sexy IPA',            0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Honey IPA',           0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Iper Weiss',          0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Ultra Pils',          0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Bella Rossa',         0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Summer IPA',          0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Imperiale',           0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Black Stout',         0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Extra Bitter',        0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 West Coast IPA',      0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Magnus',              0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Panache',             0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Radler',              0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Super Blanche',       0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 + Che Rossa',         0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Zingi Ale',           0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Cocoa IPA',           0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 O Sole Mio',          0, 10, NULL),
('ricavo', 'Birre Piccole', '0.2 Summer Alcool Free',  0, 10, NULL),

-- ============================================================
-- BOTTIGLIE DI BIRRA
-- ============================================================
('ricavo', 'Birre Bottiglia', 'Sexy IPA Bottiglia',       0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Bella Rossa Bottiglia',    0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Summer IPA Bottiglia',     0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Extra Bitter Bottiglia',   0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Ultra Pils Bottiglia',     0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Super Blanche Bottiglia',  0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'Zingi Ale Bottiglia',      0, 10, NULL),
('ricavo', 'Birre Bottiglia', 'SC Gluten Free',           0, 10, NULL),

-- ============================================================
-- CARAFFE
-- ============================================================
('ricavo', 'Caraffe', 'Caraffa Super Chiara',    0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Honey IPA',       0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Bella Rossa',     0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Sexy IPA',        0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Summer IPA',      0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Imperiale',       0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Extra Bitter',    0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Ultra Pils',      0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa West Coast IPA',  0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa + Che Rossa',     0, 10, NULL),
('ricavo', 'Caraffe', 'Caraffa Spritz',          0, 22, NULL),

-- ============================================================
-- SPILLATORI & BEER TOUR
-- ============================================================
('ricavo', 'Spillatori', 'Spill Super Chiara',   0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Bella Rossa',    0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Honey IPA',      0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Imperiale',      0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Iper Weiss',     0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Sexy IPA',       0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Ultra Pils',     0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Black Stout',    0, 10, NULL),
('ricavo', 'Spillatori', 'Spill Regina',         0, 10, NULL),
('ricavo', 'Beer Tour',  'Beer Tour Componibile', 0, 10, NULL),
('ricavo', 'Beer Tour',  'Giro di Malto',         0, 10, NULL),
('ricavo', 'Beer Tour',  'Giro di Luppoli',       0, 10, NULL),
('ricavo', 'Beer Tour',  'Giro di Aromi',         0, 10, NULL),
('ricavo', 'Beer Tour',  'Comanda Colore',        0, 10, NULL),

-- ============================================================
-- VINI
-- ============================================================
('ricavo', 'Vini', 'Calice Dolcetto',             0, 22, NULL),
('ricavo', 'Vini', 'Calice Traminer',             0, 22, NULL),
('ricavo', 'Vini', 'Calice Cannonau',             0, 22, NULL),
('ricavo', 'Vini', 'Calice Prosecco',             0, 22, NULL),
('ricavo', 'Vini', 'Calice Rosato',               0, 22, NULL),
('ricavo', 'Vini', 'Calice Vermentino',           0, 22, NULL),
('ricavo', 'Vini', 'IS Vermentino Calice',        0, 22, NULL),
('ricavo', 'Vini', 'IS Vermentino Bottiglia',     0, 22, NULL),
('ricavo', 'Vini', 'Dolcetto Bottiglia',          0, 22, NULL),
('ricavo', 'Vini', 'Traminer Bottiglia',          0, 22, NULL),
('ricavo', 'Vini', 'Cannonau Bottiglia',          0, 22, NULL),
('ricavo', 'Vini', 'Rosato Bottiglia',            0, 22, NULL),
('ricavo', 'Vini', 'Prosecco Premium Bottiglia',  0, 22, NULL),

-- ============================================================
-- COCKTAILS
-- ============================================================
('ricavo', 'Cocktails', 'Spritz Aperol',               0, 22, NULL),
('ricavo', 'Cocktails', 'Spritz Campari',              0, 22, NULL),
('ricavo', 'Cocktails', 'Spritz Hugo',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Spritz Spill',                0, 22, NULL),
('ricavo', 'Cocktails', 'Casanova Spritz',             0, 22, NULL),
('ricavo', 'Cocktails', 'Mojito',                      0, 22, NULL),
('ricavo', 'Cocktails', 'Gin Tonic',                   0, 22, NULL),
('ricavo', 'Cocktails', 'Gin Lemon',                   0, 22, NULL),
('ricavo', 'Cocktails', 'Negroni',                     0, 22, NULL),
('ricavo', 'Cocktails', 'Negroni Sbagliato',           0, 22, NULL),
('ricavo', 'Cocktails', 'Moscow Mule',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Cuba Libre',                  0, 22, NULL),
('ricavo', 'Cocktails', 'Sex on the Beach',            0, 22, NULL),
('ricavo', 'Cocktails', 'Vodka Lemon',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Vodka Tonic',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Vodka e Red Bull',            0, 22, NULL),
('ricavo', 'Cocktails', 'Vodka e Red Bull Sugar Free', 0, 22, NULL),
('ricavo', 'Cocktails', 'Rum Cooler',                  0, 22, NULL),
('ricavo', 'Cocktails', 'Americano',                   0, 22, NULL),
('ricavo', 'Cocktails', 'Bitter Bull',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Lungo Addio',                 0, 22, NULL),
('ricavo', 'Cocktails', 'Jager e Red Bull',            0, 22, NULL),
('ricavo', 'Cocktails', 'Riviera',                     0, 22, NULL),
('ricavo', 'Cocktails', 'Whisky e Cola',               0, 22, NULL),
('ricavo', 'Cocktails', 'Tequila Sale e Limone',       0, 22, NULL),
('ricavo', 'Cocktails', 'Shot Belvedere',              0, 22, NULL),
('ricavo', 'Cocktails', 'Clorofillo',                  0, 22, NULL),
('ricavo', 'Cocktails', 'Golden Spritz',               0, 22, NULL),

-- ============================================================
-- AMARI & SUPERALCOLICI
-- ============================================================
('ricavo', 'Amari', 'Amaro Doppio Malto',      0, 22, NULL),
('ricavo', 'Amari', 'L''Amaro DM Bottiglia',   0, 22, NULL),
('ricavo', 'Amari', 'Limoncello',              0, 22, NULL),
('ricavo', 'Amari', 'Mirto',                   0, 22, NULL),
('ricavo', 'Amari', 'Sambuca',                 0, 22, NULL),
('ricavo', 'Amari', 'Amaro del Capo',          0, 22, NULL),
('ricavo', 'Amari', 'Braulio',                 0, 22, NULL),
('ricavo', 'Amari', 'Montenegro',              0, 22, NULL),
('ricavo', 'Amari', 'Jagermeister',            0, 22, NULL),
('ricavo', 'Amari', 'Anima Nera',              0, 22, NULL),
('ricavo', 'Amari', 'Baileys',                 0, 22, NULL),
('ricavo', 'Amari', 'Kraken',                  0, 22, NULL),
('ricavo', 'Amari', 'Grappa Poli Classica',    0, 22, NULL),
('ricavo', 'Amari', 'Grappa Barrique',         0, 22, NULL),
('ricavo', 'Amari', 'Grappa Poli Moscato',     0, 22, NULL),
('ricavo', 'Amari', 'Johnnie Walker Red',      0, 22, NULL),
('ricavo', 'Amari', 'Talisker',                0, 22, NULL),
('ricavo', 'Amari', 'Lagavulin',               0, 22, NULL),
('ricavo', 'Amari', 'Zacapa 23Y',              0, 22, NULL),
('ricavo', 'Amari', 'Pampero Anniversario',    0, 22, NULL),
('ricavo', 'Amari', 'Irlandese',               0, 22, NULL),
('ricavo', 'Amari', 'Capadolce',               0, 22, NULL),

-- ============================================================
-- BIBITE & SOFT DRINK
-- ============================================================
('ricavo', 'Bibite', 'Coca Cola',                        0, 10, NULL),
('ricavo', 'Bibite', 'Coca Zero',                        0, 10, NULL),
('ricavo', 'Bibite', 'Coca Zero Zero',                   0, 10, NULL),
('ricavo', 'Bibite', 'Fanta',                            0, 10, NULL),
('ricavo', 'Bibite', 'Sprite',                           0, 10, NULL),
('ricavo', 'Bibite', 'Aranciata',                        0, 10, NULL),
('ricavo', 'Bibite', 'Limonata',                         0, 10, NULL),
('ricavo', 'Bibite', 'The Pesca',                        0, 10, NULL),
('ricavo', 'Bibite', 'The Limone',                       0, 10, NULL),
('ricavo', 'Bibite', 'Tonica',                           0, 10, NULL),
('ricavo', 'Bibite', 'Red Bull',                         0, 10, NULL),
('ricavo', 'Bibite', 'Red Bull Zero',                    0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Naturale',                   0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Frizzante',                  0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Naturale PET',               0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Gassata PET',                0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Panna PET',                  0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Naturale Microfiltrata',     0, 10, NULL),
('ricavo', 'Bibite', 'Acqua Frizzante Microfiltrata',    0, 10, NULL),
('ricavo', 'Bibite', 'Pop Corn Mug',                     0, 10, NULL),

-- ============================================================
-- CAFFE & CAFFETTERIA
-- ============================================================
('ricavo', 'Caffe', 'Caffe''',                   0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Macchiato',         0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Corretto',          0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Doppio',            0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Americano',         0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Vetro',             0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Ginseng',           0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Orzo',              0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Latte',             0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Imperiale',         0, 10, NULL),
('ricavo', 'Caffe', 'Caffe'' Gourmand',          0, 10, NULL),
('ricavo', 'Caffe', 'Cappuccino',                0, 10, NULL),
('ricavo', 'Caffe', 'Latte Macchiato',           0, 10, NULL),
('ricavo', 'Caffe', 'Macchiatone',               0, 10, NULL),
('ricavo', 'Caffe', 'Decaffeinato',              0, 10, NULL),
('ricavo', 'Caffe', 'Ginseng Vetro',             0, 10, NULL),
('ricavo', 'Caffe', 'Spremuta',                  0, 10, NULL),

-- ============================================================
-- BURGER
-- ============================================================
('ricavo', 'Burger', 'Doppio Smash Bacon e Cheddar',         0, 10, NULL),
('ricavo', 'Burger', 'Doppio Smash Pecorino e Pomodoro',     0, 10, NULL),
('ricavo', 'Burger', 'Triplo Smash Bacon e Cheddar',         0, 10, NULL),
('ricavo', 'Burger', 'Triplo Smash Pecorino e Pomodoro',     0, 10, NULL),
('ricavo', 'Burger', 'Il Troppo Buono',                      0, 10, NULL),
('ricavo', 'Burger', 'Maxi Il Troppo Buono',                 0, 10, NULL),
('ricavo', 'Burger', 'Bacon e Provola',                      0, 10, NULL),
('ricavo', 'Burger', 'Maxi Bacon e Provola',                 0, 10, NULL),
('ricavo', 'Burger', '''Nduja e Bella Lodi',                  0, 10, NULL),
('ricavo', 'Burger', 'Maxi ''Nduja e Bella Lodi',             0, 10, NULL),
('ricavo', 'Burger', 'Super BBQ',                            0, 10, NULL),
('ricavo', 'Burger', 'Maxi Super BBQ',                       0, 10, NULL),
('ricavo', 'Burger', 'Pulled Pork All Italiana',             0, 10, NULL),
('ricavo', 'Burger', 'Tartare e Bella Lodi Burger',          0, 10, NULL),
('ricavo', 'Burger', 'Maxi Tartare e Bella Lodi Burger',     0, 10, NULL),
('ricavo', 'Burger', 'Burger Carbonara Ole',                 0, 10, NULL),
('ricavo', 'Burger', 'Maxi Carbonara Ole',                   0, 10, NULL),
('ricavo', 'Burger', 'Fish&Chips Burger',                    0, 10, NULL),
('ricavo', 'Burger', 'Maxi Fish&Chips Burger',               0, 10, NULL),
('ricavo', 'Burger', 'Pollo Fritto Burger',                  0, 10, NULL),
('ricavo', 'Burger', 'Maxi Pollo Fritto Burger',             0, 10, NULL),
('ricavo', 'Burger', 'Che Pollo',                            0, 10, NULL),
('ricavo', 'Burger', 'Vegetale e Quale Burger',              0, 10, NULL),
('ricavo', 'Burger', 'Stra Burger',                          0, 10, NULL),
('ricavo', 'Burger', 'Super Pork',                           0, 10, NULL),
('ricavo', 'Burger', 'Super Classico Burger',                0, 10, NULL),
('ricavo', 'Burger', 'Il Manzo Triplo',                      0, 10, NULL),
('ricavo', 'Burger', 'Manzo Singolo',                        0, 10, NULL),
('ricavo', 'Burger', 'Doppio Medaglione No Meat',            0, 10, NULL),
('ricavo', 'Burger', 'Il Contadino',                         0, 10, NULL),
('ricavo', 'Burger', 'Burger Classico Pranzo',               0, 10, NULL),
('ricavo', 'Burger', 'Doppio Medaglione Pranzo',             0, 10, NULL),
('ricavo', 'Burger', 'Manzo e Patate Spicchio',              0, 10, NULL),
('ricavo', 'Burger', 'Tartare Pistacchio e Bella Lodi',      0, 10, NULL),

-- ============================================================
-- BRACE & GRIGLIA
-- ============================================================
('ricavo', 'Brace', 'Gran Tagliata',                        0, 10, NULL),
('ricavo', 'Brace', 'Gran Tagliata Speciale',               0, 10, NULL),
('ricavo', 'Brace', 'Mini Gran Tagliata',                   0, 10, NULL),
('ricavo', 'Brace', 'Mini Tagliata Speciale',               0, 10, NULL),
('ricavo', 'Brace', 'La Gigante',                           0, 10, NULL),
('ricavo', 'Brace', 'Tagliata di Pollo',                    0, 10, NULL),
('ricavo', 'Brace', 'Tagliata di Pollo BBQ',                0, 10, NULL),
('ricavo', 'Brace', 'Tagliata di Pollo Alla Brace Pranzo',  0, 10, NULL),
('ricavo', 'Brace', 'Mini Tagliata di Pollo',               0, 10, NULL),
('ricavo', 'Brace', 'Mini T. di Pollo BBQ',                 0, 10, NULL),
('ricavo', 'Brace', 'Tre di Pollo',                         0, 10, NULL),
('ricavo', 'Brace', 'Galletto Mediterraneo',                0, 10, NULL),
('ricavo', 'Brace', 'Galletto Piccante',                    0, 10, NULL),
('ricavo', 'Brace', 'Costine di Maiale',                    0, 10, NULL),
('ricavo', 'Brace', 'Cosce in Crosta',                      0, 10, NULL),
('ricavo', 'Brace', 'Brace Mista 1Px',                      0, 10, NULL),
('ricavo', 'Brace', 'Brace Cuberoll 1Px',                   0, 10, NULL),
('ricavo', 'Brace', 'Brace Singola',                        0, 10, NULL),
('ricavo', 'Brace', 'Burrata e Verdure alla Brace',         0, 10, NULL),
('ricavo', 'Brace', 'Arrosticini Abruzzesi',                0, 10, NULL),

-- ============================================================
-- PIZZE
-- ============================================================
('ricavo', 'Pizze', 'Margherita',                0, 10, NULL),
('ricavo', 'Pizze', 'Crudo e Piccadilly',         0, 10, NULL),
('ricavo', 'Pizze', 'Burrata e ''Nduja',          0, 10, NULL),
('ricavo', 'Pizze', 'Mortadella e Fiordilatte',   0, 10, NULL),
('ricavo', 'Pizze', 'Pizza Ortolana',             0, 10, NULL),
('ricavo', 'Pizze', 'Slice Margherita',           0, 10, NULL),
('ricavo', 'Pizze', 'Slice Rossa',                0, 10, NULL),
('ricavo', 'Pizze', 'Margherita E'' Mia Pranzo',  0, 10, NULL),
('ricavo', 'Pizze', 'Aperitivo 1 Pax',            0, 10, NULL),
('ricavo', 'Pizze', 'Aperitivo 2 Pax',            0, 10, NULL),
('ricavo', 'Pizze', 'Focaccia Contorno',          0, 10, NULL),

-- ============================================================
-- PASTE & PRIMI
-- ============================================================
('ricavo', 'Paste', 'Tagliatelle al Ragu',              0, 10, NULL),
('ricavo', 'Paste', 'Tagliatelle Pomodoro e Raspadura', 0, 10, NULL),
('ricavo', 'Paste', 'Fusilli Pesto Rosso',              0, 10, NULL),
('ricavo', 'Paste', 'Gnocchi e Gratinati Bella Lodi',   0, 10, NULL),
('ricavo', 'Paste', 'Gnocchi Bella Lodi e Pepe',        0, 10, NULL),
('ricavo', 'Paste', 'Parmigiana',                       0, 10, NULL),

-- ============================================================
-- STARTER & FRITTI
-- ============================================================
('ricavo', 'Starter', 'Siamo Fritti',                    0, 10, NULL),
('ricavo', 'Starter', 'Gnocco Fritto',                   0, 10, NULL),
('ricavo', 'Starter', 'Spicchi di Focaccia',             0, 10, NULL),
('ricavo', 'Starter', 'Focaccia Barese',                 0, 10, NULL),
('ricavo', 'Starter', 'Chips Bella Lodi',                0, 10, NULL),
('ricavo', 'Starter', 'Anelli di Cipolla',               0, 10, NULL),
('ricavo', 'Starter', 'Mozzarelle in Carrozza',          0, 10, NULL),
('ricavo', 'Starter', 'Rondelle di Melanzana',           0, 10, NULL),
('ricavo', 'Starter', 'Alette di Pollo',                 0, 10, NULL),
('ricavo', 'Starter', 'Tagliata di Pollo Panato',        0, 10, NULL),
('ricavo', 'Starter', 'Spiedini di Pollo Panati',        0, 10, NULL),
('ricavo', 'Starter', 'Antipasto Tricolore',             0, 10, NULL),
('ricavo', 'Starter', 'Caprese di Burrata e Pomodori',   0, 10, NULL),
('ricavo', 'Starter', 'Arancini (4 pz)',                 0, 10, NULL),
('ricavo', 'Starter', 'Arrosticini di Pollo',            0, 10, NULL),
('ricavo', 'Starter', 'Caponata di Verdure',             0, 10, NULL),
('ricavo', 'Starter', 'Tartare Pistacchio e Bella Lodi', 0, 10, NULL),

-- ============================================================
-- INSALATE
-- ============================================================
('ricavo', 'Insalate', 'Orto Fresco Insalata',              0, 10, NULL),
('ricavo', 'Insalate', 'Manzo e Burrata',                   0, 10, NULL),
('ricavo', 'Insalate', 'Ins. Tagliata di Pollo e Pomodoro', 0, 10, NULL),
('ricavo', 'Insalate', 'Ins. Pollo Fritto e Pomodoro',      0, 10, NULL),
('ricavo', 'Insalate', 'Caponata e Crudite',                0, 10, NULL),
('ricavo', 'Insalate', 'Bella Lodi e BBQ Bianca',           0, 10, NULL),

-- ============================================================
-- CONTORNI
-- ============================================================
('ricavo', 'Contorni', 'Patate a Fiammifero',  0, 10, NULL),
('ricavo', 'Contorni', 'Patate a Spicchio',    0, 10, NULL),
('ricavo', 'Contorni', 'Patate Chips',         0, 10, NULL),
('ricavo', 'Contorni', 'Verdure Grigliate',    0, 10, NULL),
('ricavo', 'Contorni', 'Fagiolini',            0, 10, NULL),

-- ============================================================
-- DESSERT
-- ============================================================
('ricavo', 'Dessert', 'Birramisu''',                       0, 10, NULL),
('ricavo', 'Dessert', 'Mini Birramisu''',                  0, 10, NULL),
('ricavo', 'Dessert', 'Torta Caprese',                    0, 10, NULL),
('ricavo', 'Dessert', 'Cheesecake Frutti di Bosco',       0, 10, NULL),
('ricavo', 'Dessert', 'Mini Cheesecake Frutti di Bosco',  0, 10, NULL),
('ricavo', 'Dessert', 'Cheesecake Nutella',               0, 10, NULL),
('ricavo', 'Dessert', 'Mini Cheesecake Nutella',          0, 10, NULL),
('ricavo', 'Dessert', 'Cannolo Singolo',                  0, 10, NULL),
('ricavo', 'Dessert', 'Mini Cannoli',                     0, 10, NULL),
('ricavo', 'Dessert', 'Cannolo Scomposto',                0, 10, NULL),
('ricavo', 'Dessert', 'Mini Cannolo Scomposto',           0, 10, NULL),
('ricavo', 'Dessert', 'Gnocco Fritto e Nutella',          0, 10, NULL),
('ricavo', 'Dessert', 'Coppa Fiordilatte e Nutella',      0, 10, NULL),
('ricavo', 'Dessert', 'Coppa Baby',                       0, 10, NULL),
('ricavo', 'Dessert', 'Mini Coppa Gelato Nutella',        0, 10, NULL),
('ricavo', 'Dessert', 'Mini Coppa Gelato Frutti di Bosco',0, 10, NULL),
('ricavo', 'Dessert', 'Coppa Birra e Caramello Salato',   0, 10, NULL),
('ricavo', 'Dessert', 'Caffe'' Gourmand',                  0, 10, NULL),
('ricavo', 'Dessert', 'Nut - Gourmand',                   0, 10, NULL),
('ricavo', 'Dessert', 'Bosc - Gourmand',                  0, 10, NULL),

-- ============================================================
-- MENU & COPERTI
-- ============================================================
('ricavo', 'Coperti', 'Servizio',            2.50, 10, NULL),
('ricavo', 'Coperti', 'Servizio Drink',      0,    10, NULL),
('ricavo', 'Coperti', 'Servizio Pranzo',     0,    10, NULL),
('ricavo', 'Coperti', 'Coperto Baby',        0,    10, NULL),
('ricavo', 'Menu',    'Menu Pranzo',         0,    10, NULL),
('ricavo', 'Menu',    'Menu Dipendenti',     0,    10, NULL),
('ricavo', 'Menu',    'Menu'' Baby',          0,    10, NULL),
('ricavo', 'Menu',    'Zero Scuse',          0,    10, NULL),
('ricavo', 'Menu',    'Noleggio Sala',       0,    22, NULL);
