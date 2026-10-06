"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/products", label: "Products", icon: "🖥️" },
  { href: "/admin/clients", label: "Clients", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "📨" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: 240,
      minHeight: "100vh",
      background: "rgba(10, 15, 26, 0.95)",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex",
      flexDirection: "column",
      padding: "20px 12px",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <Link href="/admin" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "4px 8px" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "linear-gradient(135deg, #0066FF, #00AAFF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 17, color: "white",
          boxShadow: "0 4px 12px rgba(0,102,255,0.4)",
        }}>S</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "white" }}>SOLLABS</div>
          <div style={{ fontSize: 9, color: "#00AAFF", letterSpacing: 2 }}>ADMIN</div>
        </div>
      </Link>

      <div style={{ fontSize: 10, color: "#1E293B", fontWeight: 600, letterSpacing: 1, paddingLeft: 8, marginBottom: 8, textTransform: "uppercase" }}>
        Navigation
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href, item.exact) ? "active" : ""}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
        <div style={{ padding: "8px 14px", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>Admin User</div>
          <div style={{ fontSize: 11, color: "#334155" }}>sollabstech</div>
        </div>
        <button
          className="sidebar-link"
          onClick={() => router.push("/admin/login")}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
