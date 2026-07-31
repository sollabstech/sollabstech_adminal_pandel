"use client";

import { useState } from "react";

type SoftwareType = "App" | "Web" | "ERP" | "Windows" | "Billing";

interface OldClient {
  id: number;
  name: string;
  contact: string;
  phone: string;
  city: string;
  type: SoftwareType;
  projectName: string;
  completedOn: string;
  value: string;
  rating: number;
  notes: string;
}

const oldClientsData: OldClient[] = [
  // App
  { id: 1, name: "FreshMart Retail", contact: "Kiran Shah", phone: "+91 98765 43210", city: "Mumbai", type: "App", projectName: "FreshMart Delivery App", completedOn: "Mar 2024", value: "₹1,40,000", rating: 5, notes: "Flutter app for grocery delivery. Excellent feedback." },
  { id: 2, name: "QuickCabs Pvt Ltd", contact: "Rahul Menon", phone: "+91 97654 32109", city: "Bangalore", type: "App", projectName: "QuickCabs Driver + Rider App", completedOn: "Sep 2023", value: "₹2,80,000", rating: 5, notes: "Dual app (driver + rider) with real-time tracking." },
  { id: 3, name: "Fitzone Gym Chain", contact: "Priya Nair", phone: "+91 96543 21098", city: "Pune", type: "App", projectName: "Fitzone Member App", completedOn: "Jan 2024", value: "₹90,000", rating: 4, notes: "Membership, attendance, diet plan tracker app." },
  { id: 4, name: "Dr. Sunita Sharma", contact: "Sunita Sharma", phone: "+91 95432 10987", city: "Delhi", type: "App", projectName: "HealthSched Doctor App", completedOn: "Jun 2023", value: "₹75,000", rating: 5, notes: "Appointment booking app for private clinic." },

  // Web
  { id: 5, name: "Luxe Jewellers", contact: "Anil Mehta", phone: "+91 94321 09876", city: "Ahmedabad", type: "Web", projectName: "Luxe Jewellers Website", completedOn: "Feb 2024", value: "₹55,000", rating: 5, notes: "Product catalog + enquiry form. Mobile optimized." },
  { id: 6, name: "Greenfield Schools", contact: "Smita Kulkarni", phone: "+91 93210 98765", city: "Nagpur", type: "Web", projectName: "School Portal & Website", completedOn: "Apr 2023", value: "₹65,000", rating: 4, notes: "Student portal with notices, results, fees." },
  { id: 7, name: "Spice Route Restaurant", contact: "Deepak Iyer", phone: "+91 92109 87654", city: "Chennai", type: "Web", projectName: "Restaurant Website + Menu", completedOn: "Nov 2023", value: "₹40,000", rating: 5, notes: "Online menu, table booking, WhatsApp ordering." },
  { id: 8, name: "Vertex Architects", contact: "Neha Joshi", phone: "+91 91098 76543", city: "Hyderabad", type: "Web", projectName: "Portfolio & Lead Gen Website", completedOn: "Aug 2023", value: "₹35,000", rating: 4, notes: "Architecture firm portfolio with project gallery." },

  // ERP
  { id: 9, name: "SteelCraft Industries", contact: "Ramesh Patel", phone: "+91 90987 65432", city: "Surat", type: "ERP", projectName: "Manufacturing ERP System", completedOn: "Dec 2023", value: "₹4,50,000", rating: 5, notes: "Full production, inventory, purchase, accounts ERP." },
  { id: 10, name: "AgriLink Traders", contact: "Suresh Yadav", phone: "+91 89876 54321", city: "Indore", type: "ERP", projectName: "AgriLink Trade ERP", completedOn: "Jul 2023", value: "₹2,20,000", rating: 4, notes: "Commodity trading with lot management and GST." },
  { id: 11, name: "MedPlus Hospital Group", contact: "Dr. Kavita Rao", phone: "+91 88765 43210", city: "Hyderabad", type: "ERP", projectName: "Hospital Management ERP", completedOn: "Oct 2023", value: "₹3,80,000", rating: 5, notes: "OPD, IPD, pharmacy, lab, billing integrated ERP." },

  // Windows
  { id: 12, name: "CityMall Superstore", contact: "Vijay Gupta", phone: "+91 87654 32109", city: "Lucknow", type: "Windows", projectName: "POS & Inventory Desktop App", completedOn: "May 2023", value: "₹95,000", rating: 5, notes: "Offline-capable Windows POS with daily reports." },
  { id: 13, name: "Prakash Book Depot", contact: "Mohan Tiwari", phone: "+91 86543 21098", city: "Varanasi", type: "Windows", projectName: "Book Stock Manager", completedOn: "Jan 2023", value: "₹45,000", rating: 4, notes: "Windows desktop app for book inventory and orders." },
  { id: 14, name: "RajPlast Packaging", contact: "Raj Singhania", phone: "+91 85432 10987", city: "Jaipur", type: "Windows", projectName: "Production Tracking Tool", completedOn: "Sep 2023", value: "₹70,000", rating: 4, notes: "Windows tool for shift-wise production logging." },

  // Billing
  { id: 15, name: "Shree Medicals", contact: "Ashok Sharma", phone: "+91 84321 09876", city: "Bhopal", type: "Billing", projectName: "Medical Shop Billing Software", completedOn: "Mar 2023", value: "₹38,000", rating: 5, notes: "GST billing, stock alerts, expiry tracking." },
  { id: 16, name: "Om Enterprises", contact: "Sanjay Gupta", phone: "+91 83210 98765", city: "Kanpur", type: "Billing", projectName: "Wholesale Billing + GST", completedOn: "Jun 2023", value: "₹42,000", rating: 5, notes: "Multi-user billing with party ledger and GST reports." },
  { id: 17, name: "Sunrise Caterers", contact: "Neeta Jain", phone: "+91 82109 87654", city: "Surat", type: "Billing", projectName: "Catering Order & Invoice App", completedOn: "Nov 2023", value: "₹28,000", rating: 4, notes: "Event-wise billing and advance payment tracking." },
  { id: 18, name: "Vikram Auto Parts", contact: "Vikram Singh", phone: "+91 81098 76543", city: "Agra", type: "Billing", projectName: "Auto Parts Billing System", completedOn: "Feb 2024", value: "₹34,000", rating: 5, notes: "Spare parts billing with purchase and sales reports." },
];

