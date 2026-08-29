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
  plans: PricePlan[]
  extras: ExtraService[]
  room: string
  duration: string
  extraHour: string
  formula: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

// Ordine di alternanza colore badge/tier-name per fascia (index del piano dentro la sezione),
// stesso ordine del riferimento: classico=verde, preferito=corallo, generoso=giallo.
const TIER_CLASSES = ['classico', 'preferito', 'generoso'] as const

function renderItemsList(items: PlanItem[], group: PlanGroup): string {
  return items.map((it) => {
    const shared = itemSharedAmong(it, group)
    return `
      <div class="item">
        <h4>${esc(it.name)}${shared && shared > 1 ? ` <span class="shared-note">(ogni ${shared} persone)</span>` : ''}</h4>
        ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
      </div>
    `
  }).join('')
}

function renderGroupBody(g: PlanGroup): string {
  const isChoice = g.pricingMode === 'media' && g.items.length > 1
  const subcategories = isChoice ? dishesBySubcategory(g) : null
  const hasMultipleSubcats = subcategories ? subcategories.size > 1 : false

  const itemsHtml = !isChoice
    ? renderItemsList(g.items, g)
    : hasMultipleSubcats
      ? Array.from(subcategories!.entries()).map(([subcat, dishes]) => `
          <div class="section-label" style="margin-top:14px">${esc(subcat.toUpperCase())}</div>
          ${renderItemsList(dishes, g)}
        `).join('')
      : renderItemsList(g.items, g)

  return `
    <div class="section-label">${esc((g.label || 'VOCI').toUpperCase())}${isChoice ? ' <span class="choice-note">(a scelta)</span>' : ''}</div>
    ${g.tag ? `<span class="tag">${esc(g.tag)}</span>` : ''}
    ${itemsHtml}
  `
}

function renderPlan(plan: PricePlan, index: number): string {
  const groupsHtml = plan.groups.filter((g) => g.items.length > 0).map(renderGroupBody).join('')
  const price = planPrice(plan)
  const priceLabel = price > 0 ? price.toFixed(2).replace(/\.00$/, '') : '—'
  const tierClass = TIER_CLASSES[index % TIER_CLASSES.length]

  return `
    <div class="card ${tierClass}">
      <div class="price-badge"><span class="num">${esc(priceLabel)}</span><span class="cur">EURO</span></div>
      <div class="tier-name">${esc(plan.name || 'Fascia')}</div>
      ${plan.note ? `<p class="question">${esc(plan.note)}</p>` : ''}
      ${groupsHtml}
    </div>
  `
}

function renderSection(section: MealSection): string {
  const visiblePlans = section.plans.filter((p) => p.groups.some((g) => g.items.length > 0))
  const plansHtml = visiblePlans.map((p, i) => renderPlan(p, i)).join('')
  const cardsClass = visiblePlans.length === 1 ? 'cards cards--single' : visiblePlans.length === 2 ? 'cards cards--double' : 'cards'

  const infoBadges = [
    section.duration ? `<span class="info-pill">🕐 Permanenza ${esc(section.duration)}</span>` : '',
    section.extraHour ? `<span class="info-pill">⏳ Extra ${esc(section.extraHour)}</span>` : '',
    section.room ? `<span class="info-pill">📍 ${esc(section.room)}</span>` : '',
    section.formula ? `<span class="info-pill">🍽️ ${esc(section.formula)}</span>` : '',
  ].filter(Boolean).join('')

  const extrasCard = section.extras.length > 0 ? `
    <div class="extras-card">
      <div class="extras-title">Servizi aggiuntivi</div>
      ${section.extras.map((ex) => `
        <div class="extras-row">
          <span>${esc(ex.name)}</span>
          <span>${ex.price > 0 ? `€${ex.price.toFixed(2).replace(/\.00$/, '')}${ex.unit === 'a_persona' ? '/persona' : ''}` : 'su richiesta'}</span>
        </div>
      `).join('')}
    </div>
  ` : ''

  return `
    <section class="meal-section">
      <div class="meal-head">
        ${section.hours ? `<span class="meal-tag">${esc(section.hours)}</span>` : ''}
      </div>
      <h2 class="meal-title">${esc(section.label.toUpperCase())}</h2>
      ${section.meta ? `<p class="meal-meta">${esc(section.meta)}</p>` : ''}
      ${infoBadges ? `<div class="info-strip">${infoBadges}</div>` : ''}
      <div class="${cardsClass}">${plansHtml}</div>
      ${extrasCard}
    </section>
  `
}

