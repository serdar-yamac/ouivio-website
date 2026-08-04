import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isOAuthCalendarProvider } from "@/lib/oauth-calendar";
import { syncOAuthCalendar } from "@/lib/oauth-calendar-sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  if (!isOAuthCalendarProvider(rawProvider)) return NextResponse.json({ message: "Unbekannter Kalenderanbieter." }, { status: 404 });
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!accessToken || !url || !key) return NextResponse.json({ message: "Bitte meldet euch erneut als Partner an." }, { status: 401 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  const { data: authData } = await supabase.auth.getUser(accessToken);
  if (!authData.user) return NextResponse.json({ message: "Eure Sitzung ist abgelaufen." }, { status: 401 });
  const { data: secretRows, error: secretError } = await supabase.rpc("get_oauth_calendar_connection_secret", { p_provider: rawProvider });
  const secret = Array.isArray(secretRows) ? secretRows[0] : undefined;
  if (secretError || !secret?.encrypted_credentials) return NextResponse.json({ message: "Bitte verbindet diesen Kalender zuerst." }, { status: 400 });
  try {
    const result = await syncOAuthCalendar({ supabase, provider: rawProvider, job: { connectionId: secret.connection_id, partnerId: secret.partner_id, encryptedCredentials: secret.encrypted_credentials } });
    return NextResponse.json({ ok: true, imported: result.imported });
  } catch (error) {
    console.error("[oauth-calendar-sync] failed", { provider: rawProvider, reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ message: error instanceof Error ? error.message : "Kalender konnte nicht synchronisiert werden." }, { status: 502 });
  }
}
