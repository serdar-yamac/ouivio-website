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
    .from("partner_package_favorites")
    .select("package_id, created_at, partner_packages!inner(name, description, price_amount, currency, service_type, partner_profiles!inner(business_name, city))")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const packageRow = row.partner_packages as unknown as {
      name: string; description: string | null; price_amount: number; currency: string; service_type: string;
      partner_profiles: { business_name: string; city: string | null } | null;
    };
    return {
      packageId: row.package_id,
      savedAt: row.created_at,
      partnerName: packageRow.partner_profiles?.business_name ?? "Anbieter",
      city: packageRow.partner_profiles?.city ?? "Ort folgt",
      packageName: packageRow.name,
      serviceType: packageRow.service_type,
      description: packageRow.description ?? "",
      priceAmount: Number(packageRow.price_amount),
      currency: packageRow.currency,
    };
  });
}
