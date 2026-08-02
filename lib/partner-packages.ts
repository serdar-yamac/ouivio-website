import { getSupabaseClient } from "./supabase";
import type { ServiceType } from "./partner-service-areas";

export type PartnerPackage = {
  id: string;
  partnerId: string;
  serviceType: ServiceType;
  name: string;
  description: string;
  resourceKey: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  priceAmount: number;
  currency: string;
  includedItems: string[];
  isPublished: boolean;
};

export type PartnerPackageInput = Omit<PartnerPackage, "id" | "partnerId">;

const fields = "id,partner_id,service_type,name,description,resource_key,duration_minutes,buffer_before_minutes,buffer_after_minutes,price_amount,currency,included_items,is_published";

function mapPackage(row: Record<string, unknown>): PartnerPackage {
  return {
    id: String(row.id), partnerId: String(row.partner_id), serviceType: row.service_type as ServiceType, name: String(row.name), description: String(row.description ?? ""),
    resourceKey: String(row.resource_key), durationMinutes: Number(row.duration_minutes), bufferBeforeMinutes: Number(row.buffer_before_minutes),
    bufferAfterMinutes: Number(row.buffer_after_minutes), priceAmount: Number(row.price_amount), currency: String(row.currency),
    includedItems: Array.isArray(row.included_items) ? row.included_items.map(String) : [], isPublished: Boolean(row.is_published),
  };
}

function payload(input: PartnerPackageInput) {
  return {
    service_type: input.serviceType, name: input.name.trim(), description: input.description.trim() || null, resource_key: input.resourceKey.trim().toLowerCase(),
    duration_minutes: input.durationMinutes, buffer_before_minutes: input.bufferBeforeMinutes, buffer_after_minutes: input.bufferAfterMinutes,
    price_amount: input.priceAmount, currency: input.currency.trim().toUpperCase(), included_items: input.includedItems.filter(Boolean), is_published: input.isPublished,
  };
}

export async function fetchPartnerPackages(partnerId: string) {
  const { data, error } = await getSupabaseClient().from("partner_packages").select(fields).eq("partner_id", partnerId).order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => mapPackage(row));
}

export async function createPartnerPackage(partnerId: string, input: PartnerPackageInput) {
  const { data, error } = await getSupabaseClient().from("partner_packages").insert({ partner_id: partnerId, ...payload(input) }).select(fields).single();
  if (error) throw error;
  return mapPackage(data);
}

export async function updatePartnerPackage(id: string, input: PartnerPackageInput) {
  const { data, error } = await getSupabaseClient().from("partner_packages").update(payload(input)).eq("id", id).select(fields).single();
  if (error) throw error;
  return mapPackage(data);
}

export async function deletePartnerPackage(id: string) {
  const { error } = await getSupabaseClient().from("partner_packages").delete().eq("id", id);
  if (error) throw error;
}
