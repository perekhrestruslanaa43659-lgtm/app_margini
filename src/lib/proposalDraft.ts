import type { MealSection } from '@/lib/proposalHtml'

const KEY = 'dm-proposal-draft'

export function saveDraftProposal(sections: MealSection[]) {
  sessionStorage.setItem(KEY, JSON.stringify(sections))
}

export function loadDraftProposal(): MealSection[] | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MealSection[]
  } catch {
    return null
  }
}

export function clearDraftProposal() {
  sessionStorage.removeItem(KEY)
}
