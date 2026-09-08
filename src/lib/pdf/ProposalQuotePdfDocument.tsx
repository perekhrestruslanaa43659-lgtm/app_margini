import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/margin'
import { planPrice, type MealSection } from '@/lib/proposalHtml'
import type { CompanyInfo } from '@/lib/company'
import { quoteStrings, formatQuoteDate, type QuoteLang } from './i18n'

// Palette allineata al template di riferimento dello studio (skill
// "doppio-malto-preventivo-evento"): registro sobrio/istituzionale — ink e
// ambra come unico accento, niente bordi colorati spessi né sfondo crema;
// titoli di sezione con barra verticale ambra sottile invece di card bordate;
// tabella con intestazione nera piena e riga totale pesca con barra laterale
// ambra. Il menu dettagliato NON compare in questo documento: viene allegato
// come file separato (vedi buildProposalHtml / la pagina di anteprima proposta).
const INK = '#1A1A1A'
const ACCENT = '#C67C2E'
const ACCENT_DARK = '#A85C1A'
const PEACH = '#FBEEE0'
const GRAY = '#666666'
const LINE = '#D9D9D9'

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 40, paddingTop: 32, paddingBottom: 10 },
  logo: { width: 130, height: 68, objectFit: 'contain' },
  docTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: INK, textAlign: 'right', letterSpacing: 0.3 },
  courtesyText: { fontSize: 8, color: GRAY, textAlign: 'right', marginTop: 4, letterSpacing: 0.3 },
  metaRow: { marginTop: 8, alignItems: 'flex-end' },
  metaText: { fontSize: 8.5, color: INK, textAlign: 'right', marginTop: 2 },
  metaLabel: { fontFamily: 'Helvetica-Bold' },
  headerRule: { borderBottomWidth: 1.5, borderBottomColor: INK, marginHorizontal: 40, marginBottom: 18 },

  body: { paddingHorizontal: 32 },

  section: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitleBar: { width: 3, height: 12, backgroundColor: ACCENT },
  sectionTitleText: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: INK, textTransform: 'uppercase', letterSpacing: 0.5 },

  twoColRow: { flexDirection: 'row', gap: 20 },
  col: { flex: 1 },

  fieldLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },
  fieldValue: { fontSize: 9, color: INK, borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 3, marginTop: 2, marginBottom: 8, minHeight: 12 },

  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK, paddingVertical: 8, paddingHorizontal: 10 },
  thDesc: { flex: 3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase' },
  thMin: { flex: 1.1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase', textAlign: 'center' },
  thPrice: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase', textAlign: 'right' },
  thTotal: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase', textAlign: 'right' },

  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 7, paddingHorizontal: 10 },
  tdDescWrap: { flex: 3 },
  tdName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  tdDesc: { fontSize: 8, color: GRAY, fontStyle: 'italic', marginTop: 1 },
  tdMin: { flex: 1.1, fontSize: 9, textAlign: 'center', color: GRAY },
  tdPrice: { flex: 1.3, fontSize: 9, textAlign: 'right' },
  tdTotal: { flex: 1.3, fontSize: 9, textAlign: 'right' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: PEACH, borderLeftWidth: 4, borderLeftColor: ACCENT, paddingVertical: 9, paddingHorizontal: 10, marginTop: 2 },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ACCENT_DARK },
  totalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: ACCENT_DARK, minWidth: 80, textAlign: 'right' },

  menuAttachedNote: { fontSize: 8.5, fontStyle: 'italic', color: GRAY, marginTop: 8 },

  clauseRow: { flexDirection: 'row', marginBottom: 6 },
  clauseNum: { width: 14, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },
  clauseText: { flex: 1, fontSize: 8.5, color: INK, lineHeight: 1.4 },
  clauseTitle: { fontFamily: 'Helvetica-Bold', color: INK },

  bankRow: { fontSize: 9, marginBottom: 4 },
  disclaimer: { fontSize: 7.5, fontStyle: 'italic', color: GRAY, marginTop: 8, lineHeight: 1.4 },

  signatureText: { fontSize: 9, color: INK, lineHeight: 1.4, marginBottom: 20 },
  signatureRow: { flexDirection: 'row', gap: 24, marginBottom: 18 },
  signatureCol: { flex: 1 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: INK, marginBottom: 4, minHeight: 24 },
  signatureCaption: { fontSize: 8, color: GRAY },
  pageNum: { fontSize: 8, color: GRAY, textAlign: 'center', marginTop: 24 },
})

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || ' '}</Text>
    </View>
  )
}

function SectionTitle({ text }: { text: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleBar} />
      <Text style={styles.sectionTitleText}>{text}</Text>
    </View>
  )
}

export interface QuoteClient {
  name: string
  address: string
  vatNumber: string
  sdiCode: string
  email: string
  phone: string
  eventDate: string | null
  eventTime: string
  guestsCount: number | null
  bookingStatus: string
  depositDate: string | null
}

