import { getSupabaseClient } from "./supabase";

export type CustomerEvent = {
  id: string;
  weddingId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  notes: string;
};

type CustomerEventRow = {
  id: string;
  wedding_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
};

const columns = "id,wedding_id,title,starts_at,ends_at,location,notes";

function mapEvent(row: CustomerEventRow): CustomerEvent {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location ?? "",
    notes: row.notes ?? "",
  };
}

export async function fetchCustomerEvents(weddingId: string) {
  const { data, error } = await getSupabaseClient()
    .from("events")
    .select(columns)
    .eq("wedding_id", weddingId)
    .order("starts_at");

  if (error) throw error;
  return (data as CustomerEventRow[]).map(mapEvent);
}

export async function createCustomerEvent(
  weddingId: string,
  input: Pick<CustomerEvent, "title" | "startsAt" | "endsAt" | "location" | "notes">,
) {
  const { data, error } = await getSupabaseClient()
    .from("events")
    .insert({
      wedding_id: weddingId,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location || null,
      notes: input.notes || null,
    })
    .select(columns)
    .single();

  if (error) throw error;
  return mapEvent(data as CustomerEventRow);
}

export async function updateCustomerEvent(event: CustomerEvent) {
  const { data, error } = await getSupabaseClient()
    .from("events")
    .update({
      title: event.title,
      starts_at: event.startsAt,
      ends_at: event.endsAt,
      location: event.location || null,
      notes: event.notes || null,
    })
    .eq("id", event.id)
    .select(columns)
    .single();

  if (error) throw error;
  return mapEvent(data as CustomerEventRow);
}

export async function deleteCustomerEvent(id: string) {
  const { error } = await getSupabaseClient().from("events").delete().eq("id", id);
  if (error) throw error;
}
