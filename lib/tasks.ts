import { getSupabaseClient } from "./supabase";

export type Task = {
  id: string;
  title: string;
  meta: string;
  done: boolean;
  dueDate: string | null;
  createdAt: string;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
};

const taskColumns = "id,title,notes,is_done,due_date,created_at";

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    meta: row.notes ?? "",
    done: row.is_done,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

export async function fetchTasks(weddingId: string): Promise<Task[]> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .select(taskColumns)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as TaskRow[]).map(mapTask);
}

export async function createTask(weddingId: string, input: Pick<Task, "title" | "meta" | "dueDate">): Promise<Task> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .insert({ wedding_id: weddingId, title: input.title, notes: input.meta || null, due_date: input.dueDate })
    .select(taskColumns)
    .single();

  if (error) throw error;
  return mapTask(data as TaskRow);
}

export async function updateTask(task: Task): Promise<Task> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .update({ title: task.title, notes: task.meta || null, due_date: task.dueDate, is_done: task.done })
    .eq("id", task.id)
    .select(taskColumns)
    .single();

  if (error) throw error;
  return mapTask(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("tasks").delete().eq("id", id);
  if (error) throw error;
}
