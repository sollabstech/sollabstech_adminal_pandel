"use client";

import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Post {
  id: string;
  title: string;
  category: string;
  status: "published" | "draft";
  views: number;
  date: string;
  createdAt?: { seconds: number } | null;
}

const CATEGORIES = ["Web Dev", "Mobile", "Buying Guide", "PC Building", "AI", "Business", "Tech Tips", "Other"];

const emptyForm = { title: "", category: "Web Dev" };

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      await addDoc(collection(db, "blog"), {
        title: form.title.trim(),
        category: form.category,
        status: "draft",
        views: 0,
        date: now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function toggleStatus(post: Post) {
    const newStatus = post.status === "published" ? "draft" : "published";
    await updateDoc(doc(db, "blog", post.id), { status: newStatus });
  }

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Blog</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {loading ? "Loading..." : `${published} published · ${drafts} drafts · live from Firebase`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,102,255,0.35)" }}>
          <span style={{ fontSize: 18 }}>+</span> New Post
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setForm(emptyForm); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0D1526", border: "1px solid rgba(0,102,255,0.25)", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 20 }}>📝 New Blog Post</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Title</label>
                <input placeholder="Post title..." value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  style={{ width: "100%", boxSizing: "border-box" }} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box" }}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleCreate} disabled={saving || !form.title.trim()}
                style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving || !form.title.trim() ? "#334155" : "linear-gradient(135deg,#0066FF,#0099FF)", color: "white", border: "none", cursor: saving || !form.title.trim() ? "not-allowed" : "pointer" }}>
                {saving ? "Creating..." : "Create Draft"}
              </button>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading from Firebase...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <div style={{ color: "#334155", fontSize: 14, marginBottom: 6 }}>No blog posts yet.</div>
            <div style={{ fontSize: 12, color: "#1E293B" }}>Click "+ New Post" to write your first article.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Category", "Status", "Views", "Date", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#334155", fontWeight: 600, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "white", maxWidth: 320 }}>{post.title}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="badge badge-blue">{post.category}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${post.status === "published" ? "badge-green" : "badge-yellow"}`}>{post.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#94A3B8" }}>{(post.views ?? 0).toLocaleString()}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155" }}>{post.date || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`btn-sm ${post.status === "published" ? "" : "btn-green"}`}
                        style={post.status === "published" ? { background: "rgba(255,255,255,0.05)", color: "#64748B" } : undefined}>
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button className="btn-sm btn-red" onClick={() => deleteDoc(doc(db, "blog", post.id))}>Delete</button>
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
