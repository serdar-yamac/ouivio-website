import { getSupabaseClient } from "./supabase";

export type CartPackage = {
  packageId: string;
  startsOn: string;
  endsOn: string;
  addedAt: string;
  partnerName: string;
  city: string;
  packageName: string;
  serviceType: string;
  priceAmount: number;
  currency: string;
};

export async function fetchCartPackages(weddingId: string): Promise<CartPackage[]> {
  const { data, error } = await getSupabaseClient()
    .from("wedding_cart_items")
    .select("package_id, starts_on, ends_on, created_at, partner_packages!inner(name, price_amount, currency, service_type, partner_profiles!inner(business_name, city))")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const packageRow = row.partner_packages as unknown as {
      name: string; price_amount: number; currency: string; service_type: string;
      partner_profiles: { business_name: string; city: string | null } | null;
    };
    return {
      packageId: row.package_id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      addedAt: row.created_at,
      partnerName: packageRow.partner_profiles?.business_name ?? "Anbieter",
      city: packageRow.partner_profiles?.city ?? "Ort folgt",
      packageName: packageRow.name,
      serviceType: packageRow.service_type,
      priceAmount: Number(packageRow.price_amount),
      currency: packageRow.currency,
    };
  });
}

export async function saveCartPackage(
  weddingId: string,
  packageId: string,
  startsOn: string,
  endsOn: string,
) {
  const { error } = await getSupabaseClient()
    .from("wedding_cart_items")
    .upsert(
      { wedding_id: weddingId, package_id: packageId, starts_on: startsOn, ends_on: endsOn, updated_at: new Date().toISOString() },
      { onConflict: "wedding_id,package_id" },
    );
  if (error) throw error;
}

export async function removeCartPackage(weddingId: string, packageId: string) {
  const { error } = await getSupabaseClient()
    .from("wedding_cart_items")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("package_id", packageId);
  if (error) throw error;
}
