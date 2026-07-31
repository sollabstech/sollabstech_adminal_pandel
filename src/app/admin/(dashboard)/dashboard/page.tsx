"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: { seconds: number } | null;
}

function formatTime(ts: { seconds: number } | null) {
  if (!ts) return "Just now";
  return new Date(ts.seconds * 1000).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const typeColors: Record<string, string> = {
  software: "badge-blue",
  laptop: "badge-green",
  "custom-pc": "badge-yellow",
  repair: "badge-red",
  other: "badge-blue",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState("7d");

  // Real counts from Firebase
  const [counts, setCounts] = useState({
    unreadMessages: 0,
    totalMessages: 0,
    products: 0,
    portfolio: 0,
    clients: 0,
    warranty: 0,
    warrantyExpired: 0,
    blog: 0,
  });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [todayMessages, setTodayMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Messages
    unsubs.push(onSnapshot(collection(db, "messages"), (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
      const unread = msgs.filter((m) => !m.read).length;
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayCount = msgs.filter((m) => m.createdAt && m.createdAt.seconds * 1000 >= todayStart.getTime()).length;
      setCounts((c) => ({ ...c, unreadMessages: unread, totalMessages: msgs.length }));
      setTodayMessages(todayCount);
      setLoading(false);
    }, () => setLoading(false)));

    // Recent messages (last 5)
    const recentQ = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(5));
    unsubs.push(onSnapshot(recentQ, (snap) => {
      setRecentMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    }, () => {}));

    // Products
    unsubs.push(onSnapshot(collection(db, "products"), (snap) => {
      setCounts((c) => ({ ...c, products: snap.size }));
    }, () => {}));

    // Portfolio
    unsubs.push(onSnapshot(collection(db, "portfolio"), (snap) => {
      setCounts((c) => ({ ...c, portfolio: snap.size }));
    }, () => {}));

    // Clients
    unsubs.push(onSnapshot(collection(db, "clients"), (snap) => {
      setCounts((c) => ({ ...c, clients: snap.size }));
    }, () => {}));

    // Warranty
    unsubs.push(onSnapshot(collection(db, "warranty"), (snap) => {
      const today = new Date().toISOString().split("T")[0];
      const expired = snap.docs.filter((d) => {
        const data = d.data();
        return data.warrantyEndDate && data.warrantyEndDate < today;
      }).length;
      setCounts((c) => ({ ...c, warranty: snap.size, warrantyExpired: expired }));
    }, () => {}));

    // Blog
    unsubs.push(onSnapshot(collection(db, "blog"), (snap) => {
      setCounts((c) => ({ ...c, blog: snap.size }));
    }, () => {}));

    return () => unsubs.forEach((u) => u());
  }, []);

  const statCards = [
    { label: "Unread Messages", value: loading ? "—" : String(counts.unreadMessages), icon: "📨", color: "#FBBF24", sub: `${counts.totalMessages} total` },
    { label: "Products Listed", value: loading ? "—" : String(counts.products), icon: "🖥️", color: "#A78BFA", sub: "in store" },
    { label: "Portfolio Projects", value: loading ? "—" : String(counts.portfolio), icon: "💼", color: "#60A5FA", sub: "real work" },
    { label: "Clients", value: loading ? "—" : String(counts.clients), icon: "👥", color: "#4ADE80", sub: "on record" },
  ];

  const summary = [
    { label: "New Messages Today", value: todayMessages, icon: "📩" },
    { label: "Total Messages", value: counts.totalMessages, icon: "📬" },
    { label: "Active Warranties", value: counts.warranty - counts.warrantyExpired, icon: "🛡️" },
    { label: "Expired Warranties", value: counts.warrantyExpired, icon: "⚠️" },
    { label: "Blog Posts", value: counts.blog, icon: "📝" },
  ];

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Connecting to Firebase..." : "Live data · updates in real-time"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["7d", "30d", "90d"].map((p) => (
            <button key={p} className={`btn-sm ${period === p ? "btn-blue" : ""}`}
              onClick={() => setPeriod(p)}
              style={{ background: period !== p ? "rgba(255,255,255,0.05)" : undefined, color: period !== p ? "#475569" : undefined }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}
        className="stats-row">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{stat.icon}</span>
              <span style={{ fontSize: 10, color: "#334155" }}>{stat.sub}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: loading ? "#334155" : "white", marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 24 }} className="charts-row">
        {/* Recent Messages */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Recent Messages</h3>
            <a href="/admin/messages" style={{ fontSize: 12, color: "#60A5FA", textDecoration: "none" }}>View All →</a>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#334155" }}>Loading...</div>
          ) : recentMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#334155" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              No messages yet. They appear when someone fills the contact form.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentMessages.map((msg) => (
                <div key={msg.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,102,255,0.12)", border: "1px solid rgba(0,102,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                    {msg.read ? "✉️" : "📩"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: msg.read ? 500 : 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.name}</span>
                      <span style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>{formatTime(msg.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.message}</div>
                    <span className={`badge ${typeColors[msg.type] ?? "badge-blue"}`} style={{ marginTop: 4 }}>{msg.type}</span>
                  </div>
                  {!msg.read && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0066FF", flexShrink: 0, marginTop: 6, boxShadow: "0 0 6px rgba(0,102,255,0.6)" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Summary */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 20 }}>Summary</h3>
          {summary.map((item, i) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < summary.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>{item.icon} {item.label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: loading ? "#334155" : "white" }}>
                {loading ? "—" : item.value}
              </span>
            </div>
          ))}

          <div style={{ marginTop: 20, padding: "14px", borderRadius: 10, background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.12)", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            🔥 All numbers update live from Firebase — no refresh needed.
          </div>
        </div>
      </div>

      <style>{`
        .stats-row { grid-template-columns: repeat(4, 1fr) !important; }
        .charts-row { grid-template-columns: 1.5fr 1fr !important; }
        @media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(2, 1fr) !important; } .charts-row { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .stats-row { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
