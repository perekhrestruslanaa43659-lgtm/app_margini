import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { planPrice, dishesBySubcategory, itemSharedAmong, type MealSection } from '@/lib/proposalHtml'
import { menuStrings, type QuoteLang } from './i18n'

// Segue il template di riferimento dello studio (SKILLS-STILE.md, stile "sticker &
// marker"): sfondo giallo pieno, logo vero in header, badge prezzo a cerchio corallo
// sovrapposto in alto a sinistra della card, ombra piena netta stile sticker, Archivo
// Black per i titoli display, Caveat per gli accenti "scritti a mano", Poppins per il
// corpo testo. Un solo piano prezzo per sezione (niente piu' fasce Classico/Preferito/
// Generoso affiancate). E' il documento "menu allegato" che accompagna il preventivo
// formale (ProposalQuotePdfDocument), che invece non elenca piu' i piatti nel corpo.
Font.register({
  family: 'Archivo Black',
  src: 'https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf',
})
Font.register({
  family: 'Caveat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjSx6SII.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjRV6SII.ttf', fontWeight: 700 },
  ],
})
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrFJA.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6V1s.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7V1s.ttf', fontWeight: 700 },
  ],
})

const INK = '#1C1B18'
const CORAL = '#E1543F'
const BLUE = '#58C6DE'
const YELLOW = '#F4D000'
const CREAM = '#FFFDF9'
const MUTED = '#3a3934'

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Poppins', backgroundColor: YELLOW },

  hero: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 28, paddingBottom: 6 },
  logoPill: { backgroundColor: INK, color: CREAM, fontFamily: 'Archivo Black', fontSize: 10, letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },
  logoImage: { height: 40, objectFit: 'contain' },
  heroEyebrow: { fontFamily: 'Caveat', fontWeight: 700, color: INK, fontSize: 15, marginTop: 10, marginBottom: 2 },
  heroTitle: { fontFamily: 'Archivo Black', fontSize: 19, textAlign: 'center', marginTop: 2 },
  heroTitleAmount: { color: CORAL },
  heroTagline: { fontFamily: 'Poppins', fontWeight: 700, fontSize: 9, textAlign: 'center', maxWidth: 320, marginTop: 6, lineHeight: 1.4 },

  // Niente ombra offset qui (a differenza di card/badge sotto): la View sfalsata dietro
  // un Image causa un bug di stacking in @react-pdf/renderer 4.x che copre la foto con
  // un rettangolo nero pieno. La sola cornice nera spessa da' comunque un effetto
  // "sticker" sufficiente.
  photoWrap: { marginTop: 16, marginHorizontal: 30, marginBottom: 12 },
  photo: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 20, borderWidth: 2.5, borderColor: INK },

  body: { paddingHorizontal: 28, paddingTop: 14, paddingBottom: 20 },

  mealHead: { alignItems: 'center', marginBottom: 4 },
  mealTag: { fontFamily: 'Caveat', fontWeight: 700, color: INK, fontSize: 10.5, borderWidth: 1.5, borderColor: INK, backgroundColor: CREAM, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  mealTitle: { fontFamily: 'Archivo Black', fontSize: 14, textAlign: 'center' },
  mealMeta: { fontFamily: 'Poppins', fontSize: 8, color: MUTED, marginTop: 3, textAlign: 'center', maxWidth: 420 },

  planRow: { marginTop: 40, alignItems: 'center' },
  planCol: { position: 'relative', width: '70%', paddingTop: 32 },
  // Niente ombra offset qui: stesso bug di stacking react-pdf 4.x visto sulla card
  // principale sotto — un secondo View assoluto sfalsato dietro il badge lo copre di
  // nero pieno invece di restare dietro. Bordo piu' spesso senza ombra basta. Il badge
  // e' renderizzato prima della card nel DOM, quindi deve sporgere abbastanza in alto
  // da non finire coperto dal bordo superiore della card sottostante.
  priceBadge: {
    position: 'absolute', top: -22, left: 8, width: 58, height: 58, borderRadius: 29, backgroundColor: CORAL,
    borderWidth: 3, borderColor: INK, alignItems: 'center', justifyContent: 'center',
  },
  priceBadgeNum: { fontFamily: 'Archivo Black', fontSize: 14, color: '#fff' },
  priceBadgeCur: { fontFamily: 'Poppins', fontSize: 5.5, letterSpacing: 0.4, color: '#fff', marginTop: 1 },

  // Niente ombra offset qui: una View assoluta sfalsata dietro una card con molti figli
  // annidati (testo + liste di piatti) causa lo stesso bug di stacking di react-pdf 4.x
  // gia' visto sulla foto hero — copre tutta la card di nero pieno. Bordo piu' spesso
  // senza ombra da' comunque un effetto "sticker" sufficiente ed e' affidabile.
  planCard: { width: '100%', borderWidth: 3, borderColor: INK, borderRadius: 12, padding: 12, paddingTop: 30, backgroundColor: CREAM },
  question: { fontFamily: 'Caveat', fontWeight: 700, color: CORAL, fontSize: 9.5, marginBottom: 7 },

  sectionLabel: { fontSize: 8, fontFamily: 'Poppins', fontWeight: 700, letterSpacing: 0.4, color: '#555', marginTop: 9, marginBottom: 4 },
  choiceNote: { fontFamily: 'Poppins', fontWeight: 400, color: '#8a8a80' },
  tag: { fontFamily: 'Caveat', fontWeight: 700, fontSize: 9, backgroundColor: BLUE, borderWidth: 1, borderColor: INK, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', marginBottom: 7 },

  dishName: { fontSize: 8.8, fontFamily: 'Poppins', fontWeight: 700, color: INK },
  dishDesc: { fontFamily: 'Poppins', fontSize: 7.6, color: '#4c4a44', marginTop: 1, lineHeight: 1.3 },
  dishBlock: { marginBottom: 6 },
  sharedNote: { fontFamily: 'Poppins', fontWeight: 400, fontSize: 7.2, color: '#8a8a80' },

  extrasWrap: { position: 'relative', marginTop: 16 },
  extrasCardShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 12, backgroundColor: INK, zIndex: 0 },
  extrasCard: { borderWidth: 1.5, borderColor: INK, borderStyle: 'dashed', borderRadius: 12, padding: 10, backgroundColor: CREAM, zIndex: 1 },
  extrasTitle: { fontSize: 9, fontFamily: 'Archivo Black', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Poppins', fontSize: 8, color: '#3a3a3a', marginTop: 2 },

  footNote: { fontFamily: 'Poppins', fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 20, lineHeight: 1.4 },

  footer: { backgroundColor: INK, borderTopLeftRadius: 22, borderTopRightRadius: 22, alignItems: 'center', paddingTop: 20, paddingBottom: 24, marginTop: 10 },
  footerLogoPill: { backgroundColor: CREAM, color: INK, fontFamily: 'Archivo Black', fontSize: 9, letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },
  footerLogoImage: { height: 34, objectFit: 'contain' },
  footerText: { fontFamily: 'Poppins', color: '#cfcabf', fontSize: 7.5, marginTop: 8 },
})

