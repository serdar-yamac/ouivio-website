import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptCalendarCredentials } from "@/lib/calendar-credentials";
import { exchangeOAuthCode, isOAuthCalendarProvider, oauthStateHash, providerLabel } from "@/lib/oauth-calendar";
import { oauthCallbackUrl } from "@/lib/oauth-callback-origin";

export const runtime = "nodejs";

function callbackErrorHint(provider: string, error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("redirect_uri") || message.includes("redirect uri")) return "redirect";
  if (message.includes("client secret") || message.includes("invalid_client")) return "client";
  if (message.includes("state") || message.includes("code")) return "expired";
  if (message.includes("verschlüssel") || message.includes("encryption") || message.includes("key")) return "encryption";
  if (message.includes("save_oauth_calendar_connection") || message.includes("calendar_connections")) return "save";
  return provider === "microsoft" ? "microsoft" : "google";
}

function logCallbackResult(provider: string, outcome: "connected" | "error", reason: string, detail?: string) {
  console.info("[calendar-oauth] callback result", {
    provider,
    outcome,
    reason,
    ...(detail ? { detail } : {}),
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  const target = new URL("/partner", request.nextUrl.origin);
  if (!isOAuthCalendarProvider(rawProvider)) {
    logCallbackResult(rawProvider, "error", "provider");
    target.searchParams.set("calendar", "error");
    return NextResponse.redirect(target);
  }
  const code = request.nextUrl.searchParams.get("code"); const state = request.nextUrl.searchParams.get("state"); const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    logCallbackResult(rawProvider, "error", "authorization", providerError);
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarReason", "authorization");
    return NextResponse.redirect(target);
  }
  if (!code || !state) {
    logCallbackResult(rawProvider, "error", "expired", !code ? "missing-code" : "missing-state");
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarReason", "expired");
    return NextResponse.redirect(target);
  }
  const url = process.env.OUIVIO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.OUIVIO_SUPABASE_SERVER_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    logCallbackResult(rawProvider, "error", "configuration", !url ? "missing-supabase-url" : "missing-service-role-key");
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarReason", "configuration");
    return NextResponse.redirect(target);
  }
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: stateRows, error: stateError } = await supabase.rpc("consume_calendar_oauth_state", { p_state_hash: oauthStateHash(state) });
  const saved = Array.isArray(stateRows) ? stateRows[0] : undefined;
  if (stateError || !saved || saved.provider !== rawProvider) {
    const stateErrorDetail = stateError
      ? [stateError.code, stateError.message, stateError.details, stateError.hint].filter(Boolean).join(" | ").slice(0, 1000)
      : undefined;
    logCallbackResult(
      rawProvider,
      "error",
      "state",
      stateErrorDetail || (!saved ? "not-found-or-expired" : "provider-mismatch"),
    );
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarReason", "state");
    return NextResponse.redirect(target);
  }
  try {
    const redirectUri = oauthCallbackUrl(rawProvider, request.nextUrl.origin);
    const credentials = await exchangeOAuthCode(rawProvider, code, redirectUri);
    const { error } = await supabase.rpc("save_oauth_calendar_connection", { p_partner_id: saved.partner_id, p_provider: rawProvider, p_encrypted_credentials: encryptCalendarCredentials(credentials), p_account_label: credentials.accountLabel });
    if (error) throw error;
    logCallbackResult(rawProvider, "connected", "saved");
    target.searchParams.set("calendar", `${rawProvider}-connected`);
  } catch (error) {
    const reason = callbackErrorHint(rawProvider, error);
    console.error("[calendar-oauth] callback failed", { provider: rawProvider, reason, detail: error instanceof Error ? error.message : "unknown" });
    target.searchParams.set("calendar", `${rawProvider}-error`);
    target.searchParams.set("calendarProvider", providerLabel(rawProvider));
    target.searchParams.set("calendarReason", reason);
  }
  return NextResponse.redirect(target);
}
