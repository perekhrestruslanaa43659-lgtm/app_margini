import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { planPrice, dishesBySubcategory, itemSharedAmong, type MealSection } from '@/lib/proposalHtml'

// Stile "sticker & marker" (SKILLS-STILE.md) adattato a PDF: card a bordo netto,
// badge prezzo, accento colorato per sezione. E' il documento "menu allegato"
// che accompagna il preventivo formale (ProposalQuotePdfDocument), che invece
// non elenca piu' i piatti nel corpo del documento.
const INK = '#1C1B18'
const CORAL = '#E1543F'
const CORAL_TINT = '#FBE2DD'
const GREEN = '#6FA84B'
const GREEN_TINT = '#E2EEDA'
const YELLOW = '#F0B429'
const YELLOW_TINT = '#FCEACB'
const MUTED = '#6B6558'
const MINT = '#BFE0D2'

const ACCENT = { coral: CORAL, green: GREEN, yellow: YELLOW } as const
const ACCENT_TINT = { coral: CORAL_TINT, green: GREEN_TINT, yellow: YELLOW_TINT } as const

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Helvetica', backgroundColor: '#FBF6EC' },

  hero: { backgroundColor: MINT, paddingHorizontal: 40, paddingVertical: 22 },
  brandBadge: { backgroundColor: INK, color: '#FBF6EC', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  heroTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 4 },
  heroSub: { fontSize: 8.5, color: INK, opacity: 0.75 },

  body: { paddingHorizontal: 32, paddingTop: 18, paddingBottom: 20 },

  mealTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 2 },
  mealMeta: { fontSize: 8.5, color: MUTED, marginBottom: 10 },

  planCard: { borderWidth: 2.5, borderColor: INK, borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#FFFDF9' },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INK },
  priceBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: INK },
  priceBadgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
  planNote: { fontSize: 8, color: MUTED, marginBottom: 6 },

  groupLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase', marginTop: 5, marginBottom: 2 },
  subLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN, marginTop: 3, marginBottom: 1 },
  dishRow: { fontSize: 8.5, color: '#3a3a3a', marginTop: 1.5, lineHeight: 1.3 },
  dishName: { fontFamily: 'Helvetica-Bold', color: INK },

  extrasCard: { borderWidth: 1.5, borderColor: INK, borderStyle: 'dashed', borderRadius: 12, padding: 10, marginTop: 4, marginBottom: 14 },
  extrasTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK, textTransform: 'uppercase', marginBottom: 4 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8.5, color: '#3a3a3a', marginTop: 2 },

  footNote: { fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 12, lineHeight: 1.4 },
})

interface Props {
  clientName: string
  sections: MealSection[]
}

export function ProposalMenuPdfDocument({ clientName, sections }: Props) {
  return (
    <Document title={`Menu proposta – ${clientName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.brandBadge}>DOPPIO MALTO</Text>
          <Text style={styles.heroTitle}>Menu Evento — {clientName}</Text>
          <Text style={styles.heroSub}>Allegato al preventivo — dettaglio completo delle formule e dei piatti proposti.</Text>
        </View>

        <View style={styles.body}>
          {sections.map((section) => {
            const plans = section.plans.filter((p) => p.groups.some((g) => g.items.length > 0))
            if (plans.length === 0) return null
            const accent = ACCENT[section.accent]
            const accentTint = ACCENT_TINT[section.accent]

            return (
              <View key={section.id} wrap={false} style={{ marginBottom: 16 }}>
                <Text style={styles.mealTitle}>{section.label}{section.hours ? ` · ${section.hours}` : ''}</Text>
                {section.meta ? <Text style={styles.mealMeta}>{section.meta}</Text> : null}

                {plans.map((plan) => {
                  const price = planPrice(plan)
                  return (
                    <View key={plan.id} style={[styles.planCard, { borderColor: accent }]}>
                      <View style={styles.planHeaderRow}>
                        <Text style={styles.planName}>{plan.name || 'Fascia'}</Text>
                        <View style={[styles.priceBadge, { borderColor: accent, backgroundColor: accentTint }]}>
                          <Text style={styles.priceBadgeText}>{price > 0 ? `${price.toFixed(2).replace(/\.00$/, '')} €` : '—'}</Text>
                        </View>
                      </View>
                      {plan.note ? <Text style={styles.planNote}>{plan.note}</Text> : null}

                      {plan.groups.filter((g) => g.items.length > 0).map((g) => {
                        const isChoice = g.pricingMode === 'media' && g.items.length > 1
                        const subgroups = isChoice ? dishesBySubcategory(g) : null
                        const showSubcats = subgroups ? subgroups.size > 1 : false

                        return (
                          <View key={g.id}>
                            <Text style={styles.groupLabel}>{g.label}{isChoice ? ' (a scelta)' : ''}</Text>
                            {!showSubcats ? (
                              g.items.map((it) => {
                                const shared = itemSharedAmong(it, g)
                                return (
                                  <Text style={styles.dishRow} key={it.catalogId}>
                                    <Text style={styles.dishName}>{it.name}</Text>
                                    {shared && shared > 1 ? ` (ogni ${shared} persone)` : ''}
                                    {it.desc ? ` — ${it.desc}` : ''}
                                  </Text>
                                )
                              })
                            ) : (
                              Array.from(subgroups!.entries()).map(([subcat, dishes]) => (
                                <View key={subcat}>
                                  <Text style={styles.subLabel}>{subcat}</Text>
                                  {dishes.map((d) => {
                                    const shared = itemSharedAmong(d, g)
                                    return (
                                      <Text style={styles.dishRow} key={d.catalogId}>
                                        <Text style={styles.dishName}>{d.name}</Text>
                                        {shared && shared > 1 ? ` (ogni ${shared} persone)` : ''}
                                        {d.desc ? ` — ${d.desc}` : ''}
                                      </Text>
                                    )
                                  })}
                                </View>
                              ))
                            )}
                          </View>
                        )
                      })}
                    </View>
                  )
                })}

                {section.extras.length > 0 && (
                  <View style={styles.extrasCard}>
                    <Text style={styles.extrasTitle}>Servizi aggiuntivi</Text>
                    {section.extras.map((ex) => (
                      <View style={styles.extraRow} key={ex.catalogId}>
                        <Text>{ex.name}</Text>
                        <Text>{ex.price > 0 ? `${ex.price.toFixed(2).replace(/\.00$/, '')} €${ex.unit === 'a_persona' ? '/persona' : ''}` : 'su richiesta'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}

          <Text style={styles.footNote}>
            I piatti “da condividere” sono indicati con il numero di persone per porzione. Prezzi IVA inclusa.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
