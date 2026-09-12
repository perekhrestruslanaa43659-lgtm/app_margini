'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { ProposalSend } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

function ProposteInviatePageInner() {
  const supabase = createClient()
  const [rows, setRows] = useState<ProposalSend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data } = await supabase
        .from('proposal_sends')
        .select('*')
        .order('sent_at', { ascending: false })
      setRows((data ?? []) as unknown as ProposalSend[])
      setLoading(false)
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
          <Send className="text-violet-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dm-ink">Proposte inviate</h1>
          <p className="text-sm text-slate-500">Registro delle email di proposta (menu/preventivo) inviate ai clienti</p>
        </div>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nessuna proposta inviata finora</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Data</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Cliente</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Oggetto</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500 hidden md:table-cell">Allegati</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Persone</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Importo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                      {format(new Date(row.sent_at), 'd MMM yyyy, HH:mm', { locale: it })}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.event_id ? (
                        <Link href={`/events/${row.event_id}`} className="font-medium text-dm-maroon hover:underline">
                          {row.client_name || row.client_email || '—'}
                        </Link>
                      ) : (
                        <p className="font-medium text-dm-ink/80">{row.client_name || row.client_email || '—'}</p>
                      )}
                      {row.client_name && row.client_email && (
                        <p className="text-xs text-slate-400">{row.client_email}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 hidden sm:table-cell">{row.subject || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                      {row.attachments.length > 0 ? row.attachments.join(', ') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600 hidden sm:table-cell">
                      {row.guests_count != null ? (
                        <span className="inline-flex items-center gap-1"><Users size={13} className="text-slate-400" />{row.guests_count}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-dm-ink/80">
                      {row.total_amount != null ? formatCurrency(row.total_amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProposteInviatePage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <ProposteInviatePageInner />
}
