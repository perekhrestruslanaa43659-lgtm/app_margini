import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/margin'
import { planPrice, dishesBySubcategory, type MealSection } from '@/lib/proposalHtml'
import type { CompanyInfo } from '@/lib/company'

// Palette dello skill "Preventivo Evento" (SKILLS-PREVENTIVO.md): stessi token
// cromatici di SKILLS-STILE.md, ma registro sobrio/istituzionale — niente ombre
// piene o rotazioni, corallo e verde alternati come colore-titolo di sezione.
const INK = '#1C1B18'
const CORAL = '#E1543F'
const GREEN = '#6FA84B'
const YELLOW = '#F0B429'
const CREAM = '#FBF6EC'
const MUTED = '#6B6558'

const styles = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: 'Helvetica', backgroundColor: CREAM },

  heroBand: { backgroundColor: '#BFE0D2', paddingHorizontal: 40, paddingVertical: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: INK },
  companyTag: { fontSize: 9, color: INK, opacity: 0.75, marginTop: 2 },
  statusBadge: { borderWidth: 1.5, borderColor: INK, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-end' },
  statusBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },
  courtesyText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: INK, textAlign: 'right', marginTop: 8 },
  metaText: { fontSize: 8, color: INK, opacity: 0.75, textAlign: 'right', marginTop: 3 },

  body: { paddingHorizontal: 32, paddingTop: 20 },

  card: { backgroundColor: '#FFFDF9', borderWidth: 2, borderColor: INK, borderRadius: 18, padding: 16, marginBottom: 14 },
  cardTitleCoral: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: CORAL, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  cardTitleGreen: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  twoColRow: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },

  fieldLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },
  fieldValue: { fontSize: 9, color: INK, borderBottomWidth: 1, borderBottomColor: '#BDB6A4', paddingBottom: 3, marginTop: 2, marginBottom: 8, minHeight: 12 },

  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 8, marginBottom: 2 },
  thDesc: { flex: 3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase' },
  thMin: { flex: 1.1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'center' },
  thPrice: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },
  thTotal: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },

  tableRow: { flexDirection: 'row', borderTopWidth: 1.2, borderTopColor: GREEN, borderStyle: 'dashed', paddingVertical: 7, paddingHorizontal: 8 },
  tdDescWrap: { flex: 3 },
  tdName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  tdDesc: { fontSize: 8, color: MUTED, marginTop: 1 },
  tdMin: { flex: 1.1, fontSize: 9, textAlign: 'center', color: MUTED },
  tdPrice: { flex: 1.3, fontSize: 9, textAlign: 'right' },
  tdTotal: { flex: 1.3, fontSize: 9, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#BDB6A4' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FCEACB', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6 },
  totalLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: CORAL, textTransform: 'uppercase' },
  totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: CORAL, borderBottomWidth: 1, borderBottomColor: CORAL, minWidth: 80, textAlign: 'right' },

  menuSection: { marginBottom: 8 },
  menuSectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: CORAL, textTransform: 'uppercase', marginBottom: 3 },
  menuBodyText: { fontSize: 8.5, color: '#3a3a3a', lineHeight: 1.4 },
  menuSubTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: GREEN, marginTop: 4, marginBottom: 2 },
  dishRow: { fontSize: 8.5, color: '#3a3a3a', marginTop: 2, lineHeight: 1.35 },
  dishName: { fontFamily: 'Helvetica-Bold', color: INK },
  noteBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: GREEN, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, marginBottom: 2 },
  noteBadgeText: { fontSize: 7.5, color: GREEN, fontFamily: 'Helvetica-Bold' },

  clauseRow: { flexDirection: 'row', marginBottom: 6 },
  clauseNum: { width: 14, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },
  clauseText: { flex: 1, fontSize: 8.5, color: '#3a3a3a', lineHeight: 1.4 },
  clauseTitle: { fontFamily: 'Helvetica-Bold', color: INK },

  disclaimer: { fontSize: 7.5, color: MUTED, textAlign: 'center', marginTop: 8, lineHeight: 1.4 },

  signatureText: { fontSize: 9, color: '#3a3a3a', lineHeight: 1.4, marginBottom: 20 },
  signatureRow: { flexDirection: 'row', gap: 24, marginBottom: 18 },
  signatureCol: { flex: 1 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: INK, marginBottom: 4, minHeight: 24 },
  signatureCaption: { fontSize: 8, color: MUTED, fontStyle: 'italic' },
  pageNum: { fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 24 },
})

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || ' '}</Text>
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

