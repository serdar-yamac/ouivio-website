import { getSupabaseClient } from "./supabase";

export type FavoritePackage = {
  packageId: string;
  savedAt: string;
  partnerName: string;
  city: string;
  packageName: string;
  serviceType: string;
  description: string;
  priceAmount: number;
  currency: string;
};

type SavedPackageRow = {
  entry_type: string;
  package_id: string;
  created_at: string;
  partner_name: string | null;
  city: string | null;
  package_name: string;
  description: string | null;
  service_type: string;
  price_amount: number | string;
  currency: string;
};

export async function fetchFavoritePackageIds(weddingId: string) {
  const { data, error } = await getSupabaseClient()
    .from("partner_package_favorites")
    .select("package_id")
    .eq("wedding_id", weddingId);
  if (error) throw error;
  return new Set((data ?? []).map((favorite) => favorite.package_id));
}

export async function toggleFavoritePackage(weddingId: string, packageId: string, isFavorite: boolean) {
  const supabase = getSupabaseClient();
  if (isFavorite) {
    const { error } = await supabase
      .from("partner_package_favorites")
      .delete()
      .eq("wedding_id", weddingId)
      .eq("package_id", packageId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from("partner_package_favorites")
    .insert({ wedding_id: weddingId, package_id: packageId });
  if (error) throw error;
  return true;
}

export async function fetchFavoritePackages(weddingId: string): Promise<FavoritePackage[]> {
  const { data, error } = await getSupabaseClient()
    .rpc("get_customer_saved_package_details", { requested_wedding_id: weddingId });
  if (error) throw error;

  return ((data ?? []) as SavedPackageRow[]).filter((row) => row.entry_type === "favorite").map((row) => ({
    packageId: row.package_id,
    savedAt: row.created_at,
    partnerName: row.partner_name ?? "Anbieter",
    city: row.city ?? "Ort folgt",
    packageName: row.package_name,
    serviceType: row.service_type,
    description: row.description ?? "",
    priceAmount: Number(row.price_amount),
    currency: row.currency,
  }));
}
