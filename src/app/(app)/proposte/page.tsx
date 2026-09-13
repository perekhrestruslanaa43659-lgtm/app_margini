'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText, ArrowRight, BookmarkPlus, FolderOpen, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { CatalogItem, ProposalTemplate, Room } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { buildProposalHtml, normalizeMealSections, type MealSection, type RoomPhotoByName } from '@/lib/proposalHtml'
import type { QuoteLang } from '@/lib/pdf/i18n'
import {
  saveDraftProposal, saveWorkingProposal, loadWorkingProposal, clearWorkingProposal,
  saveClientDraft, loadClientDraft, emptyClientDraft, type ProposalClientDraft,
} from '@/lib/proposalDraft'
import { SectionsEditor, emptySection, nextAccent, MEAL_PRESETS } from '@/components/proposte/SectionsEditor'

const STATUS_OPTIONS = ['Da inviare', 'Bozza / in valutazione', 'Già confermata dal cliente']

function ProposteInner() {
  const router = useRouter()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<MealSection[]>(() => {
    if (typeof window === 'undefined') return [emptySection(MEAL_PRESETS[0], 'green')]
    const working = loadWorkingProposal()
    return working ? normalizeMealSections(working) : [emptySection(MEAL_PRESETS[0], 'green')]
  })
  const [restoredNotice, setRestoredNotice] = useState(false)
  const [lang, setLang] = useState<QuoteLang>('it')
  const [client, setClient] = useState<ProposalClientDraft>(() => {
    if (typeof window === 'undefined') return emptyClientDraft()
    return loadClientDraft() ?? emptyClientDraft()
  })

  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: catalogData }, { data: templateData }, { data: roomsData }] = await Promise.all([
        sb.from('catalog_items').select('*').order('category').order('name'),
        sb.from('proposal_templates').select('*').order('name'),
        sb.from('rooms').select('*').order('name'),
      ])
      setCatalog((catalogData ?? []) as CatalogItem[])
      setTemplates((templateData ?? []) as ProposalTemplate[])
      setRooms((roomsData ?? []) as Room[])
      setLoading(false)
    }
    load()
    if (loadWorkingProposal()) setRestoredNotice(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosalvataggio: ogni modifica alla proposta viene tenuta in sessionStorage,
  // cosi' navigare via (indietro nel browser, cambio pagina) e tornare non perde il lavoro.
  useEffect(() => {
    saveWorkingProposal(sections)
  }, [sections])

  useEffect(() => {
    saveClientDraft(client)
  }, [client])

  function updateClient(patch: Partial<ProposalClientDraft>) {
    setClient((prev) => ({ ...prev, ...patch }))
  }

  function handleSectionsChange(updater: (prev: MealSection[]) => MealSection[]) {
    setSections(updater)
  }

  function startNewProposal() {
    clearWorkingProposal()
    setSections([emptySection(MEAL_PRESETS[0], 'green')])
    setClient(emptyClientDraft())
    setActiveTemplateId(null)
    setRestoredNotice(false)
  }

  function addSection() {
    setSections((prev) => [...prev, emptySection(MEAL_PRESETS[prev.length % MEAL_PRESETS.length], nextAccent(prev))])
  }

  async function saveAsNewTemplate() {
    if (!newTemplateName.trim()) return
    setTemplateSaving(true)
    const { data, error } = await sb.from('proposal_templates').insert({ name: newTemplateName.trim(), sections }).select().single()
    setTemplateSaving(false)
    if (!error && data) {
      setTemplates((prev) => [...prev, data as ProposalTemplate].sort((a, b) => a.name.localeCompare(b.name)))
      setActiveTemplateId(data.id)
      setShowSaveDialog(false)
      setNewTemplateName('')
    }
  }

  async function updateActiveTemplate() {
    if (!activeTemplateId) return
    setTemplateSaving(true)
    const { error } = await sb.from('proposal_templates').update({ sections, updated_at: new Date().toISOString() }).eq('id', activeTemplateId)
    setTemplateSaving(false)
    if (!error) {
      setTemplates((prev) => prev.map((t) => (t.id === activeTemplateId ? { ...t, sections } : t)))
    }
  }

  function loadTemplate(template: ProposalTemplate) {
    setSections(normalizeMealSections(template.sections as MealSection[]))
    setActiveTemplateId(template.id)
    setShowTemplateMenu(false)
  }

  async function deleteTemplate(id: string) {
    await sb.from('proposal_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    if (activeTemplateId === id) setActiveTemplateId(null)
  }

  function openProposal() {
    const roomPhotoByName: RoomPhotoByName = new Map()
    for (const r of rooms) {
      if (r.photo_url) roomPhotoByName.set(r.name.trim().toLowerCase(), r.photo_url)
    }
    const html = buildProposalHtml(sections, lang, roomPhotoByName)
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(blobUrl, '_blank')
  }

  function proceedToQuote() {
    saveDraftProposal(sections)
    router.push('/proposte/preventivo')
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto"><div className="card text-center text-slate-400 py-16">Caricamento catalogo...</div></div>
  }

  return (
    <div className="proposte-sticker">
      <div className="max-w-6xl mx-auto pb-16">
        {restoredNotice && (
          <div className="sticker-card flex items-center justify-between gap-3">
            <p className="text-xs text-[#1C1B18]">Ripristinata l&apos;ultima proposta su cui stavi lavorando.</p>
            <button className="text-xs text-[#1C1B18] underline shrink-0" onClick={() => setRestoredNotice(false)}>
              Ok, capito
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#1C1B18] rounded-xl flex items-center justify-center shrink-0">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <p className="sticker-eyebrow text-sm">Modulo proposta</p>
              <h1 className="text-2xl" style={{ fontFamily: "'Archivo Black', Arial, sans-serif" }}>Proposte Eventi</h1>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={addSection}>
              <Plus size={15} /> Aggiungi momento
            </button>
            <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={startNewProposal}>
              <FileText size={15} /> Nuova proposta
            </button>

            <div className="relative">
              <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={() => setShowTemplateMenu((v) => !v)}>
                <FolderOpen size={15} /> Template
              </button>
              {showTemplateMenu && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border-2 border-[#1C1B18] z-30 py-1">
                  {templates.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">Nessun template salvato</p>
                  ) : (
                    templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#FBF6EC] text-sm">
                        <button className="flex-1 text-left truncate text-[#1C1B18]" onClick={() => loadTemplate(t)}>
                          {t.name}
                        </button>
                        <button className="text-slate-300 hover:text-red-500 shrink-0 ml-2" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {activeTemplateId ? (
              <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={updateActiveTemplate} disabled={templateSaving}>
                <Save size={15} /> Aggiorna template
              </button>
            ) : null}

            <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={() => { setShowSaveDialog(true); setNewTemplateName('') }}>
              <BookmarkPlus size={15} /> Salva come template
            </button>

            <div className="flex rounded-[14px] border-[3px] border-[#1C1B18] overflow-hidden text-xs" style={{ fontFamily: "'Archivo Black', Arial, sans-serif" }}>
              <button
                className={`px-3 py-2 ${lang === 'it' ? 'bg-[#E1543F] text-white' : 'bg-[#FBF6EC] text-[#1C1B18]'}`}
                onClick={() => setLang('it')}
              >
                IT
              </button>
              <button
                className={`px-3 py-2 ${lang === 'en' ? 'bg-[#E1543F] text-white' : 'bg-[#FBF6EC] text-[#1C1B18]'}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
            <button className="sticker-btn sticker-btn-secondary flex items-center gap-2" onClick={openProposal}>
              <FileText size={15} /> Anteprima proposta
            </button>
            <button className="sticker-btn flex items-center gap-2" onClick={proceedToQuote}>
              Procedi al preventivo <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveDialog(false)}>
            <div className="sticker-card max-w-sm w-full mb-0" onClick={(e) => e.stopPropagation()}>
              <h3 className="sticker-title">Salva come nuovo template</h3>
              <input
                type="text"
                autoFocus
                className="mb-3"
                placeholder="Nome template (es. Aperitivo standard)"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveAsNewTemplate() }}
              />
              <div className="flex gap-2 justify-end">
                <button className="sticker-btn sticker-btn-secondary" onClick={() => setShowSaveDialog(false)}>Annulla</button>
                <button className="sticker-btn" onClick={saveAsNewTemplate} disabled={templateSaving || !newTemplateName.trim()}>
                  {templateSaving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="sticker-card">
          <h2 className="sticker-title">Dati cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="sticker-label">Cliente / Azienda</label>
              <input
                type="text"
                placeholder="Cliente / Azienda"
                value={client.clientName}
                onChange={(e) => updateClient({ clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="sticker-label">Email cliente</label>
              <input
                type="email"
                placeholder="Email cliente"
                value={client.clientEmail}
                onChange={(e) => updateClient({ clientEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="sticker-label">N. persone</label>
              <input
                type="number"
                min={1}
                placeholder="N. persone"
                value={client.guestsCount}
                onChange={(e) => updateClient({ guestsCount: e.target.value })}
              />
            </div>
            <div>
              <label className="sticker-label">Data evento</label>
              <input
                type="date"
                value={client.eventDate}
                onChange={(e) => updateClient({ eventDate: e.target.value })}
              />
            </div>
            <div>
              <label className="sticker-label">Stato</label>
              <select
                value={client.status}
                onChange={(e) => updateClient({ status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="sticker-label">Note</label>
          <textarea
            className="min-h-20 resize-y"
            placeholder="Note e richieste specifiche (es. escludere un piatto, servizio a persona, foto hero da usare...)"
            value={client.notes}
            onChange={(e) => updateClient({ notes: e.target.value })}
          />
        </div>

        <SectionsEditor sections={sections} onChange={handleSectionsChange} catalog={catalog} rooms={rooms} />
      </div>
    </div>
  )
}

export default function PropostePage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <ProposteInner />
}
