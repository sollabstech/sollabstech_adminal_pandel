"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { BillableProduct } from "./BillModal";

// The form (and, on download, the PDF library) loads only when someone taps Bill.
const BillModal = dynamic(() => import("./BillModal"), { ssr: false });

export default function BillButton({ product }: { product: BillableProduct }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="btn-sm"
        onClick={() => setOpen(true)}
        style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        Bill
      </button>
      {open && <BillModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
