"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Status = "new" | "contacted" | "bought" | "rejected";

interface SellRequest {
  id: string;
  deviceType: "laptop" | "mobile";
  name: string;
  phone: string;
  brand: string;
  model: string;
  specs?: string;
  age?: string;
  condition?: string;
  accessories?: string;
  expectedPrice?: string;
  city?: string;
  status: Status;
  createdAt?: { seconds: number } | null;
}

const STATUS: Record<Status, { label: string; color: string }> = {
  new: { label: "New", color: "#60A5FA" },
  contacted: { label: "Contacted", color: "#FBBF24" },
  bought: { label: "Bought", color: "#4ADE80" },
  rejected: { label: "Not buying", color: "#94A3B8" },
};

function when(ts?: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SellRequestsPage() {
  const [items, setItems] = useState<SellRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [type, setType] = useState<"all" | "laptop" | "mobile">("all");

  useEffect(() => {
    const q = query(collection(db, "sellRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SellRequest)));
      setLoading(false);
    }, (err) => { setLoadError(err.message); setLoading(false); });
  }, []);

  const shown = items.filter((r) => (filter === "all" || r.status === filter) && (type === "all" || r.deviceType === type));
  const count = (s: Status) => items.filter((r) => r.status === s).length;

  async function setStatus(id: string, status: Status) {
    await updateDoc(doc(db, "sellRequests", id), { status });
  }
  async function remove(r: SellRequest) {
    if (window.confirm(`Delete the request from ${r.name} (${r.brand} ${r.model})?`)) await deleteDoc(doc(db, "sellRequests", r.id));
  }

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    background: active ? "rgba(0,102,255,0.18)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "#0066FF" : "rgba(255,255,255,0.08)"}`, color: active ? "#60A5FA" : "#64748B",
  });

  return (
    <div style={{ padding: "32px 28px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Sell Requests</h1>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
        {loading ? "Loading..." : `${items.length} total · ${count("new")} new · from sollabstech.com/sell`}
      </p>

      {loadError && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>
          Couldn&apos;t load requests: {loadError}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button style={chip(filter === "all")} onClick={() => setFilter("all")}>All ({items.length})</button>
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <button key={s} style={chip(filter === s)} onClick={() => setFilter(s)}>{STATUS[s].label} ({count(s)})</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "laptop", "mobile"] as const).map((t) => (
          <button key={t} style={chip(type === t)} onClick={() => setType(t)}>
            {t === "all" ? "All devices" : t === "laptop" ? "💻 Laptops" : "📱 Mobiles"}
          </button>
        ))}
      </div>

      {!loading && shown.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: "center", color: "#334155", fontSize: 14 }}>
          {items.length === 0 ? "No sell requests yet. They appear here when someone submits sollabstech.com/sell." : "No requests match this filter."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {shown.map((r) => {
            const st = STATUS[r.status] ?? STATUS.new;
            const wa = `https://wa.me/91${r.phone}?text=${encodeURIComponent(`Hi ${r.name}, this is Sollabs Tech about the ${r.brand} ${r.model} you want to sell.`)}`;
            return (
              <div key={r.id} className="card" style={{ padding: 18, borderLeft: `3px solid ${st.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{r.deviceType === "mobile" ? "📱" : "💻"} {r.brand} {r.model}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{when(r.createdAt)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, padding: "3px 10px", borderRadius: 100, border: `1px solid ${st.color}55`, height: "fit-content" }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.8 }}>
                  {r.specs && <div>⚙️ {r.specs}</div>}
                  <div>🔧 {r.condition || "—"}{r.age ? ` · ${r.age} old` : ""}</div>
                  {r.accessories && <div>📦 {r.accessories}</div>}
                  {r.expectedPrice && <div>💰 Expects ₹{Number(r.expectedPrice).toLocaleString("en-IN")}</div>}
                  <div>👤 {r.name}{r.city ? ` · ${r.city}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  <a href={`tel:+91${r.phone}`} className="btn-sm btn-blue" style={{ textDecoration: "none" }}>📞 {r.phone}</a>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-sm btn-green" style={{ textDecoration: "none" }}>💬 WhatsApp</a>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as Status)} style={{ flex: 1, fontSize: 12.5 }}>
                    {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                  </select>
                  <button className="btn-sm btn-red" onClick={() => remove(r)}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
