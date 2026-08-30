import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Event, EventItem, EventMenuCategory, EventMenuItem } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'
import type { CompanyInfo } from '@/lib/company'

// Palette e registro dello skill "Preventivo Evento" (SKILLS-PREVENTIVO.md): stessi
// token cromatici di ProposalQuotePdfDocument.tsx (il preventivo formale cliente) —
// niente giallo pieno da sfondo, niente badge quadrato "DM", card a bordo netto senza
// ombra. Questo documento resta un export "tecnico" per uso interno (voci di margine,
// non le clausole/firma del preventivo formale), ma condivide lo stesso registro visivo
// istituzionale invece della vecchia palette gialla non allineata alle altre skill.
const INK = '#1C1B18'
const CORAL = '#E1543F'
const GREEN = '#6FA84B'
const YELLOW = '#F0B429'
const MUTED = '#6B6558'
const CREAM = '#FFFDF9'
const LINE = '#BDB6A4'

const styles = StyleSheet.create({
  page: { fontSize: 10, color: INK, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  headerBand: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: INK },
  small: { fontSize: 8, color: MUTED, marginTop: 1 },
  docTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: INK, textAlign: 'right' },
  docMeta: { fontSize: 8.5, color: INK, textAlign: 'right', marginTop: 2 },
  headerRule: { borderBottomWidth: 2, borderBottomColor: INK, marginHorizontal: 40, marginBottom: 20 },
  body: { paddingHorizontal: 32 },
  section: { marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitleBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: CORAL },
  sectionTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: CORAL, textTransform: 'uppercase', letterSpacing: 0.5 },
  clientBox: { backgroundColor: CREAM, borderWidth: 2, borderColor: INK, borderRadius: 18, padding: 16 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  clientLine: { fontSize: 9, color: '#3a3a3a', marginTop: 1 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 8, marginBottom: 2 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1.2, borderTopColor: GREEN, borderStyle: 'dashed', paddingVertical: 7, paddingHorizontal: 8 },
  thName: { flex: 3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase' },
  thQty: { flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'center' },
  thPrice: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },
  thTotal: { flex: 1.3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },
  tdName: { flex: 3, fontSize: 9.5 },
  tdQty: { flex: 1, fontSize: 9, textAlign: 'center', color: MUTED },
  tdPrice: { flex: 1.3, fontSize: 9, textAlign: 'right' },
  tdTotal: { flex: 1.3, fontSize: 9, textAlign: 'right', fontFamily: 'Helvetica-Bold', borderBottomWidth: 1, borderBottomColor: LINE },
  totalsBox: { alignSelf: 'flex-end', width: 220, marginTop: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { fontSize: 9, color: '#3a3a3a' },
  totalsValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FCEACB', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6 },
  grandTotalLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: CORAL, textTransform: 'uppercase' },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: CORAL },
  notesBox: { backgroundColor: CREAM, borderWidth: 1.5, borderColor: LINE, borderStyle: 'dashed', borderRadius: 14, padding: 12 },
  notesText: { fontSize: 9, color: '#3a3a3a', lineHeight: 1.4 },
  depositText: { fontFamily: 'Helvetica-Bold', color: CORAL, marginBottom: 3 },
  menuCategoryBox: { marginBottom: 8, borderTopWidth: 1.2, borderTopColor: GREEN, borderStyle: 'dashed', paddingTop: 8 },
  menuCategoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  menuCategoryName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
  menuCategoryPrice: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: CORAL },
  menuCategoryDishes: { fontSize: 9, color: MUTED },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: INK, paddingHorizontal: 40, paddingVertical: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerCol: { flex: 1 },
  footerLabel: { fontSize: 7, color: YELLOW, textTransform: 'uppercase', marginBottom: 2 },
  footerValue: { fontSize: 8, color: '#e5e5e5' },
})

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  event: Event
  revenues: EventItem[]
  totalRevenue: number
  companyInfo: CompanyInfo
  roomName: string | null
  menuCategories?: EventMenuCategory[]
  menuItems?: EventMenuItem[]
}

const MENU_VAT_RATE = 10 // usato solo per il calcolo standalone del menu (nessun campo IVA dedicato nello schema)

