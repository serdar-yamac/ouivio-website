import { getSupabaseClient } from "./supabase";

export type PartnerEventType = "inquiry" | "option" | "booking" | "appointment" | "blocked";
export type PartnerCalendarEvent = { id: string; partnerId: string; title: string; startsAt: string; endsAt: string; location: string; notes: string; type: PartnerEventType; status: "tentative" | "confirmed" | "cancelled"; source: string };

const select = "id, partner_id, title, starts_at, ends_at, location, notes, event_type, status, source";
const mapEvent = (row: Record<string, unknown>): PartnerCalendarEvent => ({ id: row.id as string, partnerId: row.partner_id as string, title: row.title as string, startsAt: row.starts_at as string, endsAt: row.ends_at as string, location: (row.location as string | null) ?? "", notes: (row.notes as string | null) ?? "", type: row.event_type as PartnerEventType, status: row.status as PartnerCalendarEvent["status"], source: row.source as string });

export async function fetchPartnerEvents(partnerId: string) {
  const { data, error } = await getSupabaseClient().from("partner_calendar_events").select(select).eq("partner_id", partnerId).order("starts_at");
  if (error) throw error;
  return (data ?? []).map((row) => mapEvent(row));
}

export async function createPartnerEvent(partnerId: string, input: Omit<PartnerCalendarEvent, "id" | "partnerId" | "status" | "source">) {
  const { data, error } = await getSupabaseClient().from("partner_calendar_events").insert({ partner_id: partnerId, title: input.title, starts_at: input.startsAt, ends_at: input.endsAt, location: input.location || null, notes: input.notes || null, event_type: input.type }).select(select).single();
  if (error) throw error;
  return mapEvent(data);
}

export async function deletePartnerEvent(id: string) {
  const { error } = await getSupabaseClient().from("partner_calendar_events").delete().eq("id", id);
  if (error) throw error;
}
