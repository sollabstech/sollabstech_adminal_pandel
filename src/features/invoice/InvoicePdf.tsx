import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { company } from "./company";
import {
  type Bill,
  accessoriesList,
  amountInWords,
  billTotals,
  describeProduct,
  formatDate,
  formatINR,
} from "./billing";

let fontsRegistered = false;

// Built-in PDF fonts have no ₹ glyph, so everything uses Noto Sans.
export function registerFonts(origin: string) {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${origin}/invoice/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/invoice/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const INK = "#111111";
const MUTED = "#555555";
const LINE = "#999999";
const SHADE = "#EEEEEE";

const s = StyleSheet.create({
  page: { fontFamily: "NotoSans", fontSize: 9, color: INK, padding: 32, paddingBottom: 40 },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center", maxWidth: 330 },
  logo: { width: 46, height: 54, marginRight: 10, objectFit: "contain" },
  shopName: { fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  small: { fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
  invoiceBox: { alignItems: "flex-end" },
  taxInvoice: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    borderWidth: 1.2,
    borderColor: INK,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  metaLine: { fontSize: 9, marginTop: 1 },
  bold: { fontWeight: 700 },
  rule: { borderBottomWidth: 1.2, borderBottomColor: INK, marginVertical: 12 },
  sectionLabel: { fontSize: 7.5, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 3 },
  billTo: { flexGrow: 1, borderWidth: 0.8, borderColor: LINE, padding: 8, marginRight: 8 },
  payBox: { width: 150, borderWidth: 0.8, borderColor: LINE, padding: 8 },
  table: { marginTop: 12, borderWidth: 0.8, borderColor: INK },
  th: { backgroundColor: SHADE, fontWeight: 700, fontSize: 8, borderBottomWidth: 0.8, borderBottomColor: INK },
  cell: { padding: 6, borderRightWidth: 0.8, borderRightColor: LINE },
  cellLast: { padding: 6 },
  itemRow: { borderTopWidth: 0.8, borderTopColor: LINE },
  colNo: { width: 22 },
  colType: { width: 50 },
  colDesc: { flexGrow: 1, flexBasis: 0 },
  colCond: { width: 62 },
  colAcc: { width: 90 },
  colAmt: { width: 78, textAlign: "right" },
  totalsWrap: { flexDirection: "row", marginTop: 10 },
  words: { flexGrow: 1, flexBasis: 0, paddingRight: 12 },
  totals: { width: 220, borderWidth: 0.8, borderColor: INK },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8 },
  tGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: SHADE,
    borderTopWidth: 0.8,
    borderTopColor: INK,
    fontWeight: 700,
    fontSize: 11,
  },
  exchangeBox: { marginTop: 10, borderWidth: 0.8, borderColor: LINE, padding: 7 },
  warranty: { marginTop: 14, borderWidth: 0.8, borderColor: INK, padding: 9 },
  wTitle: { fontWeight: 700, fontSize: 9.5, marginBottom: 5 },
  wItem: { flexDirection: "row", marginBottom: 2.5 },
  bullet: { width: 10 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  signCol: { width: 180 },
  authWrap: { flexDirection: "row", alignItems: "flex-end" },
  seal: { width: 92, height: 92, marginRight: 8, marginBottom: 0, objectFit: "contain" },
  signArea: { height: 44, justifyContent: "flex-end", alignItems: "center" },
  signImage: { maxHeight: 44, maxWidth: 170, objectFit: "contain" },
  signBox: { borderTopWidth: 0.8, borderTopColor: INK, paddingTop: 4, textAlign: "center", fontSize: 8.5 },
  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 22,
    borderTopWidth: 0.8,
    borderTopColor: LINE,
    paddingTop: 6,
    alignItems: "center",
  },
});

export default function InvoicePdf({ bill, origin }: { bill: Bill; origin: string }) {
  const t = billTotals(bill);
  // Files from /public (like the default signature) need the full URL; data URLs pass through.
  const absolute = (src: string) => (src.startsWith("/") ? `${origin}${src}` : src);
  const desc = describeProduct(bill);

  return (
    <Document title={`Invoice ${bill.invoiceNumber}`} author={company.name} creator={company.name}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={`${origin}/invoice/logo.png`} style={s.logo} />
            <View>
              <Text style={s.shopName}>{company.name.toUpperCase()}</Text>
              <Text style={s.small}>{company.address}</Text>
              <Text style={s.small}>
                Phone: {company.phone} · {company.email}
              </Text>
              {company.gstin ? (
                <Text style={[s.small, s.bold, { color: INK }]}>GSTIN: {company.gstin}</Text>
              ) : null}
            </View>
          </View>
          <View style={s.invoiceBox}>
            <Text style={s.taxInvoice}>TAX INVOICE</Text>
            <Text style={s.metaLine}>
              Invoice No: <Text style={s.bold}>{bill.invoiceNumber}</Text>
            </Text>
            <Text style={s.metaLine}>
              Date: <Text style={s.bold}>{formatDate(bill.invoiceDate)}</Text>
            </Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Bill to / payment */}
        <View style={s.row}>
          <View style={s.billTo}>
            <Text style={s.sectionLabel}>BILL TO</Text>
            <Text style={[s.bold, { fontSize: 10.5 }]}>{bill.customer.name}</Text>
            <Text>Phone: +91 {bill.customer.phone}</Text>
            {bill.customer.address.trim() ? <Text>{bill.customer.address}</Text> : null}
          </View>
          <View style={s.payBox}>
            <Text style={s.sectionLabel}>PAYMENT</Text>
            <Text style={s.bold}>{bill.paymentMode}</Text>
            <Text style={[s.small, { marginTop: 4 }]}>
              Place of supply: Tamil Nadu
            </Text>
          </View>
        </View>

        {/* Product table */}
        <View style={s.table}>
          <View style={[s.row, s.th]}>
            <Text style={[s.cell, s.colNo]}>#</Text>
            <Text style={[s.cell, s.colType]}>Type</Text>
            <Text style={[s.cell, s.colDesc]}>Description</Text>
            <Text style={[s.cell, s.colCond]}>Condition</Text>
            <Text style={[s.cell, s.colAcc]}>Accessories</Text>
            <Text style={[s.cellLast, s.colAmt]}>Taxable (₹)</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.cell, s.colNo]}>1</Text>
            <Text style={[s.cell, s.colType]}>{bill.type === "laptop" ? "Laptop" : "Mobile"}</Text>
            <View style={[s.cell, s.colDesc]}>
              {desc.map((line, i) => (
                <Text key={i} style={i === 0 ? [s.bold, { fontSize: 10 }] : { marginTop: 1.5 }}>
                  {line}
                </Text>
              ))}
            </View>
            <Text style={[s.cell, s.colCond]}>{bill.condition}</Text>
            <Text style={[s.cell, s.colAcc]}>{accessoriesList(bill)}</Text>
            <Text style={[s.cellLast, s.colAmt]}>{formatINR(t.lines[0])}</Text>
          </View>
          {bill.extras.map((x, i) => (
            <View key={x.id} style={[s.row, s.itemRow]} wrap={false}>
              <Text style={[s.cell, s.colNo]}>{i + 2}</Text>
              <Text style={[s.cell, s.colType]}>Add-on</Text>
              <View style={[s.cell, s.colDesc]}>
                <Text style={[s.bold, { fontSize: 10 }]}>{x.title}</Text>
                {x.description ? <Text style={{ marginTop: 1.5 }}>{x.description}</Text> : null}
              </View>
              <Text style={[s.cell, s.colCond]}>—</Text>
              <Text style={[s.cell, s.colAcc]}>—</Text>
              <Text style={[s.cellLast, s.colAmt]}>{formatINR(t.lines[i + 1])}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.words}>
            <Text style={s.sectionLabel}>{bill.exchange ? "AMOUNT PAYABLE IN WORDS" : "AMOUNT IN WORDS"}</Text>
            <Text style={s.bold}>{amountInWords(t.payable)}</Text>
            {bill.exchange ? (
              <View style={s.exchangeBox}>
                <Text style={s.sectionLabel}>EXCHANGE (OLD DEVICE RECEIVED)</Text>
                <Text>{bill.exchangeDevice}</Text>
                <Text style={s.bold}>Exchange value: ₹ {formatINR(t.exchange)}</Text>
              </View>
            ) : null}
            <Text style={[s.small, { marginTop: 6 }]}>
              {bill.inclusive ? "Price inclusive of GST." : "GST added to the quoted price."}
            </Text>
          </View>
          <View style={s.totals}>
            <View style={s.tRow}>
              <Text>Taxable value</Text>
              <Text>₹ {formatINR(t.taxable)}</Text>
            </View>
            <View style={s.tRow}>
              <Text>CGST @ {t.halfRate}%</Text>
              <Text>₹ {formatINR(t.cgst)}</Text>
            </View>
            <View style={s.tRow}>
              <Text>SGST @ {t.halfRate}%</Text>
              <Text>₹ {formatINR(t.sgst)}</Text>
            </View>
            {t.roundOff !== 0 ? (
              <View style={s.tRow}>
                <Text>Round off</Text>
                <Text>
                  {t.roundOff > 0 ? "+" : "−"} ₹ {formatINR(Math.abs(t.roundOff))}
                </Text>
              </View>
            ) : null}
            <View style={s.tGrand}>
              <Text>Grand Total</Text>
              <Text>₹ {formatINR(t.grandTotal)}</Text>
            </View>
            {bill.exchange ? (
              <>
                <View style={s.tRow}>
                  <Text>Less: Exchange</Text>
                  <Text>− ₹ {formatINR(t.exchange)}</Text>
                </View>
                <View style={s.tGrand}>
                  <Text>Amount Payable</Text>
                  <Text>₹ {formatINR(t.payable)}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Warranty */}
        <View style={s.warranty} wrap={false}>
          <Text style={s.wTitle}>{company.warranty.title}</Text>
          {company.warranty.covered.map((w) => (
            <View key={w.label} style={s.wItem}>
              <Text style={s.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={s.bold}>{w.label}: </Text>
                {w.text}
              </Text>
            </View>
          ))}
          <Text style={[s.small, { marginTop: 4, color: INK }]}>{company.warranty.notCovered}</Text>
        </View>

        {/* Signatures */}
        <View style={s.signRow} wrap={false}>
          <View style={s.signCol}>
            <View style={s.signArea}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {bill.customerSignature ? <Image src={absolute(bill.customerSignature)} style={s.signImage} /> : null}
            </View>
            <Text style={s.signBox}>Customer signature</Text>
          </View>
          <View style={s.authWrap}>
            {company.seal ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={absolute(company.seal)} style={s.seal} />
            ) : null}
            <View style={s.signCol}>
              <View style={s.signArea}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                {bill.authorisedSignature ? <Image src={absolute(bill.authorisedSignature)} style={s.signImage} /> : null}
              </View>
              <Text style={s.signBox}>For {company.name} — Authorised signature</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={[s.bold, { fontSize: 9.5, marginBottom: 2 }]}>{company.thankYou}</Text>
          <Text style={s.small}>
            Phone/WhatsApp: {company.whatsapp} · {company.website} · Instagram: {company.instagram}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