export const DEFAULT_CONTRACT_CLAUSES = [
  {
    title: 'Minimo Garantito e Conteggio Ospiti:',
    text: 'la fatturazione minima viene calcolata sul numero di persone garantito indicato dal cliente. Qualora i presenti fossero inferiori al minimo garantito, verrà comunque addebitata la quota calcolata su tale numero. In caso di partecipanti in esubero, verrà applicato il costo per persona in più indicato in tabella (oltre ai servizi aggiuntivi scelti). Si richiede di fornire un aggiornamento definitivo del conteggio a ridosso dell’evento.',
  },
  {
    title: 'Comunicazione Preferenze Menu:',
    text: 'per garantire un servizio fluido e tempi di uscita ottimali, si richiede gentilmente di comunicare la scelta del main course (e eventuali allergie/intolleranze) qualche giorno prima dell’evento.',
  },
  {
    title: 'Caparra Confirmatoria:',
    text: 'per confermare la prenotazione si richiede il versamento di una caparra, importo e termine come concordato via email.',
  },
  {
    title: 'Saldo Finale e Pagamento:',
    text: 'il saldo totale dovrà essere corrisposto come concordato, previa fattura, tramite bonifico bancario.',
  },
]

export interface ContractClause {
  title: string
  text: string
}

interface Props {
  client: QuoteClient
  sections: MealSection[]
  companyInfo: CompanyInfo
  quoteRef: string
  offerDate: string
  clauses: ContractClause[]
}

