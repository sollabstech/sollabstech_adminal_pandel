"use client";

import { useState } from "react";

const clientsData = [
  { id: 1, name: "RetailCo India", contact: "Suresh Gupta", email: "suresh@retailco.in", type: "software", project: "ShopEase E-commerce", value: "₹1,20,000", status: "active" },
  { id: 2, name: "LogiTrack Solutions", contact: "Anjali Verma", email: "anjali@logitrack.com", type: "software", project: "FleetPro CRM", value: "₹80,000", status: "active" },
  { id: 3, name: "HealthFirst Clinic", contact: "Dr. Rajan Nair", email: "rajan@healthfirst.in", type: "software", project: "HealthSync App", value: "₹95,000", status: "active" },
  { id: 4, name: "Arun Kumar (Individual)", contact: "Arun Kumar", email: "arun.k@gmail.com", type: "hardware", project: "Dell XPS 15", value: "₹65,000", status: "completed" },
  { id: 5, name: "Sneha Patel (Individual)", contact: "Sneha Patel", email: "sneha@gmail.com", type: "hardware", project: "Custom Gaming PC", value: "₹1,20,000", status: "completed" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = clientsData.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Clients</h1>
        <p style={{ fontSize: 13, color: "#475569" }}>{clientsData.length} total clients</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input placeholder="🔍  Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "software", "hardware"].map((f) => (
            <button key={f} className={`btn-sm ${filter === f ? "btn-blue" : ""}`}
              onClick={() => setFilter(f)}
              style={{ background: filter !== f ? "rgba(255,255,255,0.05)" : undefined, color: filter !== f ? "#475569" : undefined, textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Company / Name", "Contact", "Type", "Project", "Value", "Status", "Actions"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600,
                  padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id}
                onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>{client.email}</div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{client.contact}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${client.type === "software" ? "badge-blue" : "badge-green"}`}>{client.type}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{client.project}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "white" }}>{client.value}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${client.status === "active" ? "badge-green" : "badge-yellow"}`}>{client.status}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button className="btn-sm btn-blue">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
