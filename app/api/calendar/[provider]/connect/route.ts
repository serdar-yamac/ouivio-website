import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizationUrl, isOAuthCalendarProvider, oauthState, oauthStateHash } from "@/lib/oauth-calendar";
import { oauthCallbackUrl } from "@/lib/oauth-callback-origin";

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
  const state = oauthState();
  const { error } = await supabase.rpc("create_calendar_oauth_state", { p_provider: rawProvider, p_state_hash: oauthStateHash(state) });
  if (error) return NextResponse.json({ message: "Die sichere Kalenderfreigabe konnte nicht vorbereitet werden." }, { status: 403 });
  try {
    const redirectUri = oauthCallbackUrl(rawProvider, request.nextUrl.origin);
    return NextResponse.json({ url: authorizationUrl(rawProvider, redirectUri, state) });
  } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Kalenderanbieter ist noch nicht eingerichtet." }, { status: 503 }); }
}
