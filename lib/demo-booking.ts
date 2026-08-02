export type DemoBookingItem = {
  id: string;
  category: string;
  name: string;
  price: number;
  currency: string;
};

export type DemoBooking = {
  createdAt: string;
  contactName: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  items: DemoBookingItem[];
  total: number;
};

export const demoBookingStorageKey = "ouivio.demo-booking.v1";

export function readDemoBooking(): DemoBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(demoBookingStorageKey) || "null");
    if (!value || typeof value !== "object") return null;
    const booking = value as Partial<DemoBooking>;
    if (typeof booking.createdAt !== "string" || typeof booking.contactName !== "string" || typeof booking.contactEmail !== "string" || typeof booking.startDate !== "string" || typeof booking.endDate !== "string" || typeof booking.total !== "number" || !Array.isArray(booking.items)) return null;
    return booking as DemoBooking;
  } catch {
    return null;
  }
}

export function saveDemoBooking(booking: DemoBooking) {
  window.localStorage.setItem(demoBookingStorageKey, JSON.stringify(booking));
}
