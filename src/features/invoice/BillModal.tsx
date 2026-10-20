"use client";

import { useEffect, useMemo, useState } from "react";
import { company } from "./company";
import {
  type Bill,
  type Condition,
  type PaymentMode,
  type WarrantyOption,
  CONDITIONS,
  LAPTOP_ACCESSORIES,
  MOBILE_ACCESSORIES,
  PAYMENT_MODES,
  WARRANTY_OPTIONS,
  billTotals,
  emptyBill,
  formatINR,
  pdfFileName,
  validate,
} from "./billing";
import SignatureInput from "./SignatureInput";

// The product fields this modal reads. Matches the admin products collection.
export interface BillableProduct {
  name: string;
  price: number;
  condition?: string;
  category?: string;
  productType?: "laptop" | "mobile";
  brand?: string;
  processor?: string;
  ram?: string;
  storageType?: string;
  storageSize?: string;
  graphicsCard?: string;
  display?: string;
  os?: string;
  mobileColor?: string;
  mobileRam?: string;
  mobileStorage?: string;
}

const MOBILE_CATEGORIES = ["Smartphones", "Gaming Phones", "Mobile Phones", "Refurbished Phones"];

function mapCondition(c = ""): Condition {
  const v = c.toLowerCase();
  if (v.includes("new")) return "New";
  if (v.includes("used") || v.includes("pre-owned")) return "Pre-owned";
  return "Refurbished"; // Demo and Refurbished
}

// Splits the product name into brand + model when the product has no brand field.
function brandAndModel(p: BillableProduct): { brand: string; model: string } {
  const name = p.name.trim();
  if (p.brand?.trim()) {
    const brand = p.brand.trim();
    const model = name.toLowerCase().startsWith(brand.toLowerCase()) ? name.slice(brand.length).trim() : name;
    return { brand, model: model || name };
  }
  const [first, ...rest] = name.split(/\s+/);
  return { brand: first ?? "", model: rest.join(" ") || name };
}

function billFromProduct(p: BillableProduct): Bill {
  const bill = emptyBill(company.defaultGstRate);
  const type = p.productType === "mobile" || MOBILE_CATEGORIES.includes(p.category ?? "") ? "mobile" : "laptop";
  const { brand, model } = brandAndModel(p);
  bill.type = type;
  bill.condition = mapCondition(p.condition);
  bill.amount = p.price ? String(p.price) : "";
  bill.authorisedSignature = company.authorisedSignature;
  if (type === "laptop") {
    bill.laptop = {
      ...bill.laptop,
      brand, model,
      processor: p.processor ?? "",
      ram: p.ram ?? "",
      storage: [p.storageSize, p.storageType].filter(Boolean).join(" "),
      screen: p.display ?? "",
      graphics: p.graphicsCard ?? "",
      os: p.os ?? "",
    };
  } else {
    bill.mobile = { ...bill.mobile, brand, model, ram: p.mobileRam ?? p.ram ?? "", storage: p.mobileStorage ?? "", colour: p.mobileColor ?? "" };
  }
  return bill;
}

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 5, display: "block" };
const errText: React.CSSProperties = { fontSize: 12, color: "#F87171", marginTop: 4 };
const section: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: 1, textTransform: "uppercase", margin: "18px 0 10px" };