interface Props {
  clientName: string
  sections: MealSection[]
  lang?: QuoteLang
  logoSrc?: string
  photoSrc?: string
}

export function ProposalMenuPdfDocument({ sections, lang = 'it', logoSrc, photoSrc }: Props) {
  const t = menuStrings[lang]
  return (
    <Document title="Menu proposta Doppio Malto">
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image e' un primitivo solo-PDF, non un <img> HTML */}
          {logoSrc ? <Image src={logoSrc} style={styles.logoImage} /> : <Text style={styles.logoPill}>DOPPIO MALTO</Text>}
          <Text style={styles.heroEyebrow}>Birrificio con cucina</Text>
          <Text style={styles.heroTitle}>
            PROPOSTE <Text style={styles.heroTitleAmount}>EVENTI</Text> DI GRUPPO
          </Text>
          <Text style={styles.heroTagline}>{t.subtitle}</Text>
        </View>

        {photoSrc ? (
          <View style={styles.photoWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={photoSrc} style={styles.photo} />
          </View>
        ) : null}

        <View style={styles.body}>
          {sections.map((section) => {
            const plan = section.plan
            const groups = plan.groups.filter((g) => g.items.length > 0)
            if (groups.length === 0) return null
            const price = planPrice(plan)

            return (
              <View key={section.id} wrap={false} style={{ marginBottom: 22 }}>
                <View style={styles.mealHead}>
                  {section.hours ? <Text style={styles.mealTag}>{section.hours}</Text> : null}
                  <Text style={styles.mealTitle}>{section.label.toUpperCase()}</Text>
                  {section.meta ? <Text style={styles.mealMeta}>{section.meta}</Text> : null}
                </View>

                <View style={styles.planRow}>
                  <View style={styles.planCol}>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeNum}>{price > 0 ? price.toFixed(2).replace(/\.00$/, '') : '—'}</Text>
                      <Text style={styles.priceBadgeCur}>EURO</Text>
                    </View>
                    <View style={styles.planCard}>
                      {plan.note ? <Text style={styles.question}>{plan.note}</Text> : null}

                      {groups.map((g) => {
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
                </View>

                {section.extras.length > 0 && (
                  <View style={styles.extrasWrap}>
                    <View style={styles.extrasCardShadow} />
                    <View style={styles.extrasCard}>
                      <Text style={styles.extrasTitle}>{t.additionalServices}</Text>
                      {section.extras.map((ex) => (
                        <View style={styles.extraRow} key={ex.catalogId}>
                          <Text>{ex.name}</Text>
                          <Text>{ex.price > 0 ? `€${ex.price.toFixed(2).replace(/\.00$/, '')}${ex.unit === 'a_persona' ? `/${t.perPerson}` : ''}` : t.onRequest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )
          })}

          <Text style={styles.footNote}>{t.footnote}</Text>
        </View>

        <View style={styles.footer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoSrc ? <Image src={logoSrc} style={styles.footerLogoImage} /> : <Text style={styles.footerLogoPill}>DOPPIO MALTO</Text>}
          <Text style={styles.footerText}>Prezzi IVA inclusa · doppiomalto.com</Text>
        </View>
      </Page>
    </Document>
  )
}
