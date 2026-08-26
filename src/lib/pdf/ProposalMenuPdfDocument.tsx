import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { planPrice, dishesBySubcategory, itemSharedAmong, type MealSection } from '@/lib/proposalHtml'
import { menuStrings, type QuoteLang } from './i18n'

// Segue esattamente il template di riferimento (menu-eventi-di-gruppo.html): pill
// di testo nero come logo (nessuna immagine), badge prezzo a cerchio sovrapposto
// in alto a sinistra della card, tier verde/corallo/giallo per fascia. E' il
// documento "menu allegato" che accompagna il preventivo formale
// (ProposalQuotePdfDocument), che invece non elenca piu' i piatti nel corpo.
const INK = '#1C1B18'
const CORAL = '#E1543F'
const GREEN = '#6FA84B'
const YELLOW = '#F0B429'
const MINT = '#BFE0D2'
const PAPER = '#FFFDF9'
const MUTED = '#6b6b63'

const TIER_ACCENT = [GREEN, CORAL, YELLOW] as const
const TIER_ACCENT_TEXT = [GREEN, CORAL, '#C98A00'] as const

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Helvetica', backgroundColor: '#FBF6EC' },

  hero: { backgroundColor: MINT, alignItems: 'center', paddingHorizontal: 30, paddingTop: 28, paddingBottom: 34 },
  logoPill: { backgroundColor: INK, color: PAPER, fontFamily: 'Helvetica-Bold', fontSize: 11, letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  heroEyebrow: { fontFamily: 'Helvetica-BoldOblique', color: CORAL, fontSize: 13, marginTop: 12, marginBottom: 4 },
  heroTitle: { fontFamily: 'Helvetica-Bold', fontSize: 18, textAlign: 'center', marginTop: 2 },
  heroTagline: { fontSize: 9, textAlign: 'center', maxWidth: 360, marginTop: 8, lineHeight: 1.4 },

  body: { paddingHorizontal: 28, paddingTop: 18, paddingBottom: 20 },

  mealHead: { alignItems: 'center', marginBottom: 4 },
  mealTag: { fontFamily: 'Helvetica-BoldOblique', color: INK, fontSize: 9.5, borderWidth: 1.5, borderColor: INK, backgroundColor: PAPER, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  mealTitle: { fontFamily: 'Helvetica-Bold', fontSize: 15, textAlign: 'center' },
  mealMeta: { fontSize: 8, color: MUTED, marginTop: 3, textAlign: 'center', maxWidth: 420 },

  plansRow: { flexDirection: 'row', gap: 12, marginTop: 30, alignItems: 'flex-start', justifyContent: 'center' },
  planCol: { flex: 1, position: 'relative', paddingTop: 20 },
  planColSingle: { flex: 0, width: '70%', position: 'relative', paddingTop: 20 },
  planColDouble: { flex: 0, width: '46%', position: 'relative', paddingTop: 20 },
  priceBadge: {
    position: 'absolute', top: 0, left: 8, width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  priceBadgeNum: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#fff' },
  priceBadgeCur: { fontSize: 4.5, letterSpacing: 0.4, color: '#fff', marginTop: 1 },

  planCard: { width: '100%', borderWidth: 2, borderColor: INK, borderRadius: 12, padding: 10, paddingTop: 24, backgroundColor: PAPER },
  tierName: { fontFamily: 'Helvetica-BoldOblique', fontSize: 12, marginBottom: 4 },
  question: { fontFamily: 'Helvetica-BoldOblique', color: CORAL, fontSize: 7, marginBottom: 6 },

  sectionLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4, color: '#555', marginTop: 8, marginBottom: 3 },
  choiceNote: { fontFamily: 'Helvetica', fontWeight: 'normal', color: '#8a8a80' },
  tag: { fontFamily: 'Helvetica-BoldOblique', fontSize: 6.5, backgroundColor: MINT, borderWidth: 1, borderColor: INK, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', marginBottom: 6 },

  dishName: { fontSize: 7.2, fontFamily: 'Helvetica-Bold', color: INK },
  dishDesc: { fontSize: 6.3, color: '#4c4a44', marginTop: 1, lineHeight: 1.3 },
  dishBlock: { marginBottom: 5 },
  sharedNote: { fontFamily: 'Helvetica', fontWeight: 'normal', fontSize: 6, color: '#8a8a80' },

  extrasCard: { borderWidth: 1.5, borderColor: INK, borderStyle: 'dashed', borderRadius: 12, padding: 10, marginTop: 16 },
  extrasTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#3a3a3a', marginTop: 2 },

  footNote: { fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 20, lineHeight: 1.4 },
})

interface Props {
  clientName: string
  sections: MealSection[]
  lang?: QuoteLang
}

export function ProposalMenuPdfDocument({ sections, lang = 'it' }: Props) {
  const t = menuStrings[lang]
  return (
    <Document title="Menu proposta Doppio Malto">
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.logoPill}>DOPPIO MALTO</Text>
          <Text style={styles.heroEyebrow}>Birrificio con cucina</Text>
          <Text style={styles.heroTitle}>PROPOSTE EVENTI DI GRUPPO</Text>
          <Text style={styles.heroTagline}>{t.subtitle}</Text>
        </View>

        <View style={styles.body}>
          {sections.map((section) => {
            const plans = section.plans.filter((p) => p.groups.some((g) => g.items.length > 0))
            if (plans.length === 0) return null

            return (
              <View key={section.id} wrap={false} style={{ marginBottom: 22 }}>
                <View style={styles.mealHead}>
                  {section.hours ? <Text style={styles.mealTag}>{section.hours}</Text> : null}
                  <Text style={styles.mealTitle}>{section.label.toUpperCase()}</Text>
                  {section.meta ? <Text style={styles.mealMeta}>{section.meta}</Text> : null}
                </View>

                <View style={styles.plansRow}>
                  {plans.map((plan, i) => {
                    const price = planPrice(plan)
                    const badgeColor = TIER_ACCENT[i % TIER_ACCENT.length]
                    const nameColor = TIER_ACCENT_TEXT[i % TIER_ACCENT_TEXT.length]
                    const colStyle = plans.length === 1 ? styles.planColSingle : plans.length === 2 ? styles.planColDouble : styles.planCol
                    return (
                      <View key={plan.id} style={colStyle}>
                        <View style={[styles.priceBadge, { backgroundColor: badgeColor }]}>
                          <Text style={styles.priceBadgeNum}>{price > 0 ? price.toFixed(2).replace(/\.00$/, '') : '—'}</Text>
                          <Text style={styles.priceBadgeCur}>EURO</Text>
                        </View>
                        <View style={styles.planCard}>
                          <Text style={[styles.tierName, { color: nameColor }]}>{plan.name || 'Fascia'}</Text>
                          {plan.note ? <Text style={styles.question}>{plan.note}</Text> : null}

                          {plan.groups.filter((g) => g.items.length > 0).map((g) => {
                            const isChoice = g.pricingMode === 'media' && g.items.length > 1
                            const subgroups = isChoice ? dishesBySubcategory(g) : null
                            const showSubcats = subgroups ? subgroups.size > 1 : false

                            const renderDish = (it: (typeof g.items)[number]) => {
                              const shared = itemSharedAmong(it, g)
                              return (
                                <View style={styles.dishBlock} key={it.catalogId}>
                                  <Text style={styles.dishName}>
                                    {it.name}
                                    {shared && shared > 1 ? <Text style={styles.sharedNote}> {t.sharedEvery(shared)}</Text> : null}
                                  </Text>
                                  {it.desc ? <Text style={styles.dishDesc}>{it.desc}</Text> : null}
                                </View>
                              )
                            }

                            return (
                              <View key={g.id}>
                                <Text style={styles.sectionLabel}>
                                  {g.label.toUpperCase()}
                                  {isChoice ? <Text style={styles.choiceNote}>  {t.choice}</Text> : null}
                                </Text>
                                {g.tag ? <Text style={styles.tag}>{g.tag}</Text> : null}
                                {!showSubcats
                                  ? g.items.map(renderDish)
                                  : Array.from(subgroups!.entries()).map(([subcat, dishes]) => (
                                      <View key={subcat}>
                                        <Text style={[styles.sectionLabel, { marginTop: 6 }]}>{subcat.toUpperCase()}</Text>
                                        {dishes.map(renderDish)}
                                      </View>
                                    ))}
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    )
                  })}
                </View>

                {section.extras.length > 0 && (
                  <View style={styles.extrasCard}>
                    <Text style={styles.extrasTitle}>{t.additionalServices}</Text>
                    {section.extras.map((ex) => (
                      <View style={styles.extraRow} key={ex.catalogId}>
                        <Text>{ex.name}</Text>
                        <Text>{ex.price > 0 ? `€${ex.price.toFixed(2).replace(/\.00$/, '')}${ex.unit === 'a_persona' ? `/${t.perPerson}` : ''}` : t.onRequest}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}

          <Text style={styles.footNote}>{t.footnote}</Text>
        </View>
      </Page>
    </Document>
  )
}
