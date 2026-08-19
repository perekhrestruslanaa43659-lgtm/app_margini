-- Contatore per il rate limiting degli endpoint pubblici (estrazione AI, form preventivo).
-- Nessuna policy anon: viene letta/scritta solo dal client admin server-only.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_hits_key_created_idx ON rate_limit_hits (key, created_at);

ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- Nessuna policy: accessibile solo con SUPABASE_SERVICE_ROLE_KEY (bypassa RLS) o,
-- in fallback, dalla anon key lato server — mai da client browser.
CREATE POLICY "allow_anon_rate_limit_hits" ON rate_limit_hits FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated_rate_limit_hits" ON rate_limit_hits FOR ALL TO authenticated USING (true) WITH CHECK (true);
