export interface PlanItem {
  catalogId: string
  name: string
  desc: string
  price: number
  category: string
  /** Etichetta di sotto-gruppo scelta manualmente (es. "Pizze"). Se assente, si usa 'category' come fallback per il raggruppamento visivo. */
  subgroup?: string
  /** Se impostato, il piatto e' condiviso ogni N persone: il contributo al prezzo a testa e' price / sharedAmong invece del prezzo pieno. Sovrascrive il default del gruppo. */
  sharedAmong?: number
  /** Se true, questa riga rappresenta un'intera categoria di catalogo (es. "Bibite")
   *  invece di un singolo articolo — usata per "1 consumazione a scelta tra bibita,
   *  vino, birra media, drink" senza dover elencare ogni articolo. `catalogId` in
   *  questo caso e' sintetico ("cat:<nome categoria>"), `price` e' il massimo tra i
   *  prezzi degli articoli della categoria al momento dell'aggiunta (worst-case, stessa
   *  policy dei gruppi 'a scelta' tra piatti singoli). */
  isCategoryPick?: boolean
}

export type GroupPricingMode = 'fisso' | 'media'

export interface PlanGroup {
  id: string
  label: string
  tag: string
  pricingMode: GroupPricingMode
  /** Default "ogni N persone" per tutti i piatti del gruppo; un piatto puo' sovrascriverlo col proprio sharedAmong. */
  defaultSharedAmong?: number
  items: PlanItem[]
}

/** Numero di persone che condividono un piatto: quello specifico sul piatto, altrimenti il default del gruppo. */
export function itemSharedAmong(item: PlanItem, group: PlanGroup): number | undefined {
  return item.sharedAmong ?? group.defaultSharedAmong
}

export interface PricePlan {
  id: string
  name: string
  /** Prezzo manuale, usato solo quando pricingMode del piano e' 'fisso'. */
  price: string
  /** 'fisso': prezzo a testa deciso a mano. 'calcolato': somma delle medie dei gruppi. */
  pricingMode: 'fisso' | 'calcolato'
  note: string
  groups: PlanGroup[]
}

/** Prezzo effettivo di un piatto: diviso per il numero di persone che lo condividono (piatto o default del gruppo). */
export function itemEffectivePrice(item: PlanItem, group?: PlanGroup): number {
  const shared = group ? itemSharedAmong(item, group) : item.sharedAmong
  return shared && shared > 1 ? item.price / shared : item.price
}

/** Prezzo medio dei piatti di un gruppo 'a scelta' (o il prezzo dell'unico piatto se il gruppo e' 'fisso'). */
export function groupPrice(group: PlanGroup): number {
  if (group.items.length === 0) return 0
  const sum = group.items.reduce((acc, it) => acc + itemEffectivePrice(it, group), 0)
  return group.pricingMode === 'media' ? sum / group.items.length : sum
}

/** Prezzo a persona per un piano: manuale se 'fisso', altrimenti somma dei prezzi/medie di ogni gruppo. */
export function planPrice(plan: PricePlan): number {
  if (plan.pricingMode === 'fisso') {
    return parseFloat(plan.price.replace(',', '.')) || 0
  }
  return plan.groups.reduce((acc, g) => acc + groupPrice(g), 0)
}

/** Mappa nome piatto (case-insensitive) -> food cost, costruita dal chiamante joinando
 *  recipe_items/ingredients (vedi src/app/(app)/events/[id]/page.tsx). proposalHtml.ts
 *  resta puro/senza dipendenze da Supabase: il costo entra sempre da fuori. */
export type FoodCostByDish = Map<string, number>

/** Mappa nome categoria catalogo (case-insensitive) -> food cost MASSIMO tra gli
 *  articoli di quella categoria, costruita dal chiamante. Usata per le righe
 *  "categoria intera" (isCategoryPick), dove non esiste un piatto puntuale da cercare
 *  in FoodCostByDish. */
