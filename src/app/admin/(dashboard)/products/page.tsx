"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  condition: string;
  status: string;
  images: string[];
  image: string;
  videoUrl?: string;
  accessories?: string;
  description?: string;
  productType?: "laptop" | "mobile";
  processor?: string;
  ram?: string;
  storageType?: string;
  storageSize?: string;
  graphicsCard?: string;
  display?: string;
  os?: string;
  battery?: string;
  ports?: string;
  weight?: string;
  brand?: string;
  mobileColor?: string;
  mobileRam?: string;
  mobileStorage?: string;
  network?: string;
  createdAt?: { seconds: number } | null;
}

const emptyForm = {
  productType: "laptop" as "laptop" | "mobile",
  name: "",
  category: "Gaming Laptops",
  price: "",
  originalPrice: "",
  condition: "Refurbished",
  accessories: "Only Laptop",
  description: "",
  videoUrl: "",
  processor: "",
  ram: "",
  storageType: "NVMe SSD",
  storageSize: "",
  graphicsCard: "",
  display: "",
  os: "",
  battery: "",
  ports: "",
  weight: "",
  brand: "Apple",
  mobileColor: "",
  mobileRam: "8GB",
  mobileStorage: "128GB",
  network: "4G",
  chipset: "",
  rearCamera: "",
  frontCamera: "",
  fastCharging: "",
  simType: "Dual SIM",
  refreshRate: "",
  ipRating: "",
  batteryHealth: "",
  physicalCondition: "Good",
  screenCondition: "No scratches",
  partsReplaced: "",
  biometricWorking: "Yes",
  warrantyRemaining: "",
  purchaseDate: "",
  imei: "",
  imageFiles: [] as File[],
  imagePreviews: [] as string[],
};

type FormState = typeof emptyForm;

const LABEL: React.CSSProperties = {
  fontSize: 11, color: "#475569", fontWeight: 600,
  display: "block", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: 0.5,
};

const SEC: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, letterSpacing: 1,
  marginBottom: 14, textTransform: "uppercase",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function FormInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box" }}
    />
  );
}

