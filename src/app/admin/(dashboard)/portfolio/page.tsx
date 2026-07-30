"use client";

import { useState } from "react";

const initialProjects = [
  { id: 1, title: "ShopEase E-commerce", client: "RetailCo India", category: "E-commerce", tech: "Next.js, Stripe", status: "live", date: "Dec 2024" },
  { id: 2, title: "FleetPro CRM", client: "LogiTrack Solutions", category: "CRM", tech: "React, MongoDB", status: "live", date: "Nov 2024" },
  { id: 3, title: "HealthSync Mobile App", client: "HealthFirst Clinic", category: "Mobile App", tech: "Flutter, Firebase", status: "live", date: "Oct 2024" },
  { id: 4, title: "Analytics Dashboard", client: "DataViz Corp", category: "Dashboard", tech: "React, Chart.js", status: "live", date: "Sep 2024" },
  { id: 5, title: "EduLearn Platform", client: "EduTech India", category: "Website", tech: "Next.js, MongoDB", status: "in-progress", date: "Jan 2025" },
  { id: 6, title: "SmartBot AI", client: "TechStart Mumbai", category: "AI", tech: "Python, OpenAI", status: "live", date: "Aug 2024" },
];

export default function PortfolioPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", client: "", category: "Website", tech: "" });

  const handleDelete = (id: number) => {
    if (confirm("Remove project?")) setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = () => {
    if (!newProject.title || !newProject.client) return;
    setProjects((prev) => [...prev, {
      id: Date.now(), ...newProject, status: "in-progress", date: "Jul 2025",
    }]);
    setNewProject({ title: "", client: "", category: "Website", tech: "" });
    setShowAdd(false);
  };

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Portfolio</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>{projects.length} projects</p>
        </div>
        <button className="btn-sm btn-green" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 16px" }}>
          + Add Project
        </button>
      </div>

      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>Add Project</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Title</label><input placeholder="Project name" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Client</label><input placeholder="Client name" value={newProject.client} onChange={(e) => setNewProject({ ...newProject, client: e.target.value })} /></div>
              <div>
                <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Category</label>
                <select value={newProject.category} onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}>
                  {["Website", "Mobile App", "E-commerce", "CRM", "ERP", "Dashboard", "AI"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Tech Stack</label><input placeholder="Next.js, Node.js" value={newProject.tech} onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-sm btn-green" style={{ flex: 1, padding: 10 }} onClick={handleAdd}>Add</button>
              <button className="btn-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", padding: "10px 16px" }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {projects.map((project) => (
          <div key={project.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className={`badge ${project.status === "live" ? "badge-green" : "badge-yellow"}`}>
                {project.status}
              </span>
              <span style={{ fontSize: 11, color: "#334155" }}>{project.date}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>{project.title}</h3>
            <p style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>{project.client}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <span className="badge badge-blue">{project.category}</span>
              <span style={{ fontSize: 11, color: "#334155" }}>{project.tech}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-sm btn-blue">Edit</button>
              <button className="btn-sm btn-red" onClick={() => handleDelete(project.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
