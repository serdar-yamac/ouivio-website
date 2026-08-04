import { getSupabaseClient } from "./supabase";

export type PartnerAvailabilityRule = {
  id: string;
  partnerId: string;
  resourceKey: string;
  allowedWeekdays: number[];
  dailyStartsAt: string;
  dailyEndsAt: string;
  minNoticeHours: number;
  maxAdvanceDays: number;
  blockGermanPublicHolidays: boolean;
};

export type PartnerAvailabilityBlackout = { id: string; partnerId: string; resourceKey: string; label: string; startsOn: string; endsOn: string };

const ruleFields = "id,partner_id,resource_key,allowed_weekdays,daily_starts_at,daily_ends_at,min_notice_hours,max_advance_days,block_german_public_holidays";
const blackoutFields = "id,partner_id,resource_key,label,starts_on,ends_on";

const ruleFrom = (row: Record<string, unknown>): PartnerAvailabilityRule => ({
  id: String(row.id), partnerId: String(row.partner_id), resourceKey: String(row.resource_key || "all"),
  allowedWeekdays: (row.allowed_weekdays as number[]).map(Number), dailyStartsAt: String(row.daily_starts_at).slice(0, 5), dailyEndsAt: String(row.daily_ends_at).slice(0, 5),
  minNoticeHours: Number(row.min_notice_hours), maxAdvanceDays: Number(row.max_advance_days), blockGermanPublicHolidays: Boolean(row.block_german_public_holidays),
});
const blackoutFrom = (row: Record<string, unknown>): PartnerAvailabilityBlackout => ({ id: String(row.id), partnerId: String(row.partner_id), resourceKey: String(row.resource_key || "all"), label: String(row.label), startsOn: String(row.starts_on), endsOn: String(row.ends_on) });

export async function fetchPartnerAvailability(partnerId: string) {
  const client = getSupabaseClient();
  const [{ data: rules, error: rulesError }, { data: blackouts, error: blackoutsError }] = await Promise.all([
    client.from("partner_availability_rules").select(ruleFields).eq("partner_id", partnerId),
    client.from("partner_availability_blackouts").select(blackoutFields).eq("partner_id", partnerId).order("starts_on"),
  ]);
  if (rulesError) throw rulesError;
  if (blackoutsError) throw blackoutsError;
  return { rules: (rules ?? []).map((row) => ruleFrom(row as Record<string, unknown>)), blackouts: (blackouts ?? []).map((row) => blackoutFrom(row as Record<string, unknown>)) };
}

export async function savePartnerAvailabilityRule(partnerId: string, input: Omit<PartnerAvailabilityRule, "id" | "partnerId">) {
  const { data, error } = await getSupabaseClient().from("partner_availability_rules").upsert({
    partner_id: partnerId, resource_key: input.resourceKey, allowed_weekdays: input.allowedWeekdays,
    daily_starts_at: input.dailyStartsAt, daily_ends_at: input.dailyEndsAt, min_notice_hours: input.minNoticeHours,
    max_advance_days: input.maxAdvanceDays, block_german_public_holidays: input.blockGermanPublicHolidays, updated_at: new Date().toISOString(),
  }, { onConflict: "partner_id,resource_key" }).select(ruleFields).single();
  if (error) throw error;
  return ruleFrom(data as Record<string, unknown>);
}

export async function createPartnerAvailabilityBlackout(partnerId: string, input: Omit<PartnerAvailabilityBlackout, "id" | "partnerId">) {
  const { data, error } = await getSupabaseClient().from("partner_availability_blackouts").insert({ partner_id: partnerId, resource_key: input.resourceKey, label: input.label.trim(), starts_on: input.startsOn, ends_on: input.endsOn }).select(blackoutFields).single();
  if (error) throw error;
  return blackoutFrom(data as Record<string, unknown>);
}

export async function deletePartnerAvailabilityBlackout(id: string) {
  const { error } = await getSupabaseClient().from("partner_availability_blackouts").delete().eq("id", id);
  if (error) throw error;
}
