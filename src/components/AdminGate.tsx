"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/adminAuth";

function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAdminAuth();

  useEffect(() => {
    if (status === "signed-out" || status === "denied") router.replace("/admin/login");
  }, [status, router]);

  if (status !== "admin") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030712", color: "#475569", fontSize: 14 }}>
        Checking access…
      </div>
    );
  }
  return <>{children}</>;
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <Gate>{children}</Gate>
    </AdminAuthProvider>
  );
}
