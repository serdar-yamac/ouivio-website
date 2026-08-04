import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptCalendarCredentials, encryptCalendarCredentials } from "@/lib/calendar-credentials";
import { type OAuthCalendarCredentials, type OAuthCalendarProvider, refreshOAuthAccessToken } from "@/lib/oauth-calendar";

type SyncJob = { connectionId: string; partnerId: string; encryptedCredentials: string };
type ImportedEvent = { external_event_id: string; starts_at: string; ends_at: string; title: string };

export async function syncOAuthCalendar({ supabase, provider, job }: { supabase: SupabaseClient; provider: OAuthCalendarProvider; job: SyncJob }) {
  const credentials = decryptCalendarCredentials<OAuthCalendarCredentials>(job.encryptedCredentials);
  const refreshed = await refreshOAuthAccessToken(provider, credentials);
  const events = provider === "google" ? await readGoogleEvents(refreshed.accessToken) : await readMicrosoftEvents(refreshed.accessToken);
  const source = provider === "google" ? "google" : "microsoft";
  const { error: deleteError } = await supabase.from("partner_calendar_events").delete().eq("partner_id", job.partnerId).eq("source", source);
  if (deleteError) throw deleteError;
  if (events.length) {
    const { error: insertError } = await supabase.from("partner_calendar_events").insert(events.slice(0, 500).map((event) => ({ ...event, partner_id: job.partnerId, event_type: "blocked", status: "confirmed", source, resource_key: "primary" })));
    if (insertError) throw insertError;
  }
  const { error: connectionError } = await supabase.from("calendar_connections").update({ last_synced_at: new Date().toISOString(), status: "connected", updated_at: new Date().toISOString() }).eq("id", job.connectionId);
  if (connectionError) throw connectionError;
  if (refreshed.accessToken !== credentials.accessToken || refreshed.refreshToken !== credentials.refreshToken) {
    const { error: secretError } = await supabase.rpc("replace_calendar_connection_secret", { p_connection_id: job.connectionId, p_encrypted_credentials: encryptCalendarCredentials(refreshed) });
    if (secretError) throw secretError;
  }
  return { imported: events.length };
}

async function readGoogleEvents(accessToken: string) {
  const range = syncRange(); const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", range.start); url.searchParams.set("timeMax", range.end); url.searchParams.set("singleEvents", "true"); url.searchParams.set("orderBy", "startTime"); url.searchParams.set("maxResults", "2500");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const data = await response.json() as { items?: Array<{ id?: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || "Google Calendar konnte nicht gelesen werden.");
  return (data.items || []).flatMap((event) => toImportedEvent(`google:${event.id || ""}`, event.summary, event.start, event.end));
}

async function readMicrosoftEvents(accessToken: string) {
  const range = syncRange(); const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView");
  url.searchParams.set("startDateTime", range.start); url.searchParams.set("endDateTime", range.end); url.searchParams.set("$top", "1000"); url.searchParams.set("$select", "id,subject,start,end");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' }, cache: "no-store" });
  const data = await response.json() as { value?: Array<{ id?: string; subject?: string; start?: { dateTime?: string; timeZone?: string }; end?: { dateTime?: string; timeZone?: string } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || "Outlook Calendar konnte nicht gelesen werden.");
  return (data.value || []).flatMap((event) => toImportedEvent(`microsoft:${event.id || ""}`, event.subject, event.start, event.end));
}

function syncRange() { return { start: new Date(Date.now() - 30 * 86_400_000).toISOString(), end: new Date(Date.now() + 730 * 86_400_000).toISOString() }; }
function toImportedEvent(id: string, title: string | undefined, start?: { dateTime?: string; date?: string }, end?: { dateTime?: string; date?: string }) { const startsAt = toIso(start); const endsAt = toIso(end); return id && startsAt && endsAt ? [{ external_event_id: id, starts_at: startsAt, ends_at: endsAt, title: (title || "Belegt · Externer Kalender").slice(0, 160) }] : []; }
function toIso(value?: { dateTime?: string; date?: string }) { if (!value) return null; if (value.dateTime) return /(?:Z|[+-]\d\d:\d\d)$/.test(value.dateTime) ? new Date(value.dateTime).toISOString() : new Date(`${value.dateTime}Z`).toISOString(); if (value.date) return new Date(`${value.date}T00:00:00.000Z`).toISOString(); return null; }
