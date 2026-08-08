import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptCalendarCredentials } from "@/lib/calendar-credentials";
import { exchangeOAuthCode, isOAuthCalendarProvider, oauthStateHash, providerLabel } from "@/lib/oauth-calendar";
import { oauthCallbackUrl } from "@/lib/oauth-callback-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  const target = new URL("/partner", request.nextUrl.origin);
  if (!isOAuthCalendarProvider(rawProvider)) { target.searchParams.set("calendar", "error"); return NextResponse.redirect(target); }
  const code = request.nextUrl.searchParams.get("code"); const state = request.nextUrl.searchParams.get("state"); const providerError = request.nextUrl.searchParams.get("error");
  if (providerError || !code || !state) { target.searchParams.set("calendar", `${rawProvider}-error`); return NextResponse.redirect(target); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) { target.searchParams.set("calendar", `${rawProvider}-error`); return NextResponse.redirect(target); }
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: stateRows, error: stateError } = await supabase.rpc("consume_calendar_oauth_state", { p_state_hash: oauthStateHash(state) });
  const saved = Array.isArray(stateRows) ? stateRows[0] : undefined;
  if (stateError || !saved || saved.provider !== rawProvider) { target.searchParams.set("calendar", `${rawProvider}-error`); return NextResponse.redirect(target); }
  try {
    const redirectUri = oauthCallbackUrl(rawProvider, request.nextUrl.origin);
    const credentials = await exchangeOAuthCode(rawProvider, code, redirectUri);
    const { error } = await supabase.rpc("save_oauth_calendar_connection", { p_partner_id: saved.partner_id, p_provider: rawProvider, p_encrypted_credentials: encryptCalendarCredentials(credentials), p_account_label: credentials.accountLabel });
    if (error) throw error;
    target.searchParams.set("calendar", `${rawProvider}-connected`);
  } catch (error) {
    console.error("[calendar-oauth] callback failed", { provider: rawProvider, reason: error instanceof Error ? error.message : "unknown" });
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarProvider", providerLabel(rawProvider));
  }
  return NextResponse.redirect(target);
}
