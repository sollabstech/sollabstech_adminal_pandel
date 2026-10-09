"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceType = "mobile" | "website" | "windows" | "custom" | "ecommerce" | "admin" | "vendor";
type LinkType = "playstore" | "appstore" | "website" | "windows" | "other";
type ProjectStatus = "in-progress" | "completed" | "maintenance" | "on-hold";
type LogoBg = "transparent" | "white" | "dark";

interface ProjectLink { url: string; type: LinkType; }

interface ClientDoc {
  id: string;
  slug: string;
  companyName: string;
  logo?: string;
  logoBackground: LogoBg;
  contactPerson: string;
  designation?: string;
  industry?: string;
  companyWebsite?: string;
  city: string;
  state: string;
  country: string;
  location: string;
  projectName?: string;
  serviceTypes: ServiceType[];
  shortDescription?: string;
  fullDescription: string;
  features: string[];
  techStack: string[];
  duration: string;
  startDate?: string;
  completedDate: string;
  projectStatus: ProjectStatus;
  links: ProjectLink[];
  demoVideo?: string;
  screenshots: string[];
  rating: number;
  reviewText: string;
  reviewerName?: string;
  reviewerDesignation?: string;
  reviewDate?: string;
  reviewApproved: boolean;
  featured: boolean;
  published: boolean;
  showCompanyInfo: boolean;
  displayOrder: number;
  createdAt?: { seconds: number } | null;
}

