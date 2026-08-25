export interface PlanItem {
  catalogId: string
  name: string
  desc: string
  price: number
  category: string
}

export type GroupPricingMode = 'fisso' | 'media'

export interface PlanGroup {
  id: string
  label: string
  tag: string
  pricingMode: GroupPricingMode
  items: PlanItem[]
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

/** Prezzo medio dei piatti di un gruppo 'a scelta' (o il prezzo dell'unico piatto se il gruppo e' 'fisso'). */
export function groupPrice(group: PlanGroup): number {
  if (group.items.length === 0) return 0
  const sum = group.items.reduce((acc, it) => acc + it.price, 0)
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

/** Raggruppa i piatti di un gruppo 'a scelta' per categoria di catalogo (es. Paste, Pizze, Burger). */
function dishesBySubcategory(group: PlanGroup): Map<string, PlanItem[]> {
  const map = new Map<string, PlanItem[]>()
  for (const it of group.items) {
    const key = it.category || group.label
    const list = map.get(key) ?? []
    list.push(it)
    map.set(key, list)
  }
  return map
}

function renderItemsList(items: PlanItem[]): string {
  return `
    <ul class="plan-items">
      ${items.map((it) => `
        <li>
          <p class="plan-item-name">${esc(it.name)}</p>
          ${it.desc ? `<p class="plan-item-desc">${esc(it.desc)}</p>` : ''}
        </li>
      `).join('')}
    </ul>
  `
}

function renderPlan(plan: PricePlan): string {
  const groupsHtml = plan.groups
    .filter((g) => g.items.length > 0)
    .map((g) => {
      const isChoice = g.pricingMode === 'media' && g.items.length > 1
      const subcategories = isChoice ? dishesBySubcategory(g) : null
      const hasMultipleSubcats = subcategories ? subcategories.size > 1 : false

      const itemsHtml = !isChoice
        ? renderItemsList(g.items)
        : hasMultipleSubcats
          ? Array.from(subcategories!.entries()).map(([subcat, dishes]) => `
              <p class="plan-subgroup-label">${esc(subcat)}</p>
              ${renderItemsList(dishes)}
            `).join('')
          : renderItemsList(g.items)

      return `
        <p class="plan-group-label">${esc(g.label || 'Voci')}${isChoice ? ' (a scelta)' : ''}</p>
        ${g.tag ? `<span class="plan-group-tag">${esc(g.tag)}</span>` : ''}
        ${itemsHtml}
      `
    }).join('')

  const price = planPrice(plan)

  return `
    <article class="plan-card">
      <div class="price-badge"><span class="num">${price > 0 ? price.toFixed(2).replace(/\.00$/, '') : '—'}</span><span class="cur">EURO</span></div>
      <p class="plan-name">${esc(plan.name || 'Fascia')}</p>
      ${plan.note ? `<p class="plan-note">${esc(plan.note)}</p>` : ''}
      <hr class="plan-divider">
      ${groupsHtml}
    </article>
  `
}

function renderSection(section: MealSection): string {
  const plansHtml = section.plans.map(renderPlan).join('')
  const infoCards = [
    (section.duration || section.extraHour) ? `
      <div class="info-card">
        <div class="icon">🕐</div>
        <h3>Sala e orari</h3>
        ${section.duration ? `<p>Permanenza standard: ${esc(section.duration)}</p>` : ''}
        ${section.extraHour ? `<p>Ore aggiuntive: ${esc(section.extraHour)}</p>` : ''}
      </div>` : '',
    section.formula ? `
      <div class="info-card">
        <div class="icon">🍽️</div>
        <h3>Formula</h3>
        <p>${esc(section.formula)}</p>
      </div>` : '',
    section.room ? `
      <div class="info-card">
        <div class="icon">📍</div>
        <h3>La sala</h3>
        <p>${esc(section.room)}</p>
      </div>` : '',
    section.extras.length > 0 ? `
      <div class="info-card">
        <div class="icon">✨</div>
        <h3>Servizi aggiuntivi</h3>
        ${section.extras.map((ex) => `<p>${esc(ex.name)} — ${ex.price.toFixed(2).replace(/\.00$/, '')}€${ex.unit === 'a_persona' ? '/persona' : ''}</p>`).join('')}
      </div>` : '',
  ].filter(Boolean).join('')

  return `
    <section class="meal-section accent-${section.accent}">
      <div class="meal-head">
        ${section.hours ? `<span class="meal-tag">${esc(section.hours)}</span>` : ''}
      </div>
      <h2 class="meal-title">${esc(section.label)}</h2>
      ${section.meta ? `<p class="meal-meta">${esc(section.meta)}</p>` : ''}
      <div class="plans-grid">${plansHtml}</div>
      ${infoCards ? `<div class="info-strip">${infoCards}</div>` : ''}
    </section>
  `
}

export function buildProposalHtml(sections: MealSection[]): string {
  const sectionsHtml = sections.map(renderSection).join('')

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Proposta Eventi Doppio Malto</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Kalam:wght@400;700&family=Poppins:wght@400;500;600;700;800&display=swap');

  :root {
    --mint: #BFE0D2; --mint-dark: #8FC4AF; --cream: #FBF6EC; --paper: #FFFDF9;
    --ink: #1C1B18; --coral: #E1543F; --coral-tint: #FBE2DD;
    --green: #6FA84B; --green-tint: #E2EEDA; --yellow: #F0B429; --yellow-tint: #FCEACB;
    --muted: #6B6558;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Poppins', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  img { max-width: 100%; display: block; }
  .hero { background: var(--mint); padding: 56px 24px 96px; text-align: center; position: relative; }
  .hero::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 48px; background: var(--cream); border-radius: 60% 60% 0 0 / 100% 100% 0 0; }
  .badge-brand { display: inline-block; background: var(--ink); color: var(--cream); font-family: 'Archivo Black', sans-serif; font-size: .9rem; letter-spacing: .08em; padding: 10px 22px; border-radius: 999px; margin-bottom: 20px; }
  .eyebrow { font-family: 'Kalam', cursive; font-weight: 700; font-size: 1.15rem; color: var(--coral); transform: rotate(-1.5deg); display: inline-block; margin: 0 0 6px; }
  h1.hero-title { font-family: 'Archivo Black', sans-serif; font-size: clamp(2rem,5vw,3.1rem); margin: 0 0 18px; text-wrap: balance; line-height: 1.15; }
  h1.hero-title .mark { background: var(--yellow); padding: 2px 14px; border-radius: 8px; transform: rotate(-1deg); display: inline-block; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .hero-sub { max-width: 560px; margin: 0 auto; font-size: 1.05rem; opacity: .85; line-height: 1.55; }
  main { max-width: 1080px; margin: 0 auto; padding: 8px 24px 80px; }
  .meal-section { margin-top: 76px; }
  .meal-section:first-child { margin-top: 24px; }
  .meal-head { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
  .meal-tag { font-family: 'Kalam', cursive; font-weight: 700; font-size: 1rem; padding: 6px 16px; border-radius: 999px; border: 2.5px solid var(--ink); transform: rotate(-2deg); white-space: nowrap; }
  .accent-coral .meal-tag { background: var(--coral-tint); color: var(--coral); }
  .accent-green .meal-tag { background: var(--green-tint); color: var(--green); }
  .accent-yellow .meal-tag { background: var(--yellow-tint); color: #8A5A00; }
  .meal-title { font-family: 'Archivo Black', sans-serif; font-size: clamp(1.5rem,3vw,2.1rem); margin: 0; }
  .meal-meta { color: var(--muted); font-size: .95rem; margin: 6px 0 32px; max-width: 62ch; line-height: 1.5; }
  .plans-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px 24px; margin-top: 48px; }
  @media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; } }
  .plan-card { position: relative; background: var(--paper); border: 3px solid var(--ink); border-radius: 20px; box-shadow: 8px 8px 0 var(--ink); padding: 44px 22px 28px; display: flex; flex-direction: column; gap: 14px; }
  .price-badge { position: absolute; top: -38px; left: 22px; width: 92px; height: 92px; border-radius: 50%; border: 3px solid var(--ink); box-shadow: 6px 6px 0 var(--ink); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Archivo Black', sans-serif; transform: rotate(-7deg); }
  .plan-card:nth-child(2) .price-badge { transform: rotate(5deg); }
  .plan-card:nth-child(3) .price-badge { transform: rotate(-4deg); }
  .price-badge .num { font-size: 1.7rem; line-height: 1; }
  .price-badge .cur { font-size: .6rem; letter-spacing: .06em; margin-top: 2px; }
  .accent-coral .plan-card:nth-child(1) .price-badge { background: var(--green-tint); }
  .accent-coral .plan-card:nth-child(2) .price-badge { background: var(--coral-tint); }
  .accent-coral .plan-card:nth-child(3) .price-badge { background: var(--yellow-tint); }
  .accent-green .plan-card:nth-child(1) .price-badge { background: var(--yellow-tint); }
  .accent-green .plan-card:nth-child(2) .price-badge { background: var(--green-tint); }
  .accent-green .plan-card:nth-child(3) .price-badge { background: var(--coral-tint); }
  .accent-yellow .plan-card:nth-child(1) .price-badge { background: var(--coral-tint); }
  .accent-yellow .plan-card:nth-child(2) .price-badge { background: var(--yellow-tint); }
  .accent-yellow .plan-card:nth-child(3) .price-badge { background: var(--green-tint); }
  .plan-name { font-family: 'Kalam', cursive; font-weight: 700; font-size: 1.5rem; margin: 10px 0 0; transform: rotate(-1deg); }
  .plan-note { font-size: .85rem; color: var(--muted); line-height: 1.4; margin: -6px 0 4px; }
  .plan-divider { border: none; border-top: 2px dashed #D8D2C4; margin: 4px 0; }
  .plan-group-label { font-weight: 700; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 6px 0 2px; }
  .plan-group-tag { display: inline-block; font-family: 'Kalam', cursive; font-weight: 700; font-size: .78rem; background: #EFEAE0; color: var(--muted); padding: 2px 10px; border-radius: 999px; margin: 2px 0 8px; transform: rotate(-1deg); }
  .plan-subgroup-label { font-weight: 700; font-size: .78rem; color: var(--green); margin: 8px 0 2px; }
  .plan-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .plan-item-name { font-weight: 600; font-size: .98rem; margin: 0; }
  .plan-item-desc { font-size: .85rem; color: var(--muted); line-height: 1.45; margin: 2px 0 0; }
  .info-strip { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-top: 36px; }
  @media (max-width: 780px) { .info-strip { grid-template-columns: 1fr; } }
  .info-card { background: var(--mint); border: 3px solid var(--ink); border-radius: 18px; box-shadow: 6px 6px 0 var(--ink); padding: 18px 20px; }
  .accent-coral .info-card { background: var(--coral-tint); }
  .accent-green .info-card { background: var(--green-tint); }
  .accent-yellow .info-card { background: var(--yellow-tint); }
  .info-card .icon { font-size: 1.3rem; margin-bottom: 8px; }
  .info-card h3 { font-weight: 700; font-size: .98rem; margin: 0 0 8px; }
  .info-card p { margin: 0 0 4px; font-size: .9rem; line-height: 1.5; }
  .foot-note { max-width: 900px; margin: 64px auto 0; padding: 0 24px; text-align: center; color: var(--muted); font-size: .85rem; line-height: 1.6; }
  .foot-note strong { color: var(--ink); }
  @media print {
    .hero::after { display: none; }
    .meal-section { page-break-inside: avoid; margin-top: 40px; }
  }
</style>
</head>
<body>
  <div class="hero">
    <span class="badge-brand">DOPPIO MALTO</span>
    <p class="eyebrow">Birrificio con cucina</p>
    <h1 class="hero-title">Proposte <span class="mark">Eventi</span> di Gruppo</h1>
    <p class="hero-sub">Formule su misura per la tua compagnia — bevanda, sfizi da condividere e la sala giusta per ogni occasione.</p>
  </div>
  <main>
    ${sectionsHtml}
    <p class="foot-note"><strong>Nota:</strong> i piatti "da condividere" sono calcolati per persona salvo diversa indicazione. Prezzi IVA inclusa.</p>
  </main>
</body>
</html>`
}
