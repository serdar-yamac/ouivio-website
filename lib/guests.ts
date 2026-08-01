import { getSupabaseClient } from "./supabase";

export type RsvpStatus = "open" | "accepted" | "declined";

export type Guest = {
  id: string;
  name: string;
  group: string;
  email: string;
  status: RsvpStatus;
  dietaryNotes: string;
  inviteToken: string;
  respondedAt: string | null;
  createdAt: string;
};

type GuestRow = {
  id: string;
  name: string;
  guest_group: string | null;
  email: string | null;
  rsvp_status: RsvpStatus;
  dietary_notes: string | null;
  invite_token: string;
  rsvp_responded_at: string | null;
  created_at: string;
};

export type Invitation = {
  guestName: string;
  partnerNames: string;
  weddingDate: string | null;
  weddingLocation: string | null;
  currentStatus: RsvpStatus;
};

const guestColumns = "id,name,guest_group,email,rsvp_status,dietary_notes,invite_token,rsvp_responded_at,created_at";

function mapGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    group: row.guest_group ?? "",
    email: row.email ?? "",
    status: row.rsvp_status,
    dietaryNotes: row.dietary_notes ?? "",
    inviteToken: row.invite_token,
    respondedAt: row.rsvp_responded_at,
    createdAt: row.created_at,
  };
}

export async function fetchGuests(weddingId: string): Promise<Guest[]> {
  const { data, error } = await getSupabaseClient().from("guests").select(guestColumns).eq("wedding_id", weddingId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data as GuestRow[]).map(mapGuest);
}

export async function createGuest(weddingId: string, input: Pick<Guest, "name" | "group" | "email" | "dietaryNotes">): Promise<Guest> {
  const { data, error } = await getSupabaseClient().from("guests").insert({
    wedding_id: weddingId,
    name: input.name,
    guest_group: input.group || null,
    email: input.email || null,
    dietary_notes: input.dietaryNotes || null,
  }).select(guestColumns).single();
  if (error) throw error;
  return mapGuest(data as GuestRow);
}

export async function updateGuest(guest: Guest): Promise<Guest> {
  const { data, error } = await getSupabaseClient().from("guests").update({
    name: guest.name,
    guest_group: guest.group || null,
    email: guest.email || null,
    dietary_notes: guest.dietaryNotes || null,
    rsvp_status: guest.status,
  }).eq("id", guest.id).select(guestColumns).single();
  if (error) throw error;
  return mapGuest(data as GuestRow);
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("guests").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchInvitation(token: string): Promise<Invitation | null> {
  const { data, error } = await getSupabaseClient().rpc("get_guest_invitation", { p_token: token });
  if (error) throw error;
  const invitation = data?.[0];
  if (!invitation) return null;
  return {
    guestName: invitation.guest_name,
    partnerNames: invitation.partner_names,
    weddingDate: invitation.wedding_date,
    weddingLocation: invitation.wedding_location,
    currentStatus: invitation.current_status,
  };
}

export async function submitRsvp(token: string, response: Exclude<RsvpStatus, "open">): Promise<RsvpStatus> {
  const { data, error } = await getSupabaseClient().rpc("submit_guest_rsvp", { p_token: token, p_response: response });
  if (error) throw error;
  if (!data?.[0]) throw new Error("Einladung nicht gefunden.");
  return data[0].current_status as RsvpStatus;
}
