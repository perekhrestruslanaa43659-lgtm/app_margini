-- Chiude l'accesso pubblico (ruolo anon) a company_settings, che contiene l'IBAN.
-- Da questo momento company_settings è leggibile SOLO da:
--   - utenti autenticati nell'app (dashboard, pagina Impostazioni)
--   - route server che usano SUPABASE_SERVICE_ROLE_KEY (vedi src/lib/supabase/admin.ts)
-- IMPORTANTE: applica questa migrazione DOPO aver impostato SUPABASE_SERVICE_ROLE_KEY
-- nelle variabili d'ambiente (.env.local e Vercel), altrimenti l'export del preventivo
-- PDF smetterà di mostrare i dati aziendali finché la chiave non è configurata.
DROP POLICY IF EXISTS "allow_anon_read_company_settings" ON company_settings;

-- Le salette non contengono dati sensibili in senso stretto, ma non hanno motivo
-- di essere leggibili pubblicamente: la route export le legge tramite lo stesso
-- client admin usato per company_settings.
DROP POLICY IF EXISTS "allow_anon_rooms" ON rooms;
