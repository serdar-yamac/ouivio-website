import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

export async function ensureWeddingWorkspace(user: User) {
  const supabase = getSupabaseClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .limit(1);

  if (membershipError) throw membershipError;
  if (memberships?.[0]?.wedding_id) return memberships[0].wedding_id as string;

  const partnerNames = typeof user.user_metadata.partner_names === "string"
    ? user.user_metadata.partner_names.trim()
    : "Meine Hochzeit";

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({ owner_id: user.id, partner_names: partnerNames || "Meine Hochzeit" })
    .select("id")
    .single();

  if (weddingError) throw weddingError;

  const { error: memberError } = await supabase
    .from("wedding_members")
    .insert({ wedding_id: wedding.id, user_id: user.id, role: "owner" });

  if (memberError) throw memberError;
  return wedding.id as string;
}
