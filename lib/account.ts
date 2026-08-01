import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

export type AccountType = "customer" | "partner";

export async function ensureAccountProfile(user: User) {
  const supabase = getSupabaseClient();
  const existing = await supabase.from("account_profiles").select("account_type, display_name").eq("user_id", user.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return { type: existing.data.account_type as AccountType, displayName: existing.data.display_name as string };

  const requestedType = user.user_metadata.account_type === "partner" ? "partner" : "customer";
  const displayName = typeof user.user_metadata.display_name === "string" && user.user_metadata.display_name.trim()
    ? user.user_metadata.display_name.trim()
    : user.email?.split("@")[0] || "Ouivio Konto";
  const inserted = await supabase.from("account_profiles").insert({ user_id: user.id, account_type: requestedType, display_name: displayName }).select("account_type, display_name").single();
  if (inserted.error) throw inserted.error;
  return { type: inserted.data.account_type as AccountType, displayName: inserted.data.display_name as string };
}

export async function ensurePartnerProfile(userId: string, businessName: string) {
  const supabase = getSupabaseClient();
  const existing = await supabase.from("partner_profiles").select("id, business_name, category, city, timezone").eq("owner_id", userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;
  const inserted = await supabase.from("partner_profiles").insert({ owner_id: userId, business_name: businessName }).select("id, business_name, category, city, timezone").single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}
