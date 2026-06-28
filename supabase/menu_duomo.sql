-- ============================================================
-- MENU DM DUOMO – Catalogo voci da menu reale
-- Incolla nell'SQL Editor di Supabase dopo setup.sql
-- ============================================================

-- Pulisce il catalogo precedente (opzionale – commentare se vuoi tenere i dati demo)
-- DELETE FROM catalog_items;

INSERT INTO catalog_items (type, category, name, unit_price, vat_rate, notes) VALUES

-- ============================================================
-- RICAVI – BIRRE MEDIE (0.4L)
-- ============================================================
('ricavo', 'Birre Medie', '0.4 Super Chiara',        0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Sexy IPA',            0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Honey IPA',           0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Iper Weiss',          0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Ultra Pils',          0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Bella Rossa',         0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Summer IPA',          0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Imperiale',           0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Black Stout',         0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Extra Bitter',        0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 West Coast IPA',      0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Magnus',              0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Panache',             0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Radler',              0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Super Blanche',       0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Chiara Alcool Free',  0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Summer Alcool Free',  0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Regina',              0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Zingi Ale',           0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 Cocoa IPA',           0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', "0.4 'O Sole Mio",         0, 10, 'Spilla 0.4L'),
('ricavo', 'Birre Medie', '0.4 + Che Rossa',         0, 10, 'Spilla 0.4L'),

-- ============================================================
-- RICAVI – BIRRE PICCOLE (0.2L)
-- ============================================================
('ricavo', 'Birre Piccole', '0.2 Super Chiara',       0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Sexy IPA',           0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Honey IPA',          0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Iper Weiss',         0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Ultra Pils',         0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Bella Rossa',        0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Summer IPA',         0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Imperiale',          0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Black Stout',        0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Extra Bitter',       0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 West Coast IPA',     0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Magnus',             0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Panache',            0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Radler',             0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Super Blanche',      0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Summer Alcool Free', 0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 + Che Rossa',        0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Zingi Ale',          0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 Cocoa IPA',          0, 10, 'Spilla 0.2L'),
('ricavo', 'Birre Piccole', '0.2 O Sole Mio', 0, 10, 'Spilla 0.2L'),

