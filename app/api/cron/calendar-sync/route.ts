import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncAppleCalendar } from "@/lib/apple-calendar-sync";
import { calendarEncryptionKey } from "@/lib/calendar-credentials";
import { syncOAuthCalendar } from "@/lib/oauth-calendar-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

type SyncRow = { connection_id: string; partner_id: string; provider: "apple" | "google" | "microsoft"; encrypted_credentials: string };

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 });
  const url = process.env.OUIVIO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.OUIVIO_SUPABASE_SERVER_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const encryptionKey = calendarEncryptionKey();
  if (!url || !serviceRoleKey || !encryptionKey) return NextResponse.json({ ok: false, message: "Cron ist noch nicht vollständig konfiguriert." }, { status: 503 });
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("list_calendar_sync_jobs", { p_limit: 10 });
  if (error) { console.error("[calendar-sync-cron] jobs failed", { reason: error.message }); return NextResponse.json({ ok: false }, { status: 500 }); }
  let imported = 0;
  let failed = 0;
  let skipped = 0;
  for (const job of (data ?? []) as SyncRow[]) {
    try {
      const result = job.provider === "apple"
        ? await syncAppleCalendar({ supabase, encryptionKey, job: { connectionId: job.connection_id, partnerId: job.partner_id, encryptedCredentials: job.encrypted_credentials } })
        : job.provider === "google"
          ? await syncOAuthCalendar({ supabase, provider: "google", job: { connectionId: job.connection_id, partnerId: job.partner_id, encryptedCredentials: job.encrypted_credentials } })
          : job.provider === "microsoft"
            ? await syncOAuthCalendar({ supabase, provider: "microsoft", job: { connectionId: job.connection_id, partnerId: job.partner_id, encryptedCredentials: job.encrypted_credentials } })
            : null;
      if (!result) { skipped += 1; continue; }
      imported += result.imported;
    } catch (error) {
      failed += 1;
      console.error("[calendar-sync-cron] sync failed", { connectionId: job.connection_id, reason: error instanceof Error ? error.message : "unknown" });
    }
  }
  console.info("[calendar-sync-cron] completed", { connections: data?.length ?? 0, imported, failed, skipped });
  return NextResponse.json({ ok: true, connections: data?.length ?? 0, imported, failed, skipped });
}
