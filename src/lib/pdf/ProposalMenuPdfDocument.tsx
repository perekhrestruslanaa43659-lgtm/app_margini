import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { planPrice, dishesBySubcategory, itemSharedAmong, type MealSection } from '@/lib/proposalHtml'
import { menuStrings, type QuoteLang } from './i18n'

// Segue il template di riferimento aggiornato dello studio (menu_skill_build/
// proposta-form.html): sfondo giallo pieno, logo vero in header, foto hero sempre
// visibile in una cornice nera, pillola badge sotto il sottotitolo, un solo prezzo
// per sezione mostrato in testa al titolo (niente piu' badge a cerchio), card bianche
// impilate verticalmente per ogni gruppo di piatti — il gruppo Bevande prende sfondo
// teal pieno — con titolo corallo, tag opzionale e divider tratteggiato.
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
    { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDz8V1s.ttf', fontWeight: 800 },
  ],
})

const INK = '#1C1B18'
const CORAL = '#E1543F'
const TEAL = '#3AC6DE'
const YELLOW = '#F4D000'
const CREAM = '#FFFDF9'
const MUTED = '#3a3934'

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Poppins', backgroundColor: YELLOW },

  hero: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 28, paddingBottom: 6 },
  logoPill: { backgroundColor: INK, color: CREAM, fontFamily: 'Poppins', fontWeight: 700, fontSize: 10, letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },
  logoImage: { height: 40, objectFit: 'contain' },
  heroEyebrow: { fontFamily: 'Caveat', fontWeight: 700, color: INK, fontSize: 15, marginTop: 10, marginBottom: 2 },
  heroTitle: { fontFamily: 'Poppins', fontWeight: 800, fontSize: 19, textAlign: 'center', marginTop: 2 },
  heroTitleAmount: { color: CORAL },
  heroSubtitle: { fontFamily: 'Poppins', fontWeight: 600, fontSize: 9, color: MUTED, textAlign: 'center', maxWidth: 320, marginTop: 6, lineHeight: 1.4 },
  badgePill: { marginTop: 10, backgroundColor: INK, color: '#fff', fontFamily: 'Poppins', fontWeight: 700, fontSize: 8, letterSpacing: 0.8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },

  // Niente ombra offset qui (a differenza delle card sotto): la View sfalsata dietro un
  // Image causa un bug di stacking in @react-pdf/renderer 4.x che copre la foto con un
  // rettangolo nero pieno. La sola cornice nera spessa da' comunque un effetto "sticker"
  // sufficiente.
  photoWrap: { marginTop: 16, marginHorizontal: 30, marginBottom: 12 },
  photo: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 18, borderWidth: 3, borderColor: INK },

  body: { paddingHorizontal: 28, paddingTop: 14, paddingBottom: 20 },

  mealHead: { alignItems: 'center', marginBottom: 4 },
  mealTag: { fontFamily: 'Caveat', fontWeight: 700, color: INK, fontSize: 10.5, borderWidth: 1.5, borderColor: INK, backgroundColor: CREAM, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealTitle: { fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, textAlign: 'center' },
  mealTitlePrice: { fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, color: CORAL },
  mealMeta: { fontFamily: 'Poppins', fontSize: 8, color: MUTED, marginTop: 3, textAlign: 'center', maxWidth: 420 },
  mealNote: { fontFamily: 'Poppins', fontWeight: 600, fontSize: 8, color: INK, marginTop: 2, textAlign: 'center', maxWidth: 420 },

  // Niente ombra offset sulle card: una View assoluta sfalsata dietro contenuto con
  // figli annidati (testo + liste di piatti) causa un bug di stacking in
  // @react-pdf/renderer 4.x, gia' visto sulla foto hero — copre tutto di nero pieno.
  // Bordo spesso senza ombra da' comunque un effetto "sticker" sufficiente ed e' affidabile.
  stack: { marginTop: 14, gap: 10 },
  card: { borderWidth: 2.5, borderColor: INK, borderRadius: 14, padding: 11, backgroundColor: CREAM },
  cardColor: { backgroundColor: TEAL },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontFamily: 'Poppins', fontWeight: 800, fontSize: 10, color: CORAL, textTransform: 'uppercase' },
  cardSubtitle: { fontFamily: 'Poppins', fontSize: 7.5, color: '#8a8a80', marginTop: 1 },
  divider: { borderTopWidth: 1, borderTopColor: INK, borderStyle: 'dashed', opacity: 0.3, marginTop: 7, marginBottom: 7 },

  tag: { fontFamily: 'Poppins', fontWeight: 700, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.3, color: '#fff', backgroundColor: INK, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },

  dishName: { fontSize: 8.8, fontFamily: 'Poppins', fontWeight: 700, color: INK },
  dishDesc: { fontFamily: 'Poppins', fontSize: 7.6, color: '#4c4a44', marginTop: 1, lineHeight: 1.3 },
  dishBlock: { marginBottom: 6 },
  sharedNote: { fontFamily: 'Poppins', fontWeight: 400, fontSize: 7.2, color: '#8a8a80' },
  subcatLabel: { fontSize: 7.5, fontFamily: 'Poppins', fontWeight: 700, letterSpacing: 0.4, color: '#555', marginTop: 6, marginBottom: 4 },

  extraRow: { flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Poppins', fontSize: 8, color: '#3a3a3a', marginTop: 2 },

  footNote: { fontFamily: 'Poppins', fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 20, lineHeight: 1.4 },

  footer: { backgroundColor: INK, borderTopLeftRadius: 22, borderTopRightRadius: 22, alignItems: 'center', paddingTop: 20, paddingBottom: 24, marginTop: 10 },
  footerLogoPill: { backgroundColor: CREAM, color: INK, fontFamily: 'Poppins', fontWeight: 700, fontSize: 9, letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18 },
  footerLogoImage: { height: 34, objectFit: 'contain' },
  footerText: { fontFamily: 'Poppins', color: '#cfcabf', fontSize: 7.5, marginTop: 8 },
})