export function buildProposalHtml(sections: MealSection[]): string {
  const sectionsHtml = sections.map(renderSection).join('')

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Proposte Eventi Doppio Malto</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

  :root {
    --yellow: #F4D000;
    --ink: #1C1B18;
    --coral: #E1543F;
    --green: #4E9A4A;
    --blue: #58C6DE;
    --cream: #FFFDF9;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--yellow);
    font-family: 'Poppins', Arial, sans-serif;
    color: var(--ink);
  }

  /* HERO */
  .hero {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 24px 0;
    text-align: center;
  }
  .logo-pill {
    display: inline-block;
    background: var(--ink);
    color: var(--cream);
    font-family: 'Archivo Black', Arial, sans-serif;
    font-size: 13px;
    letter-spacing: 1px;
    padding: 8px 18px;
    border-radius: 22px;
  }
  .eyebrow {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 24px;
    margin: 10px 0 4px;
  }
  .headline {
    font-family: 'Archivo Black', Arial, sans-serif;
    font-size: 34px;
    line-height: 1.05;
    margin: 6px 0 4px;
  }
  .headline .amount { color: var(--coral); }
  .tagline {
    max-width: 480px;
    margin: 6px auto 24px;
    font-size: 14px;
    font-weight: 700;
  }

  /* MEAL SECTIONS */
  .wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px 40px;
  }
  .meal-section { margin-top: 40px; }
  .meal-section:first-child { margin-top: 8px; }

  .meal-head { display: flex; justify-content: center; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
  .meal-tag {
    font-family: 'Caveat', cursive; font-weight: 700; font-size: 17px;
    padding: 3px 14px; border-radius: 999px; border: 2px solid var(--ink); background: var(--cream);
  }
  .meal-title {
    font-family: 'Archivo Black', Arial, sans-serif; font-size: 22px; text-align: center; margin: 4px 0 0;
  }
  .meal-meta { color: #3a3934; font-size: 13px; text-align: center; max-width: 62ch; margin: 6px auto 0; line-height: 1.5; }

  .info-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 14px; }
  .info-pill { font-size: 12px; font-weight: 700; background: var(--cream); border: 2px solid var(--ink); border-radius: 999px; padding: 5px 14px; white-space: nowrap; }

  /* CARDS */
  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    align-items: start;
    margin-top: 36px;
  }
  /* Una sola fascia: centrata e piu' larga, non schiacciata in una colonna stretta */
  .cards--single {
    grid-template-columns: minmax(0, 480px);
    justify-content: center;
  }
  /* Due fasce: centrate, colonne piu' larghe di quelle a 3 */
  .cards--double {
    grid-template-columns: repeat(2, minmax(0, 400px));
    justify-content: center;
  }
  .card {
    background: var(--cream);
    border: 3px solid var(--ink);
    border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink);
    padding: 50px 22px 26px;
    position: relative;
  }
  .price-badge {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    border: 3px solid var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Archivo Black', Arial, sans-serif;
    position: absolute;
    top: -46px;
    left: 22px;
  }
  .price-badge .num { font-size: 26px; line-height: 1; }
  .price-badge .cur { font-size: 9px; letter-spacing: 1px; margin-top: 2px; }
  .card.classico .price-badge { background: var(--green); }
  .card.preferito .price-badge { background: var(--coral); }
  .card.generoso .price-badge { background: var(--blue); color: var(--ink); }

  .tier-name {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 28px;
    margin: 0 0 10px;
  }
  .card.classico .tier-name { color: var(--green); }
  .card.preferito .tier-name { color: var(--coral); }
  .card.generoso .tier-name { color: #2E8FA6; }

  .question {
    font-family: 'Caveat', cursive;
    font-weight: 700;
    color: var(--coral);
    font-size: 18px;
    margin: 0 0 12px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    color: #555;
    margin: 16px 0 6px;
  }
  .choice-note { font-family: 'Poppins', sans-serif; font-weight: 400; letter-spacing: 0; color: #8a8a80; }

  .tag {
    display: inline-block;
    font-family: 'Caveat', cursive;
    font-weight: 700;
    font-size: 15px;
    background: var(--blue);
    border: 1.5px solid var(--ink);
    border-radius: 14px;
    padding: 2px 12px;
    margin: 4px 0 10px;
  }
  .item { margin-bottom: 12px; }
  .item h4 { margin: 0 0 2px; font-size: 14px; font-weight: 700; }
  .item p { margin: 0; font-size: 12.5px; color: #4c4a44; line-height: 1.4; }
  .shared-note { font-family: 'Poppins', sans-serif; font-weight: 400; font-size: 11.5px; color: #8a8a80; }

  .extras-card {
    margin-top: 32px; background: var(--cream); border: 2px dashed var(--ink); border-radius: 18px; padding: 18px 22px;
  }
  .extras-title { font-family: 'Archivo Black', Arial, sans-serif; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; }
  .extras-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 5px 0; border-top: 1px dashed #E2DCCB; }
  .extras-row:first-of-type { border-top: none; }

  .foot-note { max-width: 700px; margin: 44px auto 0; padding: 0 24px; text-align: center; color: #3a3934; font-size: 11.5px; line-height: 1.6; }
  .foot-note strong { color: var(--ink); }

  footer {
    background: var(--ink);
    border-radius: 26px 26px 0 0;
    margin-top: 36px;
    padding: 26px 24px 30px;
    text-align: center;
  }
  footer .logo-pill { background: var(--cream); color: var(--ink); }
  footer .foot-text { color: #cfcabf; font-size: 12px; margin-top: 10px; }

  @media (max-width: 700px) {
    .cards { grid-template-columns: 1fr; }
  }
  @media print {
    .meal-section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

  <div class="hero">
    <span class="logo-pill">DOPPIO MALTO</span>
    <div class="eyebrow">Birrificio con cucina</div>
    <h1 class="headline">PROPOSTE <span class="amount">EVENTI</span> DI GRUPPO</h1>
    <p class="tagline">Formule su misura per la tua compagnia — bevanda, sfizi da condividere e la sala giusta per ogni occasione.</p>
  </div>

  <div class="wrap">
    ${sectionsHtml}
    <p class="foot-note"><strong>Nota:</strong> i piatti "da condividere" sono calcolati per persona salvo diversa indicazione. Prezzi IVA inclusa.</p>
  </div>

  <footer>
    <span class="logo-pill">DOPPIO MALTO</span>
    <div class="foot-text">Prezzi IVA inclusa · doppiomalto.com</div>
  </footer>

</body>
</html>`
}
