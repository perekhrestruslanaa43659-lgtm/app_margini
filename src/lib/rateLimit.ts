import { createAdminClient } from '@/lib/supabase/admin'

// Rate limit persistente per IP, basato su una tabella Supabase condivisa tra le
// istanze serverless (una Map in-memory non funzionerebbe: ogni invocazione può
// girare su un'istanza diversa senza stato condiviso).
export async function checkRateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean }> {
  const supabase = createAdminClient()
  // Se Supabase non è raggiungibile, non blocchiamo l'utente per un problema infrastrutturale.
  if (!supabase) return { allowed: true }

  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()
  const key = `${bucket}:${ip}`

  const { count } = await supabase
    .from('rate_limit_hits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= limit) return { allowed: false }

  await supabase.from('rate_limit_hits').insert({ key })
  return { allowed: true }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
