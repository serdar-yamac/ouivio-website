import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncAppleCalendar } from "@/lib/apple-calendar-sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const encryptionKey = process.env.APPLE_CALENDAR_ENCRYPTION_KEY;
  if (!accessToken || !supabaseUrl || !supabaseKey || !encryptionKey) return NextResponse.json({ message: "Bitte meldet euch erneut an." }, { status: 401 });
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  const { data: authData } = await supabase.auth.getUser(accessToken);
  if (!authData.user) return NextResponse.json({ message: "Eure Sitzung ist abgelaufen." }, { status: 401 });
  const [{ data: partner }, { data: secretRows, error: secretError }] = await Promise.all([
    supabase.from("partner_profiles").select("id").eq("owner_id", authData.user.id).maybeSingle(),
    supabase.rpc("get_apple_calendar_connection_secret"),
  ]);
  const secret = Array.isArray(secretRows) ? secretRows[0] : undefined;
  if (secretError || !partner || !secret?.encrypted_credentials) return NextResponse.json({ message: "Bitte verbindet Apple Calendar zuerst." }, { status: 400 });
  try {
    const result = await syncAppleCalendar({ supabase, encryptionKey, job: { connectionId: secret.connection_id, partnerId: partner.id, encryptedCredentials: secret.encrypted_credentials } });
    console.info("[apple-calendar-sync] imported", { calendars: result.calendars, events: result.imported });
    return NextResponse.json({ ok: true, imported: result.imported });
  } catch (error) {
    console.error("[apple-calendar-sync] failed", { reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ message: error instanceof Error ? error.message : "Apple Calendar konnte nicht synchronisiert werden." }, { status: 502 });
  }
}