export function ProposalQuotePdfDocument({ client, sections, companyInfo, quoteRef, offerDate, clauses }: Props) {
  const allPlans = sections.flatMap((s) => s.plans.filter((p) => p.groups.some((g) => g.items.length > 0)).map((p) => ({ section: s, plan: p })))
  const allExtras = sections.flatMap((s) => s.extras.map((ex) => ({ section: s, extra: ex })))

  return (
    <Document title={`Preventivo ${client.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.heroBand}>
          <View>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text style={styles.companyTag}>Birrificio con cucina</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>PREVENTIVO EVENTO</Text>
            </View>
            <Text style={styles.courtesyText}>Copia di cortesia / offerta commerciale</Text>
            <Text style={styles.metaText}>Data Offerta: {offerDate}</Text>
            <Text style={styles.metaText}>N. Preventivo: {quoteRef}</Text>
          </View>
        </View>

        <View style={[styles.body, { paddingBottom: 20 }]}>

          {/* Dati cliente + Dettagli evento */}
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.cardTitleCoral}>Dati Cliente</Text>
                <Field label="Intestatario:" value={client.name} />
                <Field label="Indirizzo:" value={client.address} />
                <Field label="P. IVA:" value={client.vatNumber} />
                <Field label="Codice SDI:" value={client.sdiCode} />
              </View>
              <View style={styles.col}>
                <Text style={styles.cardTitleGreen}>Dettagli Evento</Text>
                <Field label="Data Evento:" value={formatDate(client.eventDate)} />
                <Field label="Orario:" value={client.eventTime} />
                <Field label="Minimo Garantito:" value={client.guestsCount ? `${client.guestsCount} pax` : ''} />
                <Field label="Stato Prenotazione:" value={client.bookingStatus} />
              </View>
            </View>
          </View>

          {/* Riepilogo servizi e costi */}
          <View style={styles.card} wrap={false}>
            <Text style={styles.cardTitleCoral}>Riepilogo Servizi e Costi</Text>

            <View style={styles.tableHeaderRow}>
              <Text style={styles.thDesc}>Descrizione Servizio</Text>
              <Text style={styles.thMin}>Min. Garantito</Text>
              <Text style={styles.thPrice}>Prezzo Unit.</Text>
              <Text style={styles.thTotal}>Importo Totale</Text>
            </View>

            {allPlans.map(({ section, plan }) => {
              const price = planPrice(plan)
              const groupLabels = plan.groups.filter((g) => g.items.length > 0).map((g) => g.label).join(', ')
              return (
                <View style={styles.tableRow} key={plan.id}>
                  <View style={styles.tdDescWrap}>
                    <Text style={styles.tdName}>{section.label} — {plan.name || 'Menu Evento'}</Text>
                    <Text style={styles.tdDesc}>{groupLabels}{section.duration ? ` — permanenza ${section.duration}` : ''}</Text>
                  </View>
                  <Text style={styles.tdMin}>{client.guestsCount ? `${client.guestsCount} pax` : 'pax'}</Text>
                  <Text style={styles.tdPrice}>{price > 0 ? formatCurrency(price) : '—'}</Text>
                  <Text style={styles.tdTotal}> </Text>
                </View>
              )
            })}

            {allExtras.map(({ extra }) => (
              <View style={styles.tableRow} key={extra.catalogId}>
                <View style={styles.tdDescWrap}>
                  <Text style={styles.tdName}>{extra.name}</Text>
                  <Text style={styles.tdDesc}>Servizio aggiuntivo — opzionale</Text>
                </View>
                <Text style={styles.tdMin}>—</Text>
                <Text style={styles.tdPrice}>{extra.price > 0 ? `${formatCurrency(extra.price)}${extra.unit === 'a_persona' ? '/pax' : ''}` : 'su richiesta'}</Text>
                <Text style={styles.tdTotal}> </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Totale Stimato (IVA inclusa):</Text>
              <Text style={styles.totalValue}> </Text>
            </View>
          </View>

          {/* Dettaglio menu incluso */}
          {sections.some((s) => s.plans.some((p) => p.groups.some((g) => g.items.length > 0))) && (
            <View style={styles.card}>
              <Text style={styles.cardTitleCoral}>Dettaglio Menu Incluso</Text>
              {sections.flatMap((s) => s.plans).filter((p) => p.groups.some((g) => g.items.length > 0)).flatMap((p) => p.groups).filter((g) => g.items.length > 0).map((group) => {
                const isChoice = group.pricingMode === 'media' && group.items.length > 1
                const subgroups = isChoice ? dishesBySubcategory(group) : null
                return (
                  <View style={styles.menuSection} key={group.id} wrap={false}>
                    <Text style={styles.menuSectionTitle}>{group.label}{isChoice ? ' (a scelta)' : ''}</Text>
                    {!isChoice ? (
                      group.items.map((it) => (
                        <Text style={styles.dishRow} key={it.catalogId}>
                          <Text style={styles.dishName}>{it.name}</Text>
                          {it.sharedAmong && it.sharedAmong > 1 ? ` (ogni ${it.sharedAmong} persone)` : ''}
                          {it.desc ? ` — ${it.desc}` : ''}
                        </Text>
                      ))
                    ) : (
                      Array.from(subgroups!.entries()).map(([subcat, dishes]) => (
                        <View key={subcat}>
                          <Text style={styles.menuSubTitle}>{subcat}</Text>
                          {dishes.map((d) => (
                            <Text style={styles.dishRow} key={d.catalogId}>
                              <Text style={styles.dishName}>{d.name}</Text>
                              {d.sharedAmong && d.sharedAmong > 1 ? ` (ogni ${d.sharedAmong} persone)` : ''}
                              {d.desc ? ` — ${d.desc}` : ''}
                            </Text>
                          ))}
                        </View>
                      ))
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Clausole contrattuali */}
          <View style={styles.card}>
            <Text style={styles.cardTitleCoral}>Clausole Contrattuali e Condizioni di Servizio</Text>
            {clauses.map((c, i) => (
              <View style={styles.clauseRow} key={i}>
                <Text style={styles.clauseNum}>{i + 1}.</Text>
                <Text style={styles.clauseText}><Text style={styles.clauseTitle}>{c.title}</Text> {c.text}</Text>
              </View>
            ))}
          </View>

          {/* Coordinate bancarie */}
          <View style={styles.card}>
            <Text style={styles.cardTitleGreen}>Coordinate Bancarie per il Pagamento</Text>
            <Field label="Intestatario:" value={companyInfo.legalName || companyInfo.name} />
            <Field label="IBAN:" value={companyInfo.iban} />
            <Field label="Causale:" value={`Preventivo ${quoteRef} — ${client.name}`} />
            <Text style={styles.disclaimer}>
              Documento proforma (copia di cortesia), non valido ai fini fiscali. La fattura fiscale verrà emessa a seguito della ricezione dei pagamenti.
            </Text>
          </View>

        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={[styles.body, { paddingTop: 32 }]}>
          <View style={styles.card}>
            <Text style={styles.cardTitleCoral}>Conferma e Presa Visione del Preventivo</Text>
            <Text style={styles.signatureText}>
              Con la presente firma, il cliente dichiara di aver preso visione del preventivo e di confermarne i contenuti e le condizioni di servizio.
            </Text>
            <View style={styles.signatureRow}>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureCaption}>Nome e Cognome / Ragione Sociale</Text>
              </View>
              <View style={styles.signatureCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureCaption}>Firma</Text>
              </View>
            </View>
            <View style={{ width: 200 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>Data</Text>
            </View>
          </View>
          <Text style={styles.pageNum}>Pagina 2 di 2</Text>
        </View>
      </Page>
    </Document>
  )
}
