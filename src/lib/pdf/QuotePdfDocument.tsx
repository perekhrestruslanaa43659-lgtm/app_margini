import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Event, EventItem } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/margin'
import type { CompanyInfo } from '@/lib/company'

const INK = '#1A1A1A'
const YELLOW = '#F5C518'
const MAROON = '#8B2E2E'
const CREAM = '#FBF6EC'
const GREY_100 = '#ece5d6'

const styles = StyleSheet.create({
  page: { fontSize: 10, color: INK, fontFamily: 'Helvetica' },
  headerBand: { backgroundColor: YELLOW, paddingHorizontal: 40, paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logoBadge: { width: 40, height: 40, backgroundColor: INK, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoText: { color: YELLOW, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: INK },
  small: { fontSize: 8, color: INK, opacity: 0.65, marginTop: 1 },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: INK, textAlign: 'right', letterSpacing: 1 },
  docMeta: { fontSize: 9, color: INK, opacity: 0.7, textAlign: 'right', marginTop: 2 },
  body: { paddingHorizontal: 40 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: MAROON, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  clientBox: { backgroundColor: CREAM, borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: MAROON },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  clientLine: { fontSize: 9, color: '#3a3a3a', marginTop: 1 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 6, marginBottom: 2 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: GREY_100, paddingVertical: 6, paddingHorizontal: 6 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: GREY_100, paddingVertical: 6, paddingHorizontal: 6, backgroundColor: CREAM },
  thName: { flex: 3, fontSize: 8, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase' },
  thQty: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'center' },
  thPrice: { flex: 1.3, fontSize: 8, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },
  thTotal: { flex: 1.3, fontSize: 8, fontFamily: 'Helvetica-Bold', color: YELLOW, textTransform: 'uppercase', textAlign: 'right' },
  tdName: { flex: 3, fontSize: 9.5 },
  tdQty: { flex: 1, fontSize: 9.5, textAlign: 'center' },
  tdPrice: { flex: 1.3, fontSize: 9.5, textAlign: 'right' },
  tdTotal: { flex: 1.3, fontSize: 9.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsBox: { alignSelf: 'flex-end', width: 220, marginTop: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { fontSize: 9, color: '#3a3a3a' },
  totalsValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: MAROON, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6 },
  grandTotalLabel: { fontSize: 10, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  grandTotalValue: { fontSize: 12, color: YELLOW, fontFamily: 'Helvetica-Bold' },
  notesBox: { backgroundColor: CREAM, borderRadius: 8, padding: 10, marginTop: 4, borderLeftWidth: 3, borderLeftColor: YELLOW },
  notesText: { fontSize: 9, color: '#5a4a1a' },
  depositText: { fontFamily: 'Helvetica-Bold', color: MAROON, marginBottom: 3 },
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
}

export function QuotePdfDocument({ event, revenues, totalRevenue, companyInfo, roomName }: Props) {
  const vatByRate = new Map<number, number>()
  for (const r of revenues) {
    const net = r.quantity * r.unit_price
    vatByRate.set(r.vat_rate, (vatByRate.get(r.vat_rate) ?? 0) + net * (r.vat_rate / 100))
  }
  const totalVat = Array.from(vatByRate.values()).reduce((a, b) => a + b, 0)
  const totalWithVat = totalRevenue + totalVat

  return (
    <Document title={`Preventivo ${event.name}`}>
      <Page size="A4" style={styles.page}>
        {/* Header band */}
        <View style={styles.headerBand}>
          <View>
            <View style={styles.logoBadge}><Text style={styles.logoText}>DM</Text></View>
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

        <View style={[styles.body, { paddingBottom: 90 }]}>

        {/* Client + event info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evento</Text>
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

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voci di preventivo</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.thName}>Descrizione</Text>
              <Text style={styles.thQty}>Qtà</Text>
              <Text style={styles.thPrice}>Prezzo unit.</Text>
              <Text style={styles.thTotal}>Totale</Text>
            </View>
            {revenues.map((item, i) => (
              <View style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow} key={item.id}>
                <Text style={styles.tdName}>{item.name}</Text>
                <Text style={styles.tdQty}>{item.quantity}</Text>
                <Text style={styles.tdPrice}>{formatCurrency(item.unit_price)}</Text>
                <Text style={styles.tdTotal}>{formatCurrency(item.quantity * item.unit_price)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Imponibile</Text>
              <Text style={styles.totalsValue}>{formatCurrency(totalRevenue)}</Text>
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

        {/* Payment terms */}
        {(companyInfo.paymentTerms || event.deposit_date) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condizioni di pagamento</Text>
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
