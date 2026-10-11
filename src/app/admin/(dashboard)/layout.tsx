import AdminSidebar from "@/components/AdminSidebar";
import AdminGate from "@/components/AdminGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <main style={{ flex: 1, overflow: "auto", background: "#030712" }}>
          {children}
        </main>
      </div>
    </AdminGate>
  );
}
