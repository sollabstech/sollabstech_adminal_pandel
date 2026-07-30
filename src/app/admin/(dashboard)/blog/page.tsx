"use client";

import { useState } from "react";

const postsData = [
  { id: 1, title: "Why Next.js is the Best Choice for 2025", category: "Web Dev", status: "published", views: 1240, date: "Jan 15, 2025" },
  { id: 2, title: "Flutter vs React Native for Indian Startups", category: "Mobile", status: "published", views: 980, date: "Jan 8, 2025" },
  { id: 3, title: "How to Buy a Second-Hand Laptop Without Getting Scammed", category: "Buying Guide", status: "published", views: 2100, date: "Dec 28, 2024" },
  { id: 4, title: "Building a Gaming PC Under ₹80,000", category: "PC Building", status: "draft", views: 0, date: "—" },
  { id: 5, title: "AI Integration for Small Businesses", category: "AI", status: "published", views: 760, date: "Dec 12, 2024" },
];

export default function BlogPage() {
  const [posts, setPosts] = useState(postsData);
  const [showAdd, setShowAdd] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", category: "Web Dev" });

  const handleDelete = (id: number) => {
    if (confirm("Delete this post?")) setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleStatus = (id: number) => {
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, status: p.status === "published" ? "draft" : "published" } : p
    ));
  };

  const handleAdd = () => {
    if (!newPost.title) return;
    setPosts((prev) => [...prev, { id: Date.now(), ...newPost, status: "draft", views: 0, date: "—" }]);
    setNewPost({ title: "", category: "Web Dev" });
    setShowAdd(false);
  };

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Blog</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>{posts.filter((p) => p.status === "published").length} published · {posts.filter((p) => p.status === "draft").length} drafts</p>
        </div>
        <button className="btn-sm btn-green" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 16px" }}>
          + New Post
        </button>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 380 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>New Blog Post</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Title</label><input placeholder="Post title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} /></div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Category</label>
                <select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}>
                  {["Web Dev", "Mobile", "Buying Guide", "PC Building", "AI", "Business"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-sm btn-green" style={{ flex: 1, padding: 10 }} onClick={handleAdd}>Create Draft</button>
              <button className="btn-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", padding: "10px 16px" }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Title", "Category", "Status", "Views", "Date", "Actions"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600,
                  padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}
                onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "white", maxWidth: 300 }}>{post.title}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="badge badge-blue">{post.category}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge ${post.status === "published" ? "badge-green" : "badge-yellow"}`}>{post.status}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#94A3B8" }}>{post.views.toLocaleString()}</td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155" }}>{post.date}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-sm btn-blue">Edit</button>
                    <button className={`btn-sm ${post.status === "published" ? "" : "btn-green"}`}
                      style={post.status === "published" ? { background: "rgba(255,255,255,0.05)", color: "#64748B" } : undefined}
                      onClick={() => toggleStatus(post.id)}>
                      {post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button className="btn-sm btn-red" onClick={() => handleDelete(post.id)}>Delete</button>
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