const LAPTOP_CATS = ["Gaming Laptops", "Business Laptops", "Student Laptops", "Used Laptops", "Custom PCs", "Workstations", "Accessories"];
const MOBILE_CATS = ["Mobile Phones", "Refurbished Phones", "Gaming Phones"];
const MOBILE_BRANDS = ["Apple", "Samsung", "OnePlus", "Xiaomi/Redmi", "Realme", "Vivo", "Oppo", "iQOO", "Google Pixel", "Motorola", "Nothing", "ASUS ROG", "Poco", "Other"];
const MOBILE_RAM = ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "Other"];
const MOBILE_STORAGE = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "Other"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "laptop" | "mobile">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function isMobileCategory(cat: string) {
    return ["Smartphones", "Gaming Phones", "Mobile Phones", "Refurbished Phones"].includes(cat);
  }

  const filtered = products.filter((p) => {
    const pIsMobile = p.productType === "mobile" || isMobileCategory(p.category);
    const matchType =
      typeFilter === "all" ||
      (typeFilter === "mobile" && pIsMobile) ||
      (typeFilter === "laptop" && !pIsMobile);
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  function setF<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function switchType(type: "laptop" | "mobile") {
    setForm((f) => ({
      ...f,
      productType: type,
      category: type === "laptop" ? "Gaming Laptops" : "Mobile Phones",
      condition: type === "laptop" ? "Refurbished" : "Brand New",
      accessories: type === "laptop" ? "Only Laptop" : "Only Phone",
    }));
  }

  function addImageFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = 7 - form.imageFiles.length;
    const toAdd = arr.slice(0, remaining);
    if (toAdd.length === 0) return;
    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...toAdd],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
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
      const imageUrls: string[] = [];
      for (let i = 0; i < form.imageFiles.length; i++) {
        setSaveProgress(`Uploading image ${i + 1} of ${form.imageFiles.length}...`);
        const storageRef = ref(storage, `products/${Date.now()}_${form.imageFiles[i].name}`);
        await uploadBytes(storageRef, form.imageFiles[i]);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
      setSaveProgress("Saving product...");
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productData: Record<string, any> = {
        productType: form.productType,
        name: form.name,
        slug,
        category: form.category,
        price: parseInt(form.price),
        originalPrice: form.originalPrice ? parseInt(form.originalPrice) : null,
        stock: 1,
        condition: form.condition,
        status: "available",
        images: imageUrls,
        image: imageUrls[0] || "",
        videoUrl: form.videoUrl.trim(),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      };

      if (form.productType === "laptop") {
        Object.assign(productData, {
          accessories: form.accessories,
          processor: form.processor.trim(),
          ram: form.ram.trim(),
          storageType: form.storageType,
          storageSize: form.storageSize.trim(),
          graphicsCard: form.graphicsCard.trim(),
          display: form.display.trim(),
          os: form.os.trim(),
          battery: form.battery.trim(),
          ports: form.ports.trim(),
          weight: form.weight.trim(),
        });
      } else {
        Object.assign(productData, {
          brand: form.brand,
          mobileColor: form.mobileColor.trim(),
          mobileRam: form.mobileRam,
          mobileStorage: form.mobileStorage,
          network: form.network,
          accessories: form.accessories,
          chipset: form.chipset.trim(),
          display: form.display.trim(),
          rearCamera: form.rearCamera.trim(),
          frontCamera: form.frontCamera.trim(),
          battery: form.battery.trim(),
          fastCharging: form.fastCharging.trim(),
          os: form.os.trim(),
          simType: form.simType,
          refreshRate: form.refreshRate.trim(),
          ipRating: form.ipRating.trim(),
        });
        if (form.condition !== "Brand New") {
          Object.assign(productData, {
            batteryHealth: form.batteryHealth.trim(),
            physicalCondition: form.physicalCondition,
            screenCondition: form.screenCondition,
            partsReplaced: form.partsReplaced.trim(),
            biometricWorking: form.biometricWorking,
            warrantyRemaining: form.warrantyRemaining.trim(),
            purchaseDate: form.purchaseDate.trim(),
          });
        }
      }

      const productRef = await addDoc(collection(db, "products"), productData);

      // IMEI stored in a private sub-collection — NEVER exposed to the public website.
      // Firestore rule to add: match /products/{id}/private/{doc} { allow read, write: if request.auth != null && request.auth.token.admin == true; }
      if (form.productType === "mobile" && form.imei.trim()) {
        await setDoc(doc(db, "products", productRef.id, "private", "imei"), {
          imei: form.imei.trim(),
          addedAt: serverTimestamp(),
        });
      }

      setForm(emptyForm);
      setShowAdd(false);
    } catch (err) {
      console.error("Error adding product:", err);
    }
    setSaveProgress("");
    setSaving(false);
  };

  const isMobile = form.productType === "mobile";
  const isUsedPhone = isMobile && form.condition !== "Brand New";

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

      {/* ── Add Product Modal ── */}
      {showAdd && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setForm(emptyForm); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{
            background: "#0D1526", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, width: "100%", maxWidth: 720,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden",
            display: "flex", flexDirection: "column", maxHeight: "92vh",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(34,197,94,0.06)", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>Add New Product</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Saved to Firebase instantly</div>
              </div>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748B", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>

              {/* ── Images ── */}
              <div>
                <label style={LABEL}>Product Images <span style={{ color: "#334155", textTransform: "none", fontWeight: 400 }}>({form.imagePreviews.length}/7)</span></label>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files) addImageFiles(e.target.files); e.target.value = ""; }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {form.imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img src={src} alt={`img-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && (
                        <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,102,255,0.85)", borderRadius: 4, fontSize: 9, fontWeight: 700, padding: "2px 6px", color: "white", letterSpacing: 0.5 }}>MAIN</div>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none", cursor: "pointer", color: "white", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
                    </div>
                  ))}
                  {form.imagePreviews.length < 7 && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); addImageFiles(e.dataTransfer.files); }}
                      style={{
                        aspectRatio: "4/3", borderRadius: 10, cursor: "pointer",
                        border: `2px dashed ${dragOver ? "#22C55E" : "rgba(255,255,255,0.1)"}`,
                        background: dragOver ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 6, transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 24 }}>📷</div>
                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textAlign: "center" }}>
                        {form.imagePreviews.length === 0 ? "Add photos" : "More"}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>First image is the main photo. Drag & drop or click to add up to 7 images.</div>
              </div>

              {/* ── Product Type ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                <label style={LABEL}>Product Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["laptop", "mobile"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => switchType(t)}
                      style={{
                        flex: 1, padding: "10px 16px", borderRadius: 10, cursor: "pointer",
                        fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                        background: form.productType === t ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${form.productType === t ? "#0066FF" : "rgba(255,255,255,0.08)"}`,
                        color: form.productType === t ? "#00AAFF" : "#475569",
                      }}>
                      {t === "laptop" ? "💻 Laptop" : "📱 Mobile Phone"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Basic Info ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                <div style={{ ...SEC, color: "#00AAFF" }}>Basic Info</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label={isMobile ? "Phone Model *" : "Product Name *"}>
                    <FormInput value={form.name} onChange={(v) => setF("name", v)}
                      placeholder={isMobile ? "e.g. iPhone 15 Pro Max" : "e.g. ASUS TUF Gaming F15"} />
                  </Field>

                  {isMobile && (
                    <Field label="Brand *">
                      <select value={form.brand} onChange={(e) => setF("brand", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                        {MOBILE_BRANDS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </Field>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Category">
                      <select value={form.category} onChange={(e) => setF("category", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                        {(isMobile ? MOBILE_CATS : LAPTOP_CATS).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Condition">
                      <select value={form.condition} onChange={(e) => setF("condition", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                        {(isMobile
                          ? ["Brand New", "Refurbished", "Used"]
                          : ["Brand New", "Refurbished", "Demo", "Used Laptop"]
                        ).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>

                  {isMobile && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <Field label="Color">
                          <FormInput value={form.mobileColor} onChange={(v) => setF("mobileColor", v)} placeholder="e.g. Natural Titanium" />
                        </Field>
                        <Field label="RAM *">
                          <select value={form.mobileRam} onChange={(e) => setF("mobileRam", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                            {MOBILE_RAM.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </Field>
                        <Field label="Storage *">
                          <select value={form.mobileStorage} onChange={(e) => setF("mobileStorage", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                            {MOBILE_STORAGE.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </Field>
                      </div>
                      <Field label="Network *">
                        <div style={{ display: "flex", gap: 10 }}>
                          {["4G", "5G"].map((n) => (
                            <button key={n} type="button" onClick={() => setF("network", n)}
                              style={{
                                padding: "8px 28px", borderRadius: 8, cursor: "pointer",
                                fontWeight: 600, fontSize: 13,
                                background: form.network === n ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)",
                                border: `1.5px solid ${form.network === n ? "#0066FF" : "rgba(255,255,255,0.08)"}`,
                                color: form.network === n ? "#00AAFF" : "#475569",
                              }}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>
                  )}

                  <Field label="Accessories Included">
                    <select value={form.accessories} onChange={(e) => setF("accessories", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {(isMobile ? [
                        "Only Phone",
                        "Phone with Charger",
                        "Phone with Box",
                        "Phone with Box and Charger",
                        "Phone with Box, Bill & Warranty",
                        "Phone with Box, Bill & Brand Warranty",
                      ] : [
                        "Only Laptop",
                        "Laptop with Charger",
                        "Laptop with Box",
                        "Laptop with Box and Charger",
                        "Laptop with Box and Bill",
                        "Laptop with Box, Bill & Brand Warranty",
                      ]).map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* ── Pricing ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                <div style={{ ...SEC, color: "#00AAFF" }}>Pricing</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={LABEL}>Original Price / MRP (₹) <span style={{ color: "#334155", textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. 75,000"
                      value={form.originalPrice ? Number(form.originalPrice).toLocaleString("en-IN") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                        setForm((f) => ({ ...f, originalPrice: raw }));
                      }}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    {form.originalPrice && (
                      <div style={{ marginTop: 5, fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                        MRP ₹{Number(form.originalPrice).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={LABEL}>Your Price (₹) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 55,000"
                      value={form.price ? Number(form.price).toLocaleString("en-IN") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                        setForm((f) => ({ ...f, price: raw }));
                      }}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    {form.price && (
                      <div style={{ marginTop: 5, fontSize: 12, color: "#22C55E", fontWeight: 700 }}>
                        ₹{Number(form.price).toLocaleString("en-IN")}
                        {form.originalPrice && form.price && (
                          <span style={{ color: "#F59E0B", marginLeft: 8 }}>
                            {Math.round((1 - parseInt(form.price) / parseInt(form.originalPrice)) * 100)}% off
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Description ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                <div style={{ ...SEC, color: "#00AAFF" }}>About This Product</div>
                <Field label="Description">
                  <textarea
                    placeholder="Describe the product — condition details, why it's a great deal, what's included, etc."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 13, lineHeight: 1.6, fontFamily: "inherit" }}
                  />
                </Field>
              </div>

              {/* ── Full Specs — Laptop ── */}
              {!isMobile && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                  <div style={{ ...SEC, color: "#00AAFF" }}>Full Specifications</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Processor">
                        <FormInput value={form.processor} onChange={(v) => setF("processor", v)} placeholder="e.g. Intel Core i5-10300H" />
                      </Field>
                      <Field label="RAM">
                        <FormInput value={form.ram} onChange={(v) => setF("ram", v)} placeholder="e.g. 8GB DDR4 3200MHz" />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      <Field label="Storage Type">
                        <select value={form.storageType} onChange={(e) => setF("storageType", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                          {["NVMe SSD", "SSD", "HDD", "NVMe M.2", "NVMe Gen 3", "NVMe Gen 4", "eMMC"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Storage Size">
                        <FormInput value={form.storageSize} onChange={(v) => setF("storageSize", v)} placeholder="e.g. 512GB" />
                      </Field>
                      <Field label="Graphics Card">
                        <FormInput value={form.graphicsCard} onChange={(v) => setF("graphicsCard", v)} placeholder="e.g. NVIDIA GTX 1650" />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Display">
                        <FormInput value={form.display} onChange={(v) => setF("display", v)} placeholder='e.g. 15.6" FHD IPS 144Hz' />
                      </Field>
                      <Field label="Operating System">
                        <FormInput value={form.os} onChange={(v) => setF("os", v)} placeholder="e.g. Windows 11 Home" />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      <Field label="Battery">
                        <FormInput value={form.battery} onChange={(v) => setF("battery", v)} placeholder="e.g. 48Wh, ~4 hrs" />
                      </Field>
                      <Field label="Weight">
                        <FormInput value={form.weight} onChange={(v) => setF("weight", v)} placeholder="e.g. 2.3 kg" />
                      </Field>
                      <Field label="Ports">
                        <FormInput value={form.ports} onChange={(v) => setF("ports", v)} placeholder="e.g. USB-A ×3, HDMI, USB-C" />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Full Specs — Mobile ── */}
              {isMobile && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                  <div style={{ ...SEC, color: "#00AAFF" }}>Full Specifications</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Processor / Chipset">
                        <FormInput value={form.chipset} onChange={(v) => setF("chipset", v)} placeholder="e.g. Apple A17 Pro" />
                      </Field>
                      <Field label="Display">
                        <FormInput value={form.display} onChange={(v) => setF("display", v)} placeholder='e.g. 6.7" Super Retina XDR' />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Rear Camera">
                        <FormInput value={form.rearCamera} onChange={(v) => setF("rearCamera", v)} placeholder="e.g. 48MP + 12MP + 12MP" />
                      </Field>
                      <Field label="Front Camera">
                        <FormInput value={form.frontCamera} onChange={(v) => setF("frontCamera", v)} placeholder="e.g. 12MP TrueDepth" />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Battery Capacity">
                        <FormInput value={form.battery} onChange={(v) => setF("battery", v)} placeholder="e.g. 4422mAh" />
                      </Field>
                      <Field label="Fast Charging">
                        <FormInput value={form.fastCharging} onChange={(v) => setF("fastCharging", v)} placeholder="e.g. 20W, MagSafe 15W" />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="OS / Version">
                        <FormInput value={form.os} onChange={(v) => setF("os", v)} placeholder="e.g. iOS 18 / Android 14" />
                      </Field>
                      <Field label="SIM Type">
                        <select value={form.simType} onChange={(e) => setF("simType", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                          {["Dual SIM", "Single SIM", "Dual SIM + eSIM", "eSIM Only"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Refresh Rate">
                        <FormInput value={form.refreshRate} onChange={(v) => setF("refreshRate", v)} placeholder="e.g. 120Hz ProMotion" />
                      </Field>
                      <Field label="IP Rating">
                        <FormInput value={form.ipRating} onChange={(v) => setF("ipRating", v)} placeholder="e.g. IP68" />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Used Phone Condition Report ── */}
              {isUsedPhone && (
                <div style={{ borderTop: "1px solid rgba(245,158,11,0.2)", paddingTop: 20 }}>
                  <div style={{ ...SEC, color: "#F59E0B" }}>⚠ Used Condition Details</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Battery Health %">
                        <FormInput value={form.batteryHealth} onChange={(v) => setF("batteryHealth", v)} placeholder="e.g. 89%" />
                      </Field>
                      <Field label="Physical Condition">
                        <select value={form.physicalCondition} onChange={(e) => setF("physicalCondition", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                          {["Excellent", "Good", "Fair", "Poor"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Screen Condition">
                        <select value={form.screenCondition} onChange={(e) => setF("screenCondition", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                          {["No scratches", "Minor scratches", "Visible scratches", "Cracked"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Face ID / Fingerprint Working">
                        <select value={form.biometricWorking} onChange={(e) => setF("biometricWorking", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                          {["Yes", "No", "Partial"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Parts Replaced">
                      <FormInput value={form.partsReplaced} onChange={(v) => setF("partsReplaced", v)} placeholder="e.g. Battery replaced, Screen replaced, None" />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Warranty Remaining">
                        <FormInput value={form.warrantyRemaining} onChange={(v) => setF("warrantyRemaining", v)} placeholder="e.g. 6 months, Expired" />
                      </Field>
                      <Field label="Purchase Month / Year">
                        <FormInput value={form.purchaseDate} onChange={(v) => setF("purchaseDate", v)} placeholder="e.g. March 2023" />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── IMEI — Admin Only ── */}
              {isMobile && (
                <div style={{ borderTop: "1px solid rgba(239,68,68,0.2)", paddingTop: 20 }}>
                  <div style={{ ...SEC, color: "#F87171" }}>🔒 IMEI — Admin Only</div>
                  <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#F87171", lineHeight: 1.6 }}>
                    Stored in a private Firestore sub-collection. <strong>Never</strong> sent to the public website.
                  </div>
                  <Field label="IMEI Number (optional)">
                    <input
                      type="password"
                      placeholder="15-digit IMEI"
                      value={form.imei}
                      onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))}
                      autoComplete="off"
                      style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: 2 }}
                    />
                  </Field>
                  {form.imei && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#22C55E" }}>
                      ✓ {form.imei.length} digits entered — will be saved privately
                    </div>
                  )}
                </div>
              )}

              {/* ── YouTube Video ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
                <Field label="🎬 YouTube Video Link (optional)">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.videoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                  {form.videoUrl && <div style={{ marginTop: 6, fontSize: 12, color: "#22C55E" }}>✓ Video link added</div>}
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, background: "rgba(0,0,0,0.2)" }}>
              {saving && <div style={{ fontSize: 12, color: "#64748B", alignSelf: "center", marginRight: "auto" }}>{saveProgress}</div>}
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 28px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? "#334155" : "linear-gradient(135deg,#16A34A,#22C55E)", color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
                {saving ? "Saving..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter + Search ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "laptop", "mobile"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{
                padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: typeFilter === t ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${typeFilter === t ? "#0066FF" : "rgba(255,255,255,0.08)"}`,
                color: typeFilter === t ? "#00AAFF" : "#475569",
              }}>
              {t === "all" ? "All" : t === "laptop" ? "💻 Laptops" : "📱 Mobiles"}
            </button>
          ))}
        </div>
        <input placeholder="🔍  Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Product", "Type", "Category", "Price", "Stock", "Condition", "Status", "Actions"].map((h) => (
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
                <tr><td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#334155", fontSize: 14 }}>
                  No products yet. Click &quot;+ Add Product&quot; to add your first one.
                </td></tr>
              ) : filtered.map((product) => {
                const pIsMobile = product.productType === "mobile" || isMobileCategory(product.category);
                return (
                  <tr key={product.id}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {(product.images?.[0] || product.image) ? (
                          <img src={product.images?.[0] || product.image} alt={product.name} style={{ width: 44, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 44, height: 36, borderRadius: 6, background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                            {pIsMobile ? "📱" : "💻"}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{product.name}</div>
                          {product.images?.length > 1 && (
                            <div style={{ fontSize: 10, color: "#334155" }}>{product.images.length} photos</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 18, textAlign: "center" }}>
                      {pIsMobile ? "📱" : "💻"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{product.category}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>₹{product.price?.toLocaleString("en-IN")}</div>
                      {product.originalPrice && (
                        <div style={{ fontSize: 11, color: "#475569", textDecoration: "line-through" }}>₹{product.originalPrice.toLocaleString("en-IN")}</div>
                      )}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
