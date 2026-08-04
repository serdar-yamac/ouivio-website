import { createHash, randomBytes } from "crypto";

export const oauthCalendarProviders = ["google", "microsoft"] as const;
export type OAuthCalendarProvider = (typeof oauthCalendarProviders)[number];
export type OAuthCalendarCredentials = { accessToken: string; refreshToken: string; expiresAt: number; accountLabel: string };

export function isOAuthCalendarProvider(value: string): value is OAuthCalendarProvider {
  return (oauthCalendarProviders as readonly string[]).includes(value);
}

export function providerLabel(provider: OAuthCalendarProvider) {
  return provider === "google" ? "Google Calendar" : "Outlook / Microsoft 365";
}

function config(provider: OAuthCalendarProvider) {
  return provider === "google"
    ? { clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID, clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET, authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", scope: "openid email https://www.googleapis.com/auth/calendar.events.readonly" }
    : { clientId: process.env.MICROSOFT_CALENDAR_CLIENT_ID, clientSecret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET, authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", token: "https://login.microsoftonline.com/common/oauth2/v2.0/token", scope: "openid profile email offline_access https://graph.microsoft.com/Calendars.Read" };
}

export function oauthState() { return randomBytes(32).toString("base64url"); }
export function oauthStateHash(state: string) { return createHash("sha256").update(state).digest("hex"); }

export function authorizationUrl(provider: OAuthCalendarProvider, redirectUri: string, state: string) {
  const settings = config(provider);
  if (!settings.clientId || !settings.clientSecret) throw new Error(`${providerLabel(provider)} ist für diese Umgebung noch nicht eingerichtet.`);
  const url = new URL(settings.authorize);
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", settings.scope);
  url.searchParams.set("state", state);
  if (provider === "google") { url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); }
  else { url.searchParams.set("response_mode", "query"); url.searchParams.set("prompt", "select_account"); }
  return url.toString();
}

export async function exchangeOAuthCode(provider: OAuthCalendarProvider, code: string, redirectUri: string): Promise<OAuthCalendarCredentials> {
  const settings = config(provider);
  if (!settings.clientId || !settings.clientSecret) throw new Error(`${providerLabel(provider)} ist für diese Umgebung noch nicht eingerichtet.`);
  const body = new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  const response = await fetch(settings.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const result = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !result.access_token || !result.refresh_token) throw new Error(result.error_description || "Die Kalenderfreigabe wurde nicht bestätigt.");
  const accountLabel = await readAccountLabel(provider, result.access_token);
  return { accessToken: result.access_token, refreshToken: result.refresh_token, expiresAt: Date.now() + Math.max(60, result.expires_in || 3600) * 1000, accountLabel };
}

export async function refreshOAuthAccessToken(provider: OAuthCalendarProvider, credentials: OAuthCalendarCredentials) {
  if (credentials.expiresAt > Date.now() + 60_000) return credentials;
  const settings = config(provider);
  if (!settings.clientId || !settings.clientSecret) throw new Error(`${providerLabel(provider)} ist serverseitig noch nicht eingerichtet.`);
  const body = new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: credentials.refreshToken, grant_type: "refresh_token" });
  const response = await fetch(settings.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const result = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || `${providerLabel(provider)} hat die Verbindung nicht mehr akzeptiert.`);
  return { ...credentials, accessToken: result.access_token, refreshToken: result.refresh_token || credentials.refreshToken, expiresAt: Date.now() + Math.max(60, result.expires_in || 3600) * 1000 };
}

async function readAccountLabel(provider: OAuthCalendarProvider, accessToken: string) {
  try {
    const response = await fetch(provider === "google" ? "https://www.googleapis.com/oauth2/v3/userinfo" : "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const value = await response.json() as { email?: string; displayName?: string; mail?: string; userPrincipalName?: string };
    return value.email || value.mail || value.userPrincipalName || value.displayName || providerLabel(provider);
  } catch { return providerLabel(provider); }
}
