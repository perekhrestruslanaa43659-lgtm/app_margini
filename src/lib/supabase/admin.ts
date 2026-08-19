import { createClient } from '@supabase/supabase-js'

// Client Supabase server-only con privilegi elevati per leggere dati sensibili
// (IBAN, contatti) da route che girano senza sessione utente (export PDF, ecc.).
// Usa SUPABASE_SERVICE_ROLE_KEY se configurata (bypassa RLS in sicurezza, perché
// non lascia mai il server) e ricade sulla anon key pubblica solo finché quella
// variabile non è impostata, per non rompere l'app durante la migrazione.
// NON importare mai questo modulo da codice che gira nel browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || (!serviceKey && !anonKey)) return null

  return createClient(url, serviceKey || anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
