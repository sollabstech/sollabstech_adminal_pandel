"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase";

// Must match the email list in firestore.rules / storage.rules.
export const ADMIN_EMAILS = ["sollabstech@gmail.com"];

export function isAdminUser(user: User | null): boolean {
  return !!user?.email && user.emailVerified && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

type Status = "loading" | "signed-out" | "denied" | "admin";

interface AdminAuthValue {
  user: User | null;
  status: Status;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    return onAuthStateChanged(getClientAuth(), (u: User | null) => {
      setUser(u);
      setStatus(!u ? "signed-out" : isAdminUser(u) ? "admin" : "denied");
    });
  }, []);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(getClientAuth(), provider);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getClientAuth());
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, status, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
