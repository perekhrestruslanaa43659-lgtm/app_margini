-- Aggiunge colonna categoria alla tabella ingredients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Altro';

-- Assegna categorie agli ingredienti esistenti
UPDATE ingredients SET categoria = 'Basi & Impasti' WHERE name IN (
  'Focaccia Romana Base', 'Baresina Classica al Pomodoro', 'Soft Burger Bun Grande',
  'Pane Grattugiato', 'Savoiardi', 'Sbrisolona Base', 'Crostini Pane Fritti',
  'Tagliatelle Fresche', 'Fusilloni', 'Cannolo Guscio'
);

UPDATE ingredients SET categoria = 'Carni & Proteici' WHERE name IN (
  'Hamburger Bovino 180g', 'Scamone Bovino', 'Cuberoll Entrecote',
  'Sovracoscia Pollo Mediterranea', 'Galletto Mediterraneo', 'Cotoletta di Pollo',
  'Costine di Maiale', 'Straccetti di Maiale BBQ', 'Salsiccia alla Birra',
  'Merluzzo Alaska Impanato', 'Tartare Bovino', 'Arrosticini Campagnoli', 'Burger Vegetale'
);

UPDATE ingredients SET categoria = 'Latticini & Formaggi' WHERE name IN (
  'Crema Bella Lodi', 'Grana Bella Lodi Grattugiato', 'Parmigiana di Melanzane',
  'Crema di Ricotta Dolce', 'Mascarpone', 'Robiola'
);

UPDATE ingredients SET categoria = 'Salse & Condimenti' WHERE name IN (
  'Salsa BBQ DM', 'Salsa Burger DM', 'Salsa BBQ Bianca',
  'Marmellata Bacon e Cipolle', 'Salsa Miele e Zenzero', 'Emulsione Basilico',
  'Salsa Pomodori Rustici', 'Salsa Pomodoro', 'Salsa alle Erbe', 'Salsa Piccante',
  'Ragù alla Bolognese', 'Salsa Carbonara', 'Cioccolato Fondente Gocce'
);

UPDATE ingredients SET categoria = 'Fritti & Preparati' WHERE name IN (
  'Chips Patate', 'Anelli di Cipolla Pastellati', 'Rondelle Melanzana Pastellate',
  'Crocchè di Patate', 'Mozzarella in Carrozza', 'Arancini Pronti', 'Gnocco Fritto'
);

UPDATE ingredients SET categoria = 'Verdure & Contorni' WHERE name IN (
  'Patate a Spicchio', 'Verdure Miste Grigliate', 'Pomodoro Ramato',
  'Pomodori Piccadilly', 'Cipolla Rossa', 'Funghi Portobello', 'Olive Nere', 'Guttiau'
);

UPDATE ingredients SET categoria = 'Salumi & Affettati' WHERE name IN (
  'Prosciutto Crudo', 'Mortadella', 'Nduja'
);

UPDATE ingredients SET categoria = 'Dolci & Dessert' WHERE name IN (
  'Gelato alla Panna', 'Gelato alla Birra', 'Gelato Caramello Salato',
  'Frutti di Bosco Sciroppo', 'Granella Pistacchio', 'Offelle',
  'Zucchero a Velo', 'Cacao Amaro', 'Vanillina'
);

UPDATE ingredients SET categoria = 'Birre' WHERE name IN (
  'Black Stout DM 0.4', 'Extra Bitter DM 0.4', 'Bella Rossa DM 0.4',
  'Super Chiara DM 0.4', 'Summer IPA DM 0.4'
);

UPDATE ingredients SET categoria = 'Alcolici & Caffè' WHERE name IN (
  'Caffè Espresso', 'Baileys Irish Cream', 'Vermouth Rosso Cinzano',
  'Prosecco Valdobbiadene', 'Rhum Chiaro', 'Gin', 'Vodka', 'Whisky Johnnie Walker'
);

UPDATE ingredients SET categoria = 'Aggiunte Food' WHERE name LIKE 'Add %' AND name NOT IN (
  'Add Tanqueray', 'Add Sambuca', 'Add Amaro Frato Freddo', 'Add Macchiato Caldo',
  'Add Limone', 'Add Line', 'Add GinAmarena Fabbri', 'Add Cacao', 'Add Cacao Fatte',
  'Add Amaro Frato', 'Add Arancia', 'Add Birra (0.2)', 'Add Birra (0.4)', 'Add Vodka'
);

UPDATE ingredients SET categoria = 'Aggiunte Beverage' WHERE name IN (
  'Add Tanqueray', 'Add Sambuca', 'Add Amaro Frato Freddo', 'Add Macchiato Caldo',
  'Add Limone', 'Add Line', 'Add GinAmarena Fabbri', 'Add Cacao', 'Add Cacao Fatte',
  'Add Amaro Frato', 'Add Arancia', 'Add Birra (0.2)', 'Add Birra (0.4)', 'Add Vodka'
);

UPDATE ingredients SET categoria = 'Rimozioni' WHERE name LIKE 'No %';

-- Verifica
SELECT categoria, COUNT(*) FROM ingredients GROUP BY categoria ORDER BY categoria;
