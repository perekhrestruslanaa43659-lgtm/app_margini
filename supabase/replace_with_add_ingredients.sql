-- Sostituisce nelle ricette i vecchi ingredienti con gli Add equivalenti
-- poi elimina i vecchi

-- Step 1: aggiorna recipe_items

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Pancetta')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Pancetta');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Provola')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Provola');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Mayo Birra')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Maionese alla Birra');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Rucola')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Rucola');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Nutella')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Nutella');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Stracciatella')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Stracciatella');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Burrata')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Burrata');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Insalata')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Insalata Mista');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Fagiolini')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Fagiolini');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Pecorino')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Pecorino Sardo');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Panna Spray')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Panna Spray');

UPDATE recipe_items
SET ingredient_id = (SELECT id FROM ingredients WHERE name = 'Add Mozzarella Filone (100 GR)')
WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Mozzarella Filone');

-- Step 2: elimina i vecchi (ora non più usati)

DELETE FROM ingredients WHERE name = 'Pancetta';
DELETE FROM ingredients WHERE name = 'Provola';
DELETE FROM ingredients WHERE name = 'Maionese alla Birra';
DELETE FROM ingredients WHERE name = 'Rucola';
DELETE FROM ingredients WHERE name = 'Nutella';
DELETE FROM ingredients WHERE name = 'Stracciatella';
DELETE FROM ingredients WHERE name = 'Burrata';
DELETE FROM ingredients WHERE name = 'Insalata Mista';
DELETE FROM ingredients WHERE name = 'Fagiolini';
DELETE FROM ingredients WHERE name = 'Pecorino Sardo';
DELETE FROM ingredients WHERE name = 'Panna Spray';
DELETE FROM ingredients WHERE name = 'Mozzarella Filone';
