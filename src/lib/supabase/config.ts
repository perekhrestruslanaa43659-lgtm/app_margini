export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return (
    url.length > 0 &&
    url !== 'your-supabase-project-url' &&
    url.startsWith('https://') &&
    key.length > 0 &&
    key !== 'your-supabase-anon-key'
  )
}
