import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptCalendarCredentials } from "@/lib/calendar-credentials";

const appleRoot = "https://caldav.icloud.com/";
const davContentType = "application/xml; charset=utf-8";

type Credentials = { appleId: string; appPassword: string };
type ImportedEvent = { external_event_id: string; starts_at: string; ends_at: string; title: string };

export type AppleCalendarSyncJob = {
  connectionId: string;
  partnerId: string;
  encryptedCredentials: string;
};

export async function syncAppleCalendar({
  supabase,
  encryptionKey,
  job,
}: {
  supabase: SupabaseClient;
  encryptionKey: string;
  job: AppleCalendarSyncJob;
}) {
  const credentials = decryptCalendarCredentials<Credentials>(job.encryptedCredentials, encryptionKey);
  const authorization = `Basic ${Buffer.from(`${credentials.appleId}:${credentials.appPassword}`, "utf8").toString("base64")}`;
  const { calendars, events } = await readAppleEvents(authorization);

  // A sync replaces only Apple-originated blocking times. Native Ouivio events remain untouched.
  const { error: deleteError } = await supabase
    .from("partner_calendar_events")
    .delete()
    .eq("partner_id", job.partnerId)
    .eq("source", "apple");
  if (deleteError) throw deleteError;

  if (events.length) {
    const { error: insertError } = await supabase.from("partner_calendar_events").insert(
      events.slice(0, 500).map((event) => ({
        ...event,
        partner_id: job.partnerId,
        event_type: "blocked",
        status: "confirmed",
        source: "apple",
        resource_key: "primary",
      })),
    );
    if (insertError) throw insertError;
  }

  const { error: connectionError } = await supabase
    .from("calendar_connections")
    .update({ last_synced_at: new Date().toISOString(), status: "connected", updated_at: new Date().toISOString() })
    .eq("id", job.connectionId);
  if (connectionError) throw connectionError;

  return { calendars, imported: events.length };
}

async function readAppleEvents(authorization: string): Promise<{ calendars: number; events: ImportedEvent[] }> {
  const headers = { Authorization: authorization, Depth: "0", "Content-Type": davContentType };
  const principalXml = await dav(appleRoot, headers, "<propfind xmlns=\"DAV:\"><prop><current-user-principal/></prop></propfind>");
  const principal = hrefForProperty(principalXml, "current-user-principal");
  if (!principal) throw new Error("Apple hat kein Kalenderkonto zurückgegeben.");
  const homeXml = await dav(new URL(principal, appleRoot).toString(), headers, "<propfind xmlns=\"DAV:\" xmlns:c=\"urn:ietf:params:xml:ns:caldav\"><prop><c:calendar-home-set/></prop></propfind>");
  const home = hrefForProperty(homeXml, "calendar-home-set");
  if (!home) throw new Error("Apple-Kalenderordner konnte nicht gelesen werden.");
  const collectionsXml = await dav(new URL(home, appleRoot).toString(), { ...headers, Depth: "1" }, "<propfind xmlns=\"DAV:\"><prop><resourcetype/></prop></propfind>");
  const calendars = calendarHrefs(collectionsXml);
  if (!calendars.length) throw new Error("Apple Calendar enthält keine lesbaren Kalender.");
  const report = `<?xml version="1.0"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="${caldavStamp(-30)}" end="${caldavStamp(730)}"/></c:comp-filter></c:comp-filter></c:filter></c:calendar-query>`;
  const result: ImportedEvent[] = [];
  for (const calendar of calendars.slice(0, 20)) {
    const response = await fetch(new URL(calendar, appleRoot).toString(), { method: "REPORT", headers: { ...headers, Depth: "1" }, body: report, cache: "no-store" });
    if (response.ok || response.status === 207) result.push(...parseIcsEvents(await response.text()));
  }
  return { calendars: calendars.length, events: Array.from(new Map(result.map((event) => [event.external_event_id, event])).values()) };
}

