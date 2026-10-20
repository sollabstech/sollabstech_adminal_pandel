import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// The website's /warranty checker reads only this collection, by exact serial.
// Never add customer name, phone, city, price, IMEI or notes here.
export const PUBLIC_WARRANTY_COLLECTION = "warrantyPublic";

// Keep identical to warrantyKey() in the website repo (src/lib/warranty.ts).
export function warrantyKey(serial: string): string {
  return serial.trim().toUpperCase().replace(/\s+/g, "").replace(/\//g, "-");
}

export interface PublicWarrantySource {
  serialNumber: string;
  deviceType?: "laptop" | "mobile";
  laptopName: string;
  brand: string;
  purchaseDate: string;
  warrantyMonths: number;
  warrantyEndDate: string;
}

export async function savePublicWarranty(r: PublicWarrantySource): Promise<void> {
  await setDoc(doc(db, PUBLIC_WARRANTY_COLLECTION, warrantyKey(r.serialNumber)), {
    serialNumber: r.serialNumber.trim(),
    deviceType: r.deviceType ?? "laptop",
    deviceName: r.laptopName,
    brand: r.brand,
    purchaseDate: r.purchaseDate,
    warrantyMonths: r.warrantyMonths,
    warrantyEndDate: r.warrantyEndDate,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePublicWarranty(serial: string): Promise<void> {
  await deleteDoc(doc(db, PUBLIC_WARRANTY_COLLECTION, warrantyKey(serial)));
}

// ── Check by phone ──────────────────────────────────────────────────
// The website's checker looks up warrantyByPhone/{phoneKey(phone)}. The doc id is a
// SHA-256 of the 10-digit number, so the raw phone is never stored publicly, and the
// doc only lists devices and warranty dates (no name, phone, price, IMEI or notes).
export const PHONE_WARRANTY_COLLECTION = "warrantyByPhone";

// Keep identical to phoneKey() in the website repo (src/lib/warranty.ts).
export function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}
export async function phoneKey(phone: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sollabs-warranty:" + normalisePhone(phone)));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PhoneWarrantySource extends PublicWarrantySource { clientPhone: string }

// Rewrites the public entry for one phone from all of that customer's records.
export async function syncPhoneWarranty(phone: string, all: PhoneWarrantySource[]): Promise<void> {
  const p = normalisePhone(phone);
  if (p.length !== 10) return;
  const ref = doc(db, PHONE_WARRANTY_COLLECTION, await phoneKey(p));
  const mine = all.filter((r) => normalisePhone(r.clientPhone ?? "") === p);
  if (mine.length === 0) { await deleteDoc(ref); return; }
  await setDoc(ref, {
    devices: mine.map((r) => ({
      deviceType: r.deviceType ?? "laptop",
      deviceName: r.laptopName,
      brand: r.brand ?? "",
      purchaseDate: r.purchaseDate,
      warrantyMonths: r.warrantyMonths,
      warrantyEndDate: r.warrantyEndDate,
    })),
    updatedAt: serverTimestamp(),
  });
}
