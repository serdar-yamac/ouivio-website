import { getSupabaseClient } from "./supabase";

export type BudgetStatus = "planned" | "reserved" | "paid";

export type BudgetItem = {
  id: string;
  category: string;
  title: string;
  plannedAmount: number;
  paidAmount: number;
  status: BudgetStatus;
  createdAt: string;
};

type BudgetItemRow = {
  id: string;
  category: string;
  title: string;
  planned_amount: number | string;
  paid_amount: number | string;
  status: BudgetStatus;
  created_at: string;
};

const budgetColumns = "id,category,title,planned_amount,paid_amount,status,created_at";

function mapBudgetItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    plannedAmount: Number(row.planned_amount),
    paidAmount: Number(row.paid_amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchBudget(weddingId: string) {
  const supabase = getSupabaseClient();
  const [weddingResult, itemsResult] = await Promise.all([
    supabase.from("weddings").select("total_budget").eq("id", weddingId).single(),
    supabase.from("budget_items").select(budgetColumns).eq("wedding_id", weddingId).order("created_at", { ascending: true }),
  ]);

  if (weddingResult.error) throw weddingResult.error;
  if (itemsResult.error) throw itemsResult.error;
  return {
    totalBudget: Number(weddingResult.data.total_budget),
    items: (itemsResult.data as BudgetItemRow[]).map(mapBudgetItem),
  };
}

export async function saveTotalBudget(weddingId: string, totalBudget: number): Promise<number> {
  const { data, error } = await getSupabaseClient()
    .from("weddings")
    .update({ total_budget: totalBudget })
    .eq("id", weddingId)
    .select("total_budget")
    .single();

  if (error) throw error;
  return Number(data.total_budget);
}

export async function createBudgetItem(weddingId: string, input: Omit<BudgetItem, "id" | "createdAt">): Promise<BudgetItem> {
  const { data, error } = await getSupabaseClient()
    .from("budget_items")
    .insert({
      wedding_id: weddingId,
      category: input.category,
      title: input.title,
      planned_amount: input.plannedAmount,
      paid_amount: input.paidAmount,
      status: input.status,
    })
    .select(budgetColumns)
    .single();

  if (error) throw error;
  return mapBudgetItem(data as BudgetItemRow);
}

export async function updateBudgetItem(item: BudgetItem): Promise<BudgetItem> {
  const { data, error } = await getSupabaseClient()
    .from("budget_items")
    .update({
      category: item.category,
      title: item.title,
      planned_amount: item.plannedAmount,
      paid_amount: item.paidAmount,
      status: item.status,
    })
    .eq("id", item.id)
    .select(budgetColumns)
    .single();

  if (error) throw error;
  return mapBudgetItem(data as BudgetItemRow);
}

export async function deleteBudgetItem(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("budget_items").delete().eq("id", id);
  if (error) throw error;
}