export interface ContractClause {
  title: string
  text: string
}

/** Placeholder {{deposit_pct}} e {{deposit_days}} nel testo vengono sostituiti con i valori del form. */
export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    title: 'Minimo garantito e conteggio ospiti.',
    text: 'La fatturazione minima è calcolata sul numero di partecipanti garantito indicato dal cliente. Qualora il numero di presenti risultasse inferiore a tale soglia, resta comunque dovuto l’importo calcolato sul minimo garantito. In caso di partecipanti eccedenti, verrà applicato il costo unitario per persona indicato in tabella per ogni ospite aggiuntivo. Il cliente è tenuto a comunicare il numero definitivo di partecipanti entro i termini concordati e comunque non oltre 3 giorni lavorativi prima dell’evento.',
  },
  {
    title: 'Comunicazione delle preferenze di menu.',
    text: 'Al fine di garantire un servizio fluido e tempi di uscita adeguati, il cliente è tenuto a comunicare la scelta del main course, nonché eventuali allergie o intolleranze alimentari dei partecipanti, entro e non oltre 5 giorni prima della data dell’evento.',
  },
  {
    title: 'Caparra confirmatoria.',
    text: 'A conferma della prenotazione è richiesto il versamento di una caparra confirmatoria pari al {{deposit_pct}}% dell’importo totale stimato, da corrispondere entro e non oltre {{deposit_days}} giorni dalla data di accettazione del presente preventivo, tramite bonifico bancario sulle coordinate indicate. La mancata ricezione della caparra entro i termini indicati comporta la decadenza automatica dell’opzione sulla data e sulla sala.',
  },
  {
    title: 'Saldo finale e modalità di pagamento.',
    text: 'Il saldo residuo dovrà essere corrisposto entro e non oltre la data dell’evento, salvo diverso accordo scritto tra le parti, tramite bonifico bancario o le ulteriori modalità concordate. Il presente documento non costituisce fattura fiscale.',
  },
  {
    title: 'Recesso e cancellazione.',
    text: 'Eventuali disdette o modifiche alla prenotazione dovranno essere comunicate per iscritto. La caparra versata non è rimborsabile in caso di recesso comunicato a meno di 7 giorni dalla data dell’evento, salvo diverso accordo tra le parti.',
  },
]

interface Props {
  client: QuoteClient
  sections: MealSection[]
  companyInfo: CompanyInfo
  quoteRef: string
  offerDate: string
  clauses: ContractClause[]
  logoSrc?: string
  lang?: QuoteLang
}

