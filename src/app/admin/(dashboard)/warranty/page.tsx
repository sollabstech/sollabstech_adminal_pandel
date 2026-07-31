"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WarrantyRecord {
  id: string;
  serialNumber: string;
  laptopName: string;
  brand: string;
  specs: string;
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

const emptyForm = {
  serialNumber: "", laptopName: "", brand: "", specs: "",
  clientName: "", clientPhone: "", clientCity: "",
  purchaseDate: "", warrantyMonths: 6, price: "", notes: "",
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

function formatDate(ts: { seconds: number } | null | undefined) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function WarrantyPage() {
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, "warranty"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyRecord)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = records.filter((r) =>
    r.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    r.laptopName?.toLowerCase().includes(search.toLowerCase())
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!form.serialNumber.trim()) e.serialNumber = "Required";
    if (!form.laptopName.trim()) e.laptopName = "Required";
    if (!form.clientName.trim()) e.clientName = "Required";
    if (!form.clientPhone.trim()) e.clientPhone = "Required";
    if (!form.purchaseDate) e.purchaseDate = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    const endDate = calcEndDate(form.purchaseDate, form.warrantyMonths);
    try {
      await addDoc(collection(db, "warranty"), {
        ...form,
        warrantyEndDate: endDate,
        price: form.price.startsWith("₹") ? form.price : form.price ? `₹${form.price}` : "",
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setErrors({});
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
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

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Warranty Records</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${records.length} total · live from Firebase`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)" }}>
          <span style={{ fontSize: 18 }}>+</span> Add Warranty
        </button>
      </div>

      {/* Stats */}
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

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input placeholder="🔍  Search by serial, client, or laptop name..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {/* Table */}
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
                {["Serial No.", "Laptop", "Client", "Phone", "Purchase Date", "Warranty", "Status", "Actions"].map((h) => (
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{r.laptopName}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{r.brand}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: "white" }}>{r.clientName}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{r.clientCity}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <a href={`https://wa.me/91${r.clientPhone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#4ADE80", textDecoration: "none" }}>
                        💬 {r.clientPhone}
                      </a>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8" }}>{r.purchaseDate}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{r.warrantyMonths} months<br /><span style={{ fontSize: 11 }}>ends {r.warrantyEndDate}</span></td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button className="btn-sm btn-red" onClick={() => deleteDoc(doc(db, "warranty", r.id))}>Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(emptyForm); setErrors({}); } }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0D1526", border: "1px solid rgba(0,102,255,0.25)", borderRadius: 18, width: "100%", maxWidth: 560, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,102,255,0.06)", position: "sticky", top: 0, backdropFilter: "blur(12px)" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>🛡️ Add Warranty Record</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase instantly</div>
              </div>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setErrors({}); }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Laptop Info */}
              <div style={{ fontSize: 11, color: "#0066FF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Laptop Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Serial Number *</label>
                  <input placeholder="e.g. 197979" value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", border: errors.serialNumber ? "1px solid #FF6060" : undefined }} />
                  {errors.serialNumber && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.serialNumber}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Brand</label>
                  <input placeholder="e.g. Dell, HP, Asus" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Laptop Name *</label>
                <input placeholder="e.g. Dell XPS 15 9500" value={form.laptopName} onChange={(e) => setForm((f) => ({ ...f, laptopName: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", border: errors.laptopName ? "1px solid #FF6060" : undefined }} />
                {errors.laptopName && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.laptopName}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Specs</label>
                <input placeholder="e.g. i7-12th Gen · 16GB · 512GB SSD · RTX 3060" value={form.specs} onChange={(e) => setForm((f) => ({ ...f, specs: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              {/* Client Info */}
              <div style={{ fontSize: 11, color: "#0066FF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Client Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Client Name *</label>
                  <input placeholder="e.g. Arjun Mehta" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.clientName ? "1px solid #FF6060" : undefined }} />
                  {errors.clientName && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.clientName}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Phone *</label>
                  <input placeholder="e.g. 9384199108" value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.clientPhone ? "1px solid #FF6060" : undefined }} />
                  {errors.clientPhone && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.clientPhone}</div>}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>City</label>
                <input placeholder="e.g. Chennai" value={form.clientCity} onChange={(e) => setForm((f) => ({ ...f, clientCity: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              {/* Warranty Info */}
              <div style={{ fontSize: 11, color: "#0066FF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Warranty Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Purchase Date *</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.purchaseDate ? "1px solid #FF6060" : undefined }} />
                  {errors.purchaseDate && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.purchaseDate}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Months</label>
                  <select value={form.warrantyMonths} onChange={(e) => setForm((f) => ({ ...f, warrantyMonths: Number(e.target.value) }))} style={{ width: "100%", boxSizing: "border-box" }}>
                    {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Sale Price</label>
                  <input placeholder="e.g. 45000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
              {form.purchaseDate && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 12, color: "#4ADE80" }}>
                  ✓ Warranty ends on <strong>{calcEndDate(form.purchaseDate, form.warrantyMonths)}</strong> ({daysLeft(calcEndDate(form.purchaseDate, form.warrantyMonths))} days from today)
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label>
                <input placeholder="Any extra info..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setErrors({}); }}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,102,255,0.3)" }}>
                {saving ? "Saving..." : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
