"use client";

import { useState } from "react";

const initialProducts = [
  { id: 1, name: "Dell XPS 15", category: "Gaming Laptops", price: 65000, stock: 2, condition: "Excellent", status: "available" },
  { id: 2, name: "HP Pavilion Business Pro", category: "Business Laptops", price: 32000, stock: 1, condition: "Good", status: "available" },
  { id: 3, name: "Lenovo IdeaPad Student", category: "Student Laptops", price: 28000, stock: 3, condition: "Good", status: "available" },
  { id: 4, name: "Custom Gaming PC Titan", category: "Custom PCs", price: 120000, stock: 1, condition: "New", status: "available" },
  { id: 5, name: "Apple MacBook Pro M2", category: "Workstations", price: 115000, stock: 0, condition: "Excellent", status: "sold" },
  { id: 6, name: "Asus ROG Strix G15", category: "Gaming Laptops", price: 72000, stock: 1, condition: "Excellent", status: "available" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "Gaming Laptops", price: "", condition: "Good" });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm("Delete this product?")) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.price) return;
    setProducts((prev) => [...prev, {
      id: Date.now(), name: newProduct.name, category: newProduct.category,
      price: parseInt(newProduct.price), stock: 1, condition: newProduct.condition, status: "available",
    }]);
    setNewProduct({ name: "", category: "Gaming Laptops", price: "", condition: "Good" });
    setShowAdd(false);
  };

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Products</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>{products.length} products in inventory</p>
        </div>
        <button className="btn-sm btn-green" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 16px" }}>
          + Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>Add New Product</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Name</label>
                <input placeholder="Laptop name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Category</label>
                <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                  {["Gaming Laptops", "Business Laptops", "Student Laptops", "Custom PCs", "Workstations", "Accessories"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Price (₹)</label>
                <input type="number" placeholder="65000" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Condition</label>
                <select value={newProduct.condition} onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })}>
                  {["Excellent", "Good", "Fair", "Brand New"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-sm btn-green" style={{ flex: 1, padding: "10px" }} onClick={handleAdd}>Add Product</button>
              <button className="btn-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", padding: "10px 16px" }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input placeholder="🔍  Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
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
            {filtered.map((product) => (
              <tr key={product.id}
                onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "white" }}>{product.name}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748B" }}>{product.category}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>₹{product.price.toLocaleString("en-IN")}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: product.stock === 0 ? "#F87171" : "#4ADE80" }}>{product.stock}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="badge badge-blue">{product.condition}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${product.status === "available" ? "badge-green" : "badge-red"}`}>
                    {product.status}
                  </span>
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
      </div>
    </div>
  );
}
