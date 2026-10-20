// All shop details printed on the bill. Edit here and redeploy.
export const company = {
  name: "Sollabs Tech",
  tagline: "Laptops & Mobiles",
  address: "SS Colony, Bharathiyar 4th Street, Madurai, Tamil Nadu - 625402",
  phone: "+91 90038 50743",
  whatsapp: "+91 90038 50743",
  email: "sollabstech@gmail.com",
  website: "www.sollabstech.com",
  instagram: "@sollabs_tech_laptop__custom_pc",
  // Leave empty to hide the GSTIN line on the bill.
  gstin: "",
  defaultGstRate: 3,
  // Authorised signature printed on every bill by default (PNG in /public).
  // Set to null to leave the line blank for a hand signature.
  authorisedSignature: "/invoice/signature-authorised.png" as string | null,
  // Shop seal stamped next to the authorised signature on every bill (PNG in /public).
  // Set to null to hide it.
  seal: "/invoice/seal.png" as string | null,
  warranty: {
    title: "Warranty & Service Promise",
    covered: [
      { label: "7-day refund", text: "Return within 7 days for a 100% refund." },
      {
        label: "1-month exchange",
        text: "Swap for another device and pay or receive the price difference.",
      },
      {
        label: "6-month upgrade",
        text: "RAM/SSD upgrades at 90% of the parts cost, free labour.",
      },
      {
        label: "1-year free service",
        text: "Free servicing and diagnostics at our service centre.",
      },
    ],
    notCovered:
      "Not covered: physical or liquid damage, unauthorised repair or modification, software issues.",
  },
  thankYou: "Thank you for shopping with Sollabs Tech!",
} as const;