export type FoodCostByCategory = Map<string, number>

function dishFoodCost(name: string, costs: FoodCostByDish): number {
  return costs.get(name.trim().toLowerCase()) ?? 0
}

/** Costo di un piatto per il calcolo margine: stessa logica di sharing del prezzo
 *  (itemEffectivePrice) applicata al food cost invece che al prezzo di vendita.
 *  Per una riga "categoria intera" (isCategoryPick), il costo viene cercato in
 *  costsByCategory usando item.category invece che il nome del piatto. */
export function itemEffectiveCost(
  item: PlanItem,
  group: PlanGroup | undefined,
  costs: FoodCostByDish,
  costsByCategory?: FoodCostByCategory
): number {
  const cost = item.isCategoryPick
    ? costsByCategory?.get(item.category.trim().toLowerCase()) ?? 0
    : dishFoodCost(item.name, costs)
  const shared = group ? itemSharedAmong(item, group) : item.sharedAmong
  return shared && shared > 1 ? cost / shared : cost
}

/** Costo per persona di un gruppo. Politica: un gruppo 'a scelta' (pricingMode 'media')
 *  usa il MASSIMO food cost tra i piatti — worst case, coerente col vecchio calcolo
 *  margini del tab Menu evento (l'ospite potrebbe scegliere il piatto piu' caro); un
 *  gruppo 'fisso' (tutti i piatti inclusi) somma i costi di tutti i piatti. */
export function groupCost(group: PlanGroup, costs: FoodCostByDish, costsByCategory?: FoodCostByCategory): number {
  if (group.items.length === 0) return 0
  const itemCosts = group.items.map((it) => itemEffectiveCost(it, group, costs, costsByCategory))
  return group.pricingMode === 'media' ? Math.max(...itemCosts) : itemCosts.reduce((a, b) => a + b, 0)
}

/** Costo per persona di un piano: somma dei costi di ogni gruppo. Un piano a prezzo
 *  'fisso' (deciso a mano) ha comunque un costo calcolato dai piatti selezionati — il
 *  margine confronta quel prezzo manuale col costo reale dei gruppi, non lo ignora. */
export function planCost(plan: PricePlan, costs: FoodCostByDish, costsByCategory?: FoodCostByCategory): number {
  return plan.groups.reduce((acc, g) => acc + groupCost(g, costs, costsByCategory), 0)
}

/** Margine per persona di un piano: prezzo di vendita meno food cost. */
export function planMargin(plan: PricePlan, costs: FoodCostByDish, costsByCategory?: FoodCostByCategory): number {
  return planPrice(plan) - planCost(plan, costs, costsByCategory)
}

/** Percentuale di margine di un piano rispetto al prezzo di vendita (0 se il prezzo è 0). */
export function planMarginPct(plan: PricePlan, costs: FoodCostByDish, costsByCategory?: FoodCostByCategory): number {
  const price = planPrice(plan)
  return price > 0 ? (planMargin(plan, costs, costsByCategory) / price) * 100 : 0
}

export interface ExtraService {
  catalogId: string
  name: string
  price: number
  /** 'fisso': prezzo unico per l'evento. 'a_persona': moltiplicato per il numero di ospiti nel preventivo. */
  unit: 'fisso' | 'a_persona'
}

