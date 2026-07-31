"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  condition: string;
  status: string;
  image: string;
  videoUrl?: string;
  accessories?: string;
  ram?: string;
  processor?: string;
  storageType?: string;
  graphicsCard?: string;
  createdAt?: { seconds: number } | null;
}

const emptyForm = {
  name: "", category: "Gaming Laptops", price: "", condition: "Good",
  accessories: "Only Laptop", image: "", imageFile: null as File | null,
  videoUrl: "", ram: "", processor: "", storageType: "SSD", storageSize: "", graphicsCard: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image: url, imageFile: file }));
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      let imageUrl = "";
      if (form.imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${form.imageFile.name}`);
        await uploadBytes(storageRef, form.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "products"), {
        name: form.name,
        category: form.category,
        price: parseInt(form.price),
        stock: 1,
        condition: form.condition,
        status: "available",
        image: imageUrl,
        videoUrl: form.videoUrl.trim(),
        accessories: form.accessories,
        ram: form.ram.trim(),
        processor: form.processor.trim(),
        storageType: form.storageType,
        storageSize: form.storageSize.trim(),
        graphicsCard: form.graphicsCard.trim(),
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAdd(false);
    } catch (err) {
      console.error("Error adding product:", err);
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Products</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${products.length} products · live from Firebase`}
          </p>
        </div>
        <button className="btn-sm btn-green" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 16px" }}>
          + Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setForm(emptyForm); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{
            background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, width: "100%", maxWidth: 480,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden",
            display: "flex", flexDirection: "column", maxHeight: "90vh",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(34,197,94,0.06)",
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>Add New Product</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase instantly</div>
              </div>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
              {/* Image Upload */}
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Product Image
                </label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                {form.image ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 160, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}>
                      <button onClick={() => fileRef.current?.click()}
                        style={{ padding: "8px 18px", borderRadius: 8, background: "white", color: "#0A0F1A", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
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
                      height: 140, borderRadius: 12, cursor: "pointer",
                      border: `2px dashed ${dragOver ? "#22C55E" : "rgba(255,255,255,0.1)"}`,
                      background: dragOver ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 8, transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 32 }}>🖼️</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Click to upload or drag & drop</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>Uploaded to Firebase Storage</div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Product Name *</label>
                <input placeholder="Laptop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                    {["Gaming Laptops", "Business Laptops", "Student Laptops", "Custom PCs", "Workstations", "Accessories"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Condition</label>
                  <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                    {["Brand New", "Excellent", "Good", "Fair"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Accessories Included</label>
                <select value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                  {[
                    "Only Laptop",
                    "Laptop with Box",
                    "Laptop with Box and Bill",
                    "Laptop with Box, Bill & Brand Warranty",
                  ].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>RAM</label>
                  <input placeholder="e.g. 16GB DDR5" value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Processor</label>
                  <input placeholder="e.g. Intel i7-13700H" value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Storage Type</label>
                  <select value={form.storageType} onChange={(e) => setForm({ ...form, storageType: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                    {["SSD", "HDD", "NVMe", "NVMe M.2", "NVMe Gen 3", "NVMe Gen 4"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Storage Size</label>
                  <input placeholder="e.g. 512GB / 1TB" value={form.storageSize} onChange={(e) => setForm({ ...form, storageSize: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Graphics Card</label>
                  <input placeholder="e.g. RTX 4060" value={form.graphicsCard} onChange={(e) => setForm({ ...form, graphicsCard: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Price (₹) *</label>
                <input
                  type="text"
                  placeholder="e.g. 65,000"
                  value={form.price ? Number(form.price.replace(/,/g, "")).toLocaleString("en-IN") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                    setForm({ ...form, price: raw });
                  }}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                {form.price && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#22C55E", fontWeight: 600 }}>
                    ₹{Number(form.price).toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  🎬 YouTube Video Link <span style={{ color: "#334155", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                {form.videoUrl && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#22C55E" }}>
                    ✓ Video link added
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg,#16A34A,#22C55E)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
                {saving ? "Saving to Firebase..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <input placeholder="🔍  Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Product", "Category", "Price", "Stock", "Condition", "Status", "Actions"].map((h) => (
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
                  No products yet. Click "+ Add Product" to add your first one.
                </td></tr>
              ) : filtered.map((product) => (
                <tr key={product.id}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: 44, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 36, borderRadius: 6, background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💻</div>
                      )}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{product.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{product.category}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>₹{product.price?.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: product.stock === 0 ? "#F87171" : "#4ADE80" }}>{product.stock}</td>
                  <td style={{ padding: "14px 16px" }}><span className="badge badge-blue">{product.condition}</span></td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${product.status === "available" ? "badge-green" : "badge-red"}`}>{product.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-sm btn-blue">Edit</button>
                      <button className="btn-sm btn-red" onClick={() => handleDelete(product.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
