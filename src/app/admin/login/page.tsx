"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/adminAuth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function LoginCard() {
  const router = useRouter();
  const { status, user, signIn, signOut } = useAdminAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "admin") router.replace("/admin");
  }, [status, router]);

  async function handleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signIn();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(code === "auth/unauthorized-domain"
          ? "This website address isn't allowed to sign in yet. Add it under Firebase → Authentication → Settings → Authorized domains."
          : "Sign-in failed. Please try again.");
      }
    }
    setBusy(false);
  }

  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
      padding: "40px 36px", width: "100%", maxWidth: 400, position: "relative", zIndex: 1, backdropFilter: "blur(20px)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #0066FF, #00AAFF)",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, color: "white",
          margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(0,102,255,0.4)",
        }}>S</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 4 }}>Sollabs Tech Admin</h1>
        <p style={{ fontSize: 13, color: "#475569" }}>Sign in with your admin Google account</p>
      </div>

      {status === "denied" && (
        <div style={{ padding: "12px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, lineHeight: 1.6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
          <strong>{user?.email}</strong> is not an admin account.{" "}
          <button onClick={() => signOut()} style={{ background: "none", border: "none", color: "#60A5FA", cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>
            Use a different account
          </button>
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, lineHeight: 1.6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>{error}</div>
      )}

      <button
        onClick={handleSignIn}
        disabled={busy || status === "loading"}
        style={{
          width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "white", color: "#1F2937", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          opacity: busy || status === "loading" ? 0.7 : 1,
        }}
      >
        <GoogleIcon />
        {busy ? "Signing in…" : status === "loading" ? "Checking…" : "Sign in with Google"}
      </button>
      <p style={{ fontSize: 11.5, color: "#334155", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Only approved admin accounts can access this dashboard.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712", position: "relative", overflow: "hidden", padding: 20 }}>
      <div style={{ position: "absolute", top: "20%", left: "30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <AdminAuthProvider>
        <LoginCard />
      </AdminAuthProvider>
    </div>
  );
}
