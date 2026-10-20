export type ProductType = "laptop" | "mobile";
export type Condition = "New" | "Refurbished" | "Pre-owned";
export type WarrantyOption = "No warranty" | "Brand warranty" | "Shop warranty";
export type PaymentMode = "Cash" | "UPI" | "Card" | "Bank transfer";

export const CONDITIONS: Condition[] = ["New", "Refurbished", "Pre-owned"];
export const WARRANTY_OPTIONS: WarrantyOption[] = ["No warranty", "Brand warranty", "Shop warranty"];
export const PAYMENT_MODES: PaymentMode[] = ["Cash", "UPI", "Card", "Bank transfer"];
export const LAPTOP_ACCESSORIES = ["Charger", "Bag", "Mouse", "Box", "Full box"] as const;
export const MOBILE_ACCESSORIES = ["Charger", "Cable", "Box", "Full box"] as const;
// Ticked on every new bill and when switching product type.
export const DEFAULT_ACCESSORIES = ["Charger"];

export type LaptopFields = {
  brand: string;
  model: string;
  processor: string;
  ram: string;
  storage: string;
  screen: string;
  graphics: string;
  os: string;
  serial: string;
};

export type MobileFields = {
  brand: string;
  model: string;
  ram: string;
  storage: string;
  colour: string;
  imei1: string;
  imei2: string;
};

export type Bill = {
  type: ProductType;
  invoiceNumber: string;
  invoiceDate: string; // yyyy-mm-dd
  customer: { name: string; phone: string; address: string };
  laptop: LaptopFields;
  mobile: MobileFields;
  condition: Condition;
  warranty: WarrantyOption;
  warrantyNote: string; // e.g. "valid till Mar 2027"
  accessories: string[];
  otherAccessory: string;
  amount: string;
  extras: ExtraItem[];
  // Old device the customer trades in; its value is taken off the bill after GST.
  exchange: boolean;
  exchangeDevice: string;
  exchangeValue: string;
  // Signatures as PNG data URLs (memory only).
  customerSignature: string | null;
  authorisedSignature: string | null;
  gstRate: string;
  inclusive: boolean;
  paymentMode: PaymentMode;
};

// Extra items sold with the main product (e.g. a keyboard with a laptop).
export type ExtraItem = { id: string; title: string; description: string; amount: string };