-- ============================================================
-- RICAVI – BOTTIGLIE DI BIRRA
-- ============================================================
('ricavo', 'Birre Bottiglia', 'Sexy IPA Bottiglia',        0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Bella Rossa Bottiglia',     0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Summer IPA Bottiglia',      0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Extra Bitter Bottiglia',    0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Ultra Pils Bottiglia',      0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Super Blanche Bottiglia',   0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'Zingi Ale Bottiglia',       0, 10, 'Bottiglia'),
('ricavo', 'Birre Bottiglia', 'SC Gluten Free',            0, 10, 'Bottiglia senza glutine'),

-- ============================================================
-- RICAVI – CARAFFE
-- ============================================================
('ricavo', 'Caraffe', 'Caraffa Super Chiara',   0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Honey IPA',      0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Bella Rossa',    0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Sexy IPA',       0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Summer IPA',     0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Imperiale',      0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Extra Bitter',   0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Ultra Pils',     0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa West Coast IPA', 0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa + Che Rossa',    0, 10, 'Caraffa'),
('ricavo', 'Caraffe', 'Caraffa Spritz',         0, 22, 'Caraffa cocktail'),

-- ============================================================
-- RICAVI – BEER TOUR / SPILLATORI
-- ============================================================
('ricavo', 'Beer Tour', 'Beer Tour Componibile',  0, 10, 'Degustazione'),
('ricavo', 'Beer Tour', 'Giro di Malto',          0, 10, 'Beer tour'),
('ricavo', 'Beer Tour', 'Giro di Luppoli',        0, 10, 'Beer tour'),
('ricavo', 'Beer Tour', 'Giro di Aromi',          0, 10, 'Beer tour'),
('ricavo', 'Beer Tour', 'Comanda Colore',         0, 10, 'Beer tour'),
('ricavo', 'Spillatori', 'Spill Super Chiara',    0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Bella Rossa',     0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Honey IPA',       0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Imperiale',       0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Iper Weiss',      0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Sexy IPA',        0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Ultra Pils',      0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Black Stout',     0, 10, 'Spillatore'),
('ricavo', 'Spillatori', 'Spill Regina',          0, 10, 'Spillatore'),

-- ============================================================
-- RICAVI – VINI
-- ============================================================
('ricavo', 'Vini', 'Calice Dolcetto',            0, 22, 'Vino rosso – calice'),
('ricavo', 'Vini', 'Calice Traminer',            0, 22, 'Vino bianco – calice'),
('ricavo', 'Vini', 'Calice Cannonau',            0, 22, 'Vino rosso Sardegna – calice'),
('ricavo', 'Vini', 'Calice Prosecco',            0, 22, 'Bollicine – calice'),
('ricavo', 'Vini', 'Calice Rosato',              0, 22, 'Vino rosato – calice'),
('ricavo', 'Vini', 'Calice Vermentino',          0, 22, 'Vino bianco Sardegna – calice'),
('ricavo', 'Vini', 'IS Vermentino Calice',       0, 22, 'Vino bianco IS – calice'),
('ricavo', 'Vini', 'IS Vermentino Bottiglia',    0, 22, 'Bottiglia'),
('ricavo', 'Vini', 'Dolcetto Bottiglia',         0, 22, 'Bottiglia'),
('ricavo', 'Vini', 'Traminer Bottiglia',         0, 22, 'Bottiglia'),
('ricavo', 'Vini', 'Cannonau Bottiglia',         0, 22, 'Bottiglia'),
('ricavo', 'Vini', 'Rosato Bottiglia',           0, 22, 'Bottiglia'),
('ricavo', 'Vini', 'Prosecco Premium Bottiglia', 0, 22, 'Bottiglia'),

-- ============================================================
-- RICAVI – COCKTAILS
-- ============================================================
('ricavo', 'Cocktails', 'Spritz Aperol',          0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Spritz Campari',         0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Spritz Hugo',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Spritz Spill',           0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Casanova Spritz',        0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Mojito',                 0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Gin Tonic',              0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Gin Lemon',              0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Negroni',                0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Negroni Sbagliato',      0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Moscow Mule',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Cuba Libre',             0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Sex on the Beach',       0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Vodka Lemon',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Vodka Tonic',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Vodka e Red Bull',       0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Vodka e Red Bull Sugar Free', 0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Rum Cooler',             0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Americano',              0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Bitter Bull',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Lungo Addio',            0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Jager e Red Bull',       0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Riviera',                0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Whisky e Cola',          0, 22, 'Cocktail'),
('ricavo', 'Cocktails', 'Clorofillo',             0, 22, 'Cocktail analcolico'),
('ricavo', 'Cocktails', 'Golden Spritz',          0, 22, 'Cocktail analcolico'),
('ricavo', 'Cocktails', 'Tequila Sale e Limone',  0, 22, 'Shot'),
('ricavo', 'Cocktails', 'Shot Belvedere',         0, 22, 'Shot vodka premium'),

-- ============================================================
-- RICAVI – AMARI E SUPERALCOLICI
-- ============================================================
('ricavo', 'Amari', 'Amaro Doppio Malto',      0, 22, 'Amaro house'),
('ricavo', 'Amari', "L'Amaro DM Bottiglia",    0, 22, 'Bottiglia'),
('ricavo', 'Amari', 'Limoncello',              0, 22, 'Digestivo'),
('ricavo', 'Amari', 'Mirto',                   0, 22, 'Digestivo Sardegna'),
('ricavo', 'Amari', 'Sambuca',                 0, 22, 'Digestivo'),
('ricavo', 'Amari', 'Amaro del Capo',          0, 22, 'Amaro'),
('ricavo', 'Amari', 'Braulio',                 0, 22, 'Amaro alpino'),
('ricavo', 'Amari', 'Montenegro',              0, 22, 'Amaro'),
('ricavo', 'Amari', 'Jagermeister',            0, 22, 'Amaro tedesco'),
('ricavo', 'Amari', 'Anima Nera',              0, 22, 'Amaro'),
('ricavo', 'Amari', 'Baileys',                 0, 22, 'Liquore alla crema'),
('ricavo', 'Amari', 'Kraken',                  0, 22, 'Rum speziato'),
('ricavo', 'Amari', 'Grappa Poli Classica',    0, 22, 'Grappa'),
('ricavo', 'Amari', 'Grappa Barrique',         0, 22, 'Grappa invecchiata'),
('ricavo', 'Amari', 'Grappa Poli Moscato',     0, 22, 'Grappa aromatica'),
('ricavo', 'Amari', 'Johnnie Walker Red',      0, 22, 'Whisky'),
('ricavo', 'Amari', 'Talisker',                0, 22, 'Whisky torbato'),
('ricavo', 'Amari', 'Lagavulin',               0, 22, 'Whisky torbato premium'),
('ricavo', 'Amari', 'Zacapa 23Y',              0, 22, 'Rum premium'),
('ricavo', 'Amari', 'Pampero Anniversario',    0, 22, 'Rum'),
('ricavo', 'Amari', 'Irlandese',               0, 22, 'Caffe irlandese'),
('ricavo', 'Amari', 'Capadolce',               0, 22, 'Caffe dolce'),

-- ============================================================
-- RICAVI – BIBITE E SOFT DRINK
-- ============================================================
('ricavo', 'Bibite', 'Coca Cola VAP',             0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Coca Zero VAP',             0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Coca Zero Zero VAP',        0, 10, 'Bibita zero caffeina'),
('ricavo', 'Bibite', 'Cola Zero',                 0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Cola',                      0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Fanta VAP',                 0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Sprite VAP',                0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Aranciata',                 0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Limonata',                  0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Acqua Naturale',            0, 10, 'Acqua in vetro'),
('ricavo', 'Bibite', 'Acqua Frizzante',           0, 10, 'Acqua in vetro'),
('ricavo', 'Bibite', 'Acqua Naturale PET',        0, 10, 'Acqua in PET'),
('ricavo', 'Bibite', 'Acqua Gassata PET',         0, 10, 'Acqua in PET'),
('ricavo', 'Bibite', 'Acqua Panna PET',           0, 10, 'Acqua premium'),
('ricavo', 'Bibite', 'Acqua Naturale Microfiltrata', 0, 10, 'Acqua dal rubinetto filtrata'),
('ricavo', 'Bibite', 'Acqua Frizzante Microfiltrata', 0, 10, 'Acqua dal rubinetto filtrata'),
('ricavo', 'Bibite', 'Red Bull',                  0, 10, 'Energy drink'),
('ricavo', 'Bibite', 'Red Bull Zero',             0, 10, 'Energy drink sugar free'),
('ricavo', 'Bibite', 'The Pesca',                 0, 10, 'Bibita'),
('ricavo', 'Bibite', 'The Limone',                0, 10, 'Bibita'),
('ricavo', 'Bibite', 'Tonica',                    0, 10, 'Bibita mixer'),
('ricavo', 'Bibite', 'Pop Corn Mug',              0, 10, 'Soft drink'),

-- ============================================================
-- RICAVI – CAFFE E CAFFETTERIA
-- ============================================================
('ricavo', 'Caffe', "Caffe'",                   0, 10, 'Espresso'),
('ricavo', 'Caffe', "Caffe' Macchiato",         0, 10, 'Espresso macchiato'),
('ricavo', 'Caffe', "Caffe' Corretto",          0, 10, 'Espresso corretto'),
('ricavo', 'Caffe', "Caffe' Doppio",            0, 10, 'Doppio espresso'),
('ricavo', 'Caffe', "Caffe' Americano",         0, 10, 'Americano'),
('ricavo', 'Caffe', "Caffe' Vetro",             0, 10, 'Espresso in vetro'),
('ricavo', 'Caffe', "Caffe' Ginseng",           0, 10, 'Ginseng'),
('ricavo', 'Caffe', "Caffe' Orzo",              0, 10, 'Orzo'),
('ricavo', 'Caffe', "Caffe' Latte",             0, 10, 'Latte macchiato caldo'),
('ricavo', 'Caffe', "Caffe' Imperiale",         0, 10, 'Caffe speciale'),
('ricavo', 'Caffe', "Caffe' Gourmand",          0, 10, 'Caffe con pasticcino'),
('ricavo', 'Caffe', 'Cappuccino',               0, 10, 'Cappuccino'),
('ricavo', 'Caffe', 'Latte Macchiato',          0, 10, 'Latte macchiato'),
('ricavo', 'Caffe', 'Macchiatone',              0, 10, 'Macchiato grande'),
('ricavo', 'Caffe', 'Decaffeinato',             0, 10, 'Decaf'),
('ricavo', 'Caffe', 'Ginseng Vetro',            0, 10, 'Ginseng in vetro'),
('ricavo', 'Caffe', 'Spremuta',                 0, 10, 'Spremuta fresca'),

-- ============================================================
-- RICAVI – FOOD: BURGER
-- ============================================================
('ricavo', 'Burger', 'Doppio Smash Bacon e Cheddar',        0, 10, 'Burger'),
('ricavo', 'Burger', 'Il Troppo Buono',                     0, 10, 'Burger'),
('ricavo', 'Burger', 'Super Classico Burger',               0, 10, 'Burger'),
('ricavo', 'Burger', 'Bacon e Provola',                     0, 10, 'Burger'),
('ricavo', 'Burger', 'Doppio Smash Pecorino e Pomodoro',    0, 10, 'Burger'),
('ricavo', 'Burger', "Super BBQ",                           0, 10, 'Burger + fritti'),
('ricavo', 'Burger', "Pollo Fritto Burger",                 0, 10, 'Burger + fritti'),
('ricavo', 'Burger', "'Nduja e Bella Lodi",                 0, 10, 'Burger'),
('ricavo', 'Burger', 'Pulled Pork All Italiana',            0, 10, 'Burger'),
('ricavo', 'Burger', 'Tartare e Bella Lodi Burger',         0, 10, 'Burger'),
('ricavo', 'Burger', 'Burger Carbonara Ole',                0, 10, 'Burger'),
('ricavo', 'Burger', 'Tartare Pistacchio e Bella Lodi',     0, 10, 'Starter burger'),
('ricavo', 'Burger', 'Fish&Chips Burger',                   0, 10, 'Burger + fritti'),
('ricavo', 'Burger', 'Vegetale e Quale Burger',             0, 10, 'Burger vegano'),
('ricavo', 'Burger', 'Che Pollo',                           0, 10, 'Burger pollo'),
('ricavo', 'Burger', 'Stra Burger',                         0, 10, 'Burger maxi'),
('ricavo', 'Burger', 'Super Pork',                          0, 10, 'Burger maiale'),
('ricavo', 'Burger', 'Triplo Smash Bacon e Cheddar',        0, 10, 'Burger triplo'),
('ricavo', 'Burger', 'Triplo Smash Pecorino e Pomodoro',    0, 10, 'Burger triplo'),
('ricavo', 'Burger', 'Maxi Il Troppo Buono',                0, 10, 'Burger maxi'),
('ricavo', 'Burger', 'Maxi Bacon e Provola',                0, 10, 'Burger maxi'),
('ricavo', 'Burger', "Maxi 'Nduja e Bella Lodi",            0, 10, 'Burger maxi'),
('ricavo', 'Burger', 'Maxi Carbonara Ole',                  0, 10, 'Burger maxi'),
('ricavo', 'Burger', 'Maxi Tartare e Bella Lodi Burger',    0, 10, 'Burger maxi'),
('ricavo', 'Burger', 'Maxi Super BBQ',                      0, 10, 'Burger maxi + fritti'),
('ricavo', 'Burger', 'Maxi Fish&Chips Burger',              0, 10, 'Burger maxi + fritti'),
('ricavo', 'Burger', 'Maxi Pollo Fritto Burger',            0, 10, 'Burger maxi + fritti'),
('ricavo', 'Burger', 'Il Manzo Triplo',                     0, 10, 'Burger brace'),
('ricavo', 'Burger', 'Manzo e Patate Spicchio',             0, 10, 'Promo'),
('ricavo', 'Burger', 'Il Contadino',                        0, 10, 'Menu pranzo'),
('ricavo', 'Burger', 'Burger Classico Pranzo',              0, 10, 'Menu pranzo'),
('ricavo', 'Burger', 'Doppio Medaglione Pranzo',            0, 10, 'Menu pranzo'),
('ricavo', 'Burger', 'Manzo Singolo',                       0, 10, 'Brace'),
('ricavo', 'Burger', 'Doppio Medaglione No Meat',           0, 10, 'Burger vegetariano'),

-- ============================================================
-- RICAVI – FOOD: BRACE / GRIGLIA
-- ============================================================
('ricavo', 'Brace', 'Gran Tagliata',                       0, 10, 'Brace manzo'),
('ricavo', 'Brace', 'Gran Tagliata Speciale',              0, 10, 'Brace manzo premium'),
('ricavo', 'Brace', 'Tagliata di Pollo',                   0, 10, 'Brace pollo'),
('ricavo', 'Brace', 'Tagliata di Pollo BBQ',               0, 10, 'Brace pollo BBQ'),
('ricavo', 'Brace', 'Tagliata di Pollo Alla Brace Pranzo', 0, 10, 'Menu pranzo'),
('ricavo', 'Brace', 'Galletto Mediterraneo',               0, 10, 'Brace intero'),
('ricavo', 'Brace', 'Galletto Piccante',                   0, 10, 'Brace piccante'),
('ricavo', 'Brace', 'Costine di Maiale',                   0, 10, 'Brace'),
('ricavo', 'Brace', 'Brace Mista 1Px',                     0, 10, 'Brace mista per persona'),
('ricavo', 'Brace', 'Brace Cuberoll 1Px',                  0, 10, 'Cuberoll per persona'),
('ricavo', 'Brace', 'Brace Singola',                       0, 10, 'Brace singola'),
('ricavo', 'Brace', 'La Gigante',                          0, 10, 'Tagliata maxi'),
('ricavo', 'Brace', 'Tre di Pollo',                        0, 10, 'Trio pollo brace'),
('ricavo', 'Brace', 'Mini Gran Tagliata',                  0, 10, 'Tagliata mini'),
('ricavo', 'Brace', 'Mini Tagliata Speciale',              0, 10, 'Tagliata speciale mini'),
('ricavo', 'Brace', 'Mini Tagliata di Pollo',              0, 10, 'Pollo mini'),
('ricavo', 'Brace', 'Mini T. di Pollo BBQ',                0, 10, 'Pollo BBQ mini'),
('ricavo', 'Brace', 'Burrata e Verdure alla Brace',        0, 10, 'Brace vegetariana'),
('ricavo', 'Brace', 'Cosce in Crosta',                     0, 10, 'Pollo in crosta'),
('ricavo', 'Brace', 'Arrosticini Abruzzesi',               0, 10, 'Starter brace'),

-- ============================================================
-- RICAVI – FOOD: STARTER / FRITTI
-- ============================================================
('ricavo', 'Starter', 'Siamo Fritti',                 0, 10, 'Mix fritti'),
('ricavo', 'Starter', 'Gnocco Fritto',                0, 10, 'Starter'),
('ricavo', 'Starter', 'Spicchi di Focaccia',          0, 10, 'Starter'),
('ricavo', 'Starter', 'Focaccia Barese',              0, 10, 'Starter'),
('ricavo', 'Starter', 'Chips Bella Lodi',             0, 10, 'Starter formaggio'),
('ricavo', 'Starter', 'Tagliata di Pollo Panato',     0, 10, 'Starter'),
('ricavo', 'Starter', 'Spiedini di Pollo Panati',     0, 10, 'Starter'),
('ricavo', 'Starter', 'Anelli di Cipolla',            0, 10, 'Starter'),
('ricavo', 'Starter', 'Mozzarelle in Carrozza',       0, 10, 'Starter'),
('ricavo', 'Starter', 'Rondelle di Melanzana',        0, 10, 'Starter'),
('ricavo', 'Starter', 'Alette di Pollo',              0, 10, 'Starter'),
('ricavo', 'Starter', 'Antipasto Tricolore',          0, 10, 'Antipasto'),
('ricavo', 'Starter', 'Caprese di Burrata e Pomodori',0, 10, 'Antipasto'),
('ricavo', 'Starter', 'Arancini (4 pz)',              0, 10, 'Starter siciliani'),
('ricavo', 'Starter', 'Arrosticini di Pollo',         0, 10, 'Starter'),
('ricavo', 'Starter', 'Caponata di Verdure',          0, 10, 'Starter'),
('ricavo', 'Starter', 'Tartare Pistacchio e Bella Lodi', 0, 10, 'Starter'),

-- ============================================================
-- RICAVI – FOOD: PIZZE
-- ============================================================
('ricavo', 'Pizze', 'Margherita',               0, 10, 'Pizza'),
('ricavo', 'Pizze', 'Crudo e Piccadilly',        0, 10, 'Pizza'),
('ricavo', 'Pizze', "Burrata e 'Nduja",          0, 10, 'Pizza'),
('ricavo', 'Pizze', 'Mortadella e Fiordilatte',  0, 10, 'Pizza'),
('ricavo', 'Pizze', 'Pizza Ortolana',            0, 10, 'Pizza verdure'),
('ricavo', 'Pizze', 'Slice Margherita',          0, 10, 'Slice pizza'),
('ricavo', 'Pizze', 'Slice Rossa',              0, 10, 'Slice pizza rossa'),
('ricavo', 'Pizze', 'Aperitivo 1 Pax',          0, 10, 'Aperitivo con pizza'),
('ricavo', 'Pizze', 'Aperitivo 2 Pax',          0, 10, 'Aperitivo con pizza x2'),
('ricavo', 'Pizze', "Margherita E' Mia Pranzo",  0, 10, 'Menu pranzo pizza'),
('ricavo', 'Pizze', 'Focaccia Contorno',         0, 10, 'Contorno pizza'),

-- ============================================================
-- RICAVI – FOOD: PASTE
-- ============================================================
('ricavo', 'Paste', 'Gnocchi e Gratinati Bella Lodi', 0, 10, 'Primo'),
('ricavo', 'Paste', 'Tagliatelle al Ragu',            0, 10, 'Primo'),
('ricavo', 'Paste', 'Fusilli Pesto Rosso',            0, 10, 'Primo'),
('ricavo', 'Paste', 'Tagliatelle Pomodoro e Raspadura',0, 10, 'Menu pranzo'),
('ricavo', 'Paste', 'Gnocchi Bella Lodi e Pepe',      0, 10, 'Menu pranzo'),
('ricavo', 'Paste', 'Parmigiana',                     0, 10, 'Primo / secondo'),

-- ============================================================
-- RICAVI – FOOD: INSALATE
-- ============================================================
('ricavo', 'Insalate', 'Orto Fresco Insalata',           0, 10, 'Insalata'),
('ricavo', 'Insalate', 'Manzo e Burrata',                0, 10, 'Insalata con carne'),
('ricavo', 'Insalate', 'Ins Tagliata di Pollo e Pomodoro', 0, 10, 'Insalata'),
('ricavo', 'Insalate', 'Ins. Pollo Fritto e Pomodoro',   0, 10, 'Insalata'),
('ricavo', 'Insalate', 'Caponata e Crudite',             0, 10, 'Insalata vegetariana'),
('ricavo', 'Insalate', 'Bella Lodi e BBQ Bianca',        0, 10, 'Menu pranzo insalata'),

-- ============================================================
-- RICAVI – FOOD: CONTORNI
-- ============================================================
('ricavo', 'Contorni', 'Patate a Fiammifero',  0, 10, 'Contorno'),
('ricavo', 'Contorni', 'Patate a Spicchio',    0, 10, 'Contorno'),
('ricavo', 'Contorni', 'Patate Chips',         0, 10, 'Contorno'),
('ricavo', 'Contorni', 'Verdure Grigliate',    0, 10, 'Contorno'),
('ricavo', 'Contorni', 'Fagiolini',            0, 10, 'Contorno'),

-- ============================================================
-- RICAVI – FOOD: DESSERT
-- ============================================================
('ricavo', 'Dessert', 'Birramisu',                       0, 10, 'Dessert DM signature'),
('ricavo', 'Dessert', 'Torta Caprese',                   0, 10, 'Dessert'),
('ricavo', 'Dessert', 'Cheesecake Frutti di Bosco',      0, 10, 'Dessert'),
('ricavo', 'Dessert', 'Cheesecake Nutella',              0, 10, 'Dessert'),
('ricavo', 'Dessert', 'Cannolo Singolo',                 0, 10, 'Dessert siciliano'),
('ricavo', 'Dessert', 'Cannolo Scomposto',               0, 10, 'Dessert siciliano'),
('ricavo', 'Dessert', 'Mini Cannoli',                    0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Mini Cannolo Scomposto',          0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Gnocco Fritto e Nutella',         0, 10, 'Dessert'),
('ricavo', 'Dessert', 'Coppa Fiordilatte e Nutella',     0, 10, 'Dessert gelato'),
('ricavo', 'Dessert', 'Coppa Nutella Baby',              0, 10, 'Dessert menu baby'),
('ricavo', 'Dessert', 'Mini Coppa Gelato Nutella',       0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Mini Coppa Gelato Frutti di Bosco', 0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Coppa Birra e Caramello Salato',  0, 10, 'Dessert signature'),
('ricavo', 'Dessert', 'Mini Birramisu',                  0, 10, 'Dessert mini'),
('ricavo', 'Dessert', 'Mini Cheesecake Frutti di Bosco', 0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Mini Cheesecake Nutella',         0, 10, 'Dessert mignon'),
('ricavo', 'Dessert', 'Nut - Gourmand',                  0, 10, 'Dessert gourmand'),
('ricavo', 'Dessert', 'Bosc - Gourmand',                 0, 10, 'Dessert gourmand'),
('ricavo', 'Dessert', "Caffe' Gourmand",                 0, 10, 'Caffe con dessert'),

-- ============================================================
-- RICAVI – MENU / COPERTI
-- ============================================================
('ricavo', 'Coperti', 'Servizio',                      2.50, 10, 'Coperto per persona'),
('ricavo', 'Coperti', 'Servizio Drink',                0,    10, 'Coperto drink'),
('ricavo', 'Coperti', 'Servizio Pranzo',               0,    10, 'Coperto pranzo'),
('ricavo', 'Coperti', 'Coperto Baby',                  0,    10, 'Coperto menu baby'),
('ricavo', 'Menu',    'Menu Pranzo Tutto Compreso',     0,    10, 'Menu pranzo'),
('ricavo', 'Menu',    'Menu Dipendenti',                0,    10, 'Menu staff'),
('ricavo', 'Menu',    "Menu' Baby",                    0,    10, 'Menu bambini'),
('ricavo', 'Menu',    'Zero Scuse',                    0,    10, "Menu' Zero Scuse"),
('ricavo', 'Menu',    'Noleggio Sala',                  0,    22, 'Forfait sala eventi');
