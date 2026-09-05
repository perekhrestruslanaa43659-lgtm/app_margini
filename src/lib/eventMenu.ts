import type { MealSection } from '@/lib/proposalHtml'
import type { Event } from '@/lib/supabase/types'

/** Legge il menu di un evento (events.menu_sections, JSONB nello stesso formato
 *  MealSection[] usato da proposal_templates.sections) pronto per i generatori PDF
 *  (ProposalMenuPdfDocument / ProposalQuotePdfDocument). Factorizza la lettura condivisa
 *  da /api/events/[id]/quote e /api/events/[id]/menu così le due route restano
 *  sincronizzate. */
export function loadEventMealSections(event: Event): MealSection[] {
  return (event.menu_sections ?? []) as MealSection[]
}
