-- Template riutilizzabili per il configuratore Proposte Eventi: salva l'intera
-- struttura di una proposta (sezioni, fasce prezzo, piatti, servizi) come punto
-- di partenza per comporre nuove proposte senza ripartire da zero.

CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sections JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_proposal_templates" ON proposal_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_proposal_templates" ON proposal_templates FOR ALL TO anon USING (true) WITH CHECK (true);
