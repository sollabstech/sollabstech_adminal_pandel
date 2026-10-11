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
