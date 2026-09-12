import { normalizeMealSections, type MealSection } from '@/lib/proposalHtml'
import type { Event } from '@/lib/supabase/types'

/** Legge il menu di un evento (events.menu_sections, JSONB nello stesso formato
 *  MealSection[] usato da proposal_templates.sections) pronto per i generatori PDF
 *  (ProposalMenuPdfDocument / ProposalQuotePdfDocument). Factorizza la lettura condivisa
 *  da /api/events/[id]/quote e /api/events/[id]/menu così le due route restano
 *  sincronizzate. Normalizza al volo il vecchio formato con piu' fasce per sezione (dati
 *  salvati prima della rimozione delle fasce multiple), senza serve una migrazione DB. */
export function loadEventMealSections(event: Event): MealSection[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- il JSONB puo' essere nel vecchio formato multi-fascia, normalizeMealSections lo riconosce
  return normalizeMealSections((event.menu_sections ?? []) as any[])
}
