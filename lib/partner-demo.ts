import type { PartnerCalendarEvent } from "./partner-calendar";
import { isFeaturePreviewHost } from "./feature-preview";

export function isPartnerDemoAllowed(location: Pick<Location, "hostname" | "search">) {
  return isFeaturePreviewHost(location) && new URLSearchParams(location.search).get("demo") === "1";
}

export function createPartnerDemoEvents(now = new Date()): PartnerCalendarEvent[] {
  const at = (daysFromNow: number, hour: number, durationHours: number) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow, hour);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  };
  const inquiry = at(1, 10, 1);
  const booking = at(4, 14, 6);
  const blocked = at(8, 9, 8);

  return [
    { id: "demo-inquiry", partnerId: "demo", title: "Erstgespräch – Hochzeit Weber", startsAt: inquiry.start, endsAt: inquiry.end, location: "Video-Call", notes: "Demo-Termin", type: "inquiry", status: "tentative", source: "ouivio" },
    { id: "demo-booking", partnerId: "demo", title: "Hochzeit – Gut Sonnenhof", startsAt: booking.start, endsAt: booking.end, location: "Gut Sonnenhof", notes: "Demo-Buchung", type: "booking", status: "confirmed", source: "ouivio" },
    { id: "demo-blocked", partnerId: "demo", title: "Nicht verfügbar", startsAt: blocked.start, endsAt: blocked.end, location: "", notes: "Demo-Sperrzeit", type: "blocked", status: "confirmed", source: "ouivio" },
  ];
}