export interface MealSection {
  id: string
  label: string
  hours: string
  meta: string
  accent: 'coral' | 'green' | 'yellow'
  /** Ogni sezione ha un solo piano prezzo (niente piu' fasce Classico/Preferito/Generoso
   *  affiancate): il layout del template di riferimento (menu_skill_build) ha un prezzo
   *  in testa e una card per gruppo di piatti, non piu' card-fascia affiancate. */
  plan: PricePlan
  extras: ExtraService[]
  room: string
  duration: string
  extraHour: string
  formula: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Una sezione salvata prima della rimozione delle fasce multiple aveva `plans: PricePlan[]`
 *  invece di `plan: PricePlan`. Riconosciuta dall'assenza di `plan` + presenza di `plans`. */
interface LegacyMealSection extends Omit<MealSection, 'plan'> {
  plans: PricePlan[]
}

function isLegacySection(s: MealSection | LegacyMealSection): s is LegacyMealSection {
  return !('plan' in s) && Array.isArray((s as LegacyMealSection).plans)
}

/** Normalizza sezioni lette da JSONB (events.menu_sections, proposal_templates.sections,
 *  bozze in sessionStorage) che possono ancora avere il vecchio formato multi-fascia:
 *  sceglie la prima fascia con piatti (stesso criterio del vecchio mainPlan), o la prima
 *  in assoluto se nessuna ne ha. Le sezioni gia' nel formato corrente passano invariate. */
export function normalizeMealSections(raw: (MealSection | LegacyMealSection)[]): MealSection[] {
  return raw.map((s) => {
    if (!isLegacySection(s)) return s
    const { plans, ...rest } = s
    const plan = plans.find((p) => p.groups.some((g) => g.items.length > 0)) ?? plans[0]
    return { ...rest, plan }
  })
}

/** Prezzo massimo tra gli articoli di una categoria di catalogo (worst-case, stessa
 *  policy dei gruppi 'a scelta'): usato per proporre/congelare il prezzo di vendita
 *  quando si aggiunge un'intera categoria come riga "a scelta" invece di un piatto
 *  puntuale (es. "Bibita" invece di elencare Coca/Fanta/Sprite una per una). */
export function categoryMaxPrice(items: { category: string | null; unit_price: number }[], category: string): number {
  const prices = items.filter((it) => it.category === category).map((it) => it.unit_price)
  return prices.length > 0 ? Math.max(...prices) : 0
}

/** Raggruppa i piatti di un gruppo 'a scelta' per sotto-gruppo (scelto manualmente, o dedotto dalla categoria catalogo). */
export function dishesBySubcategory(group: PlanGroup): Map<string, PlanItem[]> {
  const map = new Map<string, PlanItem[]>()
  for (const it of group.items) {
    const key = it.subgroup || it.category || group.label
    const list = map.get(key) ?? []
    list.push(it)
    map.set(key, list)
  }
  return map
}

function renderItemsList(items: PlanItem[], group: PlanGroup): string {
  return items.map((it) => {
    const shared = itemSharedAmong(it, group)
    return `<p>${esc(it.name)}${shared && shared > 1 ? ` <em>(ogni ${shared} persone)</em>` : ''}${it.desc ? ` — ${esc(it.desc)}` : ''}</p>`
  }).join('')
}

/** Una card bianca per gruppo di piatti (tagliere, primi, bevande, ecc.), stile
 *  menu_skill_build/template.html: titolo corallo maiuscolo, tag opzionale, divider
 *  tratteggiato, corpo testo. Sostituisce le vecchie card-fascia affiancate. */
function renderGroupCard(g: PlanGroup): string {
  const isChoice = g.pricingMode === 'media' && g.items.length > 1
  const subcategories = isChoice ? dishesBySubcategory(g) : null
  const hasMultipleSubcats = subcategories ? subcategories.size > 1 : false

  const bodyHtml = !isChoice
    ? renderItemsList(g.items, g)
    : hasMultipleSubcats
      ? Array.from(subcategories!.entries()).map(([subcat, dishes]) => `
          <p><strong>${esc(subcat.toUpperCase())}</strong></p>
          ${renderItemsList(dishes, g)}
        `).join('')
      : renderItemsList(g.items, g)

  return `
    <div class="card white">
      <div class="card-title-row">
        <div class="card-title">${esc(g.label || 'Voci')}</div>
        ${g.tag ? `<div class="tag">${esc(g.tag)}</div>` : ''}
      </div>
      ${isChoice ? `<div class="card-subtitle">a scelta</div>` : ''}
      <hr class="divider">
      <div class="card-body">${bodyHtml}</div>
    </div>
  `
}

function renderSection(section: MealSection): string {
  const plan = section.plan
  const groupsHtml = plan.groups.filter((g) => g.items.length > 0).map(renderGroupCard).join('')
  const price = planPrice(plan)
  const priceLabel = price > 0 ? `€${price.toFixed(2).replace(/\.00$/, '')}` : '—'

  const infoBadges = [
    section.duration ? `<span class="info-pill">🕐 Permanenza ${esc(section.duration)}</span>` : '',
    section.extraHour ? `<span class="info-pill">⏳ Extra ${esc(section.extraHour)}</span>` : '',
    section.room ? `<span class="info-pill">📍 ${esc(section.room)}</span>` : '',
    section.formula ? `<span class="info-pill">🍽️ ${esc(section.formula)}</span>` : '',
  ].filter(Boolean).join('')

  const extrasCard = section.extras.length > 0 ? `
    <div class="card white">
      <div class="card-title-row"><div class="card-title">Servizi aggiuntivi</div></div>
      <hr class="divider">
      <div class="card-body">
        ${section.extras.map((ex) => `
          <p>${esc(ex.name)} — ${ex.price > 0 ? `€${ex.price.toFixed(2).replace(/\.00$/, '')}${ex.unit === 'a_persona' ? '/persona' : ''}` : 'su richiesta'}</p>
        `).join('')}
      </div>
    </div>
  ` : ''

  return `
    <section class="meal-section">
      <div class="meal-head">
        ${section.hours ? `<span class="meal-tag">${esc(section.hours)}</span>` : ''}
      </div>
      <h2 class="meal-title">${esc(section.label.toUpperCase())} <span class="price">${esc(priceLabel)}</span></h2>
      ${section.meta ? `<p class="meal-meta">${esc(section.meta)}</p>` : ''}
      ${plan.note ? `<p class="meal-meta"><em>${esc(plan.note)}</em></p>` : ''}
      ${infoBadges ? `<div class="info-strip">${infoBadges}</div>` : ''}
      <div class="stack">${groupsHtml}${extrasCard}</div>
    </section>
  `
}

export function buildProposalHtml(sections: MealSection[], heroPhotoUrl?: string): string {
  const sectionsHtml = sections.map(renderSection).join('')

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Proposte Eventi Doppio Malto</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

  :root {
    --yellow: #F4D000;
    --coral: #E1543F;
    --teal: #3AC6DE;
    --ink: #1C1B18;
    --cream: #FFFDF9;
    --green: #4C8C5B;
    --white: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--yellow);
    font-family: 'Poppins', Arial, sans-serif;
    color: var(--ink);
  }

