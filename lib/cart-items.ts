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

type SavedPackageRow = {
  entry_type: string;
  package_id: string;
  created_at: string;
  starts_on: string | null;
  ends_on: string | null;
  partner_name: string | null;
  city: string | null;
  package_name: string;
  service_type: string;
  price_amount: number | string;
  currency: string;
};

export async function fetchCartPackages(weddingId: string): Promise<CartPackage[]> {
  const { data, error } = await getSupabaseClient()
    .rpc("get_customer_saved_package_details", { requested_wedding_id: weddingId });
  if (error) throw error;

  return ((data ?? []) as SavedPackageRow[]).filter((row) => row.entry_type === "cart").map((row) => ({
    packageId: row.package_id,
    startsOn: row.starts_on ?? "",
    endsOn: row.ends_on ?? "",
    addedAt: row.created_at,
    partnerName: row.partner_name ?? "Anbieter",
    city: row.city ?? "Ort folgt",
    packageName: row.package_name,
    serviceType: row.service_type,
    priceAmount: Number(row.price_amount),
    currency: row.currency,
  }));
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
