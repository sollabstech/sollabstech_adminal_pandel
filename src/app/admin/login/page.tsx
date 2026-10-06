"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    if (creds.email === "sollabstech" && creds.password === "sollabstech") {
      router.push("/admin");
    } else {
      setError("Invalid credentials.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#030712", position: "relative", overflow: "hidden",
    }}>
      {/* Orbs */}
      <div style={{
        position: "absolute", top: "20%", left: "30%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 70%)",
        filter: "blur(60px)",
      }} />

      <div style={{
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        position: "relative",
        zIndex: 1,
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #0066FF, #00AAFF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 26, color: "white",
            margin: "0 auto 12px",
            boxShadow: "0 8px 24px rgba(0,102,255,0.4)",
          }}>S</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 4 }}>Sollabs Tech Admin</h1>
          <p style={{ fontSize: 13, color: "#475569" }}>Sign in to your dashboard</p>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171",
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: "#64748B", marginBottom: 6, fontWeight: 500 }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
              required
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, color: "#64748B", marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              required
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #0066FF, #00AAFF)",
              color: "white", border: "none",
              boxShadow: "0 4px 16px rgba(0,102,255,0.4)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
