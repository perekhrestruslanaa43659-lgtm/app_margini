-- ============================================================
-- ALLERGENI E INGREDIENTI – Menu Doppio Malto Rev.43 02/2026
-- Esegui in Supabase SQL Editor DOPO allergens_setup.sql
-- ============================================================

INSERT INTO dish_allergens (dish_name, category, glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta_guscio, sedano, senape, sesamo, anidride, lupini, molluschi, note_allergeni)
VALUES

-- ============================================================
-- STARTER & FRITTI
-- ============================================================
('Chips Bella Lodi',      'Starter', true,  false, true,  false, true,  true,  true,  true,  true,  true,  true,  false, false, false,
 'Chips (patate, olio girasole) + Crema Bella Lodi (LATTE, UOVO) + Marmellata bacon e cipolle. Può contenere GLUTINE, UOVA, ARACHIDI, SOIA, FRUTTA A GUSCIO, SEDANO, SENAPE, SESAMO'),

('Focaccia Barese',       'Starter', true,  false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Baresina classica al pomodoro (farina GRANO), emulsione basilico, basilico'),

('Mozzarelle in Carrozza','Starter', true,  false, false, true,  false, true,  true,  true,  true,  true,  true,  false, false, false,
 'Mozzarella, besciamella (LATTE, GRANO), pan carré (SOIA), impanatura (FRUMENTO). Può contenere GLUTINE, PESCE, FRUTTA A GUSCIO, SENAPE, SESAMO, SEDANO, SOLFITI'),

('Anelli di Cipolla',     'Starter', true,  false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Cipolla 40%, pastella (farina GRANO, amido GRANO), olio girasole, birra ORZO'),

('Rondelle di Melanzana', 'Starter', true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true,
 'Melanzane grigliate 55%, panatura (FRUMENTO), pastella (FRUMENTO), olio girasole. Può contenere tracce di tutti i 14 allergeni'),

('Siamo Fritti',          'Starter', true,  true,  true,  false, false, false, true,  true,  false, false, false, false, false, false,
 'Rondelle di melanzane + Crocchè di patate (LATTE, UOVO) + Anelli di cipolla (GRANO, ORZO) + Maionese alla birra'),

('Gnocco Fritto',         'Starter', true,  false, false, false, false, false, true,  false, false, false, false, true,  false, false,
 'Farina FRUMENTO 00, acqua, LATTE polvere, strutto, sale, lievito, aceto di vino (SOLFITI)'),

('Spicchi di Focaccia',   'Starter', true,  false, true,  false, false, true,  true,  true,  false, false, true,  false, false, false,
 'Focaccia Romana (farina GRANO, LATTE, UOVA). Può contenere SOIA, FRUTTA A GUSCIO, SESAMO'),

('Caprese di Burrata e Pomodori', 'Starter', false, false, false, false, false, false, true, false, false, false, false, false, false, false,
 'Burrata (LATTE), pomodoro ramato, olive nere, emulsione basilico, sale, basilico'),

('Antipasto Tricolore',   'Starter', true,  false, false, false, false, false, true,  false, false, false, false, false, false, false,
 'Prosciutto crudo, mortadella, stracciatella (LATTE), rucola, baresina (GRANO), guttiau (GRANO)'),

('Caponata di Verdure',   'Starter', false, false, false, false, false, false, true,  true,  false, false, false, false, false, false,
 'Verdure miste, salsa pomodori rustici, olive nere, olio oliva, Crema Bella Lodi (LATTE, UOVO lisozima), basilico. Può contenere LATTE, FRUTTA A GUSCIO'),

('Arancini (4 pz)',       'Starter', true,  false, true,  false, false, true,  true,  false, true,  false, false, false, false, false,
 'Riso, ragù, mozzarella (LATTE), panatura (GRANO, UOVA). Allergeni tipici: GLUTINE, UOVA, LATTE, SOIA, SEDANO'),

('Tartare Pistacchio e Bella Lodi', 'Starter', false, false, true, false, false, false, true, true, false, false, false, false, false, false,
 'Tartare bovino (UOVA tracce, LATTE tracce, FRUTTA A GUSCIO tracce, SOLFITI tracce), Crema Bella Lodi (LATTE, UOVO), granella pistacchio (FRUTTA A GUSCIO). Può contenere GLUTINE, ARACHIDI'),

('Tagliata di Pollo Panato','Starter', true,  false, true,  false, false, true,  true,  false, true,  true,  false, false, false, false,
 'Cotoletta di pollo (farina FRUMENTO, GRANO duro, LATTE polvere). Può contenere UOVO, SOIA, SEDANO, SENAPE'),

('Spiedini di Pollo Panati','Starter', true, false, false, false, false, true,  false, false, false, false, false, false, false, false,
 'Carne pollo, pangrattato (GRANO), olio, prezzemolo, limone, sale'),

('Arrosticini Abruzzesi', 'Starter', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Arrosticini campagnoli (ovino e bovino), limone'),

-- ============================================================
-- BURGER
-- ============================================================
('Super Classico Burger', 'Burger', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, false, false,
 'Soft Burger Bun Grande (FRUMENTO, LATTE, SESAMO tracce, SOIA tracce, FRUTTA A GUSCIO tracce, UOVA tracce), hamburger bovino, pomodoro, insalata, maionese (UOVA, SOIA, SENAPE), maionese alla birra (FRUMENTO, ORZO, LATTE, SENAPE), provola (LATTE), patate fritte, olio semi'),

('Il Troppo Buono',       'Burger', true,  false, true,  false, false, true,  true,  true,  true,  true,  true,  false, false, false,
 'Bun (FRUMENTO, LATTE), hamburger bovino, Salsa BBQ bianca (UOVA, SENAPE, SOLFITI), marmellata bacon e cipolle (GLUTINE, UOVA, ARACHIDI, SOIA, FRUTTA A GUSCIO, SEDANO, SENAPE, SESAMO), Grana Bella Lodi (LATTE, UOVO), pomodoro, insalata, maionese birra, patate fritte'),

('Bacon e Provola',       'Burger', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, false, false,
 'Bun (FRUMENTO, LATTE), hamburger, Salsa Burger DM (SENAPE), provola (LATTE), pancetta, pomodoro, insalata, maionese birra (UOVA, LATTE, SENAPE, FRUMENTO, ORZO), patate fritte'),

('''Nduja e Bella Lodi',  'Burger', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, false, false,
 'Bun (FRUMENTO, LATTE), hamburger, stracciatella (LATTE), pomodoro, nduja (suino), Grana Bella Lodi (LATTE, UOVO), salsa piccante, insalata riccia, maionese birra, patate fritte'),

('Super BBQ',             'Burger', true,  true,  true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Bun (FRUMENTO, LATTE), hamburger, anelli cipolla (GRANO, ORZO), Salsa BBQ DM (SOIA, FRUMENTO, PESCE acciughe), maionese birra, patate fritte'),

('Pulled Pork All Italiana','Burger', true, false, true,  false, false, true,  true,  true,  false, true,  true,  false, true,  false,
 'Bun, straccetti maiale (SOIA, SENAPE, ANIDRIDE SOLFOROSA), Salsa BBQ DM (SOIA, FRUMENTO), pomodoro, cipolla rossa, cavolo, maionese birra, patate fritte'),

('Tartare e Bella Lodi Burger','Burger', true, false, true, false, false, false, true, true, false, false, false, true, false, false,
 'Bun (FRUMENTO), tartare bovino (UOVA tracce, LATTE tracce, FRUTTA A GUSCIO tracce, SOLFITI tracce), emulsione basilico, stracciatella (LATTE), Grana Bella Lodi (LATTE, UOVO), fungo portobello, pomodoro, insalata, maionese birra, patate fritte'),

('Burger Carbonara Ole',  'Burger', true,  false, true,  false, false, false, true,  true,  false, false, false, false, false, false,
 'Bun (FRUMENTO), hamburger, salsa carbonara (UOVA, LATTE, pecorino, Parmigiano, BURRO), uovo fresco, pecorino sardo (LATTE), pancetta, insalata, maionese birra, patate fritte'),

('Fish&Chips Burger',     'Burger', true,  false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Bun (FRUMENTO, LATTE), merluzzo Alaska impanato (PESCE, FRUMENTO), Salsa Burger DM (SENAPE), pomodoro, insalata, maionese birra, patate fritte'),

('Pollo Fritto Burger',   'Burger', true,  false, true,  false, false, true,  true,  true,  true,  true,  false, false, false, false,
 'Bun (FRUMENTO, LATTE), cotoletta pollo (FRUMENTO, GRANO, LATTE). Può contenere UOVO, SOIA, SEDANO, SENAPE. Salsa miele e zenzero (UOVA, LATTE), marmellata bacon (GLUTINE, UOVA, ARACHIDI, SOIA, SENAPE, SEDANO, SESAMO), maionese birra, patate fritte'),

('Che Pollo',             'Burger', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, true,  false,
 'Bun (FRUMENTO, LATTE), sovracoscia pollo mediterranea (ANIDRIDE SOLFOROSA, SOLFITI naturali). Può contenere LATTE, FRUTTA A GUSCIO, PESCE, GLUTINE, UOVA, ARACHIDI, SOIA, SENAPE, SEDANO, SESAMO, MOLLUSCHI, LUPINI. Maionese (UOVA, SOIA, SENAPE), pancetta, insalata, maionese birra, patate fritte'),

('Vegetale e Quale Burger','Burger', false, false, false, false, false, false, false, false, false, true,  false, false, false, false,
 'Bun (FRUMENTO), burger vegetale (proteine pisello, riso), Salsa Burger DM (SENAPE), pomodoro, insalata, maionese birra, patate fritte'),

('Doppio Smash Bacon e Cheddar', 'Burger', true, false, true, false, false, true, true, true, false, true, true, false, false, false,
 'Come Super Classico + doppio medaglione smash. Bun, hamburger x2, maionese, provola, pancetta, pomodoro, insalata, patate fritte'),

-- ============================================================
-- BRACE & GRIGLIA
-- ============================================================
('Gran Tagliata',         'Brace', false, false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Scamone bovino, patate a spicchio (olio oliva, rosmarino, sale), contorno brace, rucola, olio, sale, maionese alla birra (UOVA, LATTE, SENAPE, FRUMENTO, ORZO, FRUTTA A GUSCIO tracce, PESCE tracce, CROSTACEI tracce, ARACHIDI tracce, SOIA, SESAMO tracce, MOLLUSCHI tracce, LUPINI tracce, SOLFITI tracce)'),

('Gran Tagliata Speciale','Brace', false, false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Cuberoll (entrecote bovino), patate spicchio, contorno brace, maionese alla birra (come sopra), rucola, olio, sale'),

('Tagliata di Pollo',     'Brace', false, false, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false,
 'Sovracoscia pollo mediterranea (aglio con ANIDRIDE SOLFOROSA E SOLFITI). Può contenere tracce di tutti i principali allergeni. Patate spicchio, contorno brace, salsa alle erbe, maionese birra'),

('Tagliata di Pollo BBQ', 'Brace', false, false, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false,
 'Come Tagliata di Pollo con salsa alle erbe'),

('Galletto Mediterraneo', 'Brace', false, false, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,
 'Galletto (pollo, aglio con ANIDRIDE SOLFOROSA). Può contenere tracce di LATTE, FRUTTA A GUSCIO, PESCE, GLUTINE, UOVA, ARACHIDI, SOIA, SENAPE, SEDANO, SESAMO, LUPINI, MOLLUSCHI. Patate spicchio, maionese birra, rucola'),

('Costine di Maiale',     'Brace', false, false, true,  true,  false, true,  true,  true,  true,  true,  true,  false, true,  true,
 'Costine suino (spezie, aglio), patate spicchio, contorno brace, Salsa BBQ DM (SOIA, FRUMENTO, PESCE acciughe), maionese birra. Può contenere LATTE, FRUTTA A GUSCIO, PESCE, GLUTINE, UOVA, ARACHIDI, SOIA, SENAPE, SEDANO, SESAMO, LUPINI, CROSTACEI, MOLLUSCHI, SOLFITI'),

('Cosce in Crosta',       'Brace', false, false, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false,
 'Cosce pollo marinate (aglio con ANIDRIDE SOLFOROSA E SOLFITI). Può contenere LATTE, FRUTTA A GUSCIO, PESCE, GLUTINE, UOVA, ARACHIDI, SOIA, SENAPE, SEDANO, SESAMO, LUPINI. Patate spicchio, contorno brace, maionese birra, rucola'),

('Brace Mista 1Px',       'Brace', false, true,  true,  true,  false, true,  true,  true,  true,  true,  true,  true,  true,  true,
 'Scamone + costine suino + cosce pollo + salsiccia alla birra (ORZO). Può contenere tutti i 14 allergeni. Salsa BBQ DM, patate spicchio, maionese birra, rucola, olio, sale'),

('Arrosticini di Pollo',  'Brace', true,  false, false, false, false, true,  false, false, false, false, false, false, false, false,
 'Pollo, pane grattugiato (GRANO), olio, prezzemolo, limone, sale'),

('Burrata e Verdure alla Brace','Brace', false, false, false, false, false, false, true, false, false, false, false, false, false, false,
 'Burrata (LATTE), melanzane, pomodoro, zucchine, carote, finocchi, cipolla rossa, rucola, emulsione basilico'),

-- ============================================================
-- PIZZE
-- ============================================================
('Margherita',            'Pizze', true,  false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Base bianca (FRUMENTO, SEGALE, GRANO, SOIA). Può contenere LATTE, UOVA, SENAPE, SESAMO. Salsa pomodoro (SOIA), mozzarella filone (LATTE), basilico, olio girasole'),

('Burrata e ''Nduja',     'Pizze', true,  false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Focaccia Romana (FRUMENTO). Può contenere SOIA, LATTE, UOVA, FRUTTA A GUSCIO, SESAMO. Salsa pomodoro (SOIA), nduja (suino), burrata (LATTE), cipolla rossa, emulsione basilico, basilico'),

('Crudo e Piccadilly',    'Pizze', true,  false, true,  true,  false, true,  true,  true,  false, true,  true,  false, false, false,
 'Focaccia Romana (FRUMENTO), mozzarella (LATTE), prosciutto crudo, pomodori piccadilly, Grana Bella Lodi (LATTE, UOVO), basilico'),

('Mortadella e Fiordilatte','Pizze', true, false, true,  false, false, false, true,  true,  false, false, true,  false, false, false,
 'Focaccia Romana (FRUMENTO), mozzarella (LATTE), mortadella, Crema Bella Lodi (LATTE, UOVO), granella pistacchio (PISTACCHIO - FRUTTA A GUSCIO). Può contenere GLUTINE, ARACHIDI, FRUTTA A GUSCIO, SESAMO'),

('Pizza Ortolana',        'Pizze', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, false, false,
 'Focaccia Romana (FRUMENTO), mozzarella (LATTE), zucchine, pomodori piccadilly, pomodorini gialli, emulsione basilico, olio semi (SOIA)'),

-- ============================================================
-- PASTE & PRIMI
-- ============================================================
('Tagliatelle al Ragu',   'Paste', true,  false, true,  false, false, false, true,  true,  true,  false, false, false, false, false,
 'Tagliatelle (semola GRANO duro, UOVA 20%). Può contenere LATTE, SOIA, SENAPE. Ragù alla bolognese (carni suino/bovino, SEDANO, pomodoro). Può contenere tracce di tutti i principali allergeni. Salsa pomodoro, Grana Bella Lodi (LATTE, UOVO), basilico'),

('Fusilli Pesto Rosso',   'Paste', true,  false, true,  false, false, true,  true,  true,  false, false, false, false, false, false,
 'Fusilloni (semola GRANO duro, UOVA 20%). Può contenere SOIA, LATTE, SENAPE. Crema Bella Lodi (LATTE, UOVO), zucchine, pepe, basilico, olio semi (SOIA)'),

('Gnocchi e Gratinati Bella Lodi','Paste', true, false, true, false, false, true, true, false, false, true, false, false, false, false,
 'Mezzelune ai funghi porcini (GRANO, UOVA, LATTE, funghi porcini). Può contenere SOIA, SENAPE. Crema Bella Lodi (LATTE, UOVO), fungo portobello, olio, sale, pepe, emulsione basilico'),

('Gnocchi Bella Lodi e Pepe','Paste', true, false, true, false, false, true, true, false, false, true, false, false, false, false,
 'Mezzelune funghi porcini (GRANO, UOVA, LATTE), Crema Bella Lodi (LATTE, UOVO), pepe nero, Grana Bella Lodi (LATTE, UOVO), basilico'),

('Parmigiana',            'Paste', true,  false, true,  false, false, true,  true,  false, false, false, false, false, false, false,
 'Parmigiana di melanzane (pomodoro, melanzane fritte, grana padano con LATTE e UOVO lisozima). Può contenere GLUTINE, PESCE, FRUTTA A GUSCIO, SENAPE, SESAMO, SEDANO, SOIA, SOLFITI. Salsa pomodoro, mozzarella (LATTE), Crema Bella Lodi (LATTE, UOVO), basilico'),

-- ============================================================
-- INSALATE
-- ============================================================
('Orto Fresco Insalata',  'Insalate', true, false, false, false, false, true, false, true, false, true, true, false, false, false,
 'Pomodoro ramato, insalata riccia, insalata gentile, cavolo cappuccio, finocchi, carote, cetrioli, rucola, salsa alle erbe, guttiau (GRANO, SOIA tracce, SENAPE tracce)'),

('Manzo e Burrata',       'Insalate', true, false, false, false, false, true, true, false, false, true, true, false, false, false,
 'Scamone bovino, burrata (LATTE), pomodoro ramato, insalata riccia/gentile, cavolo cappuccio, rucola, guttiau (GRANO), crostini pane fritti (FRUMENTO, SESAMO, AVENA, SEGALE, ORZO). Può contenere LATTE, FRUTTA A GUSCIO, MOLLUSCHI. Salsa alle erbe'),

('Ins. Tagliata di Pollo e Pomodoro','Insalate', true, false, true, true, true, true, true, true, true, true, true, true, true, false,
 'Cotoletta pollo (FRUMENTO, GRANO, LATTE). Può contenere UOVO, SOIA, SEDANO, SENAPE. Pecorino sardo (LATTE), pomodoro ramato, salsa alle erbe, insalata riccia/gentile, cavolo cappuccio, rucola, crostini pane fritti, guttiau'),

('Ins. Pollo Fritto e Pomodoro','Insalate', true, false, true, true, true, true, true, true, true, true, true, true, true, false,
 'Come Tagliata di Pollo e Pomodoro - stessi allergeni'),

('Caponata e Crudite',    'Insalate', true, false, false, false, false, true, true, true, false, true, true, false, false, false,
 'Pomodoro, carote, finocchi, cetrioli, fagiolini, verdure miste (SOIA tracce), emulsione basilico, salsa pomodori rustici, olive nere, olio, sale, basilico, guttiau (GRANO, SOIA tracce, SENAPE tracce)'),

-- ============================================================
-- CONTORNI
-- ============================================================
('Patate a Fiammifero',   'Contorni', false, false, true, false, false, true, true, true, false, true, false, false, false, false,
 'Patate fritte con buccia (patate, olio girasole), olio semi (SOIA), sale, maionese alla birra (UOVA, LATTE, SENAPE, FRUMENTO, ORZO)'),

('Patate a Spicchio',     'Contorni', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Patate, olio d oliva, rosmarino, sale'),

('Patate Chips',          'Contorni', false, false, true, false, false, true, true, true, false, true, false, false, false, false,
 'Patate chips (patate 93%, olio girasole 7%), olio semi (SOIA), maionese alla birra (UOVA, LATTE, SENAPE, FRUMENTO, ORZO)'),

('Verdure Grigliate',     'Contorni', false, false, false, false, false, true, false, false, false, false, false, false, false, false,
 'Pomodoro ramato, melanzane, zucchine, carote, emulsione basilico. Può contenere tracce di SOIA'),

('Fagiolini',             'Contorni', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Fagiolini, emulsione basilico (basilico, olio oliva), limone, olio d oliva'),

-- ============================================================
-- DESSERT
-- ============================================================
('Birramisu''',           'Dessert', true,  false, true,  false, false, true,  true,  false, false, true,  false, false, false, false,
 'Mascarpone (PANNA), tuorlo UOVO, zucchero, savoiardi (FRUMENTO, UOVA). Può contenere SOIA, SENAPE. Birra Black Stout (ORZO), cioccolato fondente gocce (può contenere LATTE), vanillina'),

('Torta Caprese',         'Dessert', false, false, true,  false, false, true,  true,  true,  false, false, false, false, false, false,
 'UOVA, BURRO (LATTE), zucchero, MANDORLE (FRUTTA A GUSCIO), pasta al cacao (SOIA lecitina). Può contenere GLUTINE, ARACHIDI. Gelato alla panna (LATTE), zucchero a velo'),

('Cheesecake Frutti di Bosco','Dessert', true, false, true, false, false, true, true, true, false, true, true, false, false, false,
 'Sbrisolona base (GRANO, MANDORLE, UOVA, BURRO). Può contenere SOIA, SENAPE, SESAMO, LUPINI. Robiola (LATTE), panna (LATTE), zucchero, frutti di bosco allo sciroppo'),

('Cheesecake Nutella',    'Dessert', true,  false, true,  false, false, true,  true,  true,  false, true,  true,  false, false, false,
 'Sbrisolona (GRANO, MANDORLE, UOVA, BURRO). Robiola (LATTE), panna (LATTE), zucchero, Nutella (NOCCIOLE-FRUTTA A GUSCIO, LATTE, SOIA lecitina)'),

('Cannolo Singolo',       'Dessert', true,  false, true,  false, false, true,  true,  true,  false, false, true,  false, false, false,
 'Cannolo (GRANO, UOVA). Può contenere FRUTTA A GUSCIO, LATTE, SOIA, SESAMO. Crema di ricotta dolce (siero LATTE ovino, LATTE ovino, UOVA tracce, ARACHIDI tracce, GLUTINE tracce), cioccolato fondente gocce (LATTE tracce)'),

('Cannolo Scomposto',     'Dessert', true,  false, true,  false, false, true,  true,  true,  false, false, true,  false, false, false,
 'Come Cannolo Singolo + panna + zucchero semolato + granella pistacchio (PISTACCHIO/FRUTTA A GUSCIO) + cioccolato gocce'),

('Caffe'' Gourmand',      'Dessert', true,  false, true,  false, false, true,  true,  true,  false, true,  false, false, false, false,
 'Caffè + Birramisu (FRUMENTO, UOVA, LATTE, ORZO) + Cannolo (GRANO, UOVA, LATTE, SOIA, SESAMO tracce) + Cheesecake (GRANO, MANDORLE, UOVA, LATTE, SOIA) + Mousse al cacao (LATTE, NOCCIOLE, SOIA) + Mousse al pistacchio (LATTE, PISTACCHIO, SOIA). Può contenere GLUTINE, UOVA, ARACHIDI, SENAPE'),

('Coppa Fiordilatte e Nutella','Dessert', false, false, false, false, false, true, true, true, false, false, false, false, false, false,
 'Gelato alla panna (LATTE), Nutella (NOCCIOLE-FRUTTA A GUSCIO, LATTE, SOIA lecitina), panna spray (LATTE), sbrisolona (GRANO, MANDORLE, UOVA, BURRO)'),

('Coppa Birra e Caramello Salato','Dessert', true, false, true, false, false, false, true, false, false, false, false, false, false, false,
 'Gelato alla birra (LATTE, birra con ORZO e FRUMENTO, UOVA tuorlo), gelato panna variegato caramello salato (LATTE). Può contenere UOVA, SOIA, FRUTTA A GUSCIO. Sbrisolona (GRANO, MANDORLE, UOVA, BURRO), frutti di bosco, panna spray (LATTE), offelle (FRUMENTO, BURRO, UOVA, SOIA lecitina), zucchero a velo'),

-- ============================================================
-- COCKTAILS (allergeni principali)
-- ============================================================
('Negroni',               'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Bitter, Vermouth Rosso Cinzano (SOLFITI), gin, arancia'),

('Negroni Sbagliato',     'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Vermouth Rosso Cinzano (SOLFITI), Prosecco (SOLFITI), arancia'),

('Spritz Aperol',         'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Bevanda alcolica aromatizzata al gusto spritz (Aperol, vino con SOLFITI), soda, aromi, arancia'),

('Spritz Hugo',           'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Liquore fiori sambuco, Prosecco (SOLFITI), soda, arancia'),

('Mojito',                'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Rhum chiaro, soda water (può contenere SOLFITI), zucchero di canna, lime, menta'),

('Casanova Spritz',       'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Upper Spritz, bitter, liquore sambuco, Prosecco (SOLFITI), Summer IPA (ORZO, FRUMENTO, AVENA), bevanda al gusto spritz, arancia'),

('Moscow Mule',           'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Vodka, Ginger Beer (zenzero), limone, menta'),

('Sex on the Beach',      'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Vodka alla pesca, spremuta arancia, sciroppo mirtillo, arancia'),

('Cuba Libre',            'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Rhum scuro, Cola, limone'),

('Whisky e Cola',         'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Johnnie Walker whisky, Cola, limone'),

('Vodka e Red Bull',      'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Vodka, Red Bull (acqua, saccarosio, glucosio, caffeina, taurina, vitamine), arancia'),

('Gin Tonic',             'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Gin, tonica (può contenere SOLFITI), lime'),

('Gin Lemon',             'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Gin, limonata (può contenere SOLFITI), limone'),

('Vodka Lemon',           'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Vodka, limonata (può contenere SOLFITI), limone'),

('Vodka Tonic',           'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Vodka, tonica (può contenere SOLFITI), lime'),

('Riviera',               'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Sciroppo fragola, Bella Rossa (malto ORZO), soda water, sciroppo menta'),

('Clorofillo',            'Cocktails', false, false, false, false, false, false, false, false, false, false, false, true,  false, false,
 'Spremuta arancia, sciroppo cranberry, tonica (SOLFITI tracce), lime'),

('Bitter Bull',           'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Extra Bitter (malto ORZO), limone, Red Bull'),

('Golden Spritz',         'Cocktails', false, false, false, false, false, false, false, false, false, false, false, false, false, false,
 'Super Chiara Analcolica (malto ORZO), sciroppo limone, limone'),

-- ============================================================
-- CAFFE SPECIALI
-- ============================================================
('Irlandese',             'Caffe', false, false, false, false, false, false, true,  false, false, false, false, false, false, false,
 'Caffè, Baileys Original Irish Cream (contiene LATTE), panna spray (LATTE), cioccolato fondente gocce (LATTE tracce)'),

('Capadolce',             'Caffe', true,  false, true,  false, false, true,  true,  true,  false, true,  false, false, false, false,
 'Caffè, Nutella (NOCCIOLE-FRUTTA A GUSCIO, LATTE, SOIA), panna spray (LATTE), sbrisolona (GRANO, MANDORLE-FRUTTA A GUSCIO, UOVA, BURRO). Può contenere SOIA, SENAPE, SESAMO, LUPINI. Cacao amaro (LATTE tracce)'),

-- ============================================================
-- BIRRE (allergeni base)
-- ============================================================
('0.4 Super Chiara',      'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO (GLUTINE), luppolo, lievito'),
('0.4 Bella Rossa',       'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO (GLUTINE), luppolo, lievito'),
('0.4 Imperiale',         'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, destrosio, luppolo, lievito'),
('0.4 Iper Weiss',        'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, malto di FRUMENTO, luppolo, lievito'),
('0.4 Honey IPA',         'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, zucchero candito, miele castagno, luppolo, lievito'),
('0.4 Black Stout',       'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, malto di FRUMENTO, luppolo, lievito'),
('0.4 Summer IPA',        'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, malto FRUMENTO, fiocchi AVENA, luppolo, buccia arancia dolce, lievito'),
('0.4 Extra Bitter',      'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito'),
('0.4 Sexy IPA',          'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito'),
('0.4 ''O Sole Mio',      'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, malto FRUMENTO, destrosio, luppolo, buccia limone Sorrento IGP, lievito'),
('0.4 Ultra Pils',        'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito'),
('0.4 Regina',            'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito'),
('0.4 Magnus',            'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito, liquirizia Calabria DOP'),
('0.4 Zingi Ale',         'Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto ORZO, malto FRUMENTO, luppolo, zenzero, lievito'),
('0.4 Chiara Alcool Free','Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto d ORZO, luppolo, lievito (deglutinato)'),
('0.4 Summer Alcool Free','Birre Medie', true, false, false, false, false, false, false, false, false, false, false, false, false, false, 'Acqua, malto ORZO, malto FRUMENTO, fiocchi AVENA, luppolo, buccia arancia, lievito'),

-- ============================================================
-- VINI (tutti contengono SOLFITI)
-- ============================================================
('Calice Dolcetto',       'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Dolcetto d Alba DOC. Contiene SOLFITI'),
('Calice Traminer',       'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Gewurztraminer. Contiene SOLFITI'),
('Calice Cannonau',       'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Cannonau di Sardegna Riserva DOC. Contiene SOLFITI'),
('Calice Prosecco',       'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Prosecco Valdobbiadene DOCG Superiore. Contiene SOLFITI'),
('Calice Rosato',         'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Rosato del Salento IGT. Contiene SOLFITI'),
('Calice Vermentino',     'Vini', false, false, false, false, false, false, false, false, false, false, false, true, false, false, 'Vermentino di Sardegna DOC. Contiene SOLFITI')

ON CONFLICT (dish_name) DO UPDATE SET
  category       = EXCLUDED.category,
  glutine        = EXCLUDED.glutine,
  crostacei      = EXCLUDED.crostacei,
  uova           = EXCLUDED.uova,
  pesce          = EXCLUDED.pesce,
  arachidi       = EXCLUDED.arachidi,
  soia           = EXCLUDED.soia,
  latte          = EXCLUDED.latte,
  frutta_guscio  = EXCLUDED.frutta_guscio,
  sedano         = EXCLUDED.sedano,
  senape         = EXCLUDED.senape,
  sesamo         = EXCLUDED.sesamo,
  anidride       = EXCLUDED.anidride,
  lupini         = EXCLUDED.lupini,
  molluschi      = EXCLUDED.molluschi,
  note_allergeni = EXCLUDED.note_allergeni;
