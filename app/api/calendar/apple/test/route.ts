import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const appleCalendarEndpoint = "https://caldav.icloud.com/";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!accessToken || !supabaseUrl || !publishableKey) return NextResponse.json({ message: "Bitte meldet euch erneut an." }, { status: 401 });
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Keep the caller's identity for the RLS-protected partner lookup below.
    // getUser(accessToken) validates the token, but does not implicitly add it
    // to subsequent database requests made by this separate server client.
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData } = await supabase.auth.getUser(accessToken);
  if (!userData.user) return NextResponse.json({ message: "Eure Sitzung ist abgelaufen. Bitte meldet euch erneut an." }, { status: 401 });
  const { data: partner } = await supabase.from("partner_profiles").select("id").eq("owner_id", userData.user.id).maybeSingle();
  if (!partner) return NextResponse.json({ message: "Der Apple-Kalender kann nur aus einem Partnerkonto geprüft werden." }, { status: 403 });
  let payload: { appleId?: unknown; appPassword?: unknown };
  try { payload = await request.json(); } catch { return NextResponse.json({ message: "Ungültige Eingabe." }, { status: 400 }); }
  const appleId = typeof payload.appleId === "string" ? payload.appleId.trim() : "";
  const appPassword = typeof payload.appPassword === "string" ? payload.appPassword.replace(/\s/g, "") : "";
  if (!appleId || appleId.length > 254 || !appPassword || appPassword.length > 64) return NextResponse.json({ message: "Bitte gebt Apple-ID und das App-spezifische Passwort ein." }, { status: 400 });
  try {
    const credentials = Buffer.from(`${appleId}:${appPassword}`, "utf8").toString("base64");
    const response = await fetch(appleCalendarEndpoint, { method: "PROPFIND", headers: { Authorization: `Basic ${credentials}`, Depth: "0", "Content-Type": "application/xml; charset=utf-8" }, body: "<?xml version=\"1.0\" encoding=\"utf-8\" ?><propfind xmlns=\"DAV:\"><prop><current-user-principal/></prop></propfind>", cache: "no-store" });
    if (response.status === 401 || response.status === 403) return NextResponse.json({ message: "Apple-ID oder App-spezifisches Passwort wurden nicht akzeptiert." }, { status: 400 });
    if (!response.ok) return NextResponse.json({ message: "Apple Calendar ist gerade nicht erreichbar. Bitte versucht es später noch einmal." }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ message: "Apple Calendar konnte nicht erreicht werden. Bitte prüft eure Verbindung und versucht es erneut." }, { status: 502 }); }
}
