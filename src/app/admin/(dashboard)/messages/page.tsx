"use client";

import { useState } from "react";

const messages = [
  { id: 1, name: "Rahul Sharma", email: "rahul@company.com", type: "software", message: "Hi, I need a mobile app for my food delivery business. Budget is around ₹1-2 lakhs.", date: "30 Jul, 9:14AM", read: false },
  { id: 2, name: "Priya Mehta", email: "priya@startup.com", type: "software", message: "Looking for a CRM system for our 20-person sales team. Can we schedule a call?", date: "29 Jul, 3:22PM", read: false },
  { id: 3, name: "Arun Kumar", email: "arun.k@gmail.com", type: "laptop", message: "Is the Dell XPS 15 still available? I'm in Chennai. Do you ship with insurance?", date: "29 Jul, 11:05AM", read: true },
  { id: 4, name: "Sneha Patel", email: "sneha@gmail.com", type: "custom-pc", message: "I want a gaming PC under ₹80,000. Mainly for Valorant and streaming.", date: "28 Jul, 6:48PM", read: true },
  { id: 5, name: "Vikash Singh", email: "vikash@enterprise.in", type: "software", message: "We need a complete ERP for our manufacturing unit. 50 users. When can we discuss?", date: "28 Jul, 10:00AM", read: true },
];

const typeColors: Record<string, string> = {
  software: "badge-blue",
  laptop: "badge-green",
  "custom-pc": "badge-yellow",
  repair: "badge-red",
};

export default function MessagesPage() {
  const [msgs, setMsgs] = useState(messages);
  const [selected, setSelected] = useState<typeof messages[0] | null>(null);

  const markRead = (id: number) => setMsgs((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  const unreadCount = msgs.filter((m) => !m.read).length;

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
          Messages
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 10, padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700,
              background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)",
            }}>{unreadCount} new</span>
          )}
        </h1>
        <p style={{ fontSize: 13, color: "#475569" }}>Contact form submissions from the website</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {msgs.map((msg) => (
            <div
              key={msg.id}
              className="card"
              onClick={() => { setSelected(msg); markRead(msg.id); }}
              style={{
                padding: "16px 18px",
                cursor: "pointer",
                border: selected?.id === msg.id ? "1px solid rgba(0,102,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                background: selected?.id === msg.id ? "rgba(0,102,255,0.06)" : undefined,
                position: "relative",
              }}
            >
              {!msg.read && (
                <div style={{
                  position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%",
                  background: "#0066FF", boxShadow: "0 0 6px rgba(0,102,255,0.6)",
                }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: msg.read ? 500 : 700, color: "white" }}>{msg.name}</div>
                <div style={{ fontSize: 11, color: "#334155" }}>{msg.date}</div>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>{msg.email}</div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                {msg.message}
              </p>
              <div style={{ marginTop: 8 }}>
                <span className={`badge ${typeColors[msg.type] ?? "badge-blue"}`}>{msg.type}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected && (
          <div className="card" style={{ padding: "24px", position: "sticky", top: 24, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{selected.name}</h3>
              <button className="btn-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#64748B" }}
                onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                ["Email", selected.email],
                ["Type", selected.type],
                ["Date", selected.date],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#334155", width: 60, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7 }}>{selected.message}</p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`mailto:${selected.email}?subject=Re: Your inquiry at Sollabs Tech`}
                className="btn-sm btn-blue" style={{ flex: 1, textAlign: "center", padding: "8px" }}>
                📧 Reply by Email
              </a>
              <a
                href={`https://wa.me/?text=Hi ${selected.name}, thanks for contacting Sollabs Tech!`}
                target="_blank" rel="noopener noreferrer"
                className="btn-sm btn-green" style={{ padding: "8px 12px" }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