  /* HERO */
  .hero {
    max-width: 900px;
    margin: 0 auto;
    padding: 56px 24px 0;
    text-align: center;
  }
  .hero .logo { height: 64px; margin-bottom: 10px; }
  .hero .tagline {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 22px;
    margin-bottom: 14px;
  }
  .headline {
    font-weight: 800;
    font-size: 34px;
    letter-spacing: 0.5px;
    line-height: 1.15;
  }
  .headline .amount { color: var(--coral); }
  .subtitle {
    max-width: 480px;
    margin: 8px auto 0;
    font-size: 14px;
    font-weight: 600;
    color: #3a3934;
    line-height: 1.5;
  }
  .badge-pill {
    display: inline-block;
    margin-top: 18px;
    background: var(--ink);
    color: var(--white);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 10px 24px;
    border-radius: 30px;
  }

  /* MEAL SECTIONS */
  .wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px 40px;
  }
  .meal-section { margin-top: 40px; }
  .meal-section:first-child { margin-top: 28px; }

  .meal-head { display: flex; justify-content: center; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
  .meal-tag {
    font-family: 'Caveat', cursive; font-weight: 700; font-size: 17px;
    padding: 3px 14px; border-radius: 999px; border: 2px solid var(--ink); background: var(--cream);
  }
  .meal-title {
    font-weight: 800; font-size: 22px; text-align: center; margin: 4px 0 0; text-transform: uppercase;
  }
  .meal-title .price { color: var(--coral); margin-left: 8px; }
  .meal-meta { color: #3a3934; font-size: 13px; text-align: center; max-width: 62ch; margin: 6px auto 0; line-height: 1.5; }

  .info-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 14px; }
  .info-pill { font-size: 12px; font-weight: 700; background: var(--cream); border: 2px solid var(--ink); border-radius: 999px; padding: 5px 14px; white-space: nowrap; }

  /* HERO PHOTO */
  .photo-wrap {
    max-width: 900px;
    margin: 32px auto 0;
    padding: 0 24px;
  }
  .photo-wrap .frame {
    border-radius: 22px;
    overflow: hidden;
    border: 5px solid var(--ink);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.35);
  }
  .photo-wrap img { width: 100%; display: block; }

  /* CARD STACK */
  .stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 22px;
  }
  .card {
    border-radius: 20px;
    border: 4px solid var(--ink);
    box-shadow: 6px 6px 0 rgba(0,0,0,0.3);
    padding: 20px 26px;
  }
  .card.white { background: var(--cream); }
  .card-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .card-title { font-weight: 800; font-size: 17px; color: var(--coral); text-transform: uppercase; }
  .card-subtitle { font-style: italic; font-weight: 500; font-size: 13px; color: #8a8a80; margin-top: 2px; }
  .divider { border: none; border-top: 2px dashed var(--ink); opacity: 0.3; margin: 12px 0 12px; }
  .card-body p { font-size: 13.5px; line-height: 1.55; color: #3a3934; margin-bottom: 4px; }
  .card-body p:last-child { margin-bottom: 0; }
  .card-body em { color: #8a8a80; font-style: normal; font-size: 12px; }
  .card-body strong { font-size: 11px; letter-spacing: 0.5px; color: #555; }

  .tag {
    font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
    color: var(--white); background: var(--teal); padding: 4px 12px; border-radius: 20px;
  }

  .foot-note { max-width: 700px; margin: 44px auto 0; padding: 0 24px; text-align: center; color: #3a3934; font-size: 11.5px; line-height: 1.6; }
  .foot-note strong { color: var(--ink); }

  footer {
    background: var(--ink);
    border-radius: 26px 26px 0 0;
    margin-top: 36px;
    padding: 30px 24px 34px;
    text-align: center;
  }
  footer .logo { height: 28px; margin-bottom: 12px; filter: brightness(0) invert(1); }
  footer .foot-text { color: #cfcabf; font-size: 12px; }

  @media print {
    .meal-section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

  <div class="hero">
    <img class="logo" src="/brand/doppio-malto-logo.jpg" alt="Doppio Malto">
    <div class="tagline">Birrificio con cucina</div>
    <h1 class="headline">PROPOSTE <span class="amount">EVENTI</span> DI GRUPPO</h1>
    <p class="subtitle">Formule su misura per la tua compagnia — bevanda, sfizi da condividere e la sala giusta per ogni occasione.</p>
    <span class="badge-pill">Proposta commerciale</span>
  </div>

  ${heroPhotoUrl ? `
  <div class="photo-wrap">
    <div class="frame"><img src="${esc(heroPhotoUrl)}" alt=""></div>
  </div>
  ` : ''}

  <div class="wrap">
    ${sectionsHtml}
    <p class="foot-note"><strong>Nota:</strong> i piatti "da condividere" sono calcolati per persona salvo diversa indicazione. Prezzi IVA inclusa.</p>
  </div>

  <footer>
    <img class="logo" src="/brand/doppio-malto-logo.jpg" alt="Doppio Malto">
    <div class="foot-text">Prezzi IVA inclusa · doppiomalto.com</div>
  </footer>

</body>
</html>`
}