const typeConfig: Record<SoftwareType | "All", { label: string; icon: string; color: string; bg: string }> = {
  All:     { label: "All",              icon: "🗂️",  color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  App:     { label: "Mobile App",       icon: "📱",  color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  Web:     { label: "Website",          icon: "🌐",  color: "#34D399", bg: "rgba(52,211,153,0.1)"  },
  ERP:     { label: "ERP System",       icon: "🏭",  color: "#60A5FA", bg: "rgba(96,165,250,0.1)"  },
  Windows: { label: "Windows Software", icon: "🖥️",  color: "#FBBF24", bg: "rgba(251,191,36,0.1)"  },
  Billing: { label: "Billing Software", icon: "🧾",  color: "#F87171", bg: "rgba(248,113,113,0.1)" },
};

const allTypes = ["All", "App", "Web", "ERP", "Windows", "Billing"] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 12, color: "#FBBF24", letterSpacing: 1 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function OldClientsPage() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<typeof allTypes[number]>("All");

  const filtered = oldClientsData.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.projectName.toLowerCase().includes(search.toLowerCase());
    const matchType = activeType === "All" || c.type === activeType;
    return matchSearch && matchType;
  });

  const countFor = (t: typeof allTypes[number]) =>
    t === "All" ? oldClientsData.length : oldClientsData.filter((c) => c.type === t).length;

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 4 }}>Old Client List</h1>
        <p style={{ fontSize: 13, color: "#475569" }}>
          {oldClientsData.length} completed software projects across all categories
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        {(["App", "Web", "ERP", "Windows", "Billing"] as SoftwareType[]).map((t) => {
          const cfg = typeConfig[t];
          const count = countFor(t);
          return (
            <div
              key={t}
              onClick={() => setActiveType(t)}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: activeType === t ? cfg.bg : "rgba(10,22,40,0.6)",
                border: `1px solid ${activeType === t ? cfg.color + "55" : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{cfg.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{count}</div>
              <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search + Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍  Search by name, city, project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1, minWidth: 200 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allTypes.map((t) => {
            const cfg = typeConfig[t];
            const isActive = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  border: isActive ? `1px solid ${cfg.color}55` : "1px solid rgba(255,255,255,0.07)",
                  background: isActive ? cfg.bg : "rgba(255,255,255,0.03)",
                  color: isActive ? cfg.color : "#475569",
                }}
              >
                <span>{cfg.icon}</span>
                {cfg.label}
                <span style={{
                  padding: "1px 7px", borderRadius: 100, fontSize: 10,
                  background: isActive ? cfg.color + "33" : "rgba(255,255,255,0.06)",
                  color: isActive ? cfg.color : "#334155",
                }}>{countFor(t)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: "#334155", marginBottom: 14 }}>
        Showing {filtered.length} client{filtered.length !== 1 ? "s" : ""}
        {activeType !== "All" ? ` · ${typeConfig[activeType].label}` : ""}
        {search ? ` · "${search}"` : ""}
      </div>

      {/* Client cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#475569", fontSize: 14 }}>No clients found matching your search.</div>
          </div>
        ) : (
          filtered.map((client) => {
            const cfg = typeConfig[client.type];
            return (
              <div
                key={client.id}
                className="card"
                style={{ padding: 0, overflow: "hidden", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color + "44";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {/* Card top bar */}
                <div style={{
                  padding: "14px 18px",
                  background: cfg.bg,
                  borderBottom: `1px solid ${cfg.color}22`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 0.5 }}>
                      {cfg.label.toUpperCase()}
                    </span>
                  </div>
                  <StarRating rating={client.rating} />
                </div>

                {/* Card body */}
                <div style={{ padding: "18px" }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{client.contact} · {client.city}</div>
                  </div>

                  <div style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 11, color: "#334155", fontWeight: 600, marginBottom: 3 }}>PROJECT</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>{client.projectName}</div>
                  </div>

                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 14 }}>
                    {client.notes}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#334155", fontWeight: 600, marginBottom: 2 }}>COMPLETED</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{client.completedOn}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#334155", fontWeight: 600, marginBottom: 2 }}>PROJECT VALUE</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{client.value}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                    <a
                      href={`tel:${client.phone}`}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        textAlign: "center", textDecoration: "none",
                        background: cfg.bg, color: cfg.color,
                        border: `1px solid ${cfg.color}33`,
                      }}
                    >
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        textAlign: "center", textDecoration: "none",
                        background: "rgba(37,211,102,0.1)", color: "#25D366",
                        border: "1px solid rgba(37,211,102,0.2)",
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