export function ProposalQuotePdfDocument({ client, sections, companyInfo, quoteRef, offerDate, clauses, logoSrc, lang = 'it' }: Props) {
  const t = quoteStrings[lang]
  const allPlans = sections.flatMap((s) => s.plans.filter((p) => p.groups.some((g) => g.items.length > 0)).map((p) => ({ section: s, plan: p })))
  const allExtras = sections.flatMap((s) => s.extras.map((ex) => ({ section: s, extra: ex })))
  const hasMenu = allPlans.length > 0
  const guests = client.guestsCount ?? 0

  const menuPricePerGuest = hasMenu
    ? allPlans.reduce((sum, { plan }) => sum + planPrice(plan), 0) / Math.max(allPlans.length, 1)
    : 0
  const menuTotal = menuPricePerGuest * guests
  const extrasTotal = allExtras.reduce((sum, { extra }) => sum + (extra.unit === 'a_persona' ? extra.price * guests : extra.price), 0)
  const grandTotal = menuTotal + extrasTotal
  const totalKnown = guests > 0 && (menuPricePerGuest > 0 || extrasTotal > 0)

  return (
    <Document title={`${t.docTitle} ${client.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF-only primitive, not an HTML <img> */}
          {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold' }}>{companyInfo.name}</Text>}
          <View>
            <Text style={styles.docTitle}>{t.docTitle}</Text>
            <Text style={styles.courtesyText}>{t.courtesy}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}><Text style={styles.metaLabel}>{t.offerDate}: </Text>{offerDate}</Text>
              <Text style={styles.metaText}><Text style={styles.metaLabel}>{t.quoteRef}: </Text>{quoteRef}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRule} />

        <View style={[styles.body, { paddingBottom: 20 }]}>

          {/* Dati cliente + Dettagli evento */}
          <View style={styles.section}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <SectionTitle text={t.clientData} />
                <Field label={t.intestatario} value={client.name} />
                <Field label={t.address} value={client.address} />
                <Field label={t.vatNumber} value={client.vatNumber} />
                <Field label={t.sdiCode} value={client.sdiCode} />
              </View>
              <View style={styles.col}>
                <SectionTitle text={t.eventDetails} />
                <Field label={t.eventDate} value={formatQuoteDate(client.eventDate, lang)} />
                <Field label={t.eventTime} value={client.eventTime} />
                <Field label={t.minGuaranteed} value={client.guestsCount ? `${client.guestsCount} ${t.pax}` : ''} />
                <Field label={t.bookingStatus} value={client.bookingStatus} />
              </View>
            </View>
          </View>

          {/* Riepilogo servizi e costi */}
          <View style={styles.section} wrap={false}>
            <SectionTitle text={t.servicesRecap} />

            <View style={styles.tableHeaderRow}>
              <Text style={styles.thDesc}>{t.thDesc}</Text>
              <Text style={styles.thMin}>{t.thMin}</Text>
              <Text style={styles.thPrice}>{t.thPrice}</Text>
              <Text style={styles.thTotal}>{t.thTotal}</Text>
            </View>

            {hasMenu ? (
              <View style={styles.tableRow}>
                <View style={styles.tdDescWrap}>
                  <Text style={styles.tdName}>{t.menuEvent}</Text>
                  <Text style={styles.tdDesc}>
                    {t.menuAttached}
                    {allPlans[0]?.section.duration ? ` — ${allPlans[0].section.duration}` : ''}
                  </Text>
                </View>
                <Text style={styles.tdMin}>{client.guestsCount ? `${client.guestsCount} ${t.pax}` : t.pax}</Text>
                <Text style={styles.tdPrice}>{formatCurrency(menuPricePerGuest)}</Text>
                <Text style={styles.tdTotal}>{guests > 0 ? formatCurrency(menuTotal) : ' '}</Text>
              </View>
            ) : (
              <View style={styles.tableRow}>
                <View style={styles.tdDescWrap}>
                  <Text style={styles.tdName}>{t.menuEvent}</Text>
                  <Text style={styles.tdDesc}>{t.menuAttached}</Text>
                </View>
                <Text style={styles.tdMin}>{client.guestsCount ? `${client.guestsCount} ${t.pax}` : t.pax}</Text>
                <Text style={styles.tdPrice}>€</Text>
                <Text style={styles.tdTotal}> </Text>
              </View>
            )}

            {allExtras.map(({ extra }) => {
              const extraTotal = extra.unit === 'a_persona' ? extra.price * guests : extra.price
              const extraTotalKnown = extra.price > 0 && (extra.unit === 'fisso' || guests > 0)
              return (
                <View style={styles.tableRow} key={extra.catalogId}>
                  <View style={styles.tdDescWrap}>
                    <Text style={styles.tdName}>{extra.name}</Text>
                    <Text style={styles.tdDesc}>{t.additionalService}</Text>
                  </View>
                  <Text style={styles.tdMin}>—</Text>
                  <Text style={styles.tdPrice}>{extra.price > 0 ? `${formatCurrency(extra.price)}${extra.unit === 'a_persona' ? `/${t.pax}` : ''}` : t.onRequest}</Text>
                  <Text style={styles.tdTotal}>{extraTotalKnown ? formatCurrency(extraTotal) : ' '}</Text>
                </View>
              )
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.total}</Text>
              <Text style={styles.totalValue}>{totalKnown ? formatCurrency(grandTotal) : ' '}</Text>
            </View>

            <Text style={styles.menuAttachedNote}>{t.menuAttachedFootnote}</Text>
          </View>

          {/* Clausole contrattuali */}
          <View style={styles.section}>
            <SectionTitle text={t.contractClauses} />
            {clauses.map((c, i) => (
              <View style={styles.clauseRow} key={i}>
                <Text style={styles.clauseNum}>{i + 1}.</Text>
                <Text style={styles.clauseText}><Text style={styles.clauseTitle}>{c.title}</Text> {c.text}</Text>
              </View>
            ))}
          </View>

          {/* Coordinate bancarie */}
          <View style={styles.section}>
            <SectionTitle text={t.bankDetails} />
            <View style={styles.bankRow}><Field label={t.intestatario} value={companyInfo.legalName || companyInfo.name} /></View>
            <View style={styles.bankRow}><Field label="IBAN:" value={companyInfo.iban} /></View>
            <View style={styles.bankRow}><Field label={t.causale} value={`${quoteRef} — ${client.name}`} /></View>
            <Text style={styles.disclaimer}>{t.disclaimer}</Text>
          </View>

        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={[styles.body, { paddingTop: 32 }]}>
          <View style={styles.section}>
            <SectionTitle text={t.confirmTitle} />
            <Text style={styles.signatureText}>{t.confirmText}</Text>
            <View style={styles.signatureRow}>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureCaption}>{t.signName}</Text>
              </View>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureCaption}>{t.signature}</Text>
              </View>
            </View>
            <View style={{ width: 200 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>{t.date}</Text>
            </View>
          </View>
          <Text style={styles.pageNum}>{t.pageOf(2, 2)}</Text>
        </View>
      </Page>
    </Document>
  )
}