async function dav(url: string, headers: Record<string, string>, body: string) {
  const response = await fetch(url, { method: "PROPFIND", headers, body, cache: "no-store" });
  if (response.status === 401 || response.status === 403) throw new Error("Apple hat die Kalenderverbindung nicht mehr akzeptiert. Bitte verbindet den Kalender erneut.");
  if (!response.ok && response.status !== 207) throw new Error("Apple Calendar konnte gerade nicht gelesen werden.");
  return response.text();
}
function hrefForProperty(xml: string, property: "current-user-principal" | "calendar-home-set") { return xml.match(new RegExp(`<[^>]*:?${property}\\b[^>]*>[\\s\\S]*?<[^>]*:?href[^>]*>([^<]+)<\\/[^>]*:?href>[\\s\\S]*?<\\/[^>]*:?${property}>`, "i"))?.[1]; }
function calendarHrefs(xml: string) { return [...xml.matchAll(/<[^>]*:?response\b[^>]*>([\s\S]*?)<\/[^>]*:?response>/gi)].flatMap((response) => { const block = response[1]; if (!/<[^>]*:?calendar\b[^>]*\/?\s*>/i.test(block)) return []; const href = block.match(/<[^>]*:?href[^>]*>([^<]+)<\/[^>]*:?href>/i)?.[1]; return href ? [href] : []; }); }
function caldavStamp(days: number) { return new Date(Date.now() + days * 86_400_000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
function decodeXml(value: string) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#13;/g, "\r"); }
function unfold(ics: string) { return ics.replace(/\r?\n[ \t]/g, ""); }
function parseIcsEvents(xml: string): ImportedEvent[] { const blocks = [...xml.matchAll(/<[^>]*:?calendar-data[^>]*>([\s\S]*?)<\/[^>]*:?calendar-data>/gi)].map((match) => unfold(decodeXml(match[1]))); return blocks.flatMap((block) => [...block.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].flatMap((match) => { const uid = field(match[1], "UID"); const start = dateField(match[1], "DTSTART"); const end = dateField(match[1], "DTEND"); const startsAt = start ? parseIcsDate(start.value, start.timezone) : null; const endsAt = end ? parseIcsDate(end.value, end.timezone) : null; const summary = field(match[1], "SUMMARY"); return uid && startsAt && endsAt ? [{ external_event_id: uid, starts_at: startsAt, ends_at: endsAt, title: summary ? decodeIcsText(summary).slice(0, 160) : "Belegt · Apple Calendar" }] : []; })); }
function field(event: string, name: string) { return event.match(new RegExp(`(?:^|\\n)${name}(?:;[^:]*)?:(.+)`))?.[1]?.trim(); }
function dateField(event: string, name: "DTSTART" | "DTEND") { const match = event.match(new RegExp(`(?:^|\\n)${name}((?:;[^:]*)?):(.+)`)); if (!match) return null; return { value: match[2].trim(), timezone: match[1].match(/TZID=([^;:]+)/i)?.[1] }; }
function decodeIcsText(value: string) { return value.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1"); }
function parseIcsDate(value: string, timezone?: string) { if (/^\d{8}$/.test(value)) return localTimeToUtc(`${value}T000000`, timezone || "Europe/Berlin"); const compact = value.replace(/Z$/, ""); if (!/^\d{8}T\d{6}$/.test(compact)) return null; if (value.endsWith("Z")) return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15)}Z`; return localTimeToUtc(compact, timezone || "Europe/Berlin"); }
function localTimeToUtc(value: string, timezone: string) { const year = Number(value.slice(0, 4)); const month = Number(value.slice(4, 6)); const day = Number(value.slice(6, 8)); const hour = Number(value.slice(9, 11)); const minute = Number(value.slice(11, 13)); const second = Number(value.slice(13, 15)); const intended = Date.UTC(year, month - 1, day, hour, minute, second); try { const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }); let instant = intended; for (let attempt = 0; attempt < 2; attempt += 1) { const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); const observed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)); instant = intended - (observed - instant); } return new Date(instant).toISOString(); } catch { return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`; } }
