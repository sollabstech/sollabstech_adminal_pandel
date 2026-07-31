"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  tech: string;
  description: string;
  status: string;
  imageUrl: string;
  liveUrl: string;
  completedDate: string;
  createdAt?: { seconds: number } | null;
}

const CATEGORIES = [
  "Website", "Mobile App", "E-commerce", "CRM", "ERP",
  "Dashboard", "Billing Software", "AI / Automation", "Windows App", "Other",
];
const STATUSES = ["live", "in-progress", "completed", "on-hold"];

const emptyForm = {
  title: "", client: "", category: "Website", tech: "",
  description: "", status: "live", liveUrl: "", completedDate: "",
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  live:          { color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)" },
  completed:     { color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)" },
  "in-progress": { color: "#FBBF24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)" },
  "on-hold":     { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};

function getLinkConfig(category: string) {
  if (category === "Mobile App")
    return { label: "App Store / Play Store Link", placeholder: "https://play.google.com/store/apps/details?id=...", icon: "📱" };
  if (category === "Windows App")
    return { label: "Download Link", placeholder: "https://drive.google.com/... or direct download", icon: "💾" };
  if (["Billing Software", "ERP", "CRM"].includes(category))
    return { label: "Demo / Access Link", placeholder: "https://demo.yourapp.com or share link", icon: "🔗" };
  if (category === "AI / Automation")
    return { label: "Live Demo URL", placeholder: "https://...", icon: "🤖" };
  if (["Website", "E-commerce", "Dashboard"].includes(category))
    return { label: "Live Website URL", placeholder: "https://clientwebsite.com", icon: "🌐" };
  return { label: "Project Link", placeholder: "https://...", icon: "🔗" };
}

/* ── Custom Select (uses position:fixed to escape overflow clipping) ── */
function CustomSelect({ value, options, onChange, style }: {
  value: string; options: string[]; onChange: (v: string) => void; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <button type="button"
        onClick={(e) => { setRect(e.currentTarget.getBoundingClientRect()); setOpen((o) => !o); }}
        style={{ width: "100%", textAlign: "left", padding: "9px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, boxSizing: "border-box" }}>
        <span>{value}</span>
        <span style={{ opacity: 0.45, fontSize: 10, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && rect && (
        <div style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, background: "#0A0F1A", border: "1px solid rgba(0,102,255,0.3)", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 99999, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          {options.map((opt) => (
            <div key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", color: value === opt ? "#60A5FA" : "#94A3B8", background: value === opt ? "rgba(0,102,255,0.15)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.1s" }}
              onMouseEnter={(e) => { if (value !== opt) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = value === opt ? "rgba(0,102,255,0.15)" : "transparent"; }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "portfolio"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.toLowerCase().includes(search.toLowerCase()) ||
      p.tech?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  function handleImageDrop(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.client.trim()) e.client = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const storageRef = ref(storage, `portfolio/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "portfolio"), {
        ...form,
        imageUrl,
        createdAt: serverTimestamp(),
      });
      closeModal();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  function closeModal() {
    setShowModal(false);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setErrors({});
  }

  const linkCfg = getLinkConfig(form.category);
  const cats = ["All", ...CATEGORIES];

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Portfolio Projects</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${projects.length} projects · live from Firebase`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)" }}>
          <span style={{ fontSize: 18 }}>+</span> Add Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍  Search by title, client, tech..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: filterCat === c ? "1px solid #0066FF" : "1px solid rgba(255,255,255,0.08)", background: filterCat === c ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)", color: filterCat === c ? "#60A5FA" : "#475569", transition: "all 0.15s" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
          <div style={{ color: "#334155", fontSize: 14, marginBottom: 8 }}>
            {projects.length === 0 ? 'No projects yet. Click "+ Add Project" to add your first one.' : "No projects match your filter."}
          </div>
          {projects.length === 0 && (
            <div style={{ fontSize: 12, color: "#1E293B" }}>Add your 2 years of real client work here!</div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
          {filtered.map((p) => {
            const badge = STATUS_COLORS[p.status] ?? STATUS_COLORS.completed;
            const lc = getLinkConfig(p.category);
            return (
              <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 160, background: "rgba(0,102,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: 48, opacity: 0.25 }}>💼</div>
                  )}
                  <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{p.status}</span>
                  <span style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}>{p.category}</span>
                </div>
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>👤 {p.client}</div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>
                  )}
                  {p.tech && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {p.tech.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                        <span key={t} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.2)", color: "#60A5FA" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#1E293B" }}>{p.completedDate || ""}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ADE80", textDecoration: "none" }}>
                        {lc.icon} Link ↗
                      </a>
                    )}
                    <button className="btn-sm btn-red" onClick={() => deleteDoc(doc(db, "portfolio", p.id))}>Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0D1526", border: "1px solid rgba(0,102,255,0.25)", borderRadius: 18, width: "100%", maxWidth: 580, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "92vh", overflowY: "auto" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,102,255,0.06)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>💼 Add Portfolio Project</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase · shown on website instantly</div>
              </div>
              <button onClick={closeModal}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Screenshot Upload */}
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Project Screenshot / Thumbnail</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) handleImageDrop(f); }}
                  onClick={() => document.getElementById("portfolio-img-input")?.click()}
                  style={{ border: `2px dashed ${dragOver ? "#0066FF" : imagePreview ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, height: imagePreview ? "auto" : 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", background: dragOver ? "rgba(0,102,255,0.05)" : "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>🖼️</div>
                      <div style={{ fontSize: 12, color: "#334155" }}>Drop image here or click to browse</div>
                    </>
                  )}
                </div>
                <input id="portfolio-img-input" type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageDrop(f); }} />
              </div>

              {/* Project Info */}
              <div style={{ fontSize: 11, color: "#0066FF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Project Info</div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Project Title *</label>
                <input placeholder="e.g. Billing Software for Pharmacy" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", border: errors.title ? "1px solid #FF6060" : undefined }} />
                {errors.title && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.title}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Client Name *</label>
                  <input placeholder="e.g. Arjun Medical Store" value={form.client}
                    onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: errors.client ? "1px solid #FF6060" : undefined }} />
                  {errors.client && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 3 }}>{errors.client}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Category</label>
                  <CustomSelect value={form.category} options={CATEGORIES} onChange={(v) => setForm((f) => ({ ...f, category: v, liveUrl: "" })) } />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Tech Stack</label>
                <input placeholder="e.g. React, Node.js, MySQL (comma-separated)" value={form.tech}
                  onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Short Description</label>
                <input placeholder="What was built? What problem did it solve?" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
                  <CustomSelect value={form.status} options={STATUSES} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Completed Date</label>
                  <input type="month" value={form.completedDate}
                    onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Dynamic link field based on category */}
              <div style={{ padding: "14px", borderRadius: 10, background: "rgba(0,102,255,0.05)", border: "1px solid rgba(0,102,255,0.15)" }}>
                <label style={{ fontSize: 11, color: "#60A5FA", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {linkCfg.icon} {linkCfg.label}
                </label>
                <input
                  placeholder={linkCfg.placeholder}
                  value={form.liveUrl}
                  onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
                  {form.category === "Mobile App" && "Paste Play Store or App Store link"}
                  {form.category === "Windows App" && "Paste Google Drive / direct download link"}
                  {["Billing Software", "ERP", "CRM"].includes(form.category) && "Paste demo URL or access link (optional)"}
                  {["Website", "E-commerce", "Dashboard"].includes(form.category) && "Paste the live website URL"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={closeModal}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,102,255,0.3)" }}>
                {saving ? "Uploading..." : "Add Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