let extraSeq = 0;
export function newExtraItem(): ExtraItem {
  extraSeq += 1;
  return { id: `x${Date.now()}-${extraSeq}`, title: "", description: "", amount: "" };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function newInvoiceNumber(d = new Date()): string {
  return `SLT-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`;
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyBill(defaultGstRate: number): Bill {
  const now = new Date();
  return {
    type: "laptop",
    invoiceNumber: newInvoiceNumber(now),
    invoiceDate: todayISO(now),
    customer: { name: "", phone: "", address: "" },
    laptop: { brand: "", model: "", processor: "", ram: "", storage: "", screen: "", graphics: "", os: "", serial: "" },
    mobile: { brand: "", model: "", ram: "", storage: "", colour: "", imei1: "", imei2: "" },
    condition: "New",
    warranty: "No warranty",
    warrantyNote: "",
    accessories: [...DEFAULT_ACCESSORIES],
    otherAccessory: "",
    amount: "",
    extras: [],
    exchange: false,
    exchangeDevice: "",
    exchangeValue: "",
    customerSignature: null,
    authorisedSignature: null,
    gstRate: String(defaultGstRate),
    inclusive: true,
    paymentMode: "Cash",
  };
}

// ---------- GST maths (all in integer paise to avoid float drift) ----------

export type Totals = {
  lines: number[]; // taxable value of each item: main product first, then extras
  taxable: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  grandTotal: number;
  exchange: number; // trade-in value deducted after GST (0 when none)
  payable: number; // grandTotal − exchange
  halfRate: number;
};

const toPaise = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

export function computeTotals(amounts: string[], rateStr: string, inclusive: boolean): Totals {
  const rate = Number(rateStr);
  const r = Number.isFinite(rate) && rate >= 0 ? rate : 0;
  const amountsP = amounts.map(toPaise);

  const linesP = amountsP.map((a) => (inclusive ? Math.round((a * 100) / (100 + r)) : a));
  const taxableP = linesP.reduce((x, y) => x + y, 0);
  const halfP = Math.round((taxableP * r) / 200);
  const sumP = taxableP + halfP * 2;
  // When prices include GST, the customer pays exactly the entered amounts;
  // any paisa lost to rounding shows as a round-off line.
  const grandP = inclusive ? amountsP.reduce((x, y) => x + y, 0) : sumP;

  return {
    lines: linesP.map((p) => p / 100),
    taxable: taxableP / 100,
    cgst: halfP / 100,
    sgst: halfP / 100,
    roundOff: (grandP - sumP) / 100,
    grandTotal: grandP / 100,
    halfRate: r / 2,
    exchange: 0,
    payable: grandP / 100,
  };
}

export function billTotals(bill: Bill): Totals {
  const t = computeTotals([bill.amount, ...bill.extras.map((x) => x.amount)], bill.gstRate, bill.inclusive);
  if (!bill.exchange) return t;
  const exchangeP = toPaise(bill.exchangeValue);
  const grandP = Math.round(t.grandTotal * 100);
  return { ...t, exchange: exchangeP / 100, payable: (grandP - exchangeP) / 100 };
}

export function formatINR(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Amount in words (Indian system) ----------

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  let words = `${integerToWords(rupees)} Rupees`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}

// ---------- Description + validation ----------

export function warrantyLine(bill: Bill): string {
  const note = bill.warranty !== "No warranty" ? bill.warrantyNote.trim() : "";
  return `Warranty: ${bill.warranty}${note ? ` (${note})` : ""}`;
}

// Adds a label like "RAM" unless the user already typed it ("64GB RAM" stays as is).
function withLabel(value: string, label: string): string {
  if (!value) return "";
  return value.toLowerCase().includes(label.toLowerCase()) ? value : `${value} ${label}`;
}

export function describeProduct(bill: Bill): string[] {
  if (bill.type === "laptop") {
    const l = bill.laptop;
    const title = [l.brand, l.model].filter(Boolean).join(" ");
    const specs = [
      l.processor,
      withLabel(l.ram, "RAM"),
      l.storage,
      withLabel(l.screen, "display"),
      l.graphics,
      l.os,
    ].filter(Boolean);
    return [title, specs.join(" | "), l.serial && `Serial No: ${l.serial}`, warrantyLine(bill)].filter(Boolean) as string[];
  }
  const m = bill.mobile;
  const title = [m.brand, m.model].filter(Boolean).join(" ");
  const specs = [withLabel(m.ram, "RAM"), withLabel(m.storage, "storage"), m.colour].filter(Boolean);
  return [
    title,
    specs.join(" | "),
    m.imei1 && `IMEI 1: ${m.imei1}`,
    m.imei2 && `IMEI 2: ${m.imei2}`,
    warrantyLine(bill),
  ].filter(Boolean) as string[];
}

export function accessoriesList(bill: Bill): string {
  const list = [...bill.accessories];
  if (bill.otherAccessory.trim()) list.push(bill.otherAccessory.trim());
  return list.length ? list.join(", ") : "None";
}

export type Errors = Partial<Record<string, string>>;

export function validate(bill: Bill): Errors {
  const e: Errors = {};
  if (!bill.customer.name.trim()) e.name = "Customer name is required.";
  if (!/^[6-9]\d{9}$/.test(bill.customer.phone)) e.phone = "Enter a valid 10-digit mobile number (starts with 6–9).";

  const p = bill.type === "laptop" ? bill.laptop : bill.mobile;
  if (!p.brand.trim()) e.brand = "Brand is required.";
  if (!p.model.trim()) e.model = "Model is required.";


  if (!toPaise(bill.amount)) e.amount = "Enter the amount.";
  if (bill.exchange) {
    if (!bill.exchangeDevice.trim()) e.exchangeDevice = "Describe the old device.";
    if (!toPaise(bill.exchangeValue)) e.exchangeValue = "Enter the exchange value.";
    else if (billTotals(bill).payable < 0) e.exchangeValue = "Exchange value can't be more than the bill total.";
  }
  for (const x of bill.extras) {
    if (!x.title.trim()) e[`${x.id}-title`] = "Item name is required.";
    if (!toPaise(x.amount)) e[`${x.id}-amount`] = "Enter the amount.";
  }
  const rate = Number(bill.gstRate);
  if (bill.gstRate === "" || !Number.isFinite(rate) || rate < 0 || rate > 100) e.gstRate = "GST rate must be 0–100.";
  if (!bill.invoiceNumber.trim()) e.invoiceNumber = "Invoice number is required.";
  if (!bill.invoiceDate) e.invoiceDate = "Invoice date is required.";
  return e;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function pdfFileName(bill: Bill): string {
  const name = bill.customer.name.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Customer";
  const inv = bill.invoiceNumber.trim().replace(/[^A-Za-z0-9-]+/g, "-");
  return `Invoice-${inv}-${name}.pdf`;
}