export default function BillModal({ product, onClose }: { product: BillableProduct; onClose: () => void }) {
  // The bill lives only in this component's state; nothing is saved.
  const [bill, setBill] = useState<Bill>(() => billFromProduct(product));
  const [editProduct, setEditProduct] = useState(false);
  const [more, setMore] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  const errors = useMemo(() => validate(bill), [bill]);
  const totals = billTotals(bill);
  const isLaptop = bill.type === "laptop";
  const p = isLaptop ? bill.laptop : bill.mobile;
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  const set = <K extends keyof Bill>(k: K, v: Bill[K]) => setBill((b) => ({ ...b, [k]: v }));
  const setCustomer = (k: keyof Bill["customer"], v: string) => setBill((b) => ({ ...b, customer: { ...b.customer, [k]: v } }));
  const setProduct = (k: string, v: string) =>
    setBill((b) => (b.type === "laptop" ? { ...b, laptop: { ...b.laptop, [k]: v } } : { ...b, mobile: { ...b.mobile, [k]: v } }));
  const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  const productErrorKeys = ["brand", "model", "amount"];
  // Open the product editor if one of its fields is what's blocking the download.
  useEffect(() => {
    if (showErrors && productErrorKeys.some((k) => errors[k])) setEditProduct(true);
    if (showErrors && ["gstRate", "invoiceNumber", "invoiceDate"].some((k) => errors[k])) setMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showErrors, errors]);

  async function download() {
    setDownloadError("");
    if (Object.keys(errors).length) {
      setShowErrors(true);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-bill] [aria-invalid='true']")?.focus());
      return;
    }
    setBusy(true);
    try {
      const [{ pdf }, { default: InvoicePdf, registerFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./InvoicePdf"),
      ]);
      const origin = window.location.origin;
      registerFonts(origin);
      const blob = await pdf(<InvoicePdf bill={bill} origin={origin} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFileName(bill);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      console.error(e);
      setDownloadError("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = (props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => {
    const { invalid, style, ...rest } = props;
    return <input aria-invalid={invalid || undefined} {...rest} style={{ width: "100%", height: 42, ...(invalid ? { borderColor: "#F87171" } : {}), ...style }} />;
  };

  const accessories: readonly string[] = isLaptop ? LAPTOP_ACCESSORIES : MOBILE_ACCESSORIES;
  const specs = isLaptop
    ? [bill.laptop.processor, bill.laptop.ram, bill.laptop.storage, bill.laptop.screen, bill.laptop.graphics, bill.laptop.os]
    : [bill.mobile.ram, bill.mobile.storage, bill.mobile.colour];

  return (
    <div className="bill-overlay" onClick={() => !busy && onClose()}>
      <div className="bill-sheet" data-bill role="dialog" aria-modal="true" aria-label={`Bill — ${product.name}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bill — {product.name}</div>
            <div style={{ fontSize: 12.5, color: "#64748B" }}>GST tax invoice · nothing is saved</div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="btn-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#94A3B8", fontSize: 16, padding: "4px 10px" }}>✕</button>
        </div>

        <div style={{ padding: "4px 20px 20px", overflowY: "auto", flex: 1 }}>
          {/* Product summary */}
          <div style={section}>Product</div>
          <div style={{ padding: 14, borderRadius: 12, background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 700 }}>{isLaptop ? "💻" : "📱"} {[p.brand, p.model].filter(Boolean).join(" ")}</div>
                <div style={{ fontSize: 12.5, color: "#8193AB", marginTop: 3 }}>{specs.filter(Boolean).join(" · ") || "No specs"}</div>
                <div style={{ fontSize: 12.5, color: "#8193AB", marginTop: 3 }}>Condition: {bill.condition}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>₹{formatINR(Number(bill.amount) || 0)}</div>
                <button type="button" onClick={() => setEditProduct((v) => !v)} style={{ background: "none", border: "none", color: "#60A5FA", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, marginTop: 4 }}>
                  {editProduct ? "Done" : "Edit"}
                </button>
              </div>
            </div>
            {editProduct && (
              <div className="bill-grid" style={{ marginTop: 14 }}>
                <div><label style={label}>Brand *</label>{input({ value: p.brand, onChange: (e) => setProduct("brand", e.target.value), invalid: !!err("brand") })}{err("brand") && <div style={errText}>{err("brand")}</div>}</div>
                <div><label style={label}>Model *</label>{input({ value: p.model, onChange: (e) => setProduct("model", e.target.value), invalid: !!err("model") })}{err("model") && <div style={errText}>{err("model")}</div>}</div>
                {isLaptop ? (
                  <>
                    <div><label style={label}>Processor</label>{input({ value: bill.laptop.processor, onChange: (e) => setProduct("processor", e.target.value) })}</div>
                    <div><label style={label}>RAM</label>{input({ value: bill.laptop.ram, onChange: (e) => setProduct("ram", e.target.value) })}</div>
                    <div><label style={label}>Storage</label>{input({ value: bill.laptop.storage, onChange: (e) => setProduct("storage", e.target.value) })}</div>
                    <div><label style={label}>Screen</label>{input({ value: bill.laptop.screen, onChange: (e) => setProduct("screen", e.target.value) })}</div>
                    <div><label style={label}>Graphics</label>{input({ value: bill.laptop.graphics, onChange: (e) => setProduct("graphics", e.target.value) })}</div>
                    <div><label style={label}>OS</label>{input({ value: bill.laptop.os, onChange: (e) => setProduct("os", e.target.value) })}</div>
                  </>
                ) : (
                  <>
                    <div><label style={label}>RAM</label>{input({ value: bill.mobile.ram, onChange: (e) => setProduct("ram", e.target.value) })}</div>
                    <div><label style={label}>Storage</label>{input({ value: bill.mobile.storage, onChange: (e) => setProduct("storage", e.target.value) })}</div>
                    <div><label style={label}>Colour</label>{input({ value: bill.mobile.colour, onChange: (e) => setProduct("colour", e.target.value) })}</div>
                  </>
                )}
                <div>
                  <label style={label}>Condition</label>
                  <select value={bill.condition} onChange={(e) => set("condition", e.target.value as Condition)} style={{ height: 42 }}>
                    {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={label}>Amount (₹) *</label>{input({ inputMode: "decimal", value: bill.amount, onChange: (e) => set("amount", e.target.value.replace(/[^\d.]/g, "")), invalid: !!err("amount") })}{err("amount") && <div style={errText}>{err("amount")}</div>}</div>
              </div>
            )}
          </div>

          {/* Customer */}
          <div style={section}>Customer</div>
          <div className="bill-grid">
            <div><label style={label}>Name *</label>{input({ value: bill.customer.name, onChange: (e) => setCustomer("name", e.target.value), placeholder: "Customer name", autoComplete: "off", invalid: !!err("name") })}{err("name") && <div style={errText}>{err("name")}</div>}</div>
            <div><label style={label}>Phone *</label>{input({ type: "tel", inputMode: "numeric", value: bill.customer.phone, onChange: (e) => setCustomer("phone", digits(e.target.value, 10)), placeholder: "10-digit mobile", invalid: !!err("phone") })}{err("phone") && <div style={errText}>{err("phone")}</div>}</div>
            <div style={{ gridColumn: "1 / -1" }}><label style={label}>Address</label>{input({ value: bill.customer.address, onChange: (e) => setCustomer("address", e.target.value), placeholder: "Optional" })}</div>
          </div>

          {/* Unit */}
          <div style={section}>{isLaptop ? "This laptop" : "This phone"}</div>
          {isLaptop ? (
            <div><label style={label}>Serial number</label>{input({ value: bill.laptop.serial, onChange: (e) => setProduct("serial", e.target.value), placeholder: "From the sticker underneath", style: { fontFamily: "monospace" } })}</div>
          ) : (
            <div className="bill-grid">
              <div><label style={label}>IMEI 1 *</label>{input({ inputMode: "numeric", value: bill.mobile.imei1, onChange: (e) => setProduct("imei1", digits(e.target.value, 15)), placeholder: "15 digits (dial *#06#)", invalid: !!err("imei1"), style: { fontFamily: "monospace" } })}{err("imei1") && <div style={errText}>{err("imei1")}</div>}</div>
              <div><label style={label}>IMEI 2</label>{input({ inputMode: "numeric", value: bill.mobile.imei2, onChange: (e) => setProduct("imei2", digits(e.target.value, 15)), placeholder: "Optional", invalid: !!err("imei2"), style: { fontFamily: "monospace" } })}{err("imei2") && <div style={errText}>{err("imei2")}</div>}</div>
            </div>
          )}

          {/* Payment */}
          <div style={section}>Payment</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PAYMENT_MODES.map((m) => (
              <button key={m} type="button" onClick={() => set("paymentMode", m as PaymentMode)} aria-pressed={bill.paymentMode === m} className="btn-sm" style={{
                padding: "9px 14px", fontSize: 13, fontWeight: 600,
                background: bill.paymentMode === m ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                color: bill.paymentMode === m ? "#A5B4FC" : "#94A3B8",
                border: `1px solid ${bill.paymentMode === m ? "rgba(129,140,248,0.6)" : "rgba(255,255,255,0.08)"}`,
              }}>{m}</button>
            ))}
          </div>

          {/* More options */}
          <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} style={{ ...section, background: "none", border: "none", cursor: "pointer", padding: 0, display: "block", color: "#94A3B8" }}>
            {more ? "▾" : "▸"} More options
          </button>
          {more && (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="bill-grid">
                <div><label style={label}>GST rate (%)</label>{input({ inputMode: "decimal", value: bill.gstRate, onChange: (e) => set("gstRate", e.target.value.replace(/[^\d.]/g, "")), invalid: !!err("gstRate") })}{err("gstRate") && <div style={errText}>{err("gstRate")}</div>}</div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#C4D0E0", alignSelf: "end", height: 42 }}>
                  <input type="checkbox" checked={bill.inclusive} onChange={(e) => set("inclusive", e.target.checked)} style={{ width: 16, height: 16 }} />
                  Price includes GST
                </label>
              </div>
              <div>
                <label style={label}>Accessories</label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {accessories.map((a) => (
                    <label key={a} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#C4D0E0" }}>
                      <input type="checkbox" checked={bill.accessories.includes(a)} style={{ width: 16, height: 16 }}
                        onChange={(e) => set("accessories", e.target.checked ? [...bill.accessories, a] : bill.accessories.filter((x) => x !== a))} />
                      {a}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>{input({ value: bill.otherAccessory, onChange: (e) => set("otherAccessory", e.target.value), placeholder: "Other accessory (optional)" })}</div>
              </div>
              <div className="bill-grid">
                <div>
                  <label style={label}>Warranty</label>
                  <select value={bill.warranty} onChange={(e) => set("warranty", e.target.value as WarrantyOption)} style={{ height: 42 }}>
                    {WARRANTY_OPTIONS.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </div>
                {bill.warranty !== "No warranty" && (
                  <div><label style={label}>Warranty details</label>{input({ value: bill.warrantyNote, onChange: (e) => set("warrantyNote", e.target.value), placeholder: "e.g. valid till Mar 2027" })}</div>
                )}
              </div>
              <div className="bill-grid">
                <div><label style={label}>Invoice number</label>{input({ value: bill.invoiceNumber, onChange: (e) => set("invoiceNumber", e.target.value), invalid: !!err("invoiceNumber"), style: { fontFamily: "monospace" } })}{err("invoiceNumber") && <div style={errText}>{err("invoiceNumber")}</div>}</div>
                <div><label style={label}>Date</label>{input({ type: "date", value: bill.invoiceDate, onChange: (e) => set("invoiceDate", e.target.value), invalid: !!err("invoiceDate") })}{err("invoiceDate") && <div style={errText}>{err("invoiceDate")}</div>}</div>
              </div>
              <SignatureInput label="Customer signature (optional)" value={bill.customerSignature} onChange={(v) => set("customerSignature", v)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: "#64748B" }}>Total (incl. {bill.gstRate || 0}% GST)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>₹{formatINR(totals.payable)}</div>
            {showErrors && Object.keys(errors).length > 0 && <div style={{ ...errText, marginTop: 2 }}>Fix the highlighted fields</div>}
            {downloadError && <div style={{ ...errText, marginTop: 2 }}>{downloadError}</div>}
          </div>
          <button type="button" onClick={download} disabled={busy} style={{
            padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: busy ? "wait" : "pointer", border: "none",
            color: "white", background: "linear-gradient(135deg,#4F46E5,#0066FF)", opacity: busy ? 0.7 : 1, whiteSpace: "nowrap",
          }}>
            {busy ? "Preparing…" : "⬇ Download PDF"}
          </button>
        </div>
      </div>

      <style>{`
        .bill-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .bill-sheet { width: 100%; max-width: 620px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; background: #0B1526; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; overflow: hidden; }
        .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) {
          .bill-overlay { align-items: flex-end; padding: 0; }
          .bill-sheet { max-width: none; max-height: 92vh; border-radius: 18px 18px 0 0; }
          .bill-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