interface Props {
  clientName: string
  sections: MealSection[]
  lang?: QuoteLang
  logoSrc?: string
  /** Foto unica mostrata subito sotto l'header, prima di tutte le sezioni — usata quando
   *  l'intero documento riguarda una sola sala (es. menu di un evento con room_id fisso). */
  photoSrc?: string
  /** Nome sala (case-insensitive, come in MealSection.room) -> URL foto: mostra una foto
   *  diversa per ogni sezione con una sala diversa, invece di un'unica foto globale.
   *  Se una sezione non ha match qui, resta senza foto anche se photoSrc e' assente. */
  roomPhotoByName?: Map<string, string>
}

export function ProposalMenuPdfDocument({ sections, lang = 'it', logoSrc, photoSrc, roomPhotoByName }: Props) {
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
          <Text style={styles.heroSubtitle}>{t.subtitle}</Text>
          <Text style={styles.badgePill}>Proposta commerciale</Text>
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
            const priceLabel = price > 0 ? `€${price.toFixed(2).replace(/\.00$/, '')}` : '—'
            const sectionPhotoSrc = section.room ? roomPhotoByName?.get(section.room.trim().toLowerCase()) : undefined

            return (
              <View key={section.id} wrap={false} style={{ marginBottom: 22 }}>
                <View style={styles.mealHead}>
                  {section.hours ? <Text style={styles.mealTag}>{section.hours}</Text> : null}
                  <View style={styles.mealTitleRow}>
                    <Text style={styles.mealTitle}>{section.label.toUpperCase()}</Text>
                    <Text style={styles.mealTitlePrice}>{priceLabel}</Text>
                  </View>
                  {section.meta ? <Text style={styles.mealMeta}>{section.meta}</Text> : null}
                  {plan.note ? <Text style={styles.mealNote}>{plan.note}</Text> : null}
                </View>

                {sectionPhotoSrc ? (
                  <View style={styles.photoWrap}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={sectionPhotoSrc} style={styles.photo} />
                  </View>
                ) : null}

                <View style={styles.stack}>
                  {groups.map((g) => {
                    const isChoice = g.pricingMode === 'media' && g.items.length > 1
                    const subgroups = isChoice ? dishesBySubcategory(g) : null
                    const showSubcats = subgroups ? subgroups.size > 1 : false
                    const isBeverage = /bevand/i.test(g.label)

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
                      <View key={g.id} style={isBeverage ? { ...styles.card, ...styles.cardColor } : styles.card}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle}>{g.label || 'Voci'}</Text>
                          {g.tag ? <Text style={styles.tag}>{g.tag}</Text> : null}
                        </View>
                        {isChoice ? <Text style={styles.cardSubtitle}>{t.choice}</Text> : null}
                        <View style={styles.divider} />
                        {!showSubcats
                          ? g.items.map(renderDish)
                          : Array.from(subgroups!.entries()).map(([subcat, dishes]) => (
                              <View key={subcat}>
                                <Text style={styles.subcatLabel}>{subcat.toUpperCase()}</Text>
                                {dishes.map(renderDish)}
                              </View>
                            ))}
                      </View>
                    )
                  })}

                  {section.extras.length > 0 && (
                    <View style={styles.card}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{t.additionalServices}</Text>
                      </View>
                      <View style={styles.divider} />
                      {section.extras.map((ex) => (
                        <View style={styles.extraRow} key={ex.catalogId}>
                          <Text>{ex.name}</Text>
                          <Text>{ex.price > 0 ? `€${ex.price.toFixed(2).replace(/\.00$/, '')}${ex.unit === 'a_persona' ? `/${t.perPerson}` : ''}` : t.onRequest}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
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
