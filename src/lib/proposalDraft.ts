import type { MealSection } from '@/lib/proposalHtml'

const HANDOFF_KEY = 'dm-proposal-draft'
const WORKING_KEY = 'dm-proposal-working'
const CLIENT_KEY = 'dm-proposal-client'

/** Dati cliente essenziali raccolti nel form in cima a /proposte (nome, email,
 *  persone, data, note, stato) — passati come punto di partenza al passo successivo
 *  (/proposte/preventivo), che aggiunge i campi avanzati (P.IVA, SDI, clausole, caparra). */
export interface ProposalClientDraft {
  clientName: string
  clientEmail: string
  guestsCount: string
  eventDate: string
  notes: string
  status: string
}

export const emptyClientDraft = (): ProposalClientDraft => ({
  clientName: '',
  clientEmail: '',
  guestsCount: '',
  eventDate: '',
  notes: '',
  status: 'Da inviare',
})

/** Passa la proposta dallo step 1 (configuratore) allo step 2 (dati cliente/preventivo). */
export function saveDraftProposal(sections: MealSection[]) {
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(sections))
}

export function loadDraftProposal(): MealSection[] | null {
  const raw = sessionStorage.getItem(HANDOFF_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MealSection[]
  } catch {
    return null
  }
}

export function clearDraftProposal() {
  sessionStorage.removeItem(HANDOFF_KEY)
}

/** Autosalvataggio continuo del configuratore, cosi' navigare via e tornare non perde il lavoro in corso. */
export function saveWorkingProposal(sections: MealSection[]) {
  sessionStorage.setItem(WORKING_KEY, JSON.stringify(sections))
}

export function loadWorkingProposal(): MealSection[] | null {
  const raw = sessionStorage.getItem(WORKING_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MealSection[]
  } catch {
    return null
  }
}

export function clearWorkingProposal() {
  sessionStorage.removeItem(WORKING_KEY)
}

export function saveClientDraft(client: ProposalClientDraft) {
  sessionStorage.setItem(CLIENT_KEY, JSON.stringify(client))
}

export function loadClientDraft(): ProposalClientDraft | null {
  const raw = sessionStorage.getItem(CLIENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProposalClientDraft
  } catch {
    return null
  }
}

export function clearClientDraft() {
  sessionStorage.removeItem(CLIENT_KEY)
}
