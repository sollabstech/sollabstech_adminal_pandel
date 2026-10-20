"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Default shares taken from every deal's profit. Each deal can override them.
const DEFAULT_SOLLABS = 500;
const DEFAULT_COGNITO = 1000;

interface Deal {
  id: string;
  laptop: string;
  date: string;
  buyPrice: number;
  soldPrice: number;
  sollabsShare: number;
  cognitoShare: number;
  note?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ laptop: "", date: today(), buyPrice: "", soldPrice: "", sollabsShare: String(DEFAULT_SOLLABS), cognitoShare: String(DEFAULT_COGNITO), note: "" });
const inr = (n: number) => (n < 0 ? "-" : "") + "₹" + Math.abs(n).toLocaleString("en-IN");
const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

function calc(d: { buyPrice: number; soldPrice: number; sollabsShare: number; cognitoShare: number }) {
  const profit = d.soldPrice - d.buyPrice;
  return { profit, partner: profit - d.sollabsShare - d.cognitoShare };
}

export default function PartnerPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "partnerDeals"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deal)));
      setLoading(false);
    }, (err) => { setLoadError(err.message); setLoading(false); });
  }, []);

  const months = [...new Set(deals.map((d) => d.date.slice(0, 7)))];
  const shown = month === "all" ? deals : deals.filter((d) => d.date.startsWith(month));
  const totals = shown.reduce((t, d) => {
    const c = calc(d);
    return { profit: t.profit + c.profit, sollabs: t.sollabs + d.sollabsShare, cognito: t.cognito + d.cognitoShare, partner: t.partner + c.partner, sold: t.sold + d.soldPrice };
  }, { profit: 0, sollabs: 0, cognito: 0, partner: 0, sold: 0 });

  const draft = { buyPrice: num(form.buyPrice), soldPrice: num(form.soldPrice), sollabsShare: num(form.sollabsShare), cognitoShare: num(form.cognitoShare) };
  const preview = calc(draft);
  const set = (k: keyof ReturnType<typeof blank>) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.laptop.trim() || !draft.buyPrice || !draft.soldPrice) return;
    setSaving(true);
    const data = { laptop: form.laptop.trim(), date: form.date || today(), ...draft, note: form.note.trim() };
    try {
      if (editing) await updateDoc(doc(db, "partnerDeals", editing), data);
      else await addDoc(collection(db, "partnerDeals"), { ...data, createdAt: serverTimestamp() });
      setForm(blank()); setEditing(null);
    } catch (err) {
      alert("Couldn't save: " + (err as Error).message);
    }
    setSaving(false);
  }

  function edit(d: Deal) {
    setEditing(d.id);
    setForm({ laptop: d.laptop, date: d.date, buyPrice: String(d.buyPrice), soldPrice: String(d.soldPrice), sollabsShare: String(d.sollabsShare), cognitoShare: String(d.cognitoShare), note: d.note ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(d: Deal) {
    if (window.confirm(`Delete the deal for ${d.laptop}?`)) await deleteDoc(doc(db, "partnerDeals", d.id));
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const pdf = new jsPDF();
    // The built-in PDF font has no ₹ glyph, so the report uses "Rs."
    const rs = (n: number) => (n < 0 ? "-" : "") + "Rs. " + Math.abs(n).toLocaleString("en-IN");
    const period = month === "all" ? "All time" : new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    pdf.setFontSize(18); pdf.text("Sollabs Tech - Partner Report", 14, 18);
    pdf.setFontSize(10); pdf.setTextColor(100);
    pdf.text(`Period: ${period}    Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 25);

    autoTable(pdf, {
      startY: 31,
      head: [["Summary", "Amount"]],
      body: [
        ["Laptops sold", String(shown.length)],
        ["Total sales", rs(totals.sold)],
        ["Total profit", rs(totals.profit)],
        ["Sollabs Tech share", rs(totals.sollabs)],
        ["Cognito Tech Media share", rs(totals.cognito)],
        ["Partner balance", rs(totals.partner)],
      ],
      theme: "grid", headStyles: { fillColor: [0, 102, 255] }, columnStyles: { 1: { halign: "right" } }, tableWidth: 110,
    });

    autoTable(pdf, {
      startY: (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [["Date", "Laptop", "Bought", "Sold", "Profit", "Sollabs", "Cognito", "Partner"]],
      body: shown.map((d) => { const c = calc(d); return [d.date, d.laptop, rs(d.buyPrice), rs(d.soldPrice), rs(c.profit), rs(d.sollabsShare), rs(d.cognitoShare), rs(c.partner)]; }),
      foot: [["", "Total", "", rs(totals.sold), rs(totals.profit), rs(totals.sollabs), rs(totals.cognito), rs(totals.partner)]],
      theme: "striped", headStyles: { fillColor: [0, 102, 255] }, footStyles: { fillColor: [230, 236, 245], textColor: 20 },
      styles: { fontSize: 8.5 }, columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
    });

    pdf.save(`partner-report-${month === "all" ? "all" : month}.pdf`);
  }

  const stat = (label: string, value: number, color: string, sub?: string) => (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{inr(value)}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4 }}>{sub}</div>}
    </div>
  );
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 5, display: "block" };
  const line = (label: string, value: string, color = "#C4D0E0", bold = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 14, borderTop: bold ? "1px solid rgba(255,255,255,0.1)" : "none", fontWeight: bold ? 800 : 500 }}>
      <span style={{ color: "#94A3B8" }}>{label}</span><span style={{ color }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Partner</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>Laptop deals · profit split between Sollabs Tech, Cognito Tech Media and partner</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ fontSize: 13 }}>
            <option value="all">All time</option>
            {months.map((m) => <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>)}
          </select>
          <button className="btn-sm btn-blue" onClick={downloadPdf} disabled={shown.length === 0}>⬇ Download PDF</button>
        </div>
      </div>

      {loadError && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>
          Couldn&apos;t load deals: {loadError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {stat("Total profit", totals.profit, "white", `${shown.length} laptop${shown.length === 1 ? "" : "s"} sold`)}
        {stat("Sollabs Tech", totals.sollabs, "#60A5FA")}
        {stat("Cognito Tech Media", totals.cognito, "#C084FC")}
        {stat("Partner balance", totals.partner, totals.partner < 0 ? "#F87171" : "#4ADE80", "Profit after both shares")}
      </div>

      {/* Add / edit deal */}
      <form onSubmit={save} className="card partner-form" style={{ padding: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 14 }}>{editing ? "✏️ Edit deal" : "➕ Add a sold laptop"}</div>
          <div className="partner-grid">
            <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Laptop *</label><input value={form.laptop} onChange={set("laptop")} placeholder="e.g. ASUS TUF A15 Ryzen 7" style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Bought for (₹) *</label><input inputMode="numeric" value={form.buyPrice} onChange={set("buyPrice")} placeholder="50000" style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Sold for (₹) *</label><input inputMode="numeric" value={form.soldPrice} onChange={set("soldPrice")} placeholder="60000" style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Sollabs Tech share (₹)</label><input inputMode="numeric" value={form.sollabsShare} onChange={set("sollabsShare")} style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Cognito Tech Media share (₹)</label><input inputMode="numeric" value={form.cognitoShare} onChange={set("cognitoShare")} style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={set("date")} style={{ width: "100%" }} /></div>
            <div><label style={lbl}>Note</label><input value={form.note} onChange={set("note")} placeholder="Optional" style={{ width: "100%" }} /></div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 12, background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.15)", alignSelf: "start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Calculation</div>
          {line("Sold for", inr(draft.soldPrice))}
          {line("− Bought for", inr(draft.buyPrice))}
          {line("Profit", inr(preview.profit), "white", true)}
          {line("− Sollabs Tech", inr(draft.sollabsShare), "#60A5FA")}
          {line("− Cognito Tech Media", inr(draft.cognitoShare), "#C084FC")}
          {line("Partner gets", inr(preview.partner), preview.partner < 0 ? "#F87171" : "#4ADE80", true)}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="submit" disabled={saving || !form.laptop.trim() || !draft.buyPrice || !draft.soldPrice} className="btn-sm btn-green" style={{ flex: 1, padding: "10px" }}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add deal"}
            </button>
            {editing && <button type="button" className="btn-sm" onClick={() => { setEditing(null); setForm(blank()); }}>Cancel</button>}
          </div>
        </div>
      </form>

      {/* Deals */}
      {!loading && shown.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: "center", color: "#334155", fontSize: 14 }}>No deals yet. Add a sold laptop above.</div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 820 }}>
            <thead>
              <tr style={{ color: "#64748B", fontSize: 12, textAlign: "right" }}>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>Laptop</th>
                <th style={{ padding: 12 }}>Bought</th><th style={{ padding: 12 }}>Sold</th><th style={{ padding: 12 }}>Profit</th>
                <th style={{ padding: 12 }}>Sollabs</th><th style={{ padding: 12 }}>Cognito</th><th style={{ padding: 12 }}>Partner</th><th />
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => {
                const c = calc(d);
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right", color: "#C4D0E0" }}>
                    <td style={{ textAlign: "left", padding: "12px 16px" }}>
                      <div style={{ color: "white", fontWeight: 600 }}>{d.laptop}</div>
                      <div style={{ fontSize: 11.5, color: "#475569" }}>{d.date}{d.note ? ` · ${d.note}` : ""}</div>
                    </td>
                    <td style={{ padding: 12 }}>{inr(d.buyPrice)}</td>
                    <td style={{ padding: 12 }}>{inr(d.soldPrice)}</td>
                    <td style={{ padding: 12, color: "white", fontWeight: 700 }}>{inr(c.profit)}</td>
                    <td style={{ padding: 12, color: "#60A5FA" }}>{inr(d.sollabsShare)}</td>
                    <td style={{ padding: 12, color: "#C084FC" }}>{inr(d.cognitoShare)}</td>
                    <td style={{ padding: 12, fontWeight: 700, color: c.partner < 0 ? "#F87171" : "#4ADE80" }}>{inr(c.partner)}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <button className="btn-sm btn-blue" onClick={() => edit(d)}>Edit</button>{" "}
                      <button className="btn-sm btn-red" onClick={() => remove(d)}>Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .partner-form { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
        .partner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 900px) { .partner-form, .partner-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
