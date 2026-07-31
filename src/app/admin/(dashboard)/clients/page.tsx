"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  type: string;
  project: string;
  value: string;
  status: string;
  image: string;
  createdAt?: { seconds: number } | null;
}

const emptyForm = { name: "", contact: "", email: "", type: "software", project: "", value: "", status: "active", image: "", imageFile: null as File | null };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.type === filter;
    return matchSearch && matchFilter;
  });

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setForm((f) => ({ ...f, image: URL.createObjectURL(file), imageFile: file }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.contact.trim()) e.contact = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.project.trim()) e.project = "Required";
    if (!form.value.trim()) e.value = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      let imageUrl = "";
      if (form.imageFile) {
        const storageRef = ref(storage, `clients/${Date.now()}_${form.imageFile.name}`);
        await uploadBytes(storageRef, form.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "clients"), {
        name: form.name,
        contact: form.contact,
        email: form.email,
        type: form.type,
        project: form.project,
        value: form.value.startsWith("₹") ? form.value : `₹${form.value}`,
        status: form.status,
        image: imageUrl,
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setErrors({});
      setShowModal(false);
    } catch (err) {
      console.error("Error adding client:", err);
    }
    setSaving(false);
  }

  function handleClose() {
    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
  }

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Clients</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${clients.length} total clients · live from Firebase`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #0066FF, #0099FF)",
            color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)",
          }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Client
        </button>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#334155", fontSize: 14 }}>
                  {clients.length === 0 ? "No clients yet. Click \"+ Add Client\" to add your first one." : "No clients match your search."}
                </td></tr>
              ) : filtered.map((client) => (
                <tr key={client.id}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {client.image ? (
                        <img src={client.image} alt={client.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0066FF,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {initials(client.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{client.name}</div>
                        <div style={{ fontSize: 11, color: "#334155" }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{client.contact}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${client.type === "software" ? "badge-blue" : "badge-green"}`}>{client.type}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{client.project}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "white" }}>{client.value}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${client.status === "active" ? "badge-green" : client.status === "on-hold" ? "badge-yellow" : "badge-yellow"}`}>{client.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: 6 }}>
                    <button className="btn-sm btn-blue">View</button>
                    <button className="btn-sm btn-red" onClick={() => deleteDoc(doc(db, "clients", client.id))}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div style={{
            background: "#0D1526", border: "1px solid rgba(0,102,255,0.25)",
            borderRadius: 18, width: "100%", maxWidth: 540,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,102,255,0.06)", position: "sticky", top: 0, zIndex: 1, backdropFilter: "blur(12px)",
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>Add New Client</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase instantly</div>
              </div>
              <button onClick={handleClose}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Image Upload */}
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Company Logo / Client Photo
                </label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                {form.image ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={form.image} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }} />
                    <div>
                      <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8 }}>Image selected ✓</div>
                      <button onClick={() => fileRef.current?.click()}
                        style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "rgba(0,102,255,0.12)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.25)", cursor: "pointer" }}>
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                    style={{
                      height: 100, borderRadius: 12, cursor: "pointer",
                      border: `2px dashed ${dragOver ? "#0066FF" : "rgba(255,255,255,0.1)"}`,
                      background: dragOver ? "rgba(0,102,255,0.07)" : "rgba(255,255,255,0.02)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 6, transition: "all 0.2s",
                    }}>
                    <div style={{ fontSize: 26 }}>🏢</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Click to upload or drag & drop</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>Uploaded to Firebase Storage</div>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Company / Name *</label>
                  <input placeholder="e.g. RetailCo India" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.name ? "1px solid #FF6060" : undefined }} />
                  {errors.name && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Contact Person *</label>
                  <input placeholder="e.g. Rahul Sharma" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.contact ? "1px solid #FF6060" : undefined }} />
                  {errors.contact && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.contact}</div>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Email *</label>
                <input type="email" placeholder="client@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", border: errors.email ? "1px solid #FF6060" : undefined }} />
                {errors.email && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.email}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Project Name *</label>
                  <input placeholder="e.g. ShopEase E-commerce" value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.project ? "1px solid #FF6060" : undefined }} />
                  {errors.project && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.project}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Project Value *</label>
                  <input placeholder="e.g. 1,20,000" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.value ? "1px solid #FF6060" : undefined }} />
                  {errors.value && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.value}</div>}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={handleClose}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg, #0066FF, #0099FF)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,102,255,0.3)" }}>
                {saving ? "Saving to Firebase..." : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
