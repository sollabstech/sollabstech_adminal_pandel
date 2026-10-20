"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { warrantyKey, savePublicWarranty, deletePublicWarranty, syncPhoneWarranty, normalisePhone } from "@/lib/warrantyPublic";

type DeviceType = "laptop" | "mobile";

interface WarrantyRecord {
  id: string;
  deviceType?: DeviceType;
  serialNumber: string;
  laptopName: string;
  brand: string;
  specs: string;
  imei1?: string;
  imei2?: string;
  clientName: string;
  clientPhone: string;
  clientCity: string;
  purchaseDate: string;
  warrantyMonths: number;
  warrantyEndDate: string;
  price: string;
  notes: string;
  createdAt?: { seconds: number } | null;
}

type FormState = Omit<WarrantyRecord, "id" | "createdAt" | "warrantyEndDate" | "deviceType" | "imei1" | "imei2"> & {
  deviceType: DeviceType;
  imei1: string;
  imei2: string;
};

const emptyForm: FormState = {
  deviceType: "laptop",
  serialNumber: "", laptopName: "", brand: "", specs: "", imei1: "", imei2: "",
  clientName: "", clientPhone: "", clientCity: "",
  purchaseDate: "", warrantyMonths: 12, price: "", notes: "",
};

function calcEndDate(start: string, months: number) {
  if (!start) return "";
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function daysLeft(endDate: string) {
  if (!endDate) return 0;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

const digits = (v: string) => v.replace(/\D/g, "");

const labelStyle: React.CSSProperties = { fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 };
const sectionStyle: React.CSSProperties = { fontSize: 11, color: "#0066FF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 };
const hintStyle: React.CSSProperties = { fontSize: 11, color: "#475569", marginTop: 4, lineHeight: 1.5 };
const errStyle: React.CSSProperties = { fontSize: 11, color: "#FF6060", marginTop: 3 };

export default function WarrantyPage() {
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<WarrantyRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const synced = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "warranty"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyRecord)));
      setLoading(false);
    }, (err) => {
      setLoadError(err.message);
      setLoading(false);
    });
  }, []);

  // Make sure every existing record has its public checker entry.
  useEffect(() => {
    if (loading || synced.current || records.length === 0) return;
    synced.current = true;
    records.forEach((r) => {
      if (r.serialNumber) savePublicWarranty(r).catch((e) => console.error("public warranty sync failed", e));
    });
    [...new Set(records.map((r) => normalisePhone(r.clientPhone ?? "")))].forEach((p) =>
      syncPhoneWarranty(p, records).catch((e) => console.error("phone warranty sync failed", e)));
  }, [loading, records]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const q = search.toLowerCase();
  const filtered = records.filter((r) =>
    r.serialNumber?.toLowerCase().includes(q) ||
    r.clientName?.toLowerCase().includes(q) ||
    r.clientPhone?.includes(search) ||
    r.laptopName?.toLowerCase().includes(q) ||
    r.imei1?.includes(search)
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(r: WarrantyRecord) {
    setEditing(r);
    setForm({
      deviceType: r.deviceType ?? "laptop",
      serialNumber: r.serialNumber ?? "", laptopName: r.laptopName ?? "", brand: r.brand ?? "", specs: r.specs ?? "",
      imei1: r.imei1 ?? "", imei2: r.imei2 ?? "",
      clientName: r.clientName ?? "", clientPhone: r.clientPhone ?? "", clientCity: r.clientCity ?? "",
      purchaseDate: r.purchaseDate ?? "", warrantyMonths: r.warrantyMonths ?? 12,
      price: (r.price ?? "").replace(/^₹/, ""), notes: r.notes ?? "",
    });
    setErrors({});
    setSaveError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError("");
  }

  function validate() {
    const e: Record<string, string> = {};
    const key = warrantyKey(form.serialNumber);
    if (key && records.some((r) => r.id !== editing?.id && warrantyKey(r.serialNumber ?? "") === key)) e.serialNumber = "This serial / warranty ID is already used by another record";
    if (!form.laptopName.trim()) e.laptopName = "Required";
    if (!form.clientName.trim()) e.clientName = "Required";
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(digits(form.clientPhone).replace(/^0/, ""))) e.clientPhone = "Enter a valid 10-digit mobile number";
    if (!form.purchaseDate) e.purchaseDate = "Required";
    if (form.deviceType === "mobile") {
      if (form.imei1 && digits(form.imei1).length !== 15) e.imei1 = "IMEI must be 15 digits";
      if (form.imei2 && digits(form.imei2).length !== 15) e.imei2 = "IMEI must be 15 digits";
      const serialDigits = digits(form.serialNumber);
      if (serialDigits.length >= 15 && [form.imei1, form.imei2].some((i) => i && digits(i) === serialDigits)) {
        e.serialNumber = "Don't use the IMEI as the warranty ID — the warranty ID is public";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    const warrantyEndDate = calcEndDate(form.purchaseDate, form.warrantyMonths);
    const data = {
      ...form,
      serialNumber: form.serialNumber.trim(),
      imei1: form.deviceType === "mobile" ? digits(form.imei1) : "",
      imei2: form.deviceType === "mobile" ? digits(form.imei2) : "",
      warrantyEndDate,
      price: form.price ? `₹${form.price.replace(/^₹/, "")}` : "",
    };
    try {
      if (editing) {
        await updateDoc(doc(db, "warranty", editing.id), data);
        if (editing.serialNumber && warrantyKey(editing.serialNumber) !== warrantyKey(data.serialNumber)) {
          await deletePublicWarranty(editing.serialNumber);
        }
      } else {
        await addDoc(collection(db, "warranty"), { ...data, createdAt: serverTimestamp() });
      }
      if (data.serialNumber) await savePublicWarranty(data);
      const after = [...records.filter((r) => r.id !== editing?.id), data];
      await syncPhoneWarranty(data.clientPhone, after);
      if (editing && normalisePhone(editing.clientPhone ?? "") !== normalisePhone(data.clientPhone)) {
        await syncPhoneWarranty(editing.clientPhone, after);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveError("Couldn't save. Check your connection and try again.");
    }
    setSaving(false);
  }

  async function handleDelete(r: WarrantyRecord) {
    if (!window.confirm(`Delete the warranty record for ${r.serialNumber} (${r.clientName})? Customers will no longer be able to check it online.`)) return;
    await deleteDoc(doc(db, "warranty", r.id));
    if (r.serialNumber) await deletePublicWarranty(r.serialNumber);
    await syncPhoneWarranty(r.clientPhone ?? "", records.filter((x) => x.id !== r.id));
  }

  function statusBadge(endDate: string) {
    const days = daysLeft(endDate);
    if (days < 0) return { label: "Expired", color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" };
    if (days <= 30) return { label: `${days}d left`, color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" };
    return { label: `${days}d left`, color: "#4ADE80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)" };
  }

  const expired = records.filter((r) => daysLeft(r.warrantyEndDate) < 0).length;
  const expiringSoon = records.filter((r) => { const d = daysLeft(r.warrantyEndDate); return d >= 0 && d <= 30; }).length;
  const active = records.filter((r) => daysLeft(r.warrantyEndDate) > 30).length;
  const isMobile = form.deviceType === "mobile";
  const endPreview = calcEndDate(form.purchaseDate, form.warrantyMonths);

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Warranty Records</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${records.length} total · customers check with their phone number at sollabstech.com/warranty`}
          </p>
        </div>
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)" }}>
          <span style={{ fontSize: 18 }}>+</span> Add Warranty
        </button>
      </div>

      <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 12.5, lineHeight: 1.6, background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.2)", color: "#94A3B8" }}>
        🔒 Customer name, phone, city, price, IMEI and notes stay private to admins. The public checker (by phone number) only shows the device, brand and warranty dates.
      </div>

      {loadError && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>
          Couldn&apos;t load warranty records: {loadError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active", value: active, color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
          { label: "Expiring Soon (≤30d)", value: expiringSoon, color: "#FBBF24", bg: "rgba(251,191,36,0.08)" },
          { label: "Expired", value: expired, color: "#F87171", bg: "rgba(248,113,113,0.08)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 20px", background: s.bg }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input placeholder="🔍  Search by serial, IMEI, client, phone or device..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 380 }} />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
            <div style={{ color: "#334155", fontSize: 14 }}>
              {records.length === 0 ? 'No warranty records yet. Click "+ Add Warranty" to add one.' : "No records match your search."}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Serial / ID", "Device", "Client", "Phone", "Purchase Date", "Warranty", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const badge = statusBadge(r.warrantyEndDate);
                return (
                  <tr key={r.id}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#60A5FA", fontWeight: 600 }}>{r.serialNumber}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{(r.deviceType ?? "laptop") === "mobile" ? "📱" : "💻"} {r.laptopName}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{r.brand}{r.imei1 ? ` · IMEI ${r.imei1}` : ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: "white" }}>{r.clientName}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{r.clientCity}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <a href={`https://wa.me/91${digits(r.clientPhone ?? "").slice(-10)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#4ADE80", textDecoration: "none" }}>
                        💬 {r.clientPhone}
                      </a>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{r.purchaseDate}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{r.warrantyMonths} months<br /><span style={{ fontSize: 11 }}>ends {r.warrantyEndDate}</span></td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <button className="btn-sm" onClick={() => openEdit(r)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn-sm btn-red" onClick={() => handleDelete(r)}>Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0D1526", border: "1px solid rgba(0,102,255,0.25)", borderRadius: 18, width: "100%", maxWidth: 580, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,102,255,0.06)", position: "sticky", top: 0, backdropFilter: "blur(12px)", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>🛡️ {editing ? "Edit Warranty Record" : "Add Warranty Record"}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Customer details stay private</div>
              </div>
              <button onClick={closeModal}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["laptop", "mobile"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => set("deviceType", t)}
                    style={{
                      padding: "10px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                      background: form.deviceType === t ? "linear-gradient(135deg,#0066FF,#0099FF)" : "rgba(255,255,255,0.04)",
                      color: form.deviceType === t ? "white" : "#64748B",
                      border: form.deviceType === t ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    {t === "laptop" ? "💻 Laptop" : "📱 Mobile"}
                  </button>
                ))}
              </div>

              <div style={sectionStyle}>{isMobile ? "Mobile Details" : "Laptop Details"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Serial / Warranty ID</label>
                  <input placeholder="e.g. 197979" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", border: errors.serialNumber ? "1px solid #FF6060" : undefined }} />
                  {errors.serialNumber
                    ? <div style={errStyle}>{errors.serialNumber}</div>
                    : <div style={hintStyle}>Optional. Customers check their warranty with their phone number.</div>}
                </div>
                <div>
                  <label style={labelStyle}>Brand</label>
                  <input placeholder={isMobile ? "e.g. Apple, ASUS ROG" : "e.g. Dell, HP, ASUS"} value={form.brand} onChange={(e) => set("brand", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{isMobile ? "Phone Model *" : "Laptop Name *"}</label>
                <input placeholder={isMobile ? "e.g. iPhone 13 128GB" : "e.g. Dell XPS 15 9500"} value={form.laptopName} onChange={(e) => set("laptopName", e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", border: errors.laptopName ? "1px solid #FF6060" : undefined }} />
                {errors.laptopName && <div style={errStyle}>{errors.laptopName}</div>}
              </div>
              <div>
                <label style={labelStyle}>Specs</label>
                <input placeholder={isMobile ? "e.g. 8GB · 256GB · Blue · Battery 92%" : "e.g. i7-12th Gen · 16GB · 512GB SSD · RTX 3060"} value={form.specs} onChange={(e) => set("specs", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              {isMobile && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>IMEI 1 🔒</label>
                    <input inputMode="numeric" placeholder="15 digits" value={form.imei1} onChange={(e) => set("imei1", e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", border: errors.imei1 ? "1px solid #FF6060" : undefined }} />
                    {errors.imei1 ? <div style={errStyle}>{errors.imei1}</div> : <div style={hintStyle}>Admin only, never public</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>IMEI 2 🔒</label>
                    <input inputMode="numeric" placeholder="15 digits (optional)" value={form.imei2} onChange={(e) => set("imei2", e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", border: errors.imei2 ? "1px solid #FF6060" : undefined }} />
                    {errors.imei2 && <div style={errStyle}>{errors.imei2}</div>}
                  </div>
                </div>
              )}

              <div style={sectionStyle}>Customer Details 🔒</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Customer Name *</label>
                  <input placeholder="e.g. Arjun Mehta" value={form.clientName} onChange={(e) => set("clientName", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.clientName ? "1px solid #FF6060" : undefined }} />
                  {errors.clientName && <div style={errStyle}>{errors.clientName}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input type="tel" placeholder="e.g. 9384199108" value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.clientPhone ? "1px solid #FF6060" : undefined }} />
                  {errors.clientPhone && <div style={errStyle}>{errors.clientPhone}</div>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input placeholder="e.g. Madurai" value={form.clientCity} onChange={(e) => set("clientCity", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={sectionStyle}>Warranty Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Purchase Date *</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.purchaseDate ? "1px solid #FF6060" : undefined }} />
                  {errors.purchaseDate && <div style={errStyle}>{errors.purchaseDate}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Warranty</label>
                  <select value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", Number(e.target.value))} style={{ width: "100%", boxSizing: "border-box" }}>
                    {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sale Price 🔒</label>
                  <input inputMode="numeric" placeholder="e.g. 45000" value={form.price} onChange={(e) => set("price", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
              {form.purchaseDate && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 12, color: "#4ADE80" }}>
                  ✓ Warranty ends on <strong>{endPreview}</strong> ({daysLeft(endPreview)} days from today)
                </div>
              )}
              <div>
                <label style={labelStyle}>Notes 🔒</label>
                <input placeholder="Any extra info..." value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              {saveError && <div style={{ ...errStyle, fontSize: 13 }}>{saveError}</div>}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={closeModal}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,102,255,0.3)" }}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