export function QuotePdfDocument({ event, revenues, totalRevenue, companyInfo, roomName, menuCategories = [], menuItems = [] }: Props) {
  const guests = event.guests_count ?? 1

  const menuItemsByCategory = new Map<string, EventMenuItem[]>()
  for (const it of menuItems) {
    const list = menuItemsByCategory.get(it.category_id) ?? []
    list.push(it)
    menuItemsByCategory.set(it.category_id, list)
  }

  const menuTotalPerGuest = menuCategories.reduce((sum, cat) => {
    const dishes = menuItemsByCategory.get(cat.id) ?? []
    if (cat.selection_type === 'a_scelta') return sum + (cat.price_per_guest ?? 0)
    return sum + dishes.reduce((s, d) => s + d.unit_price, 0)
  }, 0)
  const menuTotal = menuTotalPerGuest * guests
  const menuVat = menuTotal > 0 ? menuTotal * (MENU_VAT_RATE / 100) : 0

  const vatByRate = new Map<number, number>()
  for (const r of revenues) {
    const net = r.quantity * r.unit_price
    vatByRate.set(r.vat_rate, (vatByRate.get(r.vat_rate) ?? 0) + net * (r.vat_rate / 100))
  }
  const itemsVat = Array.from(vatByRate.values()).reduce((a, b) => a + b, 0)

  const grandTotalRevenue = totalRevenue + menuTotal
  const totalVat = itemsVat + menuVat
  const totalWithVat = grandTotalRevenue + totalVat

  return (
    <Document title={`Preventivo ${event.name}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            {companyInfo.address ? <Text style={styles.small}>{companyInfo.address}</Text> : null}
            {companyInfo.vatNumber ? <Text style={styles.small}>P.IVA {companyInfo.vatNumber}</Text> : null}
          </View>
          <View>
            <Text style={styles.docTitle}>PREVENTIVO</Text>
            <Text style={styles.docMeta}>Rif. #{event.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.docMeta}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>
        <View style={styles.headerRule} />

        <View style={[styles.body, { paddingBottom: 90 }]}>

        {/* Client + event info */}
        <View style={styles.section}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleBar} />
            <Text style={styles.sectionTitle}>Evento</Text>
          </View>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{event.name}</Text>
            {event.client_name ? <Text style={styles.clientLine}>Cliente: {event.client_name}</Text> : null}
            {event.client_email ? <Text style={styles.clientLine}>Email: {event.client_email}</Text> : null}
            {event.client_phone ? <Text style={styles.clientLine}>Telefono: {event.client_phone}</Text> : null}
            <Text style={styles.clientLine}>Data evento: {formatDate(event.event_date)}</Text>
            {event.location ? <Text style={styles.clientLine}>Location: {event.location}</Text> : null}
            {roomName ? <Text style={styles.clientLine}>Saletta: {roomName}</Text> : null}
            {event.guests_count ? <Text style={styles.clientLine}>Numero ospiti: {event.guests_count}</Text> : null}
          </View>
        </View>

        {/* Menu */}
        {menuCategories.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleBar} />
              <Text style={styles.sectionTitle}>Menu</Text>
            </View>
            {menuCategories.map((cat) => {
              const dishes = menuItemsByCategory.get(cat.id) ?? []
              const dishNames = dishes.map((d) => d.dish_name).join(', ') || '—'
              return (
                <View style={styles.menuCategoryBox} key={cat.id}>
                  <View style={styles.menuCategoryHeader}>
                    <Text style={styles.menuCategoryName}>{cat.name}</Text>
                    {cat.selection_type === 'a_scelta' ? (
                      <Text style={styles.menuCategoryPrice}>{formatCurrency(cat.price_per_guest ?? 0)}/persona</Text>
                    ) : null}
                  </View>
                  <Text style={styles.menuCategoryDishes}>
                    {cat.selection_type === 'a_scelta'
                      ? `A scelta tra: ${dishNames}`
                      : `${dishNames} (inclusi)`}
                  </Text>
                </View>
              )
            })}
          </View>
        ) : null}

        {/* Items table */}
        {revenues.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleBar} />
              <Text style={styles.sectionTitle}>Voci di preventivo</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.thName}>Descrizione</Text>
                <Text style={styles.thQty}>Qtà</Text>
                <Text style={styles.thPrice}>Prezzo unit.</Text>
                <Text style={styles.thTotal}>Totale</Text>
              </View>
              {revenues.map((item) => (
                <View style={styles.tableRow} key={item.id}>
                  <Text style={styles.tdName}>{item.name}</Text>
                  <Text style={styles.tdQty}>{item.quantity}</Text>
                  <Text style={styles.tdPrice}>{formatCurrency(item.unit_price)}</Text>
                  <Text style={styles.tdTotal}>{formatCurrency(item.quantity * item.unit_price)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Totals */}
        {(grandTotalRevenue > 0) ? (
          <View style={styles.section}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Imponibile</Text>
                <Text style={styles.totalsValue}>{formatCurrency(grandTotalRevenue)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IVA</Text>
                <Text style={styles.totalsValue}>{formatCurrency(totalVat)}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTALE</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(totalWithVat)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Payment terms */}
        {(companyInfo.paymentTerms || event.deposit_date) ? (
          <View style={styles.section}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleBar} />
              <Text style={styles.sectionTitle}>Condizioni di pagamento</Text>
            </View>
            <View style={styles.notesBox}>
              {event.deposit_date ? (
                <Text style={[styles.notesText, styles.depositText]}>
                  Acconto da versare entro il {formatDate(event.deposit_date)}
                </Text>
              ) : null}
              {companyInfo.paymentTerms ? <Text style={styles.notesText}>{companyInfo.paymentTerms}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* Contract terms */}
        {companyInfo.contractTerms ? (
          <View style={styles.section}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleBar} />
              <Text style={styles.sectionTitle}>Condizioni contrattuali</Text>
            </View>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{companyInfo.contractTerms}</Text>
            </View>
          </View>
        ) : null}

        </View>

        {/* Footer: company + bank details */}
        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>Ragione sociale</Text>
              <Text style={styles.footerValue}>{companyInfo.legalName || companyInfo.name}</Text>
              {companyInfo.taxCode ? <Text style={styles.footerValue}>CF {companyInfo.taxCode}</Text> : null}
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>Contatti</Text>
              {companyInfo.email ? <Text style={styles.footerValue}>{companyInfo.email}</Text> : null}
              {companyInfo.phone ? <Text style={styles.footerValue}>{companyInfo.phone}</Text> : null}
            </View>
            {companyInfo.iban ? (
              <View style={styles.footerCol}>
                <Text style={styles.footerLabel}>Coordinate bancarie</Text>
                <Text style={styles.footerValue}>IBAN {companyInfo.iban}</Text>
                {companyInfo.bankName ? <Text style={styles.footerValue}>{companyInfo.bankName}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}
