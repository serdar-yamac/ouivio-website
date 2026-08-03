import { getSupabaseClient } from "./supabase";

export type WeddingPlan = {
  id: string;
  partnerNames: string;
  weddingDate: string | null;
  location: string;
};

type WeddingPlanRow = {
  id: string;
  partner_names: string;
  wedding_date: string | null;
  location: string | null;
};

const columns = "id,partner_names,wedding_date,location";

function mapPlan(row: WeddingPlanRow): WeddingPlan {
  return {
    id: row.id,
    partnerNames: row.partner_names,
    weddingDate: row.wedding_date,
    location: row.location ?? "",
  };
}

export async function fetchWeddingPlan(weddingId: string) {
  const { data, error } = await getSupabaseClient()
    .from("weddings")
    .select(columns)
    .eq("id", weddingId)
    .single();
  if (error) throw error;
  return mapPlan(data as WeddingPlanRow);
}

export async function updateWeddingPlan(
  weddingId: string,
  input: Pick<WeddingPlan, "partnerNames" | "weddingDate" | "location">,
) {
  const { data, error } = await getSupabaseClient()
    .from("weddings")
    .update({
      partner_names: input.partnerNames,
      wedding_date: input.weddingDate,
      location: input.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", weddingId)
    .select(columns)
    .single();
  if (error) throw error;
  return mapPlan(data as WeddingPlanRow);
}
