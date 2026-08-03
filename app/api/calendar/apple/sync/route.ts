import { createDecipheriv } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const appleRoot = "https://caldav.icloud.com/";
const davContentType = "application/xml; charset=utf-8";

type Credentials = { appleId: string; appPassword: string };
type ImportedEvent = { external_event_id: string; starts_at: string; ends_at: string };

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const encryptionKey = process.env.APPLE_CALENDAR_ENCRYPTION_KEY;
  if (!accessToken || !supabaseUrl || !supabaseKey || !encryptionKey) {
    return NextResponse.json({ message: "Bitte meldet euch erneut an." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: authData } = await supabase.auth.getUser(accessToken);
  if (!authData.user) return NextResponse.json({ message: "Eure Sitzung ist abgelaufen." }, { status: 401 });

  const [{ data: partner }, { data: secretRows, error: secretError }] = await Promise.all([
    supabase.from("partner_profiles").select("id").eq("owner_id", authData.user.id).maybeSingle(),
    supabase.rpc("get_apple_calendar_connection_secret"),
  ]);
  const encryptedCredentials = Array.isArray(secretRows) ? secretRows[0]?.encrypted_credentials : undefined;
  if (secretError || !partner || !encryptedCredentials) {
    return NextResponse.json({ message: "Bitte verbindet Apple Calendar zuerst." }, { status: 400 });
  }

  try {
    const credentials = decrypt(encryptedCredentials, encryptionKey);
    const authorization = `Basic ${Buffer.from(`${credentials.appleId}:${credentials.appPassword}`, "utf8").toString("base64")}`;
    const { calendars, events } = await readAppleEvents(authorization);
    console.info("[apple-calendar-sync] imported", { calendars, events: events.length });

    // A sync replaces only Apple-originated blocking times. Native Ouivio events remain untouched.
    const { error: deleteError } = await supabase
      .from("partner_calendar_events")
      .delete()
      .eq("partner_id", partner.id)
      .eq("source", "apple");
    if (deleteError) throw deleteError;

    if (events.length) {
      const { error: insertError } = await supabase.from("partner_calendar_events").insert(
        events.slice(0, 500).map((event) => ({
          ...event,
          partner_id: partner.id,
          title: "Belegt · Apple Calendar",
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
      .eq("id", Array.isArray(secretRows) ? secretRows[0]?.connection_id : "");
    if (connectionError) throw connectionError;

    return NextResponse.json({ ok: true, imported: events.length });
  } catch (error) {
    // Never log credentials or Apple responses; the reason is enough to diagnose a failed sync.
    console.error("[apple-calendar-sync] failed", { reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Apple Calendar konnte nicht synchronisiert werden." },
      { status: 502 },
    );
  }
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
    const response = await fetch(new URL(calendar, appleRoot).toString(), {
      method: "REPORT",
      headers: { ...headers, Depth: "1" },
      body: report,
      cache: "no-store",
    });
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

function decrypt(value: string, rawKey: string): Credentials {
  const [, iv, ciphertext, tag] = value.split(".");
  if (!iv || !ciphertext || !tag) throw new Error("Die gespeicherte Kalenderverbindung ist ungültig.");
  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) throw new Error("Die sichere Kalenderverbindung ist nicht korrekt eingerichtet.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8")) as Credentials;
}

function hrefForProperty(xml: string, property: "current-user-principal" | "calendar-home-set") {
  const match = xml.match(new RegExp(`<[^>]*:?${property}\\b[^>]*>[\\s\\S]*?<[^>]*:?href[^>]*>([^<]+)<\\/[^>]*:?href>[\\s\\S]*?<\\/[^>]*:?${property}>`, "i"));
  return match?.[1];
}
function calendarHrefs(xml: string) {
  // Each DAV response describes one resource. Inspect blocks separately so the calendar-home
  // response cannot be mistaken for a calendar collection that appears later in the document.
  return [...xml.matchAll(/<[^>]*:?response\b[^>]*>([\s\S]*?)<\/[^>]*:?response>/gi)].flatMap((response) => {
    const block = response[1];
    if (!/<[^>]*:?calendar\b[^>]*\/?\s*>/i.test(block)) return [];
    const href = block.match(/<[^>]*:?href[^>]*>([^<]+)<\/[^>]*:?href>/i)?.[1];
    return href ? [href] : [];
  });
}
function caldavStamp(days: number) { return new Date(Date.now() + days * 86_400_000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
function decodeXml(value: string) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#13;/g, "\r"); }
function unfold(ics: string) { return ics.replace(/\r?\n[ \t]/g, ""); }
function parseIcsEvents(xml: string): ImportedEvent[] {
  const blocks = [...xml.matchAll(/<[^>]*:?calendar-data[^>]*>([\s\S]*?)<\/[^>]*:?calendar-data>/gi)].map((match) => unfold(decodeXml(match[1])));
  return blocks.flatMap((block) => [...block.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].flatMap((match) => {
    const uid = field(match[1], "UID");
    const start = field(match[1], "DTSTART");
    const end = field(match[1], "DTEND");
    const startsAt = start ? parseIcsDate(start) : null;
    const endsAt = end ? parseIcsDate(end) : null;
    return uid && startsAt && endsAt ? [{ external_event_id: uid, starts_at: startsAt, ends_at: endsAt }] : [];
  }));
}
function field(event: string, name: string) { return event.match(new RegExp(`(?:^|\\n)${name}(?:;[^:]*)?:(.+)`))?.[1]?.trim(); }
function parseIcsDate(value: string) {
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`;
  const compact = value.replace(/Z$/, "");
  if (!/^\d{8}T\d{6}$/.test(compact)) return null;
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15)}${value.endsWith("Z") ? "Z" : "+00:00"}`;
}
