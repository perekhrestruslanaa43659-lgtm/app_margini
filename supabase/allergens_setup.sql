-- ============================================================
-- ALLERGENI – Setup tabella
-- Incolla nell'SQL Editor di Supabase dopo setup.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS dish_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name TEXT NOT NULL UNIQUE,
  category TEXT,
  -- 14 allergeni EU (Reg. 1169/2011)
  glutine        BOOLEAN DEFAULT false,
  crostacei      BOOLEAN DEFAULT false,
  uova           BOOLEAN DEFAULT false,
  pesce          BOOLEAN DEFAULT false,
  arachidi       BOOLEAN DEFAULT false,
  soia           BOOLEAN DEFAULT false,
  latte          BOOLEAN DEFAULT false,
  frutta_guscio  BOOLEAN DEFAULT false,
  sedano         BOOLEAN DEFAULT false,
  senape         BOOLEAN DEFAULT false,
  sesamo         BOOLEAN DEFAULT false,
  anidride       BOOLEAN DEFAULT false,  -- anidride solforosa e solfiti
  lupini         BOOLEAN DEFAULT false,
  molluschi      BOOLEAN DEFAULT false,
  -- metadati
  note_allergeni TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS
ALTER TABLE dish_allergens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dish_allergens' AND policyname = 'allow_all_authenticated_allergens') THEN
    CREATE POLICY "allow_all_authenticated_allergens" ON dish_allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dish_allergens' AND policyname = 'allow_anon_allergens') THEN
    CREATE POLICY "allow_anon_allergens" ON dish_allergens FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_allergens_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS allergens_updated_at ON dish_allergens;
CREATE TRIGGER allergens_updated_at
  BEFORE UPDATE ON dish_allergens
  FOR EACH ROW EXECUTE FUNCTION update_allergens_timestamp();
