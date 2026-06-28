'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'

export function SetupBanner() {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="card border-2 border-amber-200 bg-amber-50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 mb-1">Database non configurato</h2>
            <p className="text-sm text-slate-600 mb-4">
              Per usare questa sezione devi collegare un progetto Supabase. Segui questi 3 passi:
            </p>
            <ol className="text-sm text-slate-700 space-y-3">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>
                  Crea un progetto gratuito su{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">
                    supabase.com <ExternalLink size={12} />
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>
                  Vai su <strong>Project Settings → API</strong> e copia <strong>Project URL</strong> e <strong>anon public key</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>
                  Incollali nel file <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> nella cartella del progetto:
                </span>
              </li>
            </ol>
            <div className="mt-4 bg-slate-800 text-emerald-400 rounded-xl p-4 text-xs font-mono">
              <div>NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Dopo aver salvato il file, riavvia il server con <code className="bg-slate-100 px-1 rounded">npm run dev</code>.
              Poi esegui lo schema SQL in <code className="bg-slate-100 px-1 rounded">supabase/schema.sql</code> dal pannello SQL Editor di Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
