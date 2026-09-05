'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText, ArrowRight, BookmarkPlus, FolderOpen, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { CatalogItem, ProposalTemplate } from '@/lib/supabase/types'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { buildProposalHtml, type MealSection } from '@/lib/proposalHtml'
import { saveDraftProposal, saveWorkingProposal, loadWorkingProposal, clearWorkingProposal } from '@/lib/proposalDraft'
import { SectionsEditor, emptySection, nextAccent, MEAL_PRESETS } from '@/components/proposte/SectionsEditor'

function ProposteInner() {
  const router = useRouter()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<MealSection[]>(() => {
    if (typeof window === 'undefined') return [emptySection(MEAL_PRESETS[0], 'green')]
    return loadWorkingProposal() ?? [emptySection(MEAL_PRESETS[0], 'green')]
  })
  const [restoredNotice, setRestoredNotice] = useState(false)

  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: catalogData }, { data: templateData }] = await Promise.all([
        sb.from('catalog_items').select('*').order('category').order('name'),
        sb.from('proposal_templates').select('*').order('name'),
      ])
      setCatalog((catalogData ?? []) as CatalogItem[])
      setTemplates((templateData ?? []) as ProposalTemplate[])
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

  function handleSectionsChange(updater: (prev: MealSection[]) => MealSection[]) {
    setSections(updater)
  }

  function startNewProposal() {
    clearWorkingProposal()
    setSections([emptySection(MEAL_PRESETS[0], 'green')])
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
    setSections(template.sections as MealSection[])
    setActiveTemplateId(template.id)
    setShowTemplateMenu(false)
  }

  async function deleteTemplate(id: string) {
    await sb.from('proposal_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    if (activeTemplateId === id) setActiveTemplateId(null)
  }

  function openProposal() {
    const html = buildProposalHtml(sections)
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
    <div className="max-w-6xl mx-auto pb-16">
      {restoredNotice && (
        <div className="card mb-4 flex items-center justify-between gap-3 bg-amber-50/60 border-amber-100">
          <p className="text-xs text-amber-800">Ripristinata l&apos;ultima proposta su cui stavi lavorando.</p>
          <button className="text-xs text-amber-800 underline shrink-0" onClick={() => setRestoredNotice(false)}>
            Ok, capito
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="text-amber-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dm-ink">Proposte Eventi</h1>
            <p className="text-sm text-slate-500">Componi la proposta scegliendo i piatti dal catalogo</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary flex items-center gap-2" onClick={addSection}>
            <Plus size={15} /> Aggiungi momento
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={startNewProposal}>
            <FileText size={15} /> Nuova proposta
          </button>

          <div className="relative">
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowTemplateMenu((v) => !v)}>
              <FolderOpen size={15} /> Template
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-slate-100 z-30 py-1">
                {templates.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">Nessun template salvato</p>
                ) : (
                  templates.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-dm-cream text-sm">
                      <button className="flex-1 text-left truncate text-dm-ink/90" onClick={() => loadTemplate(t)}>
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
            <button className="btn-secondary flex items-center gap-2" onClick={updateActiveTemplate} disabled={templateSaving}>
              <Save size={15} /> Aggiorna template
            </button>
          ) : null}

          <button className="btn-secondary flex items-center gap-2" onClick={() => { setShowSaveDialog(true); setNewTemplateName('') }}>
            <BookmarkPlus size={15} /> Salva come template
          </button>

          <button className="btn-secondary flex items-center gap-2" onClick={openProposal}>
            <FileText size={15} /> Anteprima proposta
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={proceedToQuote}>
            Procedi al preventivo <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-dm-ink mb-3">Salva come nuovo template</h3>
            <input
              autoFocus
              className="input mb-3"
              placeholder="Nome template (es. Aperitivo standard)"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveAsNewTemplate() }}
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowSaveDialog(false)}>Annulla</button>
              <button className="btn-primary" onClick={saveAsNewTemplate} disabled={templateSaving || !newTemplateName.trim()}>
                {templateSaving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionsEditor sections={sections} onChange={handleSectionsChange} catalog={catalog} />
    </div>
  )
}

export default function PropostePage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <ProposteInner />
}