interface PrivateDoc {
  email?: string;
  phone?: string;
  projectValue?: string;
  internalNotes?: string;
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyPrivate: PrivateDoc = { email: "", phone: "", projectValue: "", internalNotes: "" };

const emptyForm: Omit<ClientDoc, "id" | "createdAt"> & { logoFile: File | null; screenshotFiles: File[]; } = {
  slug: "",
  companyName: "",
  logo: "",
  logoBackground: "transparent",
  logoFile: null,
  contactPerson: "",
  designation: "",
  industry: "",
  companyWebsite: "",
  city: "",
  state: "",
  country: "India",
  location: "",
  projectName: "",
  serviceTypes: [],
  shortDescription: "",
  fullDescription: "",
  features: [],
  techStack: [],
  duration: "",
  startDate: "",
  completedDate: "",
  projectStatus: "completed",
  links: [],
  demoVideo: "",
  screenshots: [],
  screenshotFiles: [],
  rating: 5,
  reviewText: "",
  reviewerName: "",
  reviewerDesignation: "",
  reviewDate: "",
  reviewApproved: true,
  featured: false,
  published: true,
  showCompanyInfo: true,
  displayOrder: 999,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

// ─── Input helpers ─────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}{required && <span style={{ color: "#FF6060" }}> *</span>}
    </label>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function SectionHeader({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#0066FF,#00AAFF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "white", flexShrink: 0 }}>{n}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#475569" }}>{sub}</div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box" as const };
const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } as const;

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "mobile",    label: "Mobile App" },
  { value: "website",   label: "Website" },
  { value: "windows",   label: "Windows App" },
  { value: "custom",    label: "Custom Software" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "admin",     label: "Admin Panel" },
  { value: "vendor",    label: "Vendor Website" },
];

const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: "playstore", label: "Google Play" },
  { value: "appstore",  label: "App Store" },
  { value: "website",   label: "Website" },
  { value: "windows",   label: "Windows Download" },
  { value: "other",     label: "Other (Private)" },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [privateForm, setPrivateForm] = useState({ ...emptyPrivate });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDoc)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.companyName?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || c.serviceTypes?.includes(filter as ServiceType);
    return matchSearch && matchFilter;
  });

  // ── logo file handler ──
  function handleLogoFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setForm((f) => ({ ...f, logoFile: file }));
    setLogoPreview(URL.createObjectURL(file));
  }

  // ── screenshot file handler ──
  function handleScreenshotFiles(files: FileList) {
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setForm((f) => ({ ...f, screenshotFiles: [...f.screenshotFiles, ...newFiles] }));
    setScreenshotPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  }

  // ── tag input helpers ──
  function addTag(field: "features" | "techStack", val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, [field]: [...f[field], trimmed] }));
  }
  function removeTag(field: "features" | "techStack", idx: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  }

  // ── link helpers ──
  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, { url: "", type: "website" as LinkType }] }));
  }
  function updateLink(idx: number, key: "url" | "type", val: string) {
    setForm((f) => {
      const links = [...f.links];
      links[idx] = { ...links[idx], [key]: val };
      return { ...f, links };
    });
  }
  function removeLink(idx: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== idx) }));
  }

  // ── service type toggle ──
  function toggleService(s: ServiceType) {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(s)
        ? f.serviceTypes.filter((x) => x !== s)
        : [...f.serviceTypes, s],
    }));
  }

  // ── slug auto-gen from company name ──
  function handleCompanyName(val: string) {
    setForm((f) => ({
      ...f,
      companyName: val,
      slug: f.slug === "" || f.slug === slugify(f.companyName) ? slugify(val) : f.slug,
    }));
  }

  // ── validate ──
  function validate() {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.slug.trim()) e.slug = "Required";
    if (!form.contactPerson.trim()) e.contactPerson = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (form.serviceTypes.length === 0) e.serviceTypes = "Select at least one";
    if (!form.fullDescription.trim()) e.fullDescription = "Required";
    if (!form.duration.trim()) e.duration = "Required";
    if (!form.completedDate.trim()) e.completedDate = "Required";
    if (!form.reviewText.trim()) e.reviewText = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── save ──
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      let logoUrl = form.logo || "";
      if (form.logoFile) {
        const r = ref(storage, `clients/logos/${Date.now()}_${form.logoFile.name}`);
        await uploadBytes(r, form.logoFile);
        logoUrl = await getDownloadURL(r);
      }

      const screenshotUrls: string[] = [...(form.screenshots || [])];
      for (const file of form.screenshotFiles) {
        const r = ref(storage, `clients/screenshots/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        screenshotUrls.push(await getDownloadURL(r));
      }

      const location = [form.city, form.state, form.country].filter(Boolean).join(", ");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { logoFile, screenshotFiles, ...rest } = form;
      const docData = {
        ...rest,
        logo: logoUrl,
        screenshots: screenshotUrls,
        location,
        reviewerName: form.reviewerName || form.contactPerson,
        reviewerDesignation: form.reviewerDesignation || form.designation || "",
      };

      const privateData: PrivateDoc = {
        email: privateForm.email || "",
        phone: privateForm.phone || "",
        projectValue: privateForm.projectValue || "",
        internalNotes: privateForm.internalNotes || "",
      };

      if (editId) {
        await updateDoc(doc(db, "clients", editId), { ...docData });
        await setDoc(doc(db, "clientsPrivate", editId), privateData, { merge: true });
      } else {
        const newDoc = await addDoc(collection(db, "clients"), {
          ...docData,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, "clientsPrivate", newDoc.id), privateData);
      }

      handleClose();
    } catch (err) {
      console.error("Error saving client:", err);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    await deleteDoc(doc(db, "clients", id));
  }

  async function togglePublished(id: string, current: boolean) {
    await updateDoc(doc(db, "clients", id), { published: !current });
  }

  async function toggleFeatured(id: string, current: boolean) {
    await updateDoc(doc(db, "clients", id), { featured: !current });
  }

  function handleClose() {
    setShowModal(false);
    setEditId(null);
    setForm({ ...emptyForm });
    setPrivateForm({ ...emptyPrivate });
    setErrors({});
    setLogoPreview("");
    setScreenshotPreviews([]);
  }

  function openEdit(c: ClientDoc) {
    setEditId(c.id);
    setForm({
      ...emptyForm,
      ...c,
      logoFile: null,
      screenshotFiles: [],
    });
    setLogoPreview(c.logo || "");
    setScreenshotPreviews(c.screenshots || []);
    setPrivateForm({ ...emptyPrivate });
    setShowModal(true);
  }

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  const SERVICE_LABELS: Record<string, string> = {
    mobile: "Mobile", website: "Website", windows: "Windows",
    custom: "Custom", ecommerce: "E-Commerce", admin: "Admin", vendor: "Vendor",
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Clients &amp; Projects</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${clients.length} total · ${clients.filter(c => c.published).length} published · ${clients.filter(c => c.featured).length} featured`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #0066FF, #0099FF)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input placeholder="🔍  Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "mobile", "website", "windows", "custom", "ecommerce", "admin"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid transparent",
                background: filter === f ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)",
                color: filter === f ? "#60A5FA" : "#475569",
                borderColor: filter === f ? "rgba(0,102,255,0.3)" : "rgba(255,255,255,0.07)",
                textTransform: "capitalize",
              }}>
              {f === "all" ? "All" : SERVICE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Company", "Contact / Location", "Services", "Status", "Published", "Featured", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#334155", fontSize: 14 }}>
                  {clients.length === 0 ? "No projects yet. Click \"+ Add Project\" to add your first one." : "No projects match your search."}
                </td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {c.logo ? (
                        <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: c.logoBackground === "dark" ? "#1E293B" : c.logoBackground === "white" ? "white" : "transparent", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Image src={c.logo} alt={c.companyName} width={36} height={36} style={{ objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0066FF,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {initials(c.companyName || "")}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{c.companyName}</div>
                        <div style={{ fontSize: 11, color: "#334155" }}>{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, color: "#94A3B8" }}>{c.contactPerson}</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>{c.location || [c.city, c.state].filter(Boolean).join(", ")}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(c.serviceTypes || []).map((s) => (
                        <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(0,102,255,0.12)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.2)" }}>
                          {SERVICE_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                      background: c.projectStatus === "completed" ? "rgba(34,197,94,0.1)" : c.projectStatus === "in-progress" ? "rgba(0,170,255,0.1)" : "rgba(245,158,11,0.1)",
                      color: c.projectStatus === "completed" ? "#4ADE80" : c.projectStatus === "in-progress" ? "#38BDF8" : "#FCD34D",
                    }}>
                      {c.projectStatus || "completed"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => togglePublished(c.id, c.published !== false)}
                      style={{
                        padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid transparent",
                        background: c.published !== false ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                        color: c.published !== false ? "#4ADE80" : "#475569",
                        borderColor: c.published !== false ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.2)",
                      }}>
                      {c.published !== false ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleFeatured(c.id, c.featured === true)}
                      style={{
                        padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid transparent",
                        background: c.featured ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.1)",
                        color: c.featured ? "#FCD34D" : "#475569",
                        borderColor: c.featured ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)",
                      }}>
                      {c.featured ? "★ Yes" : "☆ No"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(c)}
                        style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(0,102,255,0.12)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.25)" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        Del
                      </button>
                    </div>
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
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
          <div style={{ background: "#0D1526", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 20, width: "100%", maxWidth: 760, boxShadow: "0 24px 60px rgba(0,0,0,0.7)", overflow: "hidden", marginBottom: 24 }}>
            {/* Sticky header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,102,255,0.06)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(16px)" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>{editId ? "Edit Project" : "Add New Project"}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase — visible on the public website when Published</div>
              </div>
              <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
            </div>

            <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 36 }}>

              {/* ── Section 1: Branding ── */}
              <div>
                <SectionHeader n={1} title="Branding" sub="Company logo and identity" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Logo upload */}
                  <div>
                    <Label>Company Logo</Label>
                    <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }} />
                    {logoPreview ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: form.logoBackground === "dark" ? "#1E293B" : form.logoBackground === "white" ? "white" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Image src={logoPreview} alt="logo" width={72} height={72} style={{ objectFit: "contain", width: "100%", height: "100%" }} unoptimized />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button onClick={() => logoRef.current?.click()} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "rgba(0,102,255,0.12)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.25)", cursor: "pointer" }}>Change Logo</button>
                          <button onClick={() => { setLogoPreview(""); setForm((f) => ({ ...f, logo: "", logoFile: null })); }} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => logoRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOverLogo(true); }}
                        onDragLeave={() => setDragOverLogo(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOverLogo(false); const f = e.dataTransfer.files[0]; if (f) handleLogoFile(f); }}
                        style={{ height: 90, borderRadius: 10, cursor: "pointer", border: `2px dashed ${dragOverLogo ? "#0066FF" : "rgba(255,255,255,0.1)"}`, background: dragOverLogo ? "rgba(0,102,255,0.07)" : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s" }}>
                        <div style={{ fontSize: 24 }}>🏢</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Click to upload or drag & drop</div>
                        <div style={{ fontSize: 10, color: "#334155" }}>PNG, JPG, SVG — uploaded to Firebase Storage</div>
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <div>
                      <Label>Logo Background</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["transparent", "white", "dark"] as LogoBg[]).map((bg) => (
                          <button key={bg} onClick={() => setForm((f) => ({ ...f, logoBackground: bg }))}
                            style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.logoBackground === bg ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)", color: form.logoBackground === bg ? "#60A5FA" : "#475569", borderColor: form.logoBackground === bg ? "rgba(0,102,255,0.3)" : "rgba(255,255,255,0.07)", textTransform: "capitalize" }}>
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={gridTwo}>
                    <Field error={errors.companyName}>
                      <Label required>Company Name</Label>
                      <input value={form.companyName} onChange={(e) => handleCompanyName(e.target.value)} placeholder="e.g. Spice Garden Restaurant" style={{ ...inputStyle, borderColor: errors.companyName ? "#FF6060" : undefined }} />
                    </Field>
                    <Field error={errors.slug}>
                      <Label required>URL Slug</Label>
                      <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" style={{ ...inputStyle, borderColor: errors.slug ? "#FF6060" : undefined }} />
                    </Field>
                  </div>
                  <div style={gridTwo}>
                    <div>
                      <Label>Industry</Label>
                      <input value={form.industry || ""} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Restaurant, Education..." style={inputStyle} />
                    </div>
                    <div>
                      <Label>Company Website</Label>
                      <input value={form.companyWebsite || ""} onChange={(e) => setForm((f) => ({ ...f, companyWebsite: e.target.value }))} placeholder="https://..." style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <Label>Short Description</Label>
                    <input value={form.shortDescription || ""} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} placeholder="One-line about the company (shown on cards)" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Client Details ── */}
              <div>
                <SectionHeader n={2} title="Client Details" sub="Contact person and location" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={gridTwo}>
                    <Field error={errors.contactPerson}>
                      <Label required>Contact Person</Label>
                      <input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="e.g. Raj Kumar" style={{ ...inputStyle, borderColor: errors.contactPerson ? "#FF6060" : undefined }} />
                    </Field>
                    <div>
                      <Label>Designation</Label>
                      <input value={form.designation || ""} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="e.g. Founder & CEO" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <Field error={errors.city}>
                      <Label required>City</Label>
                      <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Chennai" style={{ ...inputStyle, borderColor: errors.city ? "#FF6060" : undefined }} />
                    </Field>
                    <div>
                      <Label>State</Label>
                      <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="e.g. Tamil Nadu" style={inputStyle} />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="India" style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Project Details ── */}
              <div>
                <SectionHeader n={3} title="Project Details" sub="Service type, description, timeline" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <Label>Project Name</Label>
                    <input value={form.projectName || ""} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} placeholder="e.g. Online Ordering System" style={inputStyle} />
                  </div>
                  <Field error={errors.serviceTypes}>
                    <Label required>Service Type(s)</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SERVICE_OPTIONS.map((o) => (
                        <button key={o.value} type="button" onClick={() => toggleService(o.value)}
                          style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.serviceTypes.includes(o.value) ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)", color: form.serviceTypes.includes(o.value) ? "#60A5FA" : "#475569", borderColor: form.serviceTypes.includes(o.value) ? "rgba(0,102,255,0.35)" : "rgba(255,255,255,0.08)" }}>
                          {form.serviceTypes.includes(o.value) ? "✓ " : ""}{o.label}
                        </button>
                      ))}
                    </div>
                    {errors.serviceTypes && <div style={{ fontSize: 11, color: "#FF6060", marginTop: 4 }}>{errors.serviceTypes}</div>}
                  </Field>
                  <Field error={errors.fullDescription}>
                    <Label required>Full Description</Label>
                    <textarea value={form.fullDescription} onChange={(e) => setForm((f) => ({ ...f, fullDescription: e.target.value }))} placeholder="Detailed description of the project (shown on project page)..." rows={4} style={{ ...inputStyle, resize: "vertical", borderColor: errors.fullDescription ? "#FF6060" : undefined }} />
                  </Field>
                  <div style={gridTwo}>
                    <Field error={errors.duration}>
                      <Label required>Duration</Label>
                      <input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 6 weeks" style={{ ...inputStyle, borderColor: errors.duration ? "#FF6060" : undefined }} />
                    </Field>
                    <div>
                      <Label>Project Status</Label>
                      <select value={form.projectStatus} onChange={(e) => setForm((f) => ({ ...f, projectStatus: e.target.value as ProjectStatus }))} style={inputStyle}>
                        <option value="completed">Completed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="on-hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                  <div style={gridTwo}>
                    <div>
                      <Label>Start Date</Label>
                      <input type="date" value={form.startDate || ""} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                    </div>
                    <Field error={errors.completedDate}>
                      <Label required>Completed / Launch Date</Label>
                      <input type="date" value={form.completedDate} onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))} style={{ ...inputStyle, borderColor: errors.completedDate ? "#FF6060" : undefined }} />
                    </Field>
                  </div>
                  {/* Features */}
                  <div>
                    <Label>Key Features</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
                      {form.features.map((f, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "rgba(0,170,255,0.08)", color: "#38BDF8", border: "1px solid rgba(0,170,255,0.2)" }}>
                          {f}
                          <button onClick={() => removeTag("features", i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#60A5FA", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <input placeholder="Type a feature and press Enter" style={inputStyle}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("features", e.currentTarget.value); e.currentTarget.value = ""; } }} />
                  </div>
                  {/* Tech Stack */}
                  <div>
                    <Label>Tech Stack</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
                      {form.techStack.map((t, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "rgba(0,102,255,0.08)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.2)" }}>
                          {t}
                          <button onClick={() => removeTag("techStack", i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#60A5FA", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <input placeholder="Type a tech (e.g. Flutter) and press Enter" style={inputStyle}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("techStack", e.currentTarget.value); e.currentTarget.value = ""; } }} />
                  </div>
                </div>
              </div>

              {/* ── Section 4: Project Links ── */}
              <div>
                <SectionHeader n={4} title="Project Links" sub="Play Store, App Store, website, etc." />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.links.map((link, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <select value={link.type} onChange={(e) => updateLink(i, "type", e.target.value)} style={{ flexShrink: 0, width: 160 }}>
                        {LINK_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                      <button onClick={() => removeLink(i)} style={{ padding: "6px 10px", borderRadius: 7, fontSize: 14, background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <button onClick={addLink} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "rgba(0,102,255,0.08)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.2)", cursor: "pointer", alignSelf: "flex-start" }}>
                    + Add Link
                  </button>
                  <div style={{ fontSize: 11, color: "#334155" }}>Leave empty for private / internal projects (shows "Private Project" badge on the website).</div>
                </div>
              </div>

              {/* ── Section 5: Media ── */}
              <div>
                <SectionHeader n={5} title="Media" sub="Screenshots and demo video" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <Label>Demo Video URL</Label>
                    <input value={form.demoVideo || ""} onChange={(e) => setForm((f) => ({ ...f, demoVideo: e.target.value }))} placeholder="YouTube or direct video URL" style={inputStyle} />
                  </div>
                  <div>
                    <Label>Screenshots</Label>
                    <input ref={screenshotRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                      onChange={(e) => { if (e.target.files) handleScreenshotFiles(e.target.files); }} />
                    {screenshotPreviews.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                        {screenshotPreviews.map((src, i) => (
                          <div key={i} style={{ position: "relative", width: 90, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <Image src={src} alt={`screenshot-${i}`} fill style={{ objectFit: "cover" }} unoptimized />
                            <button onClick={() => {
                              setScreenshotPreviews((p) => p.filter((_, j) => j !== i));
                              setForm((f) => ({
                                ...f,
                                screenshots: f.screenshots.filter((_, j) => j !== i),
                                screenshotFiles: f.screenshotFiles.filter((_, j) => j !== (i - (f.screenshots.length - 1))),
                              }));
                            }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 4, background: "rgba(239,68,68,0.9)", color: "white", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => screenshotRef.current?.click()} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "rgba(0,102,255,0.08)", color: "#60A5FA", border: "1px solid rgba(0,102,255,0.2)", cursor: "pointer" }}>
                      + Add Screenshots
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Section 6: Client Review ── */}
              <div>
                <SectionHeader n={6} title="Client Review" sub="Rating and testimonial" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <Label>Rating</Label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setForm((f) => ({ ...f, rating: n }))}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 28 }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill={n <= form.rating ? "#F59E0B" : "rgba(255,255,255,0.1)"}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                      <span style={{ fontSize: 14, color: "#94A3B8", alignSelf: "center", marginLeft: 8 }}>{form.rating}.0 / 5.0</span>
                    </div>
                  </div>
                  <Field error={errors.reviewText}>
                    <Label required>Review Text</Label>
                    <textarea value={form.reviewText} onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))} placeholder="Client's testimonial in their own words..." rows={3} style={{ ...inputStyle, resize: "vertical", borderColor: errors.reviewText ? "#FF6060" : undefined }} />
                  </Field>
                  <div style={gridTwo}>
                    <div>
                      <Label>Reviewer Name</Label>
                      <input value={form.reviewerName || ""} onChange={(e) => setForm((f) => ({ ...f, reviewerName: e.target.value }))} placeholder="Defaults to contact person" style={inputStyle} />
                    </div>
                    <div>
                      <Label>Reviewer Designation</Label>
                      <input value={form.reviewerDesignation || ""} onChange={(e) => setForm((f) => ({ ...f, reviewerDesignation: e.target.value }))} placeholder="Defaults to designation" style={inputStyle} />
                    </div>
                  </div>
                  <div style={gridTwo}>
                    <div>
                      <Label>Review Date</Label>
                      <input type="date" value={form.reviewDate || ""} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <Label>Review Approved</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[true, false].map((v) => (
                          <button key={String(v)} onClick={() => setForm((f) => ({ ...f, reviewApproved: v }))}
                            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.reviewApproved === v ? (v ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)") : "rgba(255,255,255,0.04)", color: form.reviewApproved === v ? (v ? "#4ADE80" : "#F87171") : "#475569", borderColor: form.reviewApproved === v ? (v ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)") : "rgba(255,255,255,0.08)" }}>
                            {v ? "✓ Approved" : "✗ Hidden"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 7: Visibility ── */}
              <div>
                <SectionHeader n={7} title="Visibility" sub="Control what's shown and where" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={gridTwo}>
                    <div>
                      <Label>Published</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[true, false].map((v) => (
                          <button key={String(v)} onClick={() => setForm((f) => ({ ...f, published: v }))}
                            style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.published === v ? (v ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)") : "rgba(255,255,255,0.04)", color: form.published === v ? (v ? "#4ADE80" : "#94A3B8") : "#475569", borderColor: form.published === v ? (v ? "rgba(34,197,94,0.25)" : "rgba(100,116,139,0.25)") : "rgba(255,255,255,0.08)" }}>
                            {v ? "🌐 Live" : "🔒 Hidden"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Featured on Home</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[true, false].map((v) => (
                          <button key={String(v)} onClick={() => setForm((f) => ({ ...f, featured: v }))}
                            style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.featured === v ? (v ? "rgba(245,158,11,0.12)" : "rgba(100,116,139,0.12)") : "rgba(255,255,255,0.04)", color: form.featured === v ? (v ? "#FCD34D" : "#94A3B8") : "#475569", borderColor: form.featured === v ? (v ? "rgba(245,158,11,0.25)" : "rgba(100,116,139,0.25)") : "rgba(255,255,255,0.08)" }}>
                            {v ? "★ Featured" : "☆ Not Featured"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={gridTwo}>
                    <div>
                      <Label>Show Company Info</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[true, false].map((v) => (
                          <button key={String(v)} onClick={() => setForm((f) => ({ ...f, showCompanyInfo: v }))}
                            style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid transparent", background: form.showCompanyInfo === v ? "rgba(0,102,255,0.12)" : "rgba(255,255,255,0.04)", color: form.showCompanyInfo === v ? "#60A5FA" : "#475569", borderColor: form.showCompanyInfo === v ? "rgba(0,102,255,0.3)" : "rgba(255,255,255,0.08)" }}>
                            {v ? "Show" : "Hide"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <input type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} placeholder="999 (lower = first)" style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)", position: "sticky", bottom: 0 }}>
              <button onClick={handleClose} style={{ padding: "10px 22px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "10px 26px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg, #0066FF, #0099FF)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 12px rgba(0,102,255,0.35)" }}>
                {saving ? "Saving to Firebase..." : editId ? "Save Changes" : "Add Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
