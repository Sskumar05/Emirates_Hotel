export const CATEGORY_LABELS: Record<string, string> = {
  ac_double: "Deluxe",
  ac_triple: "Triple",
  ac_four: "Four Bed",
};

export const AMENITY_LABELS: Record<string, string> = {
  WiFi: "Complimentary WiFi",
  AC: "Air Conditioning",
  TV: "Smart TV",
  "Hot Water": "Hot Water",
  CCTV: "24/7 CCTV",
  Parking: "Car Parking",
  Kitchen: "Kitchen Facility",
  "Welcome Drink": "Welcome Drink",
};

export function formatINR(n: number | string): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
}

export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isoDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}
