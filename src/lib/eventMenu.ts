import type { MealSection, PricePlan, PlanGroup } from '@/lib/proposalHtml'
import type { Event, EventMenuCategory, EventMenuItem } from '@/lib/supabase/types'

/** Converte il menu "a categorie" di un evento (event_menu_categories/items, tab "Menu"
 *  della scheda evento) nel formato MealSection[] usato dai generatori PDF di Proposte
 *  (ProposalMenuPdfDocument / ProposalQuotePdfDocument). Un evento ha una sola fascia di
 *  prezzo (non Classico/Preferito/Generoso come nel configuratore Proposte): ogni
 *  categoria diventa un gruppo di piatti dentro quell'unica fascia, il cui prezzo è la
 *  somma dei price_per_guest delle categorie "a scelta" più la somma dei prezzi piatto
 *  delle categorie "tutti inclusi". Condivisa da /api/events/[id]/quote e
 *  /api/events/[id]/menu così le due route restano sincronizzate. */
export function menuToMealSections(
  event: Event,
  categories: EventMenuCategory[],
  itemsByCategory: Map<string, EventMenuItem[]>
): MealSection[] {
  if (categories.length === 0) return []

  const groups: PlanGroup[] = categories.map((cat) => {
    const items = itemsByCategory.get(cat.id) ?? []
    return {
      id: cat.id,
      label: cat.name || 'Voce menu',
      tag: '',
      pricingMode: cat.selection_type === 'a_scelta' ? 'media' : 'fisso',
      items: items.map((it) => ({
        catalogId: it.id,
        name: it.dish_name,
        desc: '',
        price: it.unit_price,
        category: cat.name || '',
      })),
    }
  })

  const fixedPrice = categories.reduce((sum, cat) => {
    if (cat.selection_type === 'a_scelta') return sum + (cat.price_per_guest ?? 0)
    const items = itemsByCategory.get(cat.id) ?? []
    return sum + items.reduce((s, it) => s + it.unit_price, 0)
  }, 0)

  const plan: PricePlan = {
    id: 'evento',
    name: '',
    price: String(fixedPrice),
    pricingMode: 'fisso',
    note: '',
    groups,
  }

  return [
    {
      id: 'evento',
      label: event.name || 'Evento',
      hours: '',
      meta: '',
      accent: 'green',
      plans: [plan],
      extras: [],
      room: '',
      duration: '',
      extraHour: '',
      formula: '',
    },
  ]
}

/** Legge event_menu_categories/items per un evento da Supabase e li converte subito in
 *  MealSection[]. Factorizza la sequenza di query ripetuta identica in entrambe le route
 *  che generano PDF dal menu dell'evento. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- il client admin di supabase-js non e' tipizzato sullo schema custom del progetto
export async function loadEventMealSections(supabase: any, event: Event): Promise<MealSection[]> {
  const { data: mc } = await supabase.from('event_menu_categories').select('*').eq('event_id', event.id).order('sort_order')
  const menuCategories = (mc ?? []) as unknown as EventMenuCategory[]

  let itemsByCategory = new Map<string, EventMenuItem[]>()
  if (menuCategories.length > 0) {
    const { data: mi } = await supabase
      .from('event_menu_items')
      .select('*')
      .in('category_id', menuCategories.map((c: EventMenuCategory) => c.id))
      .order('sort_order')
    const menuItems = (mi ?? []) as unknown as EventMenuItem[]
    itemsByCategory = new Map(menuCategories.map((c) => [c.id, menuItems.filter((i) => i.category_id === c.id)]))
  }

  return menuToMealSections(event, menuCategories, itemsByCategory)
}
