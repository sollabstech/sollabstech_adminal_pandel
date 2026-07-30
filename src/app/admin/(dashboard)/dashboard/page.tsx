"use client";

import { useState } from "react";

const stats = [
  { label: "Total Revenue", value: "₹18.4L", change: "+12%", icon: "💰", color: "#22C55E" },
  { label: "Software Clients", value: "152", change: "+8", icon: "💼", color: "#60A5FA" },
  { label: "Laptops Sold", value: "523", change: "+34", icon: "🖥️", color: "#A78BFA" },
  { label: "Pending Messages", value: "7", change: "New", icon: "📨", color: "#FBBF24" },
];

const recentOrders = [
  { id: "ORD-001", customer: "Rahul Sharma", product: "Dell XPS 15", amount: "₹65,000", status: "Delivered", date: "28 Jul" },
  { id: "ORD-002", customer: "Priya Mehta", product: "E-commerce Website", amount: "₹45,000", status: "In Progress", date: "27 Jul" },
  { id: "ORD-003", customer: "Arun Kumar", product: "Lenovo IdeaPad", amount: "₹28,000", status: "Shipped", date: "26 Jul" },
  { id: "ORD-004", customer: "Sneha Patel", product: "Custom Gaming PC", amount: "₹1,20,000", status: "Building", date: "25 Jul" },
  { id: "ORD-005", customer: "Vikash Singh", product: "CRM System", amount: "₹80,000", status: "Delivered", date: "24 Jul" },
];

const revenueData = [
  { month: "Feb", software: 120000, hardware: 80000 },
  { month: "Mar", software: 180000, hardware: 120000 },
  { month: "Apr", software: 150000, hardware: 95000 },
  { month: "May", software: 220000, hardware: 160000 },
  { month: "Jun", software: 190000, hardware: 140000 },
  { month: "Jul", software: 280000, hardware: 200000 },
];

const maxRevenue = Math.max(...revenueData.map((d) => d.software + d.hardware));

const statusColors: Record<string, string> = {
  "Delivered": "badge-green",
  "In Progress": "badge-blue",
  "Shipped": "badge-yellow",
  "Building": "badge-yellow",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>Welcome back! Here&apos;s what&apos;s happening.</p>
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}
        className="stats-row">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{stat.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100,
                background: "rgba(34,197,94,0.1)", color: "#4ADE80",
              }}>{stat.change}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 24 }} className="charts-row">
        {/* Revenue Chart */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 20 }}>Revenue Overview</h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#0066FF", display: "inline-block" }} />
              Software
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#00AAFF", display: "inline-block" }} />
              Hardware
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140 }}>
            {revenueData.map((d) => {
              const total = d.software + d.hardware;
              const totalH = (total / maxRevenue) * 140;
              const softH = (d.software / total) * totalH;
              const hardH = (d.hardware / total) * totalH;
              return (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden", height: totalH }}>
                    <div style={{ flex: 0, height: softH, background: "#0066FF", opacity: 0.85 }} />
                    <div style={{ flex: 0, height: hardH, background: "#00AAFF", opacity: 0.7 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#334155" }}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 20 }}>Today&apos;s Summary</h3>
          {[
            { label: "New Inquiries", value: 4, icon: "📩" },
            { label: "Orders Placed", value: 2, icon: "📦" },
            { label: "Software Leads", value: 3, icon: "💻" },
            { label: "Laptop Inquiries", value: 5, icon: "🖥️" },
            { label: "Reviews Posted", value: 1, icon: "⭐" },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>{item.icon} {item.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Recent Orders</h3>
          <button className="btn-sm btn-blue">View All</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Order ID", "Customer", "Product", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600,
                    padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "12px", fontSize: 12, color: "#60A5FA", fontFamily: "monospace" }}>{order.id}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#94A3B8" }}>{order.customer}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#94A3B8" }}>{order.product}</td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: "white" }}>{order.amount}</td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge ${statusColors[order.status] ?? "badge-blue"}`}>{order.status}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#334155" }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
